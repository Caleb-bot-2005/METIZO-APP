import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Briefcase, Gavel } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useMyBids } from '@/hooks/queries/useBidding';
import { useJobs, useMarkInProgress } from '@/hooks/queries/useJobs';
import { formatCurrency } from '@/utils/format';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ThemeColors } from '@/theme/colors';

const subTabs = [
  { key: 'bids', label: 'My Bids' },
  { key: 'active', label: 'Active Jobs' },
] as const;

const bidStatusMeta: Record<string, { label: string; color: (c: ThemeColors) => string }> = {
  pending: { label: 'Pending', color: (c) => c.artisan },
  accepted: { label: 'Accepted', color: (c) => c.success },
  declined: { label: 'Declined', color: (c) => c.danger },
  expired: { label: 'Expired', color: (c) => c.textSecondary },
};

export default function ArtisanWorkScreen() {
  const [active, setActive] = useState<'bids' | 'active'>('bids');
  const { data: bids } = useMyBids();
  const { data: jobs } = useJobs();
  const markInProgress = useMarkInProgress();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  async function handleStart(id: string) {
    try {
      await markInProgress.mutateAsync(id);
      toast.show('Job marked as started', 'success');
    } catch {
      toast.show('Could not start the job. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>My Work</Text>
        <View style={styles.tabRow}>
          {subTabs.map((tab) => (
            <AnimatedPressable
              key={tab.key}
              onPress={() => setActive(tab.key)}
              style={[styles.tabButton, { backgroundColor: active === tab.key ? colors.artisan : 'transparent' }]}>
              <Text style={[styles.tabLabel, { color: active === tab.key ? '#FFFFFF' : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      {active === 'bids' ? (
        <FlatList
          data={bids}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Gavel size={40} color={colors.textSecondary} />
              <Text style={styles.emptyLabel}>No bids placed yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = bidStatusMeta[item.status] ?? bidStatusMeta.pending;
            const statusColor = meta.color(colors);
            return (
              <Card>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>Bid on request #{item.jobId}</Text>
                  <View style={[styles.statusPill, { backgroundColor: `${statusColor}1A` }]}>
                    <Text style={[styles.statusLabel, { color: statusColor }]}>{meta.label}</Text>
                  </View>
                </View>
                <Text style={styles.jobPrice}>{formatCurrency(item.price)}</Text>
              </Card>
            );
          }}
        />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Briefcase size={40} color={colors.textSecondary} />
              <Text style={styles.emptyLabel}>No active jobs yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.jobTitle}>{item.categoryName}</Text>
              <Text style={styles.jobDescription} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.jobFooter}>
                <Text style={styles.jobPrice}>{formatCurrency(item.aiEstimatedPrice)}</Text>
                {item.status === 'accepted' ? (
                  <AnimatedPressable
                    onPress={() => handleStart(item.id)}
                    disabled={markInProgress.isPending}
                    style={styles.startButton}>
                    <Text style={styles.startButtonLabel}>Start Job</Text>
                  </AnimatedPressable>
                ) : (
                  <Text style={styles.statusHint}>{item.status.replace('_', ' ')}</Text>
                )}
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
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
    jobDescription: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    jobFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    jobPrice: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.artisan },
    statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    statusLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    statusHint: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize' },
    startButton: { backgroundColor: colors.artisan, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    startButtonLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#FFFFFF' },
  });
}
