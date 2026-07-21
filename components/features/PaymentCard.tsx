import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Banknote, CreditCard, Landmark, Wallet as WalletIcon } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { PaymentMethod } from '@/types/payment';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const icons = {
  card: CreditCard,
  mobile_money: Banknote,
  bank: Landmark,
  wallet: WalletIcon,
};

export function PaymentCard({
  method,
  selected,
  onPress,
}: {
  method: PaymentMethod;
  selected?: boolean;
  onPress?: () => void;
}) {
  const Icon = icons[method.type];
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.row,
        selected ? { borderColor: colors.primary, backgroundColor: `${colors.primary}0D` } : { borderColor: 'transparent', backgroundColor: colors.card },
      ]}>
      <View style={styles.iconWrap}>
        <Icon size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.label}>{method.label}</Text>
        <Text numberOfLines={1} style={styles.detail}>{method.detail}</Text>
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </AnimatedPressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16, borderWidth: 2 },
    iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    label: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    detail: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  });
}
