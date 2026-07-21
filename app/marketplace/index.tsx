import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Package, ShoppingCart, Star } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { SearchBar } from '@/components/ui/SearchBar';
import { useToast } from '@/components/ui/Toast';
import { useMaterials } from '@/hooks/queries/useMarketplace';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { Material } from '@/types/marketplace';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function MarketplaceScreen() {
  const { data: materials } = useMaterials();
  const cart = useMarketplaceStore((s) => s.cart);
  const addToCart = useMarketplaceStore((s) => s.addToCart);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  function handleAddToCart(item: Material) {
    addToCart(item);
    toast.show(`${item.name} added to cart`, 'success');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Material Marketplace</Text>
        <AnimatedPressable onPress={() => router.push('/marketplace/orders')} style={styles.cartButton}>
          <Package size={19} color={colors.text} />
        </AnimatedPressable>
        <AnimatedPressable onPress={() => router.push('/marketplace/cart')} style={styles.cartButton}>
          <ShoppingCart size={19} color={colors.text} />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeLabel}>{cartCount}</Text>
            </View>
          ) : null}
        </AnimatedPressable>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <SearchBar placeholder="Search materials..." />
      </View>
      <FlatList
        data={materials}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        renderItem={({ item }) => (
          <AnimatedPressable onPress={() => router.push(`/marketplace/${item.id}`)} style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 100 }} contentFit="cover" />
            <View style={{ padding: 12, gap: 4 }}>
              <Text numberOfLines={2} style={[styles.itemName, { minHeight: 32 }]}>
                {item.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Star size={11} color={colors.gold} fill={colors.gold} />
                <Text style={styles.rating}>{item.rating}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                <AnimatedPressable onPress={() => handleAddToCart(item)} style={styles.addButton}>
                  <Text style={styles.addLabel}>+</Text>
                </AnimatedPressable>
              </View>
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
    headerTitle: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    cartButton: { position: 'relative', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    cartBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    cartBadgeLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#FFFFFF' },
    card: { flex: 1, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' },
    itemName: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text },
    rating: { fontFamily: 'Inter_500Medium', fontSize: 10, color: colors.textSecondary },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    price: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primary },
    addButton: { backgroundColor: `${colors.primary}1A`, borderRadius: 999, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    addLabel: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primary },
  });
}
