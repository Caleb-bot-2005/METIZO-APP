import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Check, Crown, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { FeatureCard } from '@/components/features/FeatureCard';
import { gradients, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const features = [
  'Priority booking with top artisans',
  'Unlimited emergency requests',
  'Lower service fees on every job',
  'AI maintenance reminders',
];

export default function PaywallScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.screen}>
      <View style={{ flex: 1 }}>
        <View style={styles.background}>
          <View style={styles.placeholderCard} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <FeatureCard icon={<Crown size={18} color={colors.primary} />} title="Smart Reports" description="Monthly home health insights" />
            <FeatureCard icon={<Crown size={18} color={colors.primary} />} title="Extended Warranty" description="Extra protection on repairs" />
          </View>
          <View style={[styles.placeholderCard, { height: 160 }]} />
        </View>
        <BlurView intensity={40} tint="light" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />

        <View style={styles.overlay}>
          <AnimatedPressable onPress={() => router.back()} style={styles.closeButton}>
            <X size={18} color={colors.text} />
          </AnimatedPressable>

          <Animated.View entering={ZoomIn.springify()} style={{ width: '100%' }}>
            <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <View style={styles.crownWrap}>
                  <Crown size={28} color={colors.gold} fill={colors.gold} />
                </View>
                <Text style={styles.title}>Unlock This Premium Feature</Text>
                <Text style={styles.subtitle}>Upgrade to Home+ to access this and other premium benefits.</Text>
              </View>
              <View style={{ gap: 8 }}>
                {features.map((feature) => (
                  <View key={feature} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Check size={15} color={colors.gold} />
                    <Text style={styles.featureLabel}>{feature}</Text>
                  </View>
                ))}
              </View>
              <Button label="Upgrade Now" variant="gold" size="lg" onPress={() => router.replace('/subscriptions')} />
              <Text style={styles.later} onPress={() => router.back()}>
                Maybe later
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    background: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 16, opacity: 0.6 },
    placeholderCard: { height: 128, backgroundColor: colors.card, borderRadius: 16 },
    overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    closeButton: { position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    card: { borderRadius: 28, padding: 24, gap: 20 },
    crownWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, color: '#FFFFFF', textAlign: 'center' },
    subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
    featureLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    later: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  });
}
