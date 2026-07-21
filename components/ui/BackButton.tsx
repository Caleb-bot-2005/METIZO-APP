import React from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress ?? (() => router.back())} style={{ padding: 8, marginLeft: -8 }} hitSlop={8}>
      <ArrowLeft size={22} color="#0F172A" />
    </Pressable>
  );
}
