import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, MapPinned, MessageCircle, ShieldAlert, Star } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TimelineCard } from '@/components/features/TimelineCard';
import { useToast } from '@/components/ui/Toast';
import { useConfirmCompletion } from '@/hooks/queries/useJobs';
import { useWorkPhotos } from '@/hooks/queries/useWorkPhotos';
import { useJobStore } from '@/store/jobStore';
import { formatCurrency } from '@/utils/format';
import { Job, JobTimelineStep, ProgressStage } from '@/types/job';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

// Driven by the real backend signals only: job.status (bidding/accepted/in_progress/
// completed) and job.progressStage (the artisan-reported checkpoint while
// in_progress). No fabricated "traveling/arrived" substeps here — that's the
// separate live-tracking map screen's own thing.
const progressOrder: ProgressStage[] = ['started', 'materials_purchased', 'almost_done', 'done'];

function buildTimeline(job: Job): JobTimelineStep[] {
  const progressIndex = job.progressStage
    ? progressOrder.indexOf(job.progressStage)
    : job.status === 'in_progress'
      ? 0
      : -1;
  const isCompleted = job.status === 'completed';

  return [
    { key: 'requested', label: 'Request sent', done: true },
    { key: 'accepted', label: 'Bid accepted', done: job.status !== 'bidding' && job.status !== 'cancelled' },
    { key: 'started', label: 'Work started', done: progressIndex >= 0 || isCompleted },
    { key: 'materials', label: 'Materials purchased', done: progressIndex >= 1 || isCompleted },
    { key: 'almost_done', label: 'Almost complete', done: progressIndex >= 2 || isCompleted },
    { key: 'completed', label: 'Work completed', done: progressIndex >= 3 || isCompleted },
    { key: 'confirmed', label: 'Customer confirmation', done: isCompleted },
  ];
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobs = useJobStore((s) => s.jobs);
  const job = jobs.find((j) => j.id === id);
  const updateJobStatus = useJobStore((s) => s.updateJobStatus);
  const confirmCompletion = useConfirmCompletion();
  const { data: photos } = useWorkPhotos(job?.id);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (!job) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.notFound}>Job not found</Text>
      </SafeAreaView>
    );
  }

  // Mirrors the backend's confirmCompletion gate (ServiceRequestService.java):
  // release is only allowed once the artisan reported DONE and posted an
  // AFTER photo. Checked client-side too so the button reflects reality
  // instead of the customer hitting a confusing 400.
  const hasCompletionProof = job.progressStage === 'done' && !!photos?.some((p) => p.type === 'after');

  async function handleConfirm() {
    try {
      await confirmCompletion.mutateAsync(job!.id);
      updateJobStatus(job!.id, 'completed');
      toast.show('Payment released. Thanks for confirming!', 'success');
    } catch (error: any) {
      toast.show(error?.response?.data?.message ?? 'Could not confirm completion. Please try again.', 'error');
    }
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

        <TimelineCard steps={buildTimeline(job)} />

        {photos && photos.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.photosTitle}>Completion Photos</Text>
            <FlatList
              data={photos}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item }) => (
                <View>
                  <Image source={{ uri: item.url }} style={styles.photoThumb} />
                  <Text style={styles.photoLabel}>{item.type === 'after' ? 'After' : 'Before'}</Text>
                </View>
              )}
            />
          </View>
        ) : null}

        {job.status === 'bidding' ? (
          <Button label="View Live Bids" size="lg" onPress={() => router.push(`/bidding/${job.id}`)} />
        ) : null}

        {job.status === 'in_progress' ? (
          hasCompletionProof ? (
            <Button
              label="Confirm & Release Payment"
              size="lg"
              loading={confirmCompletion.isPending}
              icon={<CheckCircle2 size={16} color="#FFFFFF" />}
              onPress={handleConfirm}
            />
          ) : (
            <View style={styles.waitingBanner}>
              <ShieldAlert size={18} color={colors.textSecondary} />
              <Text style={styles.waitingBannerText}>
                Your payment stays safely in escrow until the artisan marks the job done and posts photos of the
                finished work for you to review.
              </Text>
            </View>
          )
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
    photosTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    photoThumb: { width: 120, height: 120, borderRadius: 14, backgroundColor: colors.card },
    photoLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
    waitingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    waitingBannerText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSecondary },
  });
}
