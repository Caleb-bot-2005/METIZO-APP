import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Icons from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { ServiceCategory } from '@/types/job';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ThemeColors } from '@/theme/colors';

interface CategoryCardProps {
  category: ServiceCategory;
  onPress?: () => void;
  variant?: 'grid' | 'row';
}

export function CategoryCard({ category, onPress, variant = 'grid' }: CategoryCardProps) {
  const Icon = (Icons as any)[toPascalCase(category.icon)] ?? Icons.Wrench;
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (variant === 'row') {
    return (
      <AnimatedPressable onPress={onPress} style={{ alignItems: 'center', gap: 8, width: 84 }}>
        <View style={styles.rowIconWrap}>
          <Icon size={26} color="#0A84FF" strokeWidth={2} />
        </View>
        <Text numberOfLines={1} style={styles.label}>
          {category.name}
        </Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable onPress={onPress} style={styles.gridCard}>
      <View style={styles.gridIconWrap}>
        <Icon size={22} color="#0A84FF" strokeWidth={2} />
      </View>
      <Text numberOfLines={1} style={styles.label}>
        {category.name}
      </Text>
      {category.emergencyAvailable ? (
        <Text style={styles.emergencyLabel}>Emergency available</Text>
      ) : null}
    </AnimatedPressable>
  );
}

function toPascalCase(kebab: string) {
  return kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    rowIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: `${colors.primary}1A`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      gap: 12,
      alignItems: 'center',
      minHeight: 120,
      shadowColor: '#0F172A',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    gridIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: `${colors.primary}1A`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 11,
      letterSpacing: 0.3,
      color: colors.text,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    emergencyLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, color: colors.warning, textAlign: 'center' },
  });
}
