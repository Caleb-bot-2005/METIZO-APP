import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Briefcase, Check, Home, MapPin, Plus, Star, Trash2 } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useLocationStore } from '@/store/locationStore';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const labelIcons = { Home, Work: Briefcase, Other: MapPin };

export default function SavedAddressesScreen() {
  const savedAddresses = useLocationStore((s) => s.savedAddresses);
  const currentAddress = useLocationStore((s) => s.currentAddress);
  const selectAddress = useLocationStore((s) => s.selectAddress);
  const setDefaultAddress = useLocationStore((s) => s.setDefaultAddress);
  const removeSavedAddress = useLocationStore((s) => s.removeSavedAddress);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  function handleSelect(id: string, label: string) {
    selectAddress(id);
    toast.show(`Now using ${label} as your location`, 'success');
    router.back();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Saved Addresses</Text>
      </View>
      <FlatList
        data={savedAddresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>No saved addresses yet.</Text>}
        renderItem={({ item }) => {
          const Icon = labelIcons[item.label] ?? MapPin;
          const isActive = currentAddress?.id === item.id;
          return (
            <AnimatedPressable onPress={() => handleSelect(item.id, item.label)} style={[styles.row, isActive ? styles.rowActive : null]}>
              <View style={styles.iconWrap}>
                <Icon size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{item.label}</Text>
                  {item.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultLabel}>DEFAULT</Text>
                    </View>
                  ) : null}
                  {isActive ? <Check size={14} color={colors.success} /> : null}
                </View>
                <Text style={styles.address} numberOfLines={1}>
                  {item.line1}
                </Text>
              </View>
              {!item.isDefault ? (
                <AnimatedPressable onPress={() => setDefaultAddress(item.id)} style={styles.iconButton} hitSlop={8}>
                  <Star size={18} color={colors.textSecondary} />
                </AnimatedPressable>
              ) : null}
              <AnimatedPressable onPress={() => removeSavedAddress(item.id)} style={styles.iconButton} hitSlop={8}>
                <Trash2 size={18} color={colors.danger} />
              </AnimatedPressable>
            </AnimatedPressable>
          );
        }}
      />
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <AnimatedPressable onPress={() => router.push('/(location)/search')} style={styles.addButton}>
          <Plus size={18} color={colors.primary} />
          <Text style={styles.addLabel}>Add New Address</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, gap: 12 },
    title: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    empty: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 48 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'transparent' },
    rowActive: { borderColor: colors.primary },
    iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    iconButton: { padding: 6 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    label: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    address: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    defaultBadge: { backgroundColor: `${colors.primary}1A`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
    defaultLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.primary },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: `${colors.primary}66`,
      borderRadius: 16,
      paddingVertical: 16,
    },
    addLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
  });
}
