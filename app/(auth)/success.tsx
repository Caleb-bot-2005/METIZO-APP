import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { PartyPopper } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const copy: Record<string, { title: string; subtitle: string; cta: string; nextRoute: string }> = {
  'verify-email': {
    title: 'Email Verified!',
    subtitle: "Your account is ready. Let's find you a trusted artisan.",
    cta: 'Continue',
    nextRoute: '/(location)/permission',
  },
  'reset-success': {
    title: 'Password Reset',
    subtitle: 'Your password has been updated successfully. You can now log in.',
    cta: 'Back to Login',
    nextRoute: '/(auth)/login',
  },
};

export default function AuthSuccessScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const details = copy[mode ?? 'verify-email'];
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        <Animated.View entering={ZoomIn.springify()} style={styles.iconWrap}>
          <PartyPopper size={48} color="#22C55E" />
        </Animated.View>
        <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 24 }}>
          <Text style={styles.title}>{details.title}</Text>
          <Text style={styles.subtitle}>{details.subtitle}</Text>
        </View>
      </View>
      <Button label={details.cta} size="lg" onPress={() => router.replace(details.nextRoute as any)} />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
    iconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: `${colors.success}1A`, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text, textAlign: 'center' },
    subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  });
}
