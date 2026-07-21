import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock, MapPin, Star } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useMaterials, useSuppliers } from '@/hooks/queries/useMarketplace';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function SupplierProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: suppliers } = useSuppliers();
  const { data: materials } = useMaterials();
  const supplier = suppliers?.find((s) => s.id === id);
  const supplierMaterials = materials?.filter((m) => m.supplierId === id) ?? [];
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (!supplier) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Supplier</Text>
      </View>
      <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 16 }}>
        <Image source={{ uri: supplier.logoUrl }} style={{ width: 72, height: 72, borderRadius: 20 }} />
        <Text style={styles.name}>{supplier.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Star size={14} color={colors.gold} fill={colors.gold} />
            <Text style={styles.metaText}>{supplier.rating}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{supplier.location}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{supplier.deliveryEtaDays}d delivery</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={supplierMaterials}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        renderItem={({ item }) => (
          <AnimatedPressable onPress={() => router.push(`/marketplace/${item.id}`)} style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 90 }} contentFit="cover" />
            <View style={{ padding: 12, gap: 4 }}>
              <Text numberOfLines={2} style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
            </View>
          </AnimatedPressable>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    name: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    metaText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    card: { flex: 1, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' },
    itemName: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text },
    itemPrice: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primary },
  });
}
