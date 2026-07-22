import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useToast } from '@/components/ui/Toast';
import { useVerifyPaystack } from '@/hooks/queries/usePayments';
import { usePaymentStore } from '@/store/paymentStore';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

// Paystack's hosted checkout redirects here (see metizo.paystack.callback-url
// on the backend) once the customer finishes, whether they paid or backed
// out. We don't trust the URL itself as proof of payment — it's only the
// signal to stop and verify the reference against the backend/Paystack.
const CALLBACK_MARKER = 'standard.paystack.co/close';

export default function PaystackCheckoutScreen() {
  const {
    authorizationUrl,
    reference,
    requestId,
    marketplaceOrderId,
    marketplaceSubtotal,
    marketplaceDelivery,
    marketplaceTotal,
    marketplaceAddress,
  } = useLocalSearchParams<{
    authorizationUrl: string;
    reference: string;
    requestId?: string;
    marketplaceOrderId?: string;
    marketplaceSubtotal?: string;
    marketplaceDelivery?: string;
    marketplaceTotal?: string;
    marketplaceAddress?: string;
  }>();
  const verifyPaystack = useVerifyPaystack();
  const topUpWallet = usePaymentStore((s) => s.topUpWallet);
  const cart = useMarketplaceStore((s) => s.cart);
  const placeMarketplaceOrder = useMarketplaceStore((s) => s.placeOrder);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const handled = useRef(false);

  async function handleNavChange(nav: WebViewNavigation) {
    if (handled.current || !nav.url.includes(CALLBACK_MARKER)) return;
    handled.current = true;
    try {
      const result = await verifyPaystack.mutateAsync(reference);
      if (result.purpose === 'WALLET_TOPUP') {
        topUpWallet(result.amount);
        toast.show(`${formatCurrency(result.amount)} added to your wallet`, 'success');
        router.back();
      } else if (result.purpose === 'MARKETPLACE_ORDER' && marketplaceOrderId) {
        placeMarketplaceOrder({
          id: marketplaceOrderId,
          items: cart,
          subtotal: Number(marketplaceSubtotal ?? 0),
          delivery: Number(marketplaceDelivery ?? 0),
          total: Number(marketplaceTotal ?? result.amount),
          address: marketplaceAddress ?? 'Set delivery address',
          status: 'preparing',
          createdAt: new Date().toISOString(),
        });
        toast.show('Payment successful — your order is being prepared!', 'success');
        router.replace(`/marketplace/delivery/${marketplaceOrderId}`);
      } else {
        toast.show('Payment secured — funds are held safely in escrow.', 'success');
        router.replace(`/tracking/${result.requestId ?? requestId}`);
      }
    } catch {
      toast.show('We could not confirm your payment. If you were charged, contact support.', 'error');
      handled.current = false;
      router.back();
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Secure Checkout</Text>
      </View>
      <WebView
        source={{ uri: authorizationUrl }}
        onNavigationStateChange={handleNavChange}
        startInLoadingState
        renderLoading={() => <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />}
        style={{ flex: 1 }}
      />
      {verifyPaystack.isPending ? (
        <View style={styles.overlay}>
          <ActivityIndicator color="#FFFFFF" size="large" />
          <Text style={styles.overlayLabel}>Confirming payment…</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15,23,42,0.65)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    overlayLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  });
}
