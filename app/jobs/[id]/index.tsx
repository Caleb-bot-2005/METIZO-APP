import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MapPinned, MessageCircle, Star } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TimelineCard } from '@/components/features/TimelineCard';
import { useJobStore } from '@/store/jobStore';
import { formatCurrency } from '@/utils/format';
import { JobTimelineStep } from '@/types/job';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

function buildTimeline(status: string): JobTimelineStep[] {
  const order = ['requested', 'accepted', 'traveling', 'arrived', 'started', 'materials', 'almost_done', 'completed', 'confirmed'];
  const statusIndex: Record<string, number> = {
    bidding: 0,
    accepted: 1,
    traveling: 2,
    arrived: 3,
    in_progress: 5,
    completed: 8,
    cancelled: 0,
  };
  const labels: Record<string, string> = {
    requested: 'Request sent',
    accepted: 'Bid accepted',
    traveling: 'Artisan travelling',
    arrived: 'Artisan arrived',
    started: 'Work started',
    materials: 'Materials purchased',
    almost_done: 'Almost complete',
    completed: 'Completed',
    confirmed: 'Customer confirmation',
  };
  const current = statusIndex[status] ?? 0;
  return order.map((key, index) => ({
    key: key as JobTimelineStep['key'],
    label: labels[key],
    done: index <= current,
  }));
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobs = useJobStore((s) => s.jobs);
  const job = jobs.find((j) => j.id === id);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (!job) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.notFound}>Job not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>{job.categoryName}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Card>
          <Text style={styles.description}>{job.description}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.address}>{job.address}</Text>
            <Text style={styles.price}>{formatCurrency(job.aiEstimatedPrice)}</Text>
          </View>
        </Card>

        {job.status !== 'bidding' && job.status !== 'cancelled' ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Track Live"
                variant="outline"
                size="sm"
                icon={<MapPinned size={16} color={colors.primary} />}
                onPress={() => router.push(`/tracking/${job.id}`)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Message"
                variant="ghost"
                size="sm"
                icon={<MessageCircle size={16} color={colors.primary} />}
                onPress={() => router.push('/(tabs)/messages')}
              />
            </View>
          </View>
        ) : null}

        <TimelineCard steps={buildTimeline(job.status)} />

        {job.status === 'bidding' ? (
          <Button label="View Live Bids" size="lg" onPress={() => router.push(`/bidding/${job.id}`)} />
        ) : null}

        {job.status === 'completed' ? (
          <Button
            label="Rate Your Artisan"
            size="lg"
            variant="gold"
            icon={<Star size={16} color={colors.text} />}
            onPress={() => router.push(`/jobs/${job.id}/review`)}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    notFound: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    description: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    address: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    price: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primary },
  });
}
