import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Lightbulb, Sparkles } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { PriceCard } from '@/components/features/PriceCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useJobEstimate } from '@/hooks/queries/useJobs';
import { serviceCategories } from '@/constants/categories';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function AiPriceEstimatorScreen() {
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(serviceCategories[0].id);
  const estimate = useJobEstimate();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  function runEstimate() {
    estimate.mutate({ description, categoryId });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>AI Price Estimator</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          <View style={styles.infoBanner}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={styles.infoText}>
              Describe your issue and our AI will estimate the likely cost, duration and complexity before you post a job.
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {serviceCategories.map((category) => (
              <AnimatedPressable
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                style={[styles.categoryChip, { backgroundColor: categoryId === category.id ? colors.primary : colors.card }]}>
                <Text style={[styles.categoryLabel, { color: categoryId === category.id ? '#FFFFFF' : colors.textSecondary }]}>
                  {category.name}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>

          <View style={styles.textBox}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="E.g. Ceiling fan makes a loud noise and spins slowly..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text, minHeight: 100, textAlignVertical: 'top' }}
            />
          </View>

          <Button label="Get AI Estimate" size="lg" loading={estimate.isPending} disabled={description.length < 5} onPress={runEstimate} />

          {estimate.isPending ? <Skeleton height={160} radius={24} /> : null}

          {estimate.data ? (
            <View style={{ gap: 16 }}>
              <PriceCard
                estimatedPrice={estimate.data.price}
                min={estimate.data.min}
                max={estimate.data.max}
                durationLabel={estimate.data.durationLabel}
                complexity={estimate.data.complexity}
              />
              <View style={styles.tipRow}>
                <Lightbulb size={18} color={colors.warning} />
                <Text style={styles.tipText}>
                  Tip: Booking during weekday mornings and bundling similar jobs together can save up to 15% on service fees.
                </Text>
              </View>
              <Button
                label="Post This Job"
                size="lg"
                variant="gold"
                onPress={() => router.push({ pathname: '/jobs/new/describe', params: { categoryId, categoryName: serviceCategories.find((c) => c.id === categoryId)?.name } })}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: `${colors.primary}0D`,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: `${colors.primary}1A`,
    },
    infoText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    categoryChip: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
    categoryLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    textBox: { backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    tipText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  });
}
