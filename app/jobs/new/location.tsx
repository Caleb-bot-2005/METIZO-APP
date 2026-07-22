import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapView, Marker } from '@/components/ui/AppMap';
import type { MapPressEvent } from '@/components/ui/AppMap';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { LocateFixed, MapPin, Search } from 'lucide-react-native';
import { StepProgress } from '@/components/ui/StepProgress';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useJobStore } from '@/store/jobStore';
import { useLocationStore } from '@/store/locationStore';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function JobLocationStep() {
  const draft = useJobStore((s) => s.draft);
  const updateDraft = useJobStore((s) => s.updateDraft);
  const currentAddress = useLocationStore((s) => s.currentAddress);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [locating, setLocating] = useState(false);
  const [pinning, setPinning] = useState(false);

  // Tapping the map is how the customer fine-tunes a search result down to
  // the exact building — reverse-geocoding here keeps the address text honest
  // about where the pin actually is, instead of showing a stale search label.
  async function handleMapPress(e: MapPressEvent) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateDraft({ latitude, longitude });
    setPinning(true);
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
      const address = place
        ? [place.street, place.name].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', ') || place.district || 'Dropped pin'
        : 'Dropped pin';
      updateDraft({ address });
    } finally {
      setPinning(false);
    }
  }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Location permission denied. Try searching for the address instead.', 'error');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
      const address = place
        ? [place.street, place.name].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', ') || place.district || 'Current location'
        : 'Current location';
      updateDraft({ latitude, longitude, address });
    } catch {
      toast.show('Could not fetch your location. Please try again.', 'error');
    } finally {
      setLocating(false);
    }
  }

  const region = {
    latitude: draft.latitude ?? currentAddress?.latitude ?? 5.6037,
    longitude: draft.longitude ?? currentAddress?.longitude ?? -0.187,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  function handleNext() {
    const address = draft.address ?? currentAddress?.line1;
    if (!address) {
      toast.show('Search, use your current location, or tap the map to set the job location', 'error');
      return;
    }
    updateDraft({ latitude: region.latitude, longitude: region.longitude, address });
    router.push('/jobs/new/budget');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StepProgress step={4} total={7} title="Where is the job?" />
      <View style={styles.actionRow}>
        <AnimatedPressable style={styles.actionButton} onPress={useCurrentLocation} disabled={locating}>
          <LocateFixed size={16} color={colors.primary} />
          <Text style={styles.actionLabel}>{locating ? 'Locating…' : 'Use Current Location'}</Text>
        </AnimatedPressable>
        <AnimatedPressable style={styles.actionButton} onPress={() => router.push('/(location)/search?for=job')}>
          <Search size={16} color={colors.primary} />
          <Text style={styles.actionLabel}>Search Address</Text>
        </AnimatedPressable>
      </View>
      <View style={styles.mapWrap}>
        <MapView style={{ flex: 1 }} initialRegion={region} onPress={handleMapPress}>
          <Marker coordinate={{ latitude: draft.latitude ?? region.latitude, longitude: draft.longitude ?? region.longitude }} />
        </MapView>
        <View style={styles.pill}>
          <MapPin size={16} color={colors.primary} />
          <Text style={styles.pillText} numberOfLines={1}>
            {pinning ? 'Locating…' : (draft.address ?? currentAddress?.line1 ?? 'Tap the map for the exact spot')}
          </Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button label="Continue" size="lg" onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingBottom: 12 },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
    mapWrap: { flex: 1, marginHorizontal: 24, marginBottom: 16, borderRadius: 24, overflow: 'hidden' },
    pill: {
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pillText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
  });
}
