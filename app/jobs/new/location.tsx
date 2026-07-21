import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapView, Marker } from '@/components/ui/AppMap';
import type { MapPressEvent } from '@/components/ui/AppMap';
import { router } from 'expo-router';
import { Briefcase, Home, MapPin } from 'lucide-react-native';
import { StepProgress } from '@/components/ui/StepProgress';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useJobStore } from '@/store/jobStore';
import { useLocationStore } from '@/store/locationStore';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const labelIcons = { Home, Work: Briefcase, Other: MapPin };

export default function JobLocationStep() {
  const draft = useJobStore((s) => s.draft);
  const updateDraft = useJobStore((s) => s.updateDraft);
  const currentAddress = useLocationStore((s) => s.currentAddress);
  const savedAddresses = useLocationStore((s) => s.savedAddresses);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const region = {
    latitude: draft.latitude ?? currentAddress?.latitude ?? 5.6037,
    longitude: draft.longitude ?? currentAddress?.longitude ?? -0.187,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  function pickSavedAddress(address: (typeof savedAddresses)[number]) {
    updateDraft({ latitude: address.latitude, longitude: address.longitude, address: address.line1 });
  }

  function handleNext() {
    const address = draft.address ?? currentAddress?.line1;
    if (!address) {
      toast.show('Pick a saved address or tap the map to set the job location', 'error');
      return;
    }
    updateDraft({ latitude: region.latitude, longitude: region.longitude, address });
    router.push('/jobs/new/budget');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StepProgress step={4} total={7} title="Where is the job?" />
      {savedAddresses.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {savedAddresses.map((address) => {
            const Icon = labelIcons[address.label] ?? MapPin;
            const active = draft.address === address.line1;
            return (
              <AnimatedPressable
                key={address.id}
                onPress={() => pickSavedAddress(address)}
                style={[styles.chip, active ? styles.chipActive : null]}>
                <Icon size={14} color={active ? '#FFFFFF' : colors.primary} />
                <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]} numberOfLines={1}>
                  {address.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      ) : null}
      <View style={styles.mapWrap}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={region}
          onPress={(e: MapPressEvent) => updateDraft({ latitude: e.nativeEvent.coordinate.latitude, longitude: e.nativeEvent.coordinate.longitude })}>
          <Marker coordinate={{ latitude: draft.latitude ?? region.latitude, longitude: draft.longitude ?? region.longitude }} />
        </MapView>
        <View style={styles.pill}>
          <MapPin size={16} color={colors.primary} />
          <Text style={styles.pillText} numberOfLines={1}>
            {draft.address ?? currentAddress?.line1 ?? 'Tap on the map to set location'}
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
    chipRow: { paddingHorizontal: 24, paddingBottom: 12, gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.card,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text },
    chipLabelActive: { color: '#FFFFFF' },
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
