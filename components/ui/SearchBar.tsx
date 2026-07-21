import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { fontFamily } from '@/theme/typography';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  editable?: boolean;
  onPress?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search for a service...',
  onFilterPress,
  editable = true,
  onPress,
}: SearchBarProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Search size={18} color={colors.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          editable={editable}
          onPressIn={onPress}
          style={styles.input}
        />
      </View>
      {onFilterPress ? (
        <AnimatedPressable onPress={onFilterPress} style={styles.filterButton}>
          <SlidersHorizontal size={18} color="#FFFFFF" />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    field: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      shadowColor: '#0F172A',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    input: { flex: 1, fontFamily: fontFamily.medium, color: colors.text, fontSize: 15 },
    filterButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
