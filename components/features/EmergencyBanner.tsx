import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Siren } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ThemeColors } from '@/theme/colors';

export function EmergencyBanner({ onPress }: { onPress?: () => void }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <AnimatedPressable onPress={onPress} style={styles.banner}>
      <View style={styles.iconWrap}>
        <Siren size={22} color="#EF4444" strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Emergency Service</Text>
        <Text style={styles.subtitle}>Get priority artisans dispatched now</Text>
      </View>
      <ChevronRight size={20} color="#EF4444" strokeWidth={2} />
    </AnimatedPressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    banner: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    iconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: `${colors.danger}1A`, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    subtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  });
}
