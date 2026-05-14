import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useCustomAlert } from '../../contexts/AlertContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS } from '../../constants/fonts';
import { getBadgeById } from '../../constants/badges';
import appSoundManager from '../../lib/SoundManager';

// Fallback when an unlocked badge id is not yet present in the catalog.
const FALLBACK_BADGE_ICON = require('../../../assets/ProfileAssets/BadgeShield.png');

type QueuedBadge = { name: string; description: string; icon: any };

export default function BadgeUnlockListener() {
  const { alert } = useCustomAlert();
  const { colors } = useTheme();
  const queueRef = useRef<QueuedBadge[]>([]);
  const showingRef = useRef(false);

  const showNext = () => {
    if (showingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    showingRef.current = true;
    alert(
      'Badge Unlocked!',
      undefined,
      [
        {
          text: 'Awesome!',
          onPress: () => {
            showingRef.current = false;
            showNext();
          },
        },
      ],
      <View style={styles.body}>
        <Image source={next.icon} style={styles.badge} resizeMode="contain" />
        <Text style={[styles.name, { color: colors.textPrimary }]}>{next.name}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>{next.description}</Text>
      </View>,
    );
  };

  useEffect(() => {
    let channel: any;
    let mounted = true;

    const subscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      channel = supabase
        .channel(`user_badges_listener:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_badges',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload: any) => {
            const badgeId = payload?.new?.badge_id;
            if (!badgeId) return;
            const catalogEntry = getBadgeById(badgeId);
            if (catalogEntry) {
              void appSoundManager.playBadgeUnlockCue();
              queueRef.current.push({
                name: catalogEntry.name,
                description: catalogEntry.description,
                icon: catalogEntry.icon,
              });
              showNext();
              return;
            }
            // Catalog miss: fall back to the DB row so unknown badges still surface.
            const { data, error } = await supabase
              .from('badges')
              .select('name, description')
              .eq('id', badgeId)
              .single();
            if (error || !data) return;
            void appSoundManager.playBadgeUnlockCue();
            queueRef.current.push({
              name: data.name,
              description: data.description,
              icon: FALLBACK_BADGE_ICON,
            });
            showNext();
          },
        )
        .subscribe();
    };

    subscribe();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (channel) {
          supabase.removeChannel(channel);
          channel = null;
        }
        queueRef.current = [];
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (!channel) subscribe();
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  badge: {
    width: 110,
    height: 110,
    marginBottom: 14,
  },
  name: {
    fontSize: 13,
    fontFamily: FONTS.display,
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
});
