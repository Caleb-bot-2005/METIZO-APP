import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text numberOfLines={1} style={styles.title}>{title}</Text>
      <Text numberOfLines={3} style={styles.description}>{description}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: 24, padding: 16, gap: 8, flex: 1 },
    iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    description: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
  });
}
