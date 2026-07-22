import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useEscrow, useInitializePaystack } from '@/hooks/queries/usePayments';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function EscrowPaymentScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { data: escrow, isLoading } = useEscrow(jobId);
  const initializePaystack = useInitializePaystack();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const amount = escrow?.amount ?? 0;
  const serviceFee = Math.round(amount * 0.05);
  const total = amount + serviceFee;
  const alreadyPaid = !!escrow?.paidAt;

  async function handlePay() {
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
        <Text style={styles.notFound}>No payment is due yet — this job doesn't have an accepted bid.</Text>
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

        <View style={styles.paystackBanner}>
          <Text style={styles.paystackTitle}>Pay with Paystack</Text>
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
    paystackBanner: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 6, borderWidth: 1, borderColor: colors.border },
    paystackTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text },
    paystackText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    rowValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    rowValueBold: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    divider: { height: 1, backgroundColor: colors.background, marginVertical: 4 },
  });
}
