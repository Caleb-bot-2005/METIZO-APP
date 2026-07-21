import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CheckCircle2, ChevronRight, MapPin } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { PaymentCard } from '@/components/features/PaymentCard';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { usePaymentStore } from '@/store/paymentStore';
import { useLocationStore } from '@/store/locationStore';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function CheckoutScreen() {
  const cart = useMarketplaceStore((s) => s.cart);
  const placeOrderInStore = useMarketplaceStore((s) => s.placeOrder);
  const methods = usePaymentStore((s) => s.methods);
  const selectedMethodId = usePaymentStore((s) => s.selectedMethodId);
  const selectMethod = usePaymentStore((s) => s.selectMethod);
  const currentAddress = useLocationStore((s) => s.currentAddress);
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [placed, setPlaced] = useState(false);
  const [orderId] = useState(`order-${Date.now()}`);

  const subtotal = cart.reduce((sum, item) => sum + item.material.price * item.quantity, 0);
  const delivery = 25;
  const total = subtotal + delivery;

  function placeOrder() {
    placeOrderInStore({
      id: orderId,
      items: cart,
      subtotal,
      delivery,
      total,
      address: currentAddress?.line1 ?? 'Set delivery address',
      status: 'preparing',
      createdAt: new Date().toISOString(),
    });
    setPlaced(true);
  }

  if (placed) {
    return (
      <SafeAreaView style={styles.successScreen}>
        <View style={styles.successCenter}>
          <Animated.View entering={ZoomIn.springify()} style={styles.successIcon}>
            <CheckCircle2 size={48} color={colors.success} />
          </Animated.View>
          <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 24 }}>
            <Text style={styles.successTitle}>Order Placed!</Text>
            <Text style={styles.successSubtitle}>Your materials are being prepared for delivery.</Text>
          </View>
        </View>
        <Button label="Track Delivery" size="lg" onPress={() => router.replace(`/marketplace/delivery/${orderId}`)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <AnimatedPressable onPress={() => router.push('/(location)/saved')} style={styles.addressRow}>
          <MapPin size={18} color={colors.primary} />
          <Text style={styles.addressText} numberOfLines={1}>
            {currentAddress?.line1 ?? 'Set delivery address'}
          </Text>
          <ChevronRight size={18} color={colors.textSecondary} />
        </AnimatedPressable>

        <View style={styles.summaryCard}>
          <Row label="Subtotal" value={formatCurrency(subtotal)} />
          <Row label="Delivery" value={formatCurrency(delivery)} />
          <View style={styles.divider} />
          <Row label="Total" value={formatCurrency(total)} bold />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {methods.map((method) => (
            <PaymentCard key={method.id} method={method} selected={selectedMethodId === method.id} onPress={() => selectMethod(method.id)} />
          ))}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button label={`Place Order · ${formatCurrency(total)}`} size="lg" onPress={placeOrder} />
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={bold ? styles.rowValueBold : styles.rowValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    successScreen: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 40 },
    successCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: `${colors.success}1A`, alignItems: 'center', justifyContent: 'center' },
    successTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text, textAlign: 'center' },
    successSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    addressText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
    summaryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 8 },
    sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    rowValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    rowValueBold: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    divider: { height: 1, backgroundColor: colors.background, marginVertical: 4 },
  });
}
