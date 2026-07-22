import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight, MapPin, ShieldCheck } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { useLocationStore } from '@/store/locationStore';
import { useInitializePaystack } from '@/hooks/queries/usePayments';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function CheckoutScreen() {
  const cart = useMarketplaceStore((s) => s.cart);
  const currentAddress = useLocationStore((s) => s.currentAddress);
  const initializePaystack = useInitializePaystack();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [orderId] = useState(`order-${Date.now()}`);

  const subtotal = cart.reduce((sum, item) => sum + item.material.price * item.quantity, 0);
  const delivery = 25;
  const total = subtotal + delivery;

  async function handlePay() {
    try {
      const { authorizationUrl, reference } = await initializePaystack.mutateAsync({ purpose: 'MARKETPLACE_ORDER', amount: total });
      router.push({
        pathname: '/payments/paystack-checkout',
        params: {
          authorizationUrl,
          reference,
          marketplaceOrderId: orderId,
          marketplaceSubtotal: String(subtotal),
          marketplaceDelivery: String(delivery),
          marketplaceTotal: String(total),
          marketplaceAddress: currentAddress?.line1 ?? 'Set delivery address',
        },
      });
    } catch (error: any) {
      toast.show(error?.response?.data?.message ?? 'Could not start the payment. Please try again.', 'error');
    }
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

        <View style={styles.paystackBanner}>
          <ShieldCheck size={20} color={colors.primary} />
          <Text style={styles.paystackText}>
            Choose card, mobile money, or bank transfer on Paystack's secure checkout — METIZO never sees your
            payment details.
          </Text>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button
          label={`Pay ${formatCurrency(total)} Securely`}
          size="lg"
          loading={initializePaystack.isPending}
          onPress={handlePay}
        />
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
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    addressText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
    summaryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 8 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    rowValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    rowValueBold: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    divider: { height: 1, backgroundColor: colors.background, marginVertical: 4 },
    paystackBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: `${colors.primary}0D`, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${colors.primary}1A` },
    paystackText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  });
}
