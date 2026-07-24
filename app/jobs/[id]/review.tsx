import { useState } from 'react';
import { Share, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { CheckCircle2, Share2, Star } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { useJobs, useLeaveReview } from '@/hooks/queries/useJobs';
import { useArtisan } from '@/hooks/queries/useArtisans';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function RateArtisanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: jobs } = useJobs();
  const job = jobs?.find((j) => j.id === id);
  const { data: artisan } = useArtisan(job?.assignedArtisanId ?? '');
  const leaveReview = useLeaveReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  async function submit() {
    try {
      await leaveReview.mutateAsync({ id, rating, comment });
      setSubmitted(true);
    } catch (error: any) {
      toast.show(error?.response?.data?.message ?? 'Could not submit your review. Please try again.', 'error');
    }
  }

  async function share() {
    try {
      await Share.share({
        message: `I just had a great experience with ${artisan?.name ?? 'my artisan'} on METIZO — ${rating}/5 stars!`,
      });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  }

  if (!job) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.notFound}>Job not found</Text>
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.successScreen}>
        <View style={styles.successCenter}>
          <Animated.View entering={ZoomIn.springify()} style={styles.successIcon}>
            <CheckCircle2 size={48} color={colors.success} />
          </Animated.View>
          <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 24 }}>
            <Text style={styles.successTitle}>Thank you!</Text>
            <Text style={styles.successSubtitle}>Your review helps other customers find trusted artisans.</Text>
          </View>
          <AnimatedPressable onPress={share} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Share2 size={16} color={colors.primary} />
            <Text style={styles.shareLabel}>Share your review</Text>
          </AnimatedPressable>
        </View>
        <Button label="Back to History" size="lg" onPress={() => router.replace('/(tabs)/jobs')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Rate Your Artisan</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Avatar name={artisan?.name ?? job.categoryName} uri={artisan?.avatarUrl} size={72} />
          <Text style={styles.artisanName}>{artisan?.name ?? job.categoryName}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <AnimatedPressable key={value} onPress={() => setRating(value)}>
                <Star size={32} color={colors.gold} fill={value <= rating ? colors.gold : 'transparent'} />
              </AnimatedPressable>
            ))}
          </View>
        </View>

        <View style={styles.commentBox}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share details about your experience..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text, minHeight: 100, textAlignVertical: 'top' }}
          />
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button label="Submit Review" size="lg" loading={leaveReview.isPending} onPress={submit} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    notFound: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    successScreen: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 40 },
    successCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: `${colors.success}1A`, alignItems: 'center', justifyContent: 'center' },
    successTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text, textAlign: 'center' },
    successSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    shareLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    artisanName: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    commentBox: { backgroundColor: colors.card, borderRadius: 16, padding: 16 },
  });
}
