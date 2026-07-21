import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { useLocationStore } from '@/store/locationStore';
import { Address } from '@/types/user';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

type Result = Omit<Address, 'id' | 'label' | 'isDefault'> & { id: string };

// Quick picks shown before the user types anything — real coordinates, just
// not the result of a live search.
const popularAreas: Result[] = [
  { id: 'l1', line1: 'East Legon, Accra', city: 'Accra', latitude: 5.6501, longitude: -0.1467 },
  { id: 'l2', line1: 'Osu, Accra', city: 'Accra', latitude: 5.5556, longitude: -0.1789 },
  { id: 'l3', line1: 'Airport Residential Area, Accra', city: 'Accra', latitude: 5.6052, longitude: -0.1719 },
  { id: 'l4', line1: 'Adenta, Accra', city: 'Accra', latitude: 5.7095, longitude: -0.1669 },
  { id: 'l5', line1: 'Spintex Road, Accra', city: 'Accra', latitude: 5.6298, longitude: -0.1103 },
];

export default function SearchAddressScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>(popularAreas);
  const [searching, setSearching] = useState(false);
  const setCurrentAddress = useLocationStore((s) => s.setCurrentAddress);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(popularAreas);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const geocoded = await Location.geocodeAsync(trimmed);
        const top = geocoded.slice(0, 5);
        const withAddresses = await Promise.all(
          top.map(async (g, index) => {
            const [place] = await Location.reverseGeocodeAsync(g).catch(() => []);
            const line1 = place
              ? [place.street, place.name].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', ') || place.district || trimmed
              : trimmed;
            const city = place?.city ?? place?.region ?? '';
            return { id: `geo-${index}-${g.latitude}-${g.longitude}`, line1, city, latitude: g.latitude, longitude: g.longitude };
          })
        );
        setResults(withAddresses);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [query]);

  function selectResult(result: Result) {
    // Staged only — the preview screen is where the user picks a label and
    // decides whether to save/default it.
    setCurrentAddress({ id: result.id, label: 'Home', line1: result.line1, city: result.city, latitude: result.latitude, longitude: result.longitude });
    router.replace('/(location)/preview');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
      </View>
      <View style={styles.body}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search for an address..." />
        {searching ? <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} /> : null}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          ListEmptyComponent={
            !searching && query.trim() ? <Text style={styles.empty}>No matches found. Try a different search.</Text> : null
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => selectResult(item)} style={styles.row}>
              <MapPin size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{item.line1}</Text>
                {item.city ? <Text style={styles.rowSubLabel}>{item.city}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, gap: 12 },
    body: { paddingHorizontal: 24, paddingTop: 16, gap: 16, flex: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    rowLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
    rowSubLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    empty: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 24 },
  });
}
