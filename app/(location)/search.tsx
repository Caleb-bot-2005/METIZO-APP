import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { LocateFixed, MapPin } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/components/ui/Toast';
import { useLocationStore } from '@/store/locationStore';
import { useJobStore } from '@/store/jobStore';
import { useEmergencyStore } from '@/store/emergencyStore';
import { Address } from '@/types/user';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

type Result = Omit<Address, 'id' | 'label' | 'isDefault'> & { id: string };

// Loose bounding box around Ghana — cheap sanity check to keep results (and
// the device geocoder's international guesses) confined to the country,
// since the job site should always be somewhere the artisan can reach.
const GHANA_BOUNDS = { minLat: 4.5, maxLat: 11.5, minLon: -3.5, maxLon: 1.5 };
function isInGhana(latitude: number, longitude: number) {
  return (
    latitude >= GHANA_BOUNDS.minLat &&
    latitude <= GHANA_BOUNDS.maxLat &&
    longitude >= GHANA_BOUNDS.minLon &&
    longitude <= GHANA_BOUNDS.maxLon
  );
}

// Quick picks shown before the user types anything — real coordinates, just
// not the result of a live search. Spans multiple regions, not just Accra.
const popularAreas: Result[] = [
  { id: 'l1', line1: 'East Legon, Accra', city: 'Accra', latitude: 5.6501, longitude: -0.1467 },
  { id: 'l2', line1: 'Osu, Accra', city: 'Accra', latitude: 5.5556, longitude: -0.1789 },
  { id: 'l3', line1: 'Airport Residential Area, Accra', city: 'Accra', latitude: 5.6052, longitude: -0.1719 },
  { id: 'l4', line1: 'Adenta, Accra', city: 'Accra', latitude: 5.7095, longitude: -0.1669 },
  { id: 'l5', line1: 'Spintex Road, Accra', city: 'Accra', latitude: 5.6298, longitude: -0.1103 },
  { id: 'l6', line1: 'Adum, Kumasi', city: 'Kumasi', latitude: 6.6935, longitude: -1.6291 },
  { id: 'l7', line1: 'Market Circle, Takoradi', city: 'Takoradi', latitude: 4.8916, longitude: -1.7534 },
  { id: 'l8', line1: 'Cape Coast Central', city: 'Cape Coast', latitude: 5.1053, longitude: -1.2466 },
  { id: 'l9', line1: 'Tamale Central', city: 'Tamale', latitude: 9.4034, longitude: -0.8424 },
];

export default function SearchAddressScreen() {
  // for=job means we got here from the "Where is the job?" step — pick a
  // result straight into the job draft and go back, skipping the
  // Home/Work/Other label flow, which only makes sense for personal addresses.
  const { for: target } = useLocalSearchParams<{ for?: string }>();
  const isJobTarget = target === 'job';
  const isEmergencyTarget = target === 'emergency';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>(popularAreas);
  const [searching, setSearching] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const setCurrentAddress = useLocationStore((s) => s.setCurrentAddress);
  const updateJobDraft = useJobStore((s) => s.updateDraft);
  const setEmergencyLocation = useEmergencyStore((s) => s.setLocation);
  const toast = useToast();
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
        // Bias the device geocoder toward Ghana, then hard-filter to the
        // bounding box in case it still returns an international match.
        const geocoded = await Location.geocodeAsync(`${trimmed}, Ghana`);
        const withinGhana = geocoded.filter((g) => isInGhana(g.latitude, g.longitude));
        const top = withinGhana.slice(0, 5);
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
    if (isJobTarget) {
      updateJobDraft({ latitude: result.latitude, longitude: result.longitude, address: result.line1 });
      router.back();
      return;
    }
    if (isEmergencyTarget) {
      setEmergencyLocation({ latitude: result.latitude, longitude: result.longitude, address: result.line1 });
      router.back();
      return;
    }
    // Staged only — the preview screen is where the user picks a label and
    // decides whether to save/default it.
    setCurrentAddress({ id: result.id, label: 'Home', line1: result.line1, city: result.city, latitude: result.latitude, longitude: result.longitude });
    router.replace('/(location)/preview');
  }

  async function useCurrentLocation() {
    setLocatingCurrent(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Location permission denied. Try searching for the address instead.', 'error');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
      const line1 = place
        ? [place.street, place.name].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', ') || place.district || 'Current location'
        : 'Current location';
      selectResult({ id: `gps-${Date.now()}`, line1, city: place?.city ?? place?.region ?? '', latitude, longitude });
    } catch {
      toast.show('Could not fetch your location. Please try again.', 'error');
    } finally {
      setLocatingCurrent(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>{isJobTarget || isEmergencyTarget ? 'Where is the job?' : 'Search address'}</Text>
      </View>
      <View style={styles.body}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search for an address in Ghana..." />
        {searching ? <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} /> : null}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          ListHeaderComponent={
            <Pressable onPress={useCurrentLocation} disabled={locatingCurrent} style={[styles.row, styles.currentLocationRow]}>
              {locatingCurrent ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <LocateFixed size={18} color={colors.primary} />
              )}
              <Text style={styles.currentLocationLabel}>{locatingCurrent ? 'Locating…' : 'Use my current location'}</Text>
            </Pressable>
          }
          ListEmptyComponent={
            !searching && query.trim() ? (
              <Text style={styles.empty}>No matches found in Ghana. Try a different search.</Text>
            ) : null
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
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    body: { paddingHorizontal: 24, paddingTop: 16, gap: 16, flex: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    currentLocationRow: { marginBottom: 8, borderWidth: 1, borderColor: colors.primary },
    currentLocationLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
    rowLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
    rowSubLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    empty: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 24 },
  });
}
