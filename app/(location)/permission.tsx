import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { LocateFixed, MapPin, Search } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useLocationStore } from '@/store/locationStore';
import { useToast } from '@/components/ui/Toast';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function LocationPermissionScreen() {
  const [requesting, setRequesting] = useState(false);
  const setPermissionGranted = useLocationStore((s) => s.setPermissionGranted);
  const setCurrentAddress = useLocationStore((s) => s.setCurrentAddress);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  async function useCurrentLocation() {
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Location permission denied. You can search your address instead.', 'error');
        setRequesting(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setPermissionGranted(true);

      const { latitude, longitude } = position.coords;
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
      const line1 = place ? [place.street, place.name].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', ') || place.district || 'Current location' : 'Current location';
      const city = place?.city ?? place?.region ?? '';

      // Staged, not yet saved — the preview screen lets the user pick a label
      // (Home/Work/Other) and whether to make it their default before it's kept.
      setCurrentAddress({ id: `gps-${Date.now()}`, label: 'Home', line1, city, latitude, longitude });
      router.replace('/(location)/preview');
    } catch {
      toast.show('Could not fetch location. Please try again.', 'error');
    } finally {
      setRequesting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <MapPin size={72} color="#0A84FF" strokeWidth={1.5} />
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.subtitle}>
            METIZO uses your location to find the nearest trusted artisans and share your address for jobs.
          </Text>
        </View>
      </View>

      <View style={{ gap: 12, paddingBottom: 32 }}>
        <Button
          label="Use Current Location"
          size="lg"
          loading={requesting}
          icon={<LocateFixed size={18} color="#FFFFFF" />}
          onPress={useCurrentLocation}
        />
        <Button
          label="Search Address"
          variant="outline"
          size="lg"
          icon={<Search size={18} color="#0A84FF" />}
          onPress={() => router.push('/(location)/search')}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 },
    iconWrap: { width: 160, height: 160, borderRadius: 80, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text, textAlign: 'center' },
    subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  });
}
