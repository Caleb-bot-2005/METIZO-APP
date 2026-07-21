import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StepProgress } from '@/components/ui/StepProgress';
import { CategoryCard } from '@/components/features/CategoryCard';
import { useJobStore } from '@/store/jobStore';
import { serviceCategories } from '@/constants/categories';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function JobCategoryStep() {
  const updateDraft = useJobStore((s) => s.updateDraft);
  const resetDraft = useJobStore((s) => s.resetDraft);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  function selectCategory(id: string, name: string) {
    resetDraft();
    updateDraft({ categoryId: id, categoryName: name });
    router.push('/jobs/new/describe');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StepProgress step={1} total={7} title="What do you need help with?" />
      <FlatList
        data={serviceCategories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <CategoryCard category={item} onPress={() => selectCategory(item.id, item.name)} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
  });
}
