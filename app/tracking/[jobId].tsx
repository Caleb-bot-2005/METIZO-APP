import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapView, Marker, Polyline } from '@/components/ui/AppMap';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Navigation, Phone } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useJobStore } from '@/store/jobStore';
import { mockArtisans } from '@/constants/mockData';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const TOTAL_STEPS = 40;

export default function TrackingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const job = useJobStore((s) => s.jobs.find((j) => j.id === jobId));
  const updateJobStatus = useJobStore((s) => s.updateJobStatus);
  const artisan = mockArtisans[0];
  const [step, setStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const destination = { latitude: job?.latitude ?? 5.6037, longitude: job?.longitude ?? -0.187 };
  const origin = { latitude: destination.latitude + 0.02, longitude: destination.longitude - 0.015 };

  useEffect(() => {
    if (jobId && job?.status === 'accepted') updateJobStatus(jobId, 'traveling');
  }, [jobId]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= TOTAL_STEPS) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (jobId) updateJobStatus(jobId, 'arrived');
          return s;
        }
        return s + 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId]);

  const progress = step / TOTAL_STEPS;
  const currentPosition = {
    latitude: origin.latitude + (destination.latitude - origin.latitude) * progress,
    longitude: origin.longitude + (destination.longitude - origin.longitude) * progress,
  };
  const etaMinutes = Math.max(0, Math.round(12 * (1 - progress)));
  const distanceKm = Math.max(0, 3.2 * (1 - progress)).toFixed(1);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={{ flex: 1 }}>
        <MapView style={{ flex: 1 }} initialRegion={{ ...destination, latitudeDelta: 0.04, longitudeDelta: 0.04 }}>
          <Polyline coordinates={[origin, destination]} strokeColor={colors.primary} strokeWidth={3} lineDashPattern={[8, 6]} />
          <Marker coordinate={currentPosition} title={artisan.name}>
            <View style={styles.markerDot}>
              <Navigation size={16} color="#FFFFFF" />
            </View>
          </Marker>
          <Marker coordinate={destination} title="You" pinColor={colors.success} />
        </MapView>

        <View style={styles.topBar}>
          <BackButton />
        </View>

        <View style={styles.trafficPill}>
          <View style={styles.trafficDot} />
          <Text style={styles.trafficLabel}>Moderate traffic</Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.artisanRow}>
          <Image source={{ uri: artisan.avatarUrl }} style={{ width: 52, height: 52, borderRadius: 26 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.artisanName}>{artisan.name}</Text>
            <Text style={styles.artisanProfession}>{artisan.profession}</Text>
          </View>
          <AnimatedPressable style={styles.callButton}>
            <Phone size={18} color={colors.primary} />
          </AnimatedPressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValuePrimary}>{etaMinutes}m</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{distanceKm}km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValueSuccess}>{progress >= 1 ? 'Arrived' : 'En route'}</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        {progress >= 1 ? (
          <Text style={styles.viewProgress} onPress={() => router.replace(`/jobs/${jobId}`)}>
            View Job Progress
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    markerDot: { backgroundColor: colors.primary, borderRadius: 999, padding: 8, borderWidth: 2, borderColor: '#FFFFFF' },
    topBar: { position: 'absolute', top: 56, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between' },
    trafficPill: {
      position: 'absolute',
      top: 112,
      left: 24,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    trafficDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
    trafficLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
      gap: 16,
      shadowColor: '#0F172A',
      shadowOpacity: 0.1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: -6 },
    },
    artisanRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    artisanName: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    artisanProfession: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, borderRadius: 16, padding: 16 },
    statItem: { alignItems: 'center', flex: 1 },
    statValuePrimary: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.primary },
    statValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.text },
    statValueSuccess: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: colors.success },
    statLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    divider: { width: 1, height: 32, backgroundColor: colors.border },
    viewProgress: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary, textAlign: 'center' },
  });
}
