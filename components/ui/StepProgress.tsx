import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackButton } from './BackButton';
import { fontFamily } from '@/theme/typography';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export function StepProgress({ step, total, title }: { step: number; total: number; title: string }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <BackButton />
        <Text style={styles.stepLabel}>
          Step {step} of {total}
        </Text>
      </View>
      <View style={styles.track}>
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[styles.bar, { backgroundColor: index < step ? colors.primary : colors.border }]}
          />
        ))}
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stepLabel: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.textSecondary },
    track: { flexDirection: 'row', gap: 6 },
    bar: { flex: 1, height: 6, borderRadius: 999 },
    title: { fontFamily: fontFamily.extrabold, fontSize: 24, color: colors.text },
  });
}
