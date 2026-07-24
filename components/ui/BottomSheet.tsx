import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { height } = useWindowDimensions();
  const colors = useThemeColors();
  const styles = createStyles(colors, height * 0.85);

  return (
    // A real Modal renders in its own top-level native layer, above
    // everything else on screen (including the enclosing screen's own
    // navigation-stack container) — the previous implementation was a plain
    // absolutely-positioned View, which stayed clipped inside whatever
    // ancestor React Navigation gives each screen and could end up
    // invisible depending on that ancestor's own layout/overflow.
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root} pointerEvents="box-none">
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors, maxHeight: number) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.5)' },
    sheet: {
      maxHeight,
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 12,
    },
    handle: { width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 4 },
    content: { paddingHorizontal: 24, paddingBottom: 32, gap: 16 },
  });
}
