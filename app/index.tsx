import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
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
import { gradients } from '@/theme/colors';
import { logoMetrics } from '@/components/ui/Logo';
import { getHomeRoute } from '@/utils/navigation';

const SPLASH_DURATION = 3000;
const LOGO_SIZE = 84;
const U = LOGO_SIZE / logoMetrics.MARK_WIDTH;
const MARK_HEIGHT = logoMetrics.MARK_HEIGHT * U;

export default function SplashScreen() {
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userRole = useAuthStore((s) => s.user?.role);
  const permissionGranted = useLocationStore((s) => s.permissionGranted);

  // Logo piece-by-piece build
  const thickY = useSharedValue(36);
  const thickOpacity = useSharedValue(0);
  const thinY = useSharedValue(-28);
  const thinOpacity = useSharedValue(0);
  const triScale = useSharedValue(0);
  const triOpacity = useSharedValue(0);
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
    // Outer bars rise into place
    thickOpacity.value = withTiming(1, { duration: 320 });
    thickY.value = withSpring(0, { damping: 9, stiffness: 160 });

    // Inner bars drop into place, just after
    thinOpacity.value = withDelay(220, withTiming(1, { duration: 320 }));
    thinY.value = withDelay(220, withSpring(0, { damping: 9, stiffness: 160 }));

    // Triangle pops in
    triOpacity.value = withDelay(500, withTiming(1, { duration: 250 }));
    triScale.value = withDelay(500, withSpring(1, { damping: 6, stiffness: 220 }));

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
  const thickBarStyle = useAnimatedStyle(() => ({ opacity: thickOpacity.value, transform: [{ translateY: thickY.value }] }));
  const thinBarStyle = useAnimatedStyle(() => ({ opacity: thinOpacity.value, transform: [{ translateY: thinY.value }] }));
  const triStyle = useAnimatedStyle(() => ({ opacity: triOpacity.value, transform: [{ scale: triScale.value }] }));
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

  const m = logoMetrics;

  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <View style={styles.center}>
        <View style={styles.ringStack}>
          <Animated.View style={[styles.ring, ring1Style]} />
          <Animated.View style={[styles.ring, ring2Style]} />

          <Animated.View style={[{ width: LOGO_SIZE, height: MARK_HEIGHT }, groupStyle]}>
            <Animated.View
              style={[
                styles.thickBar,
                thickBarStyle,
                { left: m.LEFT_THICK_X * U, top: m.DOT_R * U, width: m.THICK_W * U, height: m.FULL_H * U, borderTopLeftRadius: (m.THICK_W * U) / 2, borderTopRightRadius: (m.THICK_W * U) / 2 },
              ]}
            />
            <Animated.View
              style={[
                styles.thinBar,
                thinBarStyle,
                { left: m.LEFT_THIN_X * U, top: m.DOT_R * U, width: m.THIN_W * U, height: m.SHORT_H * U, borderRadius: (m.THIN_W * U) / 2 },
              ]}
            />
            <Animated.View
              style={[
                triStyle,
                {
                  position: 'absolute',
                  left: (m.LEFT_THIN_X + m.THIN_W) * U,
                  top: m.DOT_R * U,
                  width: m.GAP_MID * U,
                  height: 50 * U,
                },
              ]}>
              <Svg width={m.GAP_MID * U} height={50 * U} viewBox={`0 0 ${m.GAP_MID} 50`}>
                <Polygon points={`0,0 ${m.GAP_MID},0 ${m.GAP_MID / 2},50`} fill="#FFFFFF" />
              </Svg>
            </Animated.View>
            <Animated.View
              style={[
                styles.thinBar,
                thinBarStyle,
                { left: m.RIGHT_THIN_X * U, top: m.DOT_R * U, width: m.THIN_W * U, height: m.SHORT_H * U, borderRadius: (m.THIN_W * U) / 2 },
              ]}
            />
            <Animated.View
              style={[
                styles.thickBar,
                thickBarStyle,
                { left: m.RIGHT_THICK_X * U, top: m.DOT_R * U, width: m.THICK_W * U, height: m.FULL_H * U, borderTopLeftRadius: (m.THICK_W * U) / 2, borderTopRightRadius: (m.THICK_W * U) / 2 },
              ]}
            />
            <Animated.View
              style={[
                dotStyle,
                {
                  position: 'absolute',
                  left: (m.RIGHT_THICK_X + m.THICK_W - m.DOT_R * 0.6) * U,
                  top: 0,
                  width: m.DOT_R * 2 * U,
                  height: m.DOT_R * 2 * U,
                  borderRadius: m.DOT_R * U,
                  backgroundColor: '#FACC15',
                },
              ]}
            />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  ringStack: { width: LOGO_SIZE + 40, height: MARK_HEIGHT + 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ring: {
    position: 'absolute',
    width: LOGO_SIZE + 16,
    height: LOGO_SIZE + 16,
    borderRadius: (LOGO_SIZE + 16) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  thickBar: { position: 'absolute', backgroundColor: '#FFFFFF' },
  thinBar: { position: 'absolute', backgroundColor: '#FFFFFF' },
  shineClip: { position: 'absolute', overflow: 'hidden' },
  shine: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 30, color: '#FFFFFF', letterSpacing: 1 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
});
