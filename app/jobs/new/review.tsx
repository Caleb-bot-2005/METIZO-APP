import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Calendar, CheckCircle2, MapPin, Wallet } from 'lucide-react-native';
import { StepProgress } from '@/components/ui/StepProgress';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useCreateJob } from '@/hooks/queries/useJobs';
import { useJobStore } from '@/store/jobStore';
import { useNotificationStore } from '@/store/notificationStore';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const timingLabels: Record<string, string> = { today: 'Today', tomorrow: 'Tomorrow', scheduled: 'Scheduled' };

function timingDisplay(timing?: string, scheduledAt?: string) {
  if (timing === 'scheduled' && scheduledAt) {
    return new Date(scheduledAt).toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return timingLabels[timing ?? 'today'];
}

export default function JobReviewStep() {
  const draft = useJobStore((s) => s.draft);
  const addJob = useJobStore((s) => s.addJob);
  const resetDraft = useJobStore((s) => s.resetDraft);
  const createJob = useCreateJob();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [submitted, setSubmitted] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  async function handleSubmit() {
    try {
      const job = await createJob.mutateAsync({
        categoryId: draft.categoryId,
        categoryName: draft.categoryName,
        description: draft.description,
        photos: draft.photos,
        latitude: draft.latitude,
        longitude: draft.longitude,
        address: draft.address,
        budgetMin: draft.budgetMin,
        budgetMax: draft.budgetMax,
        aiEstimatedPrice: draft.aiEstimatedPrice,
        timing: draft.timing,
        scheduledAt: draft.scheduledAt,
        status: 'bidding',
      });
      addJob(job);
      setJobId(job.id);
      setSubmitted(true);
      toast.show('Job request submitted!', 'success');
      addNotification({
        id: `notif-job-${job.id}`,
        category: 'job',
        title: 'Job request submitted',
        body: `Your ${job.categoryName} request is live — we'll notify you as bids come in.`,
        createdAt: 'Now',
        read: false,
      });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        toast.show('Your session has expired. Please log out and log back in.', 'error');
      } else {
        toast.show('Could not submit your request. Please try again.', 'error');
      }
    }
  }

  function goToBidding() {
    resetDraft();
    if (jobId) router.replace(`/bidding/${jobId}`);
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.successScreen}>
        <View style={styles.successCenter}>
          <Animated.View entering={ZoomIn.springify()} style={styles.successIcon}>
            <CheckCircle2 size={48} color={colors.success} />
          </Animated.View>
          <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 24 }}>
            <Text style={styles.successTitle}>Job Posted!</Text>
            <Text style={styles.successSubtitle}>
              We&apos;re notifying nearby artisans. Bids will start coming in shortly.
            </Text>
          </View>
        </View>
        <Button label="View Live Bids" size="lg" onPress={goToBidding} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StepProgress step={7} total={7} title="Review your request" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Card>
          <Text style={styles.categoryName}>{draft.categoryName ?? 'Service'}</Text>
          <Text style={styles.description}>{draft.description}</Text>
        </Card>

        {draft.photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {draft.photos.map((photo) => (
              <Image key={photo.id} source={{ uri: photo.uri }} style={{ width: 90, height: 90, borderRadius: 12 }} />
            ))}
          </ScrollView>
        ) : null}

        <Card>
          <View style={styles.detailRow}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.detailText}>{draft.address ?? 'Location not set'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Wallet size={16} color={colors.primary} />
            <Text style={styles.detailText}>
              {formatCurrency(draft.budgetMin ?? 0)} - {formatCurrency(draft.budgetMax ?? 0)}
            </Text>
          </View>
          <View style={[styles.detailRow, { marginBottom: 0 }]}>
            <Calendar size={16} color={colors.primary} />
            <Text style={styles.detailText}>{timingDisplay(draft.timing, draft.scheduledAt)}</Text>
          </View>
        </Card>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button label="Submit Job Request" size="lg" loading={createJob.isPending} onPress={handleSubmit} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    successScreen: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 40 },
    successCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: `${colors.success}1A`, alignItems: 'center', justifyContent: 'center' },
    successTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text, textAlign: 'center' },
    successSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    categoryName: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text, marginBottom: 4 },
    description: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    detailText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
  });
}
