import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { StepProgress } from '@/components/ui/StepProgress';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useJobStore } from '@/store/jobStore';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const suggestionsByCategory: Record<string, string[]> = {
  plumber: ['Leaking pipe under sink', 'Blocked drain', 'No hot water', 'Toilet not flushing'],
  electrician: ['Power outlet not working', 'Frequent tripping', 'Install new lights', 'Rewiring needed'],
  default: ['Needs urgent repair', 'Routine maintenance', 'Installation required', 'Not sure, need inspection'],
};

export default function JobDescribeStep() {
  const params = useLocalSearchParams<{ categoryId?: string; categoryName?: string }>();
  const draft = useJobStore((s) => s.draft);
  const updateDraft = useJobStore((s) => s.updateDraft);
  const [description, setDescription] = useState(draft.description ?? '');
  const colors = useThemeColors();
  const styles = createStyles(colors);

  useEffect(() => {
    if (params.categoryId && !draft.categoryId) {
      updateDraft({ categoryId: params.categoryId, categoryName: params.categoryName });
    }
  }, [params.categoryId]);

  const categoryId = draft.categoryId ?? params.categoryId ?? 'default';
  const suggestions = suggestionsByCategory[categoryId] ?? suggestionsByCategory.default;

  function handleNext() {
    updateDraft({ description });
    router.push('/jobs/new/photos');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <StepProgress step={2} total={7} title="Describe the problem" />
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <View style={styles.textBox}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="E.g. My kitchen sink pipe is leaking and water is pooling on the floor..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.text, minHeight: 140, textAlignVertical: 'top' }}
            />
            <View style={styles.charCountRow}>
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color={colors.primary} />
              <Text style={styles.suggestionsTitle}>AI Suggestions</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.map((suggestion) => (
                <AnimatedPressable key={suggestion} onPress={() => setDescription(suggestion)} style={styles.suggestionChip}>
                  <Text style={styles.suggestionLabel}>{suggestion}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>
        </ScrollView>
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <Button label="Continue" size="lg" disabled={description.trim().length < 5} onPress={handleNext} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    textBox: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 12 },
    charCountRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    charCount: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    suggestionsTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    suggestionChip: { backgroundColor: colors.card, borderWidth: 1, borderColor: `${colors.primary}33`, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    suggestionLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.text },
  });
}
