import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Star } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { TrustBadge } from '@/components/ui/TrustBadge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Artisan } from '@/types/artisan';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ThemeColors } from '@/theme/colors';

interface ArtisanCardProps {
  artisan: Artisan;
  onPress?: () => void;
  compact?: boolean;
}

// Real artisan accounts start with no completed jobs / reviews / trust history yet
// (the backend has no distance or verification data at all). Showing "0 km", a
// red 0% trust ring, or a checkmark derived from a zero score reads as broken —
// so brand-new artisans get a neutral "New" treatment instead of fabricated stats.
function isNewArtisan(artisan: Artisan) {
  return artisan.completedJobs === 0 && artisan.reviewCount === 0;
}

export function ArtisanCard({ artisan, onPress, compact }: ArtisanCardProps) {
  const isNew = isNewArtisan(artisan);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (compact) {
    return (
      <AnimatedPressable onPress={onPress} style={styles.compactCard}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View>
            <Image source={{ uri: artisan.avatarUrl }} style={{ width: 64, height: 64, borderRadius: 32 }} />
            {artisan.isOnline ? <View style={styles.onlineDot} /> : null}
          </View>
          <View style={styles.compactNameRow}>
            <Text numberOfLines={1} style={styles.compactName}>{artisan.name}</Text>
            {artisan.verified ? <VerifiedBadge size={13} /> : null}
          </View>
          <Text numberOfLines={1} style={[styles.compactProfession, { width: '100%' }]}>{artisan.profession}</Text>
        </View>
        {isNew ? (
          <View style={styles.newPill}>
            <Text style={styles.newPillLabel}>New</Text>
          </View>
        ) : (
          <TrustBadge score={artisan.trustScore} size="sm" />
        )}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View>
          <Image source={{ uri: artisan.avatarUrl }} style={{ width: 64, height: 64, borderRadius: 32 }} />
          {artisan.isOnline ? <View style={styles.onlineDot} /> : null}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={[styles.name, { flexShrink: 1 }]}>{artisan.name}</Text>
            {artisan.verified ? <VerifiedBadge size={16} /> : null}
          </View>
          <Text numberOfLines={1} style={styles.profession}>{artisan.profession}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              {artisan.reviewCount > 0 ? (
                <>
                  <Star size={14} color="#FACC15" fill="#FACC15" />
                  <Text style={styles.metaText}>{artisan.rating.toFixed(1)}</Text>
                  <Text style={styles.metaSubtext}>({artisan.reviewCount})</Text>
                </>
              ) : (
                <Text style={styles.metaSubtext}>No reviews yet</Text>
              )}
            </View>
            {artisan.distanceKm > 0 ? (
              <View style={styles.metaItem}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text style={styles.metaSubtext}>{artisan.distanceKm} km</Text>
              </View>
            ) : null}
          </View>
        </View>
        {isNew ? (
          <View style={styles.newPill}>
            <Text style={styles.newPillLabel}>New</Text>
          </View>
        ) : (
          <TrustBadge score={artisan.trustScore} size="sm" />
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Text style={styles.jobsDone}>{artisan.completedJobs > 0 ? `${artisan.completedJobs} jobs done` : 'No jobs completed yet'}</Text>
      </View>
    </AnimatedPressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    compactCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 12,
      gap: 8,
      width: 168,
      shadowColor: '#0F172A',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 16,
      gap: 12,
      shadowColor: '#0F172A',
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    onlineDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.success,
      borderWidth: 2,
      borderColor: colors.card,
    },
    compactNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, width: '100%' },
    compactName: { flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text, textAlign: 'center' },
    compactProfession: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    name: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    profession: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text },
    metaSubtext: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    jobsDone: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primary },
    newPill: {
      backgroundColor: `${colors.primary}1A`,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    newPillLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.primary },
  });
}
