import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { BackButton } from '@/components/ui/BackButton';
import { Logo } from '@/components/ui/Logo';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function AboutScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>About METIZO</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 16 }}>
          <View style={styles.iconWrap}>
            <Logo size={40} />
          </View>
          <Text style={styles.title}>METIZO</Text>
          <Text style={styles.version}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
        <Text style={styles.description}>
          METIZO connects customers with trusted, verified artisans across Ghana — from plumbers and electricians to
          painters and welders. Post a job, compare live bids, pay securely through escrow, and track your artisan in
          real time.
        </Text>
        <View style={{ gap: 12 }}>
          <Text style={styles.link}>Terms of Service</Text>
          <Text style={styles.link}>Privacy Policy</Text>
          <Text style={styles.link}>Contact Support</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    iconWrap: { width: 64, height: 64, borderRadius: 24, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, color: colors.text },
    version: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    description: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
    link: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
  });
}
