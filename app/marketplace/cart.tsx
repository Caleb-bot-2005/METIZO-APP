import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function CartScreen() {
  const cart = useMarketplaceStore((s) => s.cart);
  const updateQuantity = useMarketplaceStore((s) => s.updateQuantity);
  const removeFromCart = useMarketplaceStore((s) => s.removeFromCart);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const total = cart.reduce((sum, item) => sum + item.material.price * item.quantity, 0);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Your Cart</Text>
      </View>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.material.id}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ShoppingCart size={40} color={colors.textSecondary} />
            <Text style={styles.emptyLabel}>Your cart is empty</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={{ uri: item.material.imageUrl }} style={{ width: 56, height: 56, borderRadius: 12 }} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.itemName}>{item.material.name}</Text>
              <Text style={styles.itemPrice}>{formatCurrency(item.material.price)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AnimatedPressable
                onPress={() => (item.quantity > 1 ? updateQuantity(item.material.id, item.quantity - 1) : removeFromCart(item.material.id))}
                style={styles.stepperButton}>
                {item.quantity > 1 ? <Minus size={12} color={colors.text} /> : <Trash2 size={12} color={colors.danger} />}
              </AnimatedPressable>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <AnimatedPressable onPress={() => updateQuantity(item.material.id, item.quantity + 1)} style={styles.stepperButton}>
                <Plus size={12} color={colors.text} />
              </AnimatedPressable>
            </View>
          </View>
        )}
      />
      {cart.length > 0 ? (
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
          <Button label="Checkout" size="lg" onPress={() => router.push('/marketplace/checkout')} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    empty: { alignItems: 'center', gap: 12, marginTop: 64 },
    emptyLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 12 },
    itemName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    itemPrice: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primary, marginTop: 2 },
    stepperButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    quantity: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text, minWidth: 18, textAlign: 'center' },
    footer: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12, gap: 12, borderTopWidth: 1, borderTopColor: colors.border },
    totalLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.textSecondary },
    totalValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, color: colors.text },
  });
}
