import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import { StepProgress } from '@/components/ui/StepProgress';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { PriceCard } from '@/components/features/PriceCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useJobEstimate } from '@/hooks/queries/useJobs';
import { useJobStore } from '@/store/jobStore';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function JobBudgetStep() {
  const draft = useJobStore((s) => s.draft);
  const updateDraft = useJobStore((s) => s.updateDraft);
  const estimate = useJobEstimate();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  useEffect(() => {
    if (draft.description && draft.categoryId && !draft.aiEstimatedPrice) {
      estimate.mutate(
        { description: draft.description, categoryId: draft.categoryId },
        {
          onSuccess: (data) => {
            updateDraft({ aiEstimatedPrice: data.price, budgetMin: data.min, budgetMax: data.max });
          },
        }
      );
    }
  }, []);

  function adjust(field: 'budgetMin' | 'budgetMax', delta: number) {
    const value = Math.max(0, (draft[field] ?? 0) + delta);
    updateDraft({ [field]: value } as any);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StepProgress step={5} total={7} title="Set your budget" />
      <View style={{ flex: 1, paddingHorizontal: 24, gap: 24 }}>
        {estimate.isPending ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={140} radius={24} />
          </View>
        ) : (
          <PriceCard
            estimatedPrice={draft.aiEstimatedPrice ?? 0}
            min={draft.budgetMin}
            max={draft.budgetMax}
            durationLabel={estimate.data?.durationLabel}
            complexity={estimate.data?.complexity}
          />
        )}

        <View style={{ gap: 16 }}>
          <Text style={styles.label}>Adjust your budget range</Text>
          <View style={styles.adjustRow}>
            <Text style={styles.adjustLabel}>Min</Text>
            <View style={styles.stepper}>
              <AnimatedPressable onPress={() => adjust('budgetMin', -20)} style={styles.stepperButton}>
                <Minus size={14} color={colors.text} />
              </AnimatedPressable>
              <Text style={styles.adjustValue}>{formatCurrency(draft.budgetMin ?? 0)}</Text>
              <AnimatedPressable onPress={() => adjust('budgetMin', 20)} style={styles.stepperButton}>
                <Plus size={14} color={colors.text} />
              </AnimatedPressable>
            </View>
          </View>
          <View style={styles.adjustRow}>
            <Text style={styles.adjustLabel}>Max</Text>
            <View style={styles.stepper}>
              <AnimatedPressable onPress={() => adjust('budgetMax', -20)} style={styles.stepperButton}>
                <Minus size={14} color={colors.text} />
              </AnimatedPressable>
              <Text style={styles.adjustValue}>{formatCurrency(draft.budgetMax ?? 0)}</Text>
              <AnimatedPressable onPress={() => adjust('budgetMax', 20)} style={styles.stepperButton}>
                <Plus size={14} color={colors.text} />
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button label="Continue" size="lg" disabled={estimate.isPending} onPress={() => router.push('/jobs/new/timing')} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    label: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    adjustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    adjustLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    stepperButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    adjustValue: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text, minWidth: 70, textAlign: 'center' },
  });
}
