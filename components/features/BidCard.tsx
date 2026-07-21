import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Clock, MapPin, Star } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { TrustBadge } from '@/components/ui/TrustBadge';
import { Bid } from '@/types/bidding';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface BidCardProps {
  bid: Bid;
  index?: number;
  onAccept?: () => void;
  onNegotiate?: () => void;
  onDecline?: () => void;
  onPress?: () => void;
}

export function BidCard({ bid, index = 0, onAccept, onNegotiate, onDecline, onPress }: BidCardProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).springify().damping(16)} style={styles.card}>
      <View style={styles.row}>
        <Image source={{ uri: bid.artisan.avatarUrl }} style={{ width: 52, height: 52, borderRadius: 26 }} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.name}>{bid.artisan.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Star size={12} color="#FACC15" fill="#FACC15" />
              <Text style={styles.metaText}>{bid.artisan.rating}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>{bid.artisan.distanceKm} km · ETA {bid.artisan.etaMinutes}m</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.price}>{formatCurrency(bid.price)}</Text>
          <View style={styles.metaItem}>
            <Clock size={11} color={colors.textSecondary} />
            <Text style={styles.metaText}>{bid.estimatedDurationMinutes}m</Text>
          </View>
        </View>
      </View>

      <TrustBadge score={bid.artisan.trustScore} size="sm" />

      {bid.message ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText} numberOfLines={2}>
            &ldquo;{bid.message}&rdquo;
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button label="Decline" variant="outline" size="sm" onPress={onDecline} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Negotiate" variant="ghost" size="sm" onPress={onNegotiate} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Accept" variant="primary" size="sm" onPress={onAccept} />
        </View>
      </View>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 16,
      gap: 12,
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    name: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    price: { fontFamily: 'Inter_800ExtraBold', fontSize: 18, color: colors.primary },
    messageBox: { backgroundColor: colors.background, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
    messageText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
  });
}
