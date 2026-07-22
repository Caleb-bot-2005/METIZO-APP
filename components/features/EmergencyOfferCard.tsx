import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin, Siren } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { EmergencyOffer } from '@/types/emergency';
import { formatCurrency, formatDistance } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface Props {
  offer: EmergencyOffer;
  onAccept: () => void;
  onDecline: () => void;
  accepting?: boolean;
  declining?: boolean;
}

// First to accept wins — the live countdown makes that stakes-of-speed obvious
// to the artisan, matching the "instant, ride-hailing" feel the flow needs.
export function EmergencyOfferCard({ offer, onAccept, onDecline, accepting, declining }: Props) {
  const [now, setNow] = useState(Date.now());
  const colors = useThemeColors();
  const styles = createStyles(colors);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = Math.max(0, Math.round((offer.roundDeadlineEpochMs - now) / 1000));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Siren size={14} color="#FFFFFF" />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {offer.title}
        </Text>
        <Text style={styles.countdown}>{secondsLeft}s</Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {offer.description}
      </Text>
      <View style={styles.metaRow}>
        <MapPin size={13} color={colors.textSecondary} />
        <Text style={styles.metaText} numberOfLines={1}>
          {offer.location}
          {offer.distanceKm != null ? ` · ${formatDistance(offer.distanceKm)}` : ''}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.price}>{formatCurrency(offer.estimatedAmount)}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button label="Decline" variant="ghost" size="sm" onPress={onDecline} loading={declining} disabled={accepting} />
          <Button label="Accept" variant="danger" size="sm" onPress={onAccept} loading={accepting} disabled={declining} />
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, gap: 10, borderWidth: 1.5, borderColor: colors.danger },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconWrap: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
    title: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text },
    countdown: { fontFamily: 'Inter_800ExtraBold', fontSize: 16, color: colors.danger },
    description: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSecondary },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
    price: { fontFamily: 'Inter_800ExtraBold', fontSize: 16, color: colors.danger },
  });
}
