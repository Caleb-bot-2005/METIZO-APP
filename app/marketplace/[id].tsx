import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Star, Store } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useMaterials } from '@/hooks/queries/useMarketplace';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function MaterialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: materials } = useMaterials();
  const material = materials?.find((m) => m.id === id);
  const addToCart = useMarketplaceStore((s) => s.addToCart);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (!material) return null;

  function handleAddToCart() {
    addToCart(material!);
    toast.show(`${material!.name} added to cart`, 'success');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 260 }}>
          <Image source={{ uri: material.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <View style={{ position: 'absolute', top: 56, left: 24 }}>
            <BackButton />
          </View>
        </View>
        <View style={styles.body}>
          <View>
            <Text style={styles.name}>{material.name}</Text>
            <Text style={styles.meta}>{material.category} · {material.unit}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star size={14} color={colors.gold} fill={colors.gold} />
              <Text style={styles.rating}>{material.rating}</Text>
            </View>
            <View style={[styles.stockBadge, { backgroundColor: material.inStock ? `${colors.success}1A` : `${colors.danger}1A` }]}>
              <Text style={[styles.stockLabel, { color: material.inStock ? colors.success : colors.danger }]}>
                {material.inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>
          <Text style={styles.price}>{formatCurrency(material.price)}</Text>

          <AnimatedPressable onPress={() => router.push(`/marketplace/supplier/${material.supplierId}`)} style={styles.supplierRow}>
            <View style={styles.supplierIcon}>
              <Store size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supplierName}>{material.supplierName}</Text>
              <Text style={styles.supplierLink}>View supplier profile</Text>
            </View>
          </AnimatedPressable>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Add to Cart" size="lg" disabled={!material.inStock} onPress={handleAddToCart} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    body: { paddingHorizontal: 24, paddingTop: 20, gap: 16 },
    name: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, color: colors.text },
    meta: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    rating: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    stockLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    price: { fontFamily: 'Inter_800ExtraBold', fontSize: 30, color: colors.primary },
    supplierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    supplierIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    supplierName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    supplierLink: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  });
}
