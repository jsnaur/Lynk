import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useCustomAlert } from '../../contexts/AlertContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS } from '../../constants/fonts';

// Placeholder asset until per-badge artwork is available.
const PLACEHOLDER_BADGE = require('../../../assets/ProfileAssets/BadgeShield.png');

type QueuedBadge = { name: string; description: string };

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
        <Image source={PLACEHOLDER_BADGE} style={styles.badge} resizeMode="contain" />
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
            const { data, error } = await supabase
              .from('badges')
              .select('name, description')
              .eq('id', badgeId)
              .single();
            if (error || !data) return;
            queueRef.current.push({ name: data.name, description: data.description });
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
