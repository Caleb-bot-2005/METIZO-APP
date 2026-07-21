import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { CheckCircle2, MapPin, Wallet } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useJobFeed } from '@/hooks/queries/useJobs';
import { usePlaceBid } from '@/hooks/queries/useBidding';
import { formatCurrency } from '@/utils/format';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ThemeColors } from '@/theme/colors';

const timeOptions = ['30-60 min', '1-2 hours', '2-3 hours', 'Today', 'Tomorrow'];

export default function ArtisanJobBidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: jobs } = useJobFeed();
  const job = jobs?.find((j) => j.id === id);
  const placeBid = usePlaceBid();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const [amount, setAmount] = useState(job ? String(job.aiEstimatedPrice || '') : '');
  const [estimatedTime, setEstimatedTime] = useState(timeOptions[1]);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      toast.show('Enter a valid bid amount', 'error');
      return;
    }
    try {
      await placeBid.mutateAsync({ jobId: id!, amount: parsed, estimatedTime, message: message || undefined });
      setSubmitted(true);
    } catch {
      toast.show('Could not place your bid. Please try again.', 'error');
    }
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.successScreen}>
        <View style={styles.successCenter}>
          <Animated.View entering={ZoomIn.springify()} style={styles.successIcon}>
            <CheckCircle2 size={48} color={colors.success} />
          </Animated.View>
          <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 24 }}>
            <Text style={styles.successTitle}>Bid Placed!</Text>
            <Text style={styles.successSubtitle}>The customer will be notified. Track it under My Work.</Text>
          </View>
        </View>
        <Button
          label="Back to Feed"
          size="lg"
          onPress={() => router.replace('/(artisan-tabs)')}
          style={{ backgroundColor: colors.artisan }}
        />
      </SafeAreaView>
    );
  }

  if (!job) {
    return <SafeAreaView style={styles.screen} />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Place a Bid</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.categoryName}>{job.categoryName}</Text>
          <Text style={styles.description}>{job.description}</Text>
          <View style={styles.detailRow}>
            <MapPin size={16} color={colors.artisan} />
            <Text style={styles.detailText}>{job.address || 'Location not set'}</Text>
          </View>
          <View style={[styles.detailRow, { marginBottom: 0 }]}>
            <Wallet size={16} color={colors.artisan} />
            <Text style={styles.detailText}>Customer budget: {formatCurrency(job.aiEstimatedPrice)}</Text>
          </View>
        </Card>

        <Input
          label="Your bid amount (GH₵)"
          placeholder="250"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <View style={{ gap: 8 }}>
          <Text style={styles.fieldLabel}>Estimated time</Text>
          <View style={styles.chipRow}>
            {timeOptions.map((option) => (
              <AnimatedPressable
                key={option}
                onPress={() => setEstimatedTime(option)}
                style={[styles.chip, estimatedTime === option ? styles.chipActive : null]}>
                <Text style={[styles.chipLabel, estimatedTime === option ? styles.chipLabelActive : null]}>{option}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>

        <Input
          label="Message to customer (optional)"
          placeholder="Let them know why you're a good fit..."
          multiline
          style={{ minHeight: 80, textAlignVertical: 'top' }}
          value={message}
          onChangeText={setMessage}
        />
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button
          label="Submit Bid"
          size="lg"
          loading={placeBid.isPending}
          onPress={handleSubmit}
          style={{ backgroundColor: colors.artisan }}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    successScreen: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 40 },
    successCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: `${colors.success}1A`, alignItems: 'center', justifyContent: 'center' },
    successTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text, textAlign: 'center' },
    successSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    categoryName: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text, marginBottom: 4 },
    description: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    detailText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
    fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.artisan, borderColor: colors.artisan },
    chipLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text },
    chipLabelActive: { color: '#FFFFFF' },
  });
