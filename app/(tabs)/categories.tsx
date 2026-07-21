import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { SearchBar } from '@/components/ui/SearchBar';
import { CategoryCard } from '@/components/features/CategoryCard';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { TabScreen } from '@/components/ui/TabScreen';
import { serviceCategories } from '@/constants/categories';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function CategoriesScreen() {
  const [query, setQuery] = useState('');
  const filtered = serviceCategories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <TabScreen routeIndex={1}>
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>All Services</Text>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search categories..." />
        <AnimatedPressable onPress={() => router.push('/jobs/estimator')} style={styles.estimateButton}>
          <Sparkles size={16} color="#0A84FF" />
          <Text style={styles.estimateLabel}>Get an instant AI price estimate</Text>
        </AnimatedPressable>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <CategoryCard
              category={item}
              onPress={() => router.push({ pathname: '/jobs/new/describe', params: { categoryId: item.id, categoryName: item.name } })}
            />
          </View>
        )}
      />
    </SafeAreaView>
    </TabScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
    title: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text },
    estimateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: `${colors.primary}1A`,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    estimateLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
  });
}
