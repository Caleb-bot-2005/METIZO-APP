import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { AlertTriangle, Clock, LocateFixed, MapPin, RefreshCw, Search, ShieldCheck, Siren, Star, UserX, Zap } from 'lucide-react-native';
import { Image } from 'expo-image';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { TrustBadge } from '@/components/ui/TrustBadge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useToast } from '@/components/ui/Toast';
import {
  useCancelEmergencyDispatch,
  useCreateEmergencyDispatch,
  useEmergencyDispatch,
  useEmergencyEstimate,
  useRematchEmergencyDispatch,
} from '@/hooks/queries/useEmergency';
import { useArtisan } from '@/hooks/queries/useArtisans';
import { useEmergencyStore } from '@/store/emergencyStore';
import { serviceCategories } from '@/constants/categories';
import { emergencyProblemTypes } from '@/constants/emergencyProblems';
import { formatCurrency, formatDistance } from '@/utils/format';
import { gradients, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const emergencyCategories = serviceCategories.filter((c) => c.emergencyAvailable);

export default function EmergencyModeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [now, setNow] = useState(Date.now());

  const location = useEmergencyStore();
  const setEmergencyLocation = useEmergencyStore((s) => s.setLocation);
  const createDispatch = useCreateEmergencyDispatch();
  const cancelDispatch = useCancelEmergencyDispatch();
  const rematchDispatch = useRematchEmergencyDispatch();
  const { data: dispatch } = useEmergencyDispatch(requestId ?? undefined);
  const { data: estimate } = useEmergencyEstimate(selectedCategory ?? undefined, selectedProblem ?? undefined);
  const { data: matchedArtisan, isLoading: matchedArtisanLoading } = useArtisan(
    dispatch?.assignedArtisanId ? String(dispatch.assignedArtisanId) : ''
  );
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const selectedCategoryData = emergencyCategories.find((c) => c.id === selectedCategory);
  const problemOptions = selectedCategory ? emergencyProblemTypes[selectedCategory] ?? [] : [];

  // Auto-detect location as soon as the screen opens — this is the ride-hailing
  // pattern: don't make the user do anything to get a location, just let them
  // override it if it's wrong.
  useEffect(() => {
    if (location.address) return;
    autoDetectLocation();
  }, []);

  // Ticks every second so the round countdown (derived from roundDeadlineEpochMs) is live.
  useEffect(() => {
    if (dispatch?.status !== 'SEARCHING') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [dispatch?.status]);

  async function autoDetectLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
      const address = place
        ? [place.street, place.name].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', ') || place.district || 'Current location'
        : 'Current location';
      setEmergencyLocation({ latitude, longitude, address });
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit() {
    if (!selectedCategoryData || !selectedProblem) return;
    if (!location.latitude || !location.longitude) {
      toast.show('Set your location before dispatching.', 'error');
      return;
    }
    try {
      const result = await createDispatch.mutateAsync({
        category: selectedCategoryData.id,
        problemType: selectedProblem,
        note: note || undefined,
        location: location.address ?? 'Location not set',
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setRequestId(String(result.requestId));
      setNow(Date.now());
    } catch (error: any) {
      toast.show(error?.response?.data?.message ?? 'Could not send the emergency request. Please try again.', 'error');
    }
  }

  async function handleCancel() {
    if (!requestId) return;
    try {
      await cancelDispatch.mutateAsync(requestId);
      resetForm();
    } catch {
      toast.show('Could not cancel. Please try again.', 'error');
    }
  }

  async function handleRematch() {
    if (!requestId) return;
    try {
      await rematchDispatch.mutateAsync(requestId);
      toast.show('Looking for a different artisan...', 'success');
    } catch (error: any) {
      toast.show(error?.response?.data?.message ?? 'No more rematches available for this request.', 'error');
    }
  }

  function resetForm() {
    setRequestId(null);
    setSelectedCategory(null);
    setSelectedProblem(null);
    setNote('');
  }

  function retryAfterFailure() {
    setRequestId(null);
    // Keep category/problem selected so the customer doesn't have to re-tap everything.
  }

  const phase: 'form' | 'searching' | 'matched' | 'failed' | 'cancelled' = !requestId || !dispatch
    ? 'form'
    : dispatch.status === 'SEARCHING'
      ? 'searching'
      : dispatch.status === 'ASSIGNED'
        ? 'matched'
        : dispatch.status === 'FAILED'
          ? 'failed'
          : 'cancelled';

  const secondsLeft = dispatch ? Math.max(0, Math.round((dispatch.roundDeadlineEpochMs - now) / 1000)) : 0;

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={gradients.emergency} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <BackButton />
        </View>
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 16 }}>
          <View style={styles.iconWrap}>
            <Siren size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Emergency Service</Text>
          <Text style={styles.heroSubtitle}>
            {phase === 'form'
              ? 'The nearest available artisan is dispatched instantly — no bidding, no waiting to compare.'
              : 'Fast dispatch in progress'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {phase === 'form' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingBottom: 24 }}>
            <Text style={styles.sectionTitle}>1. What's the emergency?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {emergencyCategories.map((category) => (
                <AnimatedPressable
                  key={category.id}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setSelectedProblem(null);
                  }}
                  style={[styles.categoryChip, selectedCategory === category.id ? styles.categoryChipActive : null]}>
                  <Text style={[styles.categoryChipLabel, selectedCategory === category.id ? styles.categoryChipLabelActive : null]}>
                    {category.name}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            {selectedCategory ? (
              <>
                <Text style={styles.sectionTitle}>2. What's the problem?</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {problemOptions.map((problem) => (
                    <AnimatedPressable
                      key={problem}
                      onPress={() => setSelectedProblem(problem)}
                      style={[styles.categoryChip, selectedProblem === problem ? styles.categoryChipActive : null]}>
                      <Text style={[styles.categoryChipLabel, selectedProblem === problem ? styles.categoryChipLabelActive : null]}>
                        {problem}
                      </Text>
                    </AnimatedPressable>
                  ))}
                </View>
              </>
            ) : null}

            {selectedProblem ? (
              <>
                <Text style={styles.sectionTitle}>3. Anything else? (optional)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="A short note for the artisan..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  style={styles.noteInput}
                />

                <Text style={styles.sectionTitle}>4. Your location</Text>
                <View style={styles.locationRow}>
                  <MapPin size={18} color={colors.primary} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {locating ? 'Detecting your location…' : location.address ?? 'Location not set'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <AnimatedPressable style={styles.smallAction} onPress={autoDetectLocation} disabled={locating}>
                    <LocateFixed size={14} color={colors.primary} />
                    <Text style={styles.smallActionLabel}>Use Current Location</Text>
                  </AnimatedPressable>
                  <AnimatedPressable style={styles.smallAction} onPress={() => router.push('/(location)/search?for=emergency')}>
                    <Search size={14} color={colors.primary} />
                    <Text style={styles.smallActionLabel}>Change</Text>
                  </AnimatedPressable>
                </View>

                {estimate ? (
                  <View style={styles.estimateCard}>
                    <Text style={styles.estimateLabel}>Estimated cost (call-out included)</Text>
                    <Text style={styles.estimateValue}>
                      {formatCurrency(estimate.lowEstimate)} - {formatCurrency(estimate.highEstimate)}
                    </Text>
                    <Text style={styles.estimateNote}>
                      Fixed estimate, no bidding — held securely in escrow once you're matched. Final amount confirmed
                      before payment.
                    </Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        ) : null}

        {phase === 'searching' ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <ActivityIndicator size="large" color={colors.danger} />
            <Text style={styles.countdown}>{secondsLeft}s</Text>
            <Text style={styles.dispatching}>Notifying nearby {selectedCategoryData?.name.toLowerCase() ?? 'artisans'}...</Text>
            <Text style={styles.roundLabel}>
              Round {dispatch?.round ?? 1} of {dispatch?.maxRounds ?? 3}
            </Text>
            {estimate || dispatch ? (
              <Text style={styles.estimatePill}>{formatCurrency(dispatch?.estimatedAmount ?? estimate?.estimatedCost ?? 0)} estimated</Text>
            ) : null}
            <Button label="Cancel Request" variant="ghost" onPress={handleCancel} loading={cancelDispatch.isPending} />
          </View>
        ) : null}

        {phase === 'matched' && dispatch ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
            <View style={styles.matchedBanner}>
              <ShieldCheck size={20} color={colors.success} />
              <Text style={styles.matchedBannerText}>Artisan matched! They've been notified and are on the way.</Text>
            </View>

            {matchedArtisan ? (
              <View style={styles.artisanCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Image source={{ uri: matchedArtisan.avatarUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.artisanName}>{matchedArtisan.name}</Text>
                      {matchedArtisan.verified ? <VerifiedBadge size={15} /> : null}
                    </View>
                    <Text style={styles.artisanProfession}>{matchedArtisan.profession}</Text>
                  </View>
                  <TrustBadge score={matchedArtisan.trustScore} size="sm" />
                </View>
                <View style={styles.metaRow}>
                  {matchedArtisan.reviewCount > 0 ? (
                    <View style={styles.metaItem}>
                      <Star size={13} color={colors.gold} fill={colors.gold} />
                      <Text style={styles.metaText}>{matchedArtisan.rating.toFixed(1)}</Text>
                    </View>
                  ) : (
                    <Text style={styles.metaText}>New artisan</Text>
                  )}
                  {dispatch.distanceKm != null ? (
                    <View style={styles.metaItem}>
                      <MapPin size={13} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{formatDistance(dispatch.distanceKm)} away</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : matchedArtisanLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              // Full profile fetch failed or is slow — fall back to what the dispatch
              // status itself already carries, so payment is never blocked on this.
              <View style={styles.artisanCard}>
                <Text style={styles.artisanName}>{dispatch.assignedArtisanName ?? 'Your artisan'}</Text>
                {dispatch.distanceKm != null ? (
                  <View style={styles.metaItem}>
                    <MapPin size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{formatDistance(dispatch.distanceKm)} away</Text>
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.estimateCard}>
              <Text style={styles.estimateLabel}>Amount to secure in escrow</Text>
              <Text style={styles.estimateValue}>{formatCurrency(dispatch.estimatedAmount)}</Text>
              <Text style={styles.estimateNote}>Released to the artisan only after you confirm the job is complete.</Text>
            </View>

            <Button
              label="Pay & Confirm Booking"
              size="lg"
              variant="danger"
              icon={<Zap size={18} color="#FFFFFF" />}
              onPress={() => router.push(`/payments/escrow/${requestId}`)}
            />
            <Button
              label="Find a Different Artisan"
              variant="outline"
              icon={<RefreshCw size={16} color={colors.primary} />}
              loading={rematchDispatch.isPending}
              disabled={dispatch.round >= dispatch.maxRounds}
              onPress={handleRematch}
            />
          </ScrollView>
        ) : null}

        {phase === 'failed' ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 8 }}>
            <View style={styles.failIcon}>
              <UserX size={32} color={colors.danger} />
            </View>
            <Text style={styles.dispatching}>No {selectedCategoryData?.name.toLowerCase() ?? 'artisan'}s were available right now.</Text>
            <Button label="Try Again" variant="danger" icon={<Zap size={18} color="#FFFFFF" />} onPress={retryAfterFailure} />
          </View>
        ) : null}

        {phase === 'cancelled' ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <AlertTriangle size={32} color={colors.textSecondary} />
            <Text style={styles.dispatching}>Request cancelled.</Text>
            <Button label="Start a New Request" variant="danger" onPress={resetForm} />
          </View>
        ) : null}

        {phase === 'form' ? (
          <View style={{ paddingTop: 12 }}>
            <Button
              label="Dispatch Emergency Artisan"
              variant="danger"
              size="lg"
              disabled={!selectedCategory || !selectedProblem || !location.address}
              loading={createDispatch.isPending}
              onPress={handleSubmit}
              icon={<Zap size={18} color="#FFFFFF" />}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // Deliberately always dark (matches the red/black "emergency" gradient), not a theme artifact.
    screen: { flex: 1, backgroundColor: '#0B1220' },
    hero: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 16 },
    iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    heroTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: '#FFFFFF' },
    heroSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', paddingHorizontal: 24 },
    body: { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, paddingHorizontal: 24, paddingTop: 24 },
    sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.text },
    categoryChip: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
    categoryChipActive: { backgroundColor: colors.danger, borderColor: colors.danger },
    categoryChipLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    categoryChipLabelActive: { color: '#FFFFFF' },
    noteInput: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      minHeight: 70,
      textAlignVertical: 'top',
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: colors.text,
    },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
    locationText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
    smallAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.card, borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
    smallActionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primary },
    estimateCard: { backgroundColor: `${colors.danger}0D`, borderRadius: 16, padding: 16, gap: 4, borderWidth: 1, borderColor: `${colors.danger}22` },
    estimateLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.textSecondary },
    estimateValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 22, color: colors.text },
    estimateNote: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginTop: 2 },
    estimatePill: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.danger, backgroundColor: `${colors.danger}1A`, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
    countdown: { fontFamily: 'Inter_800ExtraBold', fontSize: 44, color: colors.danger },
    dispatching: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    roundLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    matchedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: `${colors.success}1A`, borderRadius: 16, padding: 14 },
    matchedBannerText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text },
    artisanCard: { backgroundColor: colors.card, borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border },
    artisanName: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    artisanProfession: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSecondary },
    metaRow: { flexDirection: 'row', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.text },
    failIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${colors.danger}1A`, alignItems: 'center', justifyContent: 'center' },
  });
}
