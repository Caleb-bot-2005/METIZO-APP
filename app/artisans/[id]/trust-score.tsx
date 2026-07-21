import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Award, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { LineChart } from '@/components/ui/LineChart';
import { useArtisan, useTrustHistory } from '@/hooks/queries/useArtisans';
import { gradients, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const { width } = Dimensions.get('window');

const achievements = [
  { icon: ShieldCheck, label: 'ID Verified', earned: true },
  { icon: Award, label: 'Top Performer 2026', earned: true },
  { icon: CheckCircle2, label: '100+ Jobs Completed', earned: true },
  { icon: Award, label: 'Zero Disputes Streak', earned: false },
];

export default function TrustScoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: artisan } = useArtisan(id);
  const { data: history } = useTrustHistory(id);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (!artisan) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Trust Score</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={styles.heroValue}>{artisan.trustScore}%</Text>
          <Text style={styles.heroLabel}>Overall Trust Score</Text>
        </LinearGradient>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MetricCard label="Completion Rate" value="98%" positive />
          <MetricCard label="Cancellation Rate" value="1.2%" positive={false} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MetricCard label="Review Score" value={`${artisan.rating} / 5`} positive />
          <MetricCard label="Response Rate" value={`${artisan.responseRate}%`} positive />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Trust Score History</Text>
          {history ? (
            <LineChart data={history.map((h) => ({ label: h.month, value: h.score }))} width={width - 88} />
          ) : null}
        </View>

        <View style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {achievements.map((achievement) => (
            <View key={achievement.label} style={styles.achievementRow}>
              <View style={[styles.achievementIcon, { backgroundColor: achievement.earned ? `${colors.success}33` : colors.card }]}>
                <achievement.icon size={18} color={achievement.earned ? colors.success : colors.textSecondary} />
              </View>
              <Text style={[styles.achievementLabel, { color: achievement.earned ? colors.text : colors.textSecondary }]}>
                {achievement.label}
              </Text>
              {achievement.earned ? <CheckCircle2 size={18} color={colors.success} /> : <XCircle size={18} color={colors.textSecondary} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: positive ? colors.success : colors.danger }]}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
  hero: { borderRadius: 24, padding: 24, alignItems: 'center', gap: 8 },
  heroValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 48, color: '#FFFFFF' },
  heroLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  chartCard: { backgroundColor: colors.card, borderRadius: 24, padding: 20, gap: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
  achievementRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16 },
  achievementIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  achievementLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14 },
  metricCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 4 },
  metricLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  });
}
