/**
 * LYNK — Minimalist Animated Splash Screen
 * Revised: Removed claw slashes and impact effects for a clean, professional look.
 * Revised: Removed blinking cursor from the motto typing sequence.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');

const BG_COLOR      = '#0D0D12'; 
const ACCENT_COLOR  = '#FACC15'; 
const TEXT_PRIMARY  = '#FAFAFA';
const TEXT_MUTED    = '#A1A1AA';

const MOTTO         = 'Let Your Network Know';
const LOGO_SIZE     = Math.min(SCREEN_W * 0.45, 180);
const GLOW_SIZE     = LOGO_SIZE * 1.5;

const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOutQuart = Easing.bezier(0.76, 0, 0.24, 1);

export default function AnimatedSplashScreen({ onAnimationComplete }: AnimatedSplashScreenProps) {
  const isMounted = useRef(true);

  // Logo & Branding Animations
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.8)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  
  const rippleScale1   = useRef(new Animated.Value(0.5)).current;
  const rippleOpacity1 = useRef(new Animated.Value(0)).current;
  const rippleScale2   = useRef(new Animated.Value(0.5)).current;
  const rippleOpacity2 = useRef(new Animated.Value(0)).current;

  const mottoOpacity   = useRef(new Animated.Value(0)).current;
  const veilOpacity    = useRef(new Animated.Value(0)).current;

  const [displayedMotto, setDisplayedMotto] = useState('');
  const typeIntervalRef = useRef<any>(null);

  const startExit = useCallback(() => {
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(veilOpacity, {
        toValue: 1,
        duration: 500,
        easing: easeInOutQuart,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && isMounted.current) onAnimationComplete();
    });
  }, [onAnimationComplete, veilOpacity]);

  const startTyping = useCallback(() => {
    if (!isMounted.current) return;
    
    Animated.timing(mottoOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    let i = 0;
    typeIntervalRef.current = setInterval(() => {
      if (!isMounted.current) { clearInterval(typeIntervalRef.current); return; }
      i += 1;
      setDisplayedMotto(MOTTO.slice(0, i));
      
      if (i >= MOTTO.length) {
        clearInterval(typeIntervalRef.current);
        setTimeout(() => {
          if (isMounted.current) startExit();
        }, 1200); 
      }
    }, 40); 
  }, [startExit, mottoOpacity]);

  useEffect(() => {
    isMounted.current = true;
    SplashScreen.hideAsync().catch(() => {});

    // ─── 1. Logo Sequence ───
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 800, easing: easeOutExpo, useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1, damping: 15, stiffness: 90, useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0, duration: 800, easing: easeOutExpo, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ─── 2. Subtle Accent Ripples ───
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(rippleScale1, {
          toValue: 1.25, duration: 1800, easing: easeOutExpo, useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(rippleOpacity1, { toValue: 0.2, duration: 500, useNativeDriver: true }),
          Animated.timing(rippleOpacity1, { toValue: 0, duration: 1300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(250),
          Animated.parallel([
            Animated.timing(rippleScale2, {
              toValue: 1.5, duration: 2000, easing: easeOutExpo, useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(rippleOpacity2, { toValue: 0.1, duration: 500, useNativeDriver: true }),
              Animated.timing(rippleOpacity2, { toValue: 0, duration: 1500, useNativeDriver: true }),
            ]),
          ]),
        ])
      ]),
    ]).start();

    // ─── 3. Motto Delay ───
    const mottoTimer = setTimeout(startTyping, 1000);

    return () => {
      isMounted.current = false;
      clearTimeout(mottoTimer);
      if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
    };
  }, [startTyping]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.contentCenter}>
        
        {/* ── Logo & Ripple Stage ── */}
        <View style={styles.logoArea} pointerEvents="none">
          <Animated.View
            style={[styles.rippleRing, { opacity: rippleOpacity1, transform: [{ scale: rippleScale1 }] }]}
          />
          <Animated.View
            style={[styles.rippleRing, { borderWidth: 1, opacity: rippleOpacity2, transform: [{ scale: rippleScale2 }] }]}
          />

          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
              },
            ]}
          >
            <Image
              source={require('../../assets/logowithoutbg.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* ── App Identity ── */}
        <Animated.View
          style={[
            styles.appNameContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
            },
          ]}
        >
          <Text style={styles.appName}>LYNK</Text>
        </Animated.View>

        {/* ── Motto (No Cursor) ── */}
        <Animated.View style={[styles.mottoContainer, { opacity: mottoOpacity }]}>
          <Text style={styles.mottoText}>{displayedMotto}</Text>
        </Animated.View>

      </View>

      {/* ── Seamless Exit Veil ── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.veil, { opacity: veilOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG_COLOR,
    zIndex: 9999,
  },
  contentCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG_COLOR,
  },
  logoArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rippleRing: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    borderWidth: 1.5,
    borderColor: ACCENT_COLOR,
  },
  logoWrapper: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appNameContainer: {
    marginTop: 0,
  },
  appName: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 12,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  mottoContainer: {
    marginTop: 24,
    paddingHorizontal: 30,
    height: 24, 
    justifyContent: 'center',
  },
  mottoText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  veil: {
    backgroundColor: BG_COLOR,
    zIndex: 100,
  },
});