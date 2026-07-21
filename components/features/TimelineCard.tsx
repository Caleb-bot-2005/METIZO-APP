import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { JobTimelineStep } from '@/types/job';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export function TimelineCard({ steps }: { steps: JobTimelineStep[] }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <View key={step.key} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.dot, { backgroundColor: step.done ? colors.success : colors.border }]}>
                {step.done ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
              {!isLast ? (
                <View style={[styles.connector, { backgroundColor: step.done ? colors.success : colors.border }]} />
              ) : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 20 }}>
              <Text style={[styles.label, { color: step.done ? colors.text : colors.textSecondary }]}>
                {step.label}
              </Text>
              {step.timestamp ? <Text style={styles.timestamp}>{step.timestamp}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: 24, padding: 20 },
    dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    connector: { width: 2, flex: 1, marginVertical: 4, minHeight: 24 },
    label: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    timestamp: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  });
}
