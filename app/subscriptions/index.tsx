import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Building2, Crown, RotateCcw, ShieldCheck, Smartphone, Star, Wallet } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SubscriptionCard } from '@/components/features/SubscriptionCard';
import { useToast } from '@/components/ui/Toast';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useInitializePaystack } from '@/hooks/queries/usePayments';
import { usePayFromWallet, useWalletBalance } from '@/hooks/queries/useWallet';
import { formatCurrency } from '@/utils/format';
import { plans } from '@/constants/mockData';
import { gradients, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { BillingCycle, Plan } from '@/types/subscription';

const testimonials = [
  { name: 'Abena K.', quote: 'Home Pro paid for itself after one emergency plumbing call.', rating: 5 },
  { name: 'Kojo M.', quote: 'Priority bidding gets me the best artisans every time.', rating: 5 },
];

const faqs = [
  { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time from Settings with no penalty.' },
  { q: 'Is there a free trial?', a: 'Home+ includes a 7-day free trial for new subscribers.' },
  { q: 'What is the money-back guarantee?', a: "If you're not satisfied within 14 days, we'll refund your subscription in full." },
];

export default function SubscriptionsScreen() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const currentPlanId = useSubscriptionStore((s) => s.currentPlanId);
  const setPlan = useSubscriptionStore((s) => s.setPlan);
  const initializePaystack = useInitializePaystack();
  const payFromWallet = usePayFromWallet();
  const { data: walletBalance = 0 } = useWalletBalance();
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const pendingPrice = pendingPlan ? (cycle === 'monthly' ? pendingPlan.monthlyPrice : pendingPlan.yearlyPrice) : 0;
  const walletCoversIt = walletBalance >= pendingPrice;

  // A plan change only takes effect once real money has actually moved —
  // free/custom-pricing plans have nothing to charge, but any priced plan
  // opens a real payment choice (Paystack or the wallet) instead of flipping
  // instantly on tap.
  function choosePlan(plan: Plan) {
    if (plan.id === currentPlanId) return;
    if (plan.customPricing) {
      toast.show('Our team will reach out to discuss custom pricing.', 'success');
      return;
    }
    const price = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    if (price <= 0) {
      setPlan(plan.id);
      toast.show('Plan updated successfully!', 'success');
      router.back();
      return;
    }
    setPendingPlan(plan);
  }

  async function payWithPaystack() {
    if (!pendingPlan) return;
    try {
      const { authorizationUrl, reference } = await initializePaystack.mutateAsync({ purpose: 'SUBSCRIPTION', amount: pendingPrice });
      setPendingPlan(null);
      router.push({
        pathname: '/payments/paystack-checkout',
        params: { authorizationUrl, reference, subscriptionPlanId: pendingPlan.id },
      });
    } catch (error: any) {
      toast.show(error?.response?.data?.message ?? 'Could not start the payment. Please try again.', 'error');
    }
  }

  async function payWithWallet() {
    if (!pendingPlan || !walletCoversIt) return;
    try {
      await payFromWallet.mutateAsync({ purpose: 'SUBSCRIPTION', amount: pendingPrice });
      setPlan(pendingPlan.id);
      setPendingPlan(null);
      toast.show('Paid from your METIZO Wallet — plan upgraded!', 'success');
      router.back();
    } catch (error: any) {
      toast.show(error?.response?.data?.message ?? 'Could not pay from your wallet. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <BackButton onPress={() => router.back()} />
          <View style={{ alignItems: 'center', gap: 12, marginTop: 8 }}>
            <Crown size={40} color={colors.gold} fill={colors.gold} />
            <Text style={styles.heroTitle}>Upgrade your home{'\n'}maintenance experience</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.cycleToggle}>
            {(['monthly', 'yearly'] as BillingCycle[]).map((option) => (
              <AnimatedPressable
                key={option}
                onPress={() => setCycle(option)}
                style={[styles.cycleOption, { backgroundColor: cycle === option ? colors.primary : 'transparent' }]}>
                <Text style={[styles.cycleLabel, { color: cycle === option ? '#FFFFFF' : colors.textSecondary }]}>
                  {option}
                </Text>
                {option === 'yearly' ? (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveLabel}>SAVE 17%</Text>
                  </View>
                ) : null}
              </AnimatedPressable>
            ))}
          </View>

          <View style={{ gap: 16 }}>
            {plans.map((plan) => (
              <SubscriptionCard
                key={plan.id}
                plan={plan}
                cycle={cycle}
                current={currentPlanId === plan.id}
                onSelect={() => choosePlan(plan)}
              />
            ))}
          </View>

          <AnimatedPressable style={styles.restoreRow}>
            <RotateCcw size={15} color={colors.textSecondary} />
            <Text style={styles.restoreLabel}>Restore Purchase</Text>
          </AnimatedPressable>

          <View style={{ gap: 12 }}>
            <Text style={styles.sectionTitle}>What members say</Text>
            {testimonials.map((t) => (
              <View key={t.name} style={styles.testimonialCard}>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={13} color={colors.gold} fill={colors.gold} />
                  ))}
                </View>
                <Text style={styles.quote}>&ldquo;{t.quote}&rdquo;</Text>
                <Text style={styles.testimonialName}>{t.name}</Text>
              </View>
            ))}
          </View>

          <View style={{ gap: 12 }}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {faqs.map((faq) => (
              <View key={faq.q} style={styles.faqCard}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              </View>
            ))}
          </View>

          <View style={styles.guaranteeRow}>
            <ShieldCheck size={15} color={colors.success} />
            <Text style={styles.guaranteeLabel}>14-day money-back guarantee</Text>
          </View>
        </View>
      </ScrollView>

      <BottomSheet visible={!!pendingPlan} onClose={() => setPendingPlan(null)}>
        <Text style={styles.modalTitle}>Pay for {pendingPlan?.name}</Text>
        <Text style={styles.modalSubtitle}>{formatCurrency(pendingPrice)} / {cycle === 'monthly' ? 'mo' : 'yr'}</Text>

        <AnimatedPressable onPress={payWithPaystack} style={styles.methodOption}>
          <View style={[styles.methodIcon, { backgroundColor: `${colors.primary}1A` }]}>
            <Smartphone size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Pay with Paystack</Text>
            <Text style={styles.methodSubtitle}>Card, mobile money, or bank transfer</Text>
          </View>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={payWithWallet}
          disabled={!walletCoversIt || payFromWallet.isPending}
          style={[styles.methodOption, !walletCoversIt ? { opacity: 0.5 } : null]}>
          <View style={[styles.methodIcon, { backgroundColor: `${colors.gold}26` }]}>
            <Wallet size={20} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Pay with METIZO Wallet</Text>
            <Text style={[styles.methodSubtitle, !walletCoversIt ? { color: colors.danger } : null]}>
              {walletCoversIt ? `Balance: ${formatCurrency(walletBalance)}` : `Balance: ${formatCurrency(walletBalance)} — not enough`}
            </Text>
          </View>
        </AnimatedPressable>

        <View style={styles.walletHint}>
          <Building2 size={14} color={colors.textSecondary} />
          <Text style={styles.walletHintText}>Paying from your wallet settles instantly — no redirect needed.</Text>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    modalTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 18, color: colors.text, textAlign: 'center' },
    modalSubtitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 4 },
    methodOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.background, borderRadius: 16, padding: 14 },
    methodIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    methodTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    methodSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    walletHint: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingTop: 4 },
    walletHintText: { fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
    hero: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, gap: 16 },
    heroTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: '#FFFFFF', textAlign: 'center' },
    body: { paddingHorizontal: 24, marginTop: -24, gap: 24 },
    cycleToggle: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 4,
      alignSelf: 'center',
      shadowColor: '#0F172A',
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    cycleOption: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    cycleLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, textTransform: 'capitalize' },
    saveBadge: { backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
    saveLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, color: colors.text },
    restoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
    restoreLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.textSecondary },
    sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    testimonialCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 8 },
    quote: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    testimonialName: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text },
    faqCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 6 },
    faqQuestion: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    faqAnswer: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
    guaranteeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 8 },
    guaranteeLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
  });
}
