import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CreditCard, MapPinned, ShieldCheck, Users } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { gradients, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const { width } = Dimensions.get('window');

const pages = [
  {
    icon: Users,
    title: 'Find Trusted Artisans',
    subtitle: 'Discover nearby professionals — plumbers, electricians, painters and more, all verified and rated by real customers.',
    colors: gradients.hero,
  },
  {
    icon: CreditCard,
    title: 'Receive Multiple Quotes',
    subtitle: 'Watch artisans compete for your job in real time. Compare lowest price, best rated and fastest arrival.',
    colors: ['#0F172A', '#0F172A'] as const,
  },
  {
    icon: ShieldCheck,
    title: 'Secure Escrow Payments',
    subtitle: 'Your money stays protected and is only released to the artisan after the job is completed to your satisfaction.',
    colors: gradients.success,
  },
  {
    icon: MapPinned,
    title: 'Track Jobs Live',
    subtitle: 'Follow your artisan on a live map with real-time ETA, then review before & after photos once the job is done.',
    colors: ['#312E81', '#312E81'] as const,
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const setOnboarded = useAuthStore((s) => s.setOnboarded);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const isLast = pageIndex === pages.length - 1;

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== pageIndex) setPageIndex(index);
  }

  function goNext() {
    if (isLast) {
      setOnboarded(true);
      router.replace('/(auth)/welcome');
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (pageIndex + 1), animated: true });
  }

  function skip() {
    setOnboarded(true);
    router.replace('/(auth)/welcome');
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {pages.map((page, index) => {
          const Icon = page.icon;
          return (
            <View key={page.title} style={{ width, paddingHorizontal: 24, paddingTop: 96, flex: 1 }}>
              <Animated.View entering={FadeIn.delay(100)} style={{ alignItems: 'center', gap: 32 }}>
                <LinearGradient
                  colors={page.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconCircle}>
                  <Icon size={84} color="#FFFFFF" strokeWidth={1.5} />
                </LinearGradient>
                <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 8 }}>
                  <Text style={styles.title}>{page.title}</Text>
                  <Text style={styles.subtitle}>{page.subtitle}</Text>
                </View>
              </Animated.View>
              <Text style={styles.skip} onPress={skip}>
                {index < pages.length - 1 ? 'Skip' : ''}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {pages.map((page, index) => (
            <View
              key={page.title}
              style={[styles.dot, { width: index === pageIndex ? 24 : 8, backgroundColor: index === pageIndex ? colors.primary : colors.textSecondary }]}
            />
          ))}
        </View>
        <Button label={isLast ? 'Start Now' : 'Next'} onPress={goNext} size="lg" />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    iconCircle: { width: 220, height: 220, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text, textAlign: 'center' },
    subtitle: { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
    skip: { position: 'absolute', top: 64, right: 24, fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.textSecondary },
    footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 24 },
    dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    dot: { height: 8, borderRadius: 999 },
  });
}
