import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { MoveHorizontal } from 'lucide-react-native';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  height?: number;
}

export function BeforeAfterSlider({ beforeUrl, afterUrl, height = 240 }: BeforeAfterSliderProps) {
  const [width, setWidth] = useState(0);
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const position = useSharedValue(0.5);

  const pan = Gesture.Pan()
    .onChange((e) => {
      if (width === 0) return;
      const next = position.value + e.changeX / width;
      position.value = Math.min(1, Math.max(0, next));
    })
    .runOnJS(true);

  const revealStyle = useAnimatedStyle(() => ({ width: `${position.value * 100}%` }));
  const handleStyle = useAnimatedStyle(() => ({ left: `${position.value * 100}%` }));

  return (
    <View
      style={{ height, borderRadius: 20, overflow: 'hidden' }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Image source={{ uri: afterUrl }} style={{ width: '100%', height: '100%', position: 'absolute' }} contentFit="cover" />
      <Animated.View style={[{ height: '100%', overflow: 'hidden', position: 'absolute', left: 0, top: 0 }, revealStyle]}>
        <Image source={{ uri: beforeUrl }} style={{ width, height: '100%' }} contentFit="cover" />
      </Animated.View>

      <View style={[styles.tag, { left: 12 }]}>
        <Text style={styles.tagLabel}>BEFORE</Text>
      </View>
      <View style={[styles.tag, { right: 12 }]}>
        <Text style={styles.tagLabel}>AFTER</Text>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[{ position: 'absolute', top: 0, bottom: 0, width: 36, marginLeft: -18, alignItems: 'center', justifyContent: 'center' }, handleStyle]}>
          <View style={{ width: 2, height: '100%', backgroundColor: '#FFFFFF', position: 'absolute' }} />
          <View style={styles.handle}>
            <MoveHorizontal size={16} color="#0F172A" />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tag: { position: 'absolute', top: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    tagLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#FFFFFF' },
    handle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  });
}
