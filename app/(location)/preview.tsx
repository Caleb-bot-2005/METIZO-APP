import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapView, Marker } from '@/components/ui/AppMap';
import type { MapPressEvent } from '@/components/ui/AppMap';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Briefcase, Home, MapPin } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { useLocationStore } from '@/store/locationStore';
import { useAuthStore } from '@/store/authStore';
import { getHomeRoute } from '@/utils/navigation';
import { Address } from '@/types/user';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const labelOptions: { key: Address['label']; Icon: typeof Home }[] = [
  { key: 'Home', Icon: Home },
  { key: 'Work', Icon: Briefcase },
  { key: 'Other', Icon: MapPin },
];

export default function LocationPreviewScreen() {
  const currentAddress = useLocationStore((s) => s.currentAddress);
  const savedAddresses = useLocationStore((s) => s.savedAddresses);
  const saveAddress = useLocationStore((s) => s.saveAddress);
  const userRole = useAuthStore((s) => s.user?.role);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const [pin, setPin] = useState({
    latitude: currentAddress?.latitude ?? 5.6037,
    longitude: currentAddress?.longitude ?? -0.187,
    line1: currentAddress?.line1 ?? 'Pin your location',
    city: currentAddress?.city ?? '',
  });
  const [label, setLabel] = useState<Address['label']>(currentAddress?.label ?? 'Home');
  // Default to true when this is the very first address, since there's nothing
  // else it could compete with.
  const [makeDefault, setMakeDefault] = useState(savedAddresses.length === 0);
  const [locating, setLocating] = useState(false);

  const region = { latitude: pin.latitude, longitude: pin.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };

  async function handleMapPress(e: MapPressEvent) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPin((p) => ({ ...p, latitude, longitude }));
    setLocating(true);
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const line1 = place
        ? [place.street, place.name].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', ') || place.district || 'Dropped pin'
        : 'Dropped pin';
      setPin({ latitude, longitude, line1, city: place?.city ?? place?.region ?? '' });
    } catch {
      setPin((p) => ({ ...p, latitude, longitude, line1: 'Dropped pin' }));
    } finally {
      setLocating(false);
    }
  }

  function confirm() {
    saveAddress(
      { id: currentAddress?.id ?? `addr-${Date.now()}`, label, line1: pin.line1, city: pin.city, latitude: pin.latitude, longitude: pin.longitude },
      makeDefault
    );
    router.replace(getHomeRoute(userRole));
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={{ flex: 1 }}>
        <MapView style={{ flex: 1 }} initialRegion={region} onPress={handleMapPress}>
          <Marker coordinate={{ latitude: pin.latitude, longitude: pin.longitude }} />
        </MapView>
        <View style={styles.pill}>
          <MapPin size={18} color={colors.primary} />
          <Text style={styles.pillText} numberOfLines={1}>
            {locating ? 'Locating…' : pin.line1}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.hint}>Tap anywhere on the map to move the pin to your exact location</Text>

        <View style={styles.labelRow}>
          {labelOptions.map(({ key, Icon }) => (
            <AnimatedPressable
              key={key}
              onPress={() => setLabel(key)}
              style={[styles.labelChip, label === key ? styles.labelChipActive : null]}>
              <Icon size={16} color={label === key ? '#FFFFFF' : colors.primary} />
              <Text style={[styles.labelChipText, label === key ? styles.labelChipTextActive : null]}>{key}</Text>
            </AnimatedPressable>
          ))}
        </View>

        <View style={styles.defaultRow}>
          <Text style={styles.defaultLabel}>Set as my default address</Text>
          <Switch value={makeDefault} onValueChange={setMakeDefault} trackColor={{ true: colors.primary }} />
        </View>

        <Button label="Confirm Location" size="lg" onPress={confirm} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    pill: {
      position: 'absolute',
      top: 64,
      left: 24,
      right: 24,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      shadowColor: '#0F172A',
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    pillText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text, flex: 1 },
    footer: { paddingHorizontal: 24, paddingVertical: 20, gap: 16, backgroundColor: colors.background },
    hint: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
    labelRow: { flexDirection: 'row', gap: 8 },
    labelChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    labelChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    labelChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text },
    labelChipTextActive: { color: '#FFFFFF' },
    defaultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    defaultLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
  });
}
