import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { logoMetrics } from '@/components/ui/Logo';
import { getHomeRoute } from '@/utils/navigation';

const SPLASH_DURATION = 3000;
const LOGO_SIZE = 84;
const GLYPH_WIDTH = LOGO_SIZE * logoMetrics.GLYPH_TO_MARK_WIDTH;
const GLYPH_HEIGHT = GLYPH_WIDTH / logoMetrics.GLYPH_ASPECT;
const DOT_SIZE = GLYPH_WIDTH * logoMetrics.DOT_TO_GLYPH_WIDTH;
const MARK_HEIGHT = GLYPH_HEIGHT + DOT_SIZE;

export default function SplashScreen() {
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userRole = useAuthStore((s) => s.user?.role);
  const permissionGranted = useLocationStore((s) => s.permissionGranted);

  // Logo build: glyph pops in, then the dot flourishes in with a spin
  const glyphScale = useSharedValue(0.7);
  const glyphOpacity = useSharedValue(0);
  const dotScale = useSharedValue(0);
  const dotOpacity = useSharedValue(0);
  const dotRotate = useSharedValue(-90);
  const groupScale = useSharedValue(1);
  const shineX = useSharedValue(-1);

  // Radar rings
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);

  // Wordmark / tagline
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkY = useSharedValue(14);
  const taglineOpacity = useSharedValue(0);

  // Loading dots
  const wave1 = useSharedValue(0.3);
  const wave2 = useSharedValue(0.3);
  const wave3 = useSharedValue(0.3);

  useEffect(() => {
    // Glyph pops into place
    glyphOpacity.value = withTiming(1, { duration: 320 });
    glyphScale.value = withSpring(1, { damping: 9, stiffness: 160 });

    // Dot flourishes in with a spin
    dotOpacity.value = withDelay(720, withTiming(1, { duration: 250 }));
    dotRotate.value = withDelay(720, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
    dotScale.value = withDelay(
      720,
      withSequence(
        withTiming(1.4, { duration: 220, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
      )
    );

    // Whole mark gives a small celebratory bounce once assembled, then a shine sweep
    groupScale.value = withDelay(
      980,
      withSequence(withTiming(1.08, { duration: 160, easing: Easing.out(Easing.cubic) }), withTiming(1, { duration: 220 }))
    );
    shineX.value = withDelay(1050, withTiming(2, { duration: 550, easing: Easing.out(Easing.ease) }));

    // Radar pulse rings run continuously in the background
    ring1.value = withDelay(150, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false));
    ring2.value = withDelay(1050, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false));

    // Wordmark and tagline reveal after the logo assembles
    wordmarkOpacity.value = withDelay(1150, withTiming(1, { duration: 420 }));
    wordmarkY.value = withDelay(1150, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
    taglineOpacity.value = withDelay(1320, withTiming(1, { duration: 420 }));

    // Loading dots wave in last
    const dotPulse = () => withRepeat(withSequence(withTiming(1, { duration: 380 }), withTiming(0.3, { duration: 380 })), -1, true);
    wave1.value = withDelay(1600, dotPulse());
    wave2.value = withDelay(1750, dotPulse());
    wave3.value = withDelay(1900, dotPulse());

    const timeout = setTimeout(() => {
      if (!hasOnboarded) {
        router.replace('/(onboarding)');
      } else if (!isAuthenticated) {
        router.replace('/(auth)/welcome');
      } else if (!permissionGranted) {
        router.replace('/(location)/permission');
      } else {
        router.replace(getHomeRoute(userRole));
      }
    }, SPLASH_DURATION);

    return () => clearTimeout(timeout);
  }, [hasOnboarded, isAuthenticated, permissionGranted, userRole]);

  const groupStyle = useAnimatedStyle(() => ({ transform: [{ scale: groupScale.value }] }));
  const glyphStyle = useAnimatedStyle(() => ({ opacity: glyphOpacity.value, transform: [{ scale: glyphScale.value }] }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }, { rotate: `${dotRotate.value}deg` }],
  }));
  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value * LOGO_SIZE * 1.4 }, { rotate: '18deg' }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring1.value * 1.5 }],
    opacity: (1 - ring1.value) * 0.45,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring2.value * 1.5 }],
    opacity: (1 - ring2.value) * 0.45,
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({ opacity: wordmarkOpacity.value, transform: [{ translateY: wordmarkY.value }] }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  const wave1Style = useAnimatedStyle(() => ({ opacity: wave1.value, transform: [{ scale: 0.7 + wave1.value * 0.3 }] }));
  const wave2Style = useAnimatedStyle(() => ({ opacity: wave2.value, transform: [{ scale: 0.7 + wave2.value * 0.3 }] }));
  const wave3Style = useAnimatedStyle(() => ({ opacity: wave3.value, transform: [{ scale: 0.7 + wave3.value * 0.3 }] }));

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <View style={styles.ringStack}>
          <Animated.View style={[styles.ring, ring1Style]} />
          <Animated.View style={[styles.ring, ring2Style]} />

          <Animated.View style={[{ width: LOGO_SIZE, height: MARK_HEIGHT }, groupStyle]}>
            <Animated.View style={[glyphStyle, { position: 'absolute', left: 0, top: DOT_SIZE, width: GLYPH_WIDTH, height: GLYPH_HEIGHT }]}>
              <Image
                source={require('@/assets/images/logo-glyph.png')}
                tintColor="#0A84FF"
                style={{ width: GLYPH_WIDTH, height: GLYPH_HEIGHT }}
              />
            </Animated.View>
            <Animated.View style={[dotStyle, { position: 'absolute', left: GLYPH_WIDTH, top: 0, width: DOT_SIZE, height: DOT_SIZE }]}>
              <Image
                source={require('@/assets/images/logo-dot.png')}
                tintColor="#FACC15"
                style={{ width: DOT_SIZE, height: DOT_SIZE }}
              />
            </Animated.View>
          </Animated.View>

          <View pointerEvents="none" style={[styles.shineClip, { width: LOGO_SIZE, height: MARK_HEIGHT }]}>
            <Animated.View style={[styles.shine, shineStyle]} />
          </View>
        </View>

        <Animated.Text style={[styles.title, wordmarkStyle]}>METIZO</Animated.Text>
        <Animated.Text style={[styles.subtitle, taglineStyle]}>Trusted artisans, on demand</Animated.Text>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.loadingDot, wave1Style]} />
          <Animated.View style={[styles.loadingDot, wave2Style]} />
          <Animated.View style={[styles.loadingDot, wave3Style]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Matches the native splash background (app.json's expo-splash-screen config)
  // so the handoff from native splash to this animated one is seamless.
  screen: { flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  ringStack: { width: LOGO_SIZE + 40, height: LOGO_SIZE + 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ring: {
    // Padded well past the mark's own corner-to-center distance so the ring
    // never visually cuts through the logo, even at its smallest pulse frame.
    position: 'absolute',
    width: LOGO_SIZE + 34,
    height: LOGO_SIZE + 34,
    borderRadius: (LOGO_SIZE + 34) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(10,132,255,0.35)',
  },
  shineClip: { position: 'absolute', overflow: 'hidden' },
  shine: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 18,
    backgroundColor: 'rgba(10,132,255,0.2)',
  },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 30, color: '#0F172A', letterSpacing: 1 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#6B7280' },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0A84FF' },
});
