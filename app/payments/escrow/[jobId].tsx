import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Building2, CheckCircle2, ShieldCheck, Smartphone, Wallet } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useEscrow, useInitializePaystack } from '@/hooks/queries/usePayments';
import { usePayFromWallet, useWalletBalance } from '@/hooks/queries/useWallet';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

type Method = 'paystack' | 'wallet';

export default function EscrowPaymentScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { data: escrow, isLoading } = useEscrow(jobId);
  const { data: walletBalance = 0 } = useWalletBalance();
  const initializePaystack = useInitializePaystack();
  const payFromWallet = usePayFromWallet();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<Method>('paystack');
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const amount = escrow?.amount ?? 0;
  const serviceFee = Math.round(amount * 0.05);
  const total = amount + serviceFee;
  const alreadyPaid = !!escrow?.paidAt;
  // The wallet debit (like Paystack's own charge) is for the job amount only —
  // the 5% service fee shown below isn't actually collected by either path
  // yet, so both stay consistent with each other.
  const walletCoversIt = walletBalance >= amount;

  async function handlePay() {
    if (method === 'wallet') {
      if (!walletCoversIt) {
        toast.show("Your wallet balance doesn't cover this yet — top up or pay with Paystack instead.", 'error');
        return;
      }
      try {
        await payFromWallet.mutateAsync({ purpose: 'ESCROW', requestId: jobId! });
        queryClient.invalidateQueries({ queryKey: ['escrow', jobId] });
        toast.show('Paid from your METIZO Wallet — funds are held in escrow.', 'success');
      } catch (error: any) {
        toast.show(error?.response?.data?.message ?? 'Could not pay from your wallet. Please try again.', 'error');
      }
      return;
    }
    try {
      const { authorizationUrl, reference } = await initializePaystack.mutateAsync({ purpose: 'ESCROW', requestId: jobId! });
      router.push({ pathname: '/payments/paystack-checkout', params: { authorizationUrl, reference, requestId: jobId } });
    } catch (error: any) {
      toast.show(error?.response?.data?.message ?? 'Could not start the payment. Please try again.', 'error');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!escrow) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }]}>
        <Text style={styles.notFound}>No payment is due yet — this job doesn&apos;t have an accepted bid.</Text>
        <Button label="Go Back" size="lg" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (alreadyPaid) {
    return (
      <SafeAreaView style={styles.successScreen}>
        <View style={styles.successCenter}>
          <Animated.View entering={ZoomIn.springify()} style={styles.successIcon}>
            <ShieldCheck size={48} color={colors.success} />
          </Animated.View>
          <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 24 }}>
            <Text style={styles.successTitle}>Funds Secured!</Text>
            <Text style={styles.successSubtitle}>
              {formatCurrency(total)} is safely held in escrow and will only be released once the job is completed.
            </Text>
          </View>
        </View>
        <Button label="Track Job" size="lg" onPress={() => router.replace(`/tracking/${jobId}`)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Secure Payment</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <Row label="Service amount" value={formatCurrency(amount)} />
          <Row label="Service fee (5%)" value={formatCurrency(serviceFee)} />
          <View style={styles.divider} />
          <Row label="Total" value={formatCurrency(total)} bold />
        </View>

        <View style={styles.infoBanner}>
          <ShieldCheck size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Your money stays protected in escrow. It is only released to the artisan after you confirm the job is
            completed to your satisfaction.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>How would you like to pay?</Text>

        <AnimatedPressable
          onPress={() => setMethod('paystack')}
          style={[styles.methodOption, method === 'paystack' ? styles.methodOptionActive : null]}>
          <View style={[styles.methodIcon, { backgroundColor: `${colors.primary}1A` }]}>
            <Smartphone size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Paystack</Text>
            <Text style={styles.methodSubtitle}>Card, mobile money, or bank transfer</Text>
          </View>
          <View style={[styles.radio, method === 'paystack' ? styles.radioActive : null]} />
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => setMethod('wallet')}
          style={[styles.methodOption, method === 'wallet' ? styles.methodOptionActive : null]}>
          <View style={[styles.methodIcon, { backgroundColor: `${colors.gold}26` }]}>
            <Wallet size={20} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>METIZO Wallet</Text>
            <Text style={[styles.methodSubtitle, !walletCoversIt ? { color: colors.danger } : null]}>
              {walletCoversIt
                ? `Balance: ${formatCurrency(walletBalance)}`
                : `Balance: ${formatCurrency(walletBalance)} — not enough for this job`}
            </Text>
          </View>
          <View style={[styles.radio, method === 'wallet' ? styles.radioActive : null]} />
        </AnimatedPressable>

        <View style={styles.paystackBanner}>
          <Building2 size={16} color={colors.textSecondary} />
          <Text style={styles.paystackText}>
            {method === 'wallet'
              ? 'Paying from your wallet settles instantly — no redirect needed.'
              : "Paystack's checkout also includes bank transfer alongside card and mobile money — METIZO never sees your payment details."}
          </Text>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button
          label={`Pay ${formatCurrency(method === 'wallet' ? amount : total)} Securely`}
          size="lg"
          loading={initializePaystack.isPending || payFromWallet.isPending}
          disabled={method === 'wallet' && !walletCoversIt}
          icon={<CheckCircle2 size={18} color="#FFFFFF" />}
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
    notFound: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
    successScreen: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 40 },
    successCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: `${colors.success}1A`, alignItems: 'center', justifyContent: 'center' },
    successTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text, textAlign: 'center' },
    successSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    summaryCard: { backgroundColor: colors.card, borderRadius: 24, padding: 20, gap: 12 },
    summaryTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text, marginBottom: 4 },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: `${colors.primary}0D`,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: `${colors.primary}1A`,
    },
    infoText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
    sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text, marginTop: 4 },
    methodOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: 2,
      borderColor: colors.border,
    },
    methodOptionActive: { borderColor: colors.primary },
    methodIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    methodTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    methodSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border },
    radioActive: { borderColor: colors.primary, borderWidth: 6 },
    paystackBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
    paystackText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    rowValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    rowValueBold: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    divider: { height: 1, backgroundColor: colors.background, marginVertical: 4 },
  });
}
