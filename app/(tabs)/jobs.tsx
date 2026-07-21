import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Briefcase, Calendar, CheckCircle2, XCircle } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { TabScreen } from '@/components/ui/TabScreen';
import { useJobs } from '@/hooks/queries/useJobs';
import { useJobStore } from '@/store/jobStore';
import { formatCurrency } from '@/utils/format';
import { JobStatus } from '@/types/job';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const tabs: { key: 'active' | 'completed' | 'cancelled'; label: string; statuses: JobStatus[] }[] = [
  { key: 'active', label: 'Active', statuses: ['bidding', 'accepted', 'traveling', 'arrived', 'in_progress'] },
  { key: 'completed', label: 'Completed', statuses: ['completed'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
];

const statusMeta: Record<JobStatus, { label: string; color: string; Icon: typeof Calendar }> = {
  draft: { label: 'Draft', color: '#64748B', Icon: Calendar },
  bidding: { label: 'Receiving bids', color: '#60A5FA', Icon: Calendar },
  accepted: { label: 'Bid accepted', color: '#0A84FF', Icon: CheckCircle2 },
  traveling: { label: 'Artisan traveling', color: '#0A84FF', Icon: Calendar },
  arrived: { label: 'Artisan arrived', color: '#0A84FF', Icon: Calendar },
  in_progress: { label: 'In progress', color: '#F59E0B', Icon: Calendar },
  completed: { label: 'Completed', color: '#22C55E', Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: '#EF4444', Icon: XCircle },
};

export default function JobsScreen() {
  const [active, setActive] = useState<'active' | 'completed' | 'cancelled'>('active');
  const jobs = useJobStore((s) => s.jobs);
  const setJobs = useJobStore((s) => s.setJobs);
  const { data: fetchedJobs } = useJobs();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  useEffect(() => {
    if (fetchedJobs) setJobs(fetchedJobs);
  }, [fetchedJobs]);

  const currentTab = tabs.find((t) => t.key === active)!;
  const filtered = jobs.filter((j) => currentTab.statuses.includes(j.status));

  return (
    <TabScreen routeIndex={2}>
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Jobs</Text>
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <AnimatedPressable
              key={tab.key}
              onPress={() => setActive(tab.key)}
              style={[styles.tabButton, { backgroundColor: active === tab.key ? '#0A84FF' : 'transparent' }]}>
              <Text style={[styles.tabLabel, { color: active === tab.key ? '#FFFFFF' : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Briefcase size={40} color="#CBD5E1" />
            <Text style={styles.emptyLabel}>No {currentTab.label.toLowerCase()} jobs yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = statusMeta[item.status];
          return (
            <AnimatedPressable onPress={() => router.push(`/jobs/${item.id}`)}>
              <Card style={{ borderLeftWidth: 4, borderLeftColor: meta.color }}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>{item.categoryName}</Text>
                  <View style={[styles.statusPill, { backgroundColor: `${meta.color}1A` }]}>
                    <meta.Icon size={12} color={meta.color} />
                    <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>
                <Text style={styles.jobDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.jobFooter}>
                  <Text style={styles.jobAddress}>{item.address}</Text>
                  <Text style={styles.jobPrice}>{formatCurrency(item.aiEstimatedPrice)}</Text>
                </View>
              </Card>
            </AnimatedPressable>
          );
        }}
      />
    </SafeAreaView>
    </TabScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
    title: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text },
    tabRow: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 4 },
    tabButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    tabLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    empty: { alignItems: 'center', gap: 12, marginTop: 64 },
    emptyLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    jobTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    statusLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    jobDescription: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    jobFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    jobAddress: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    jobPrice: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primary },
  });
}
