import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface PriceCardProps {
  title?: string;
  estimatedPrice: number;
  min?: number;
  max?: number;
  durationLabel?: string;
  complexity?: 'Simple' | 'Moderate' | 'Complex';
}

export function PriceCard({ title = 'AI Price Estimate', estimatedPrice, min, max, durationLabel, complexity }: PriceCardProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Sparkles size={16} color="#0A84FF" />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.price}>{formatCurrency(estimatedPrice)}</Text>
      {min !== undefined && max !== undefined ? (
        <Text style={styles.range}>Typical range {formatCurrency(min)} - {formatCurrency(max)}</Text>
      ) : null}
      <View style={styles.metaRow}>
        {durationLabel ? (
          <View>
            <Text style={styles.metaLabel}>Est. duration</Text>
            <Text style={styles.metaValue}>{durationLabel}</Text>
          </View>
        ) : null}
        {complexity ? (
          <View>
            <Text style={styles.metaLabel}>Complexity</Text>
            <Text style={styles.metaValue}>{complexity}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: `${colors.primary}0D`, borderRadius: 24, padding: 20, gap: 12, borderWidth: 1, borderColor: `${colors.primary}1A` },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
    price: { fontFamily: 'Inter_800ExtraBold', fontSize: 30, color: colors.text },
    range: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    metaRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
    metaLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    metaValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
  });
}
