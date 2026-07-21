import React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MAX_HEIGHT = Dimensions.get('window').height * 0.85;

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (!visible) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { ...StyleSheet.absoluteFillObject, zIndex: 100, elevation: 100 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.5)' },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: MAX_HEIGHT,
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 12,
      zIndex: 101,
      elevation: 101,
    },
    handle: { width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 4 },
    content: { paddingHorizontal: 24, paddingBottom: 32, gap: 16 },
  });
}
