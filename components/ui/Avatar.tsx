import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

const PALETTE = ['#0A84FF', '#FF9F0A', '#30D158', '#BF5AF2', '#FF453A', '#64D2FF', '#FFD60A', '#FF375F'];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
}

// A real photo when one actually exists (uri set), otherwise initials on a
// deterministic color — never a stock photo of a stranger standing in for
// someone whose account has no picture yet.
export function Avatar({ name, uri, size = 48 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={dimension} />;
  }

  return (
    <View style={[styles.fallback, dimension, { backgroundColor: colorFor(name || '?') }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
});
