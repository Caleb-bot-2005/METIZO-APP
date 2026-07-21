import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Crown } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { gradients, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { BillingCycle, Plan } from '@/types/subscription';
import { formatCurrency } from '@/utils/format';

export function SubscriptionCard({
  plan,
  cycle,
  onSelect,
  current,
}: {
  plan: Plan;
  cycle: BillingCycle;
  onSelect?: () => void;
  current?: boolean;
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const price = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const light = plan.highlight;

  const content = (
    <View style={{ gap: 16 }}>
      <View style={styles.headerRow}>
        <View style={styles.nameRow}>
          {plan.highlight ? <Crown size={18} color="#FACC15" fill="#FACC15" /> : null}
          <Text numberOfLines={1} style={[styles.name, { color: light ? '#FFFFFF' : colors.text }]}>
            {plan.name}
          </Text>
        </View>
        {current ? (
          <View style={styles.currentBadge}>
            <Text style={styles.currentLabel}>CURRENT</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={2} style={[styles.tagline, { color: light ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
        {plan.tagline}
      </Text>
      {plan.customPricing ? (
        <Text style={[styles.customPrice, { color: light ? '#FFFFFF' : colors.text }]}>Custom Pricing</Text>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={[styles.price, { color: light ? '#FFFFFF' : colors.text }]}>
            {formatCurrency(price)}
          </Text>
          {price > 0 ? (
            <Text style={[styles.pricePeriod, { color: light ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
              /{cycle === 'monthly' ? 'mo' : 'yr'}
            </Text>
          ) : null}
        </View>
      )}
      <View style={{ gap: 8 }}>
        {plan.features.map((feature) => (
          <View key={feature} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Check size={15} color={light ? '#FFFFFF' : '#22C55E'} />
            <Text style={[styles.feature, { flex: 1, color: light ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>
      <Button
        label={plan.customPricing ? 'Contact Sales' : current ? 'Current Plan' : 'Choose Plan'}
        variant={plan.highlight ? 'gold' : 'primary'}
        disabled={current}
        onPress={onSelect}
      />
    </View>
  );

  if (plan.highlight) {
    return (
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientCard}>
        {content}
      </LinearGradient>
    );
  }

  return <View style={styles.plainCard}>{content}</View>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    gradientCard: { borderRadius: 24, padding: 20 },
    plainCard: { backgroundColor: colors.card, borderRadius: 24, padding: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    name: { fontFamily: 'Inter_700Bold', fontSize: 18, flexShrink: 1 },
    currentBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    currentLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#FFFFFF' },
    tagline: { fontFamily: 'Inter_500Medium', fontSize: 14 },
    customPrice: { fontFamily: 'Inter_800ExtraBold', fontSize: 24 },
    price: { fontFamily: 'Inter_800ExtraBold', fontSize: 30 },
    pricePeriod: { fontFamily: 'Inter_500Medium', fontSize: 14 },
    feature: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  });
}
