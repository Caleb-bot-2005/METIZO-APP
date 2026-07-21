import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { ArtisanCard } from '@/components/features/ArtisanCard';
import { useArtisans } from '@/hooks/queries/useArtisans';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function SavedArtisansScreen() {
  const { data: artisans } = useArtisans();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Saved Artisans</Text>
      </View>
      <FlatList
        data={artisans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Heart size={40} color={colors.textSecondary} />
            <Text style={styles.emptyLabel}>No saved artisans yet</Text>
          </View>
        }
        renderItem={({ item }) => <ArtisanCard artisan={item} onPress={() => router.push(`/artisans/${item.id}`)} />}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    empty: { alignItems: 'center', gap: 12, marginTop: 64 },
    emptyLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
  });
}
