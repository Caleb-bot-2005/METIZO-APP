import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Star, ThumbsUp } from 'lucide-react-native';
import { Review } from '@/types/artisan';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export function ReviewCard({ review }: { review: Review }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image source={{ uri: review.customerAvatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.name}>{review.customerName}</Text>
          <Text numberOfLines={1} style={styles.date}>{review.createdAt}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 2, flexShrink: 0 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={13} color="#FACC15" fill={i < review.rating ? '#FACC15' : 'transparent'} />
          ))}
        </View>
      </View>
      <Text style={styles.comment}>{review.comment}</Text>
      {review.recommend ? (
        <View style={styles.recommendRow}>
          <ThumbsUp size={13} color="#22C55E" />
          <Text style={styles.recommendLabel}>Recommends this artisan</Text>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: 24, padding: 16, gap: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    name: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    date: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    comment: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    recommendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    recommendLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.success },
  });
}
