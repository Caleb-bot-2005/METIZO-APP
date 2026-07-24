import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Camera, ImagePlus, LocateFixed, LogOut, Pencil, Star, X } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TrustBadge } from '@/components/ui/TrustBadge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useToast } from '@/components/ui/Toast';
import { useArtisan, useUpdateMyProfile } from '@/hooks/queries/useArtisans';
import { useArtisanPortfolio, useDeletePortfolioPhoto, useUploadPortfolioPhoto } from '@/hooks/queries/usePortfolio';
import { useAuthStore } from '@/store/authStore';
import { serviceCategories } from '@/constants/categories';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ThemeColors } from '@/theme/colors';

export default function ArtisanProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: artisan, isLoading, isError, refetch } = useArtisan(user?.id ?? '');
  const updateProfile = useUpdateMyProfile();
  const { data: portfolio } = useArtisanPortfolio(user?.id ?? '');
  const uploadPortfolioPhoto = useUploadPortfolioPhoto(user?.id ?? '');
  const deletePortfolioPhoto = useDeletePortfolioPhoto(user?.id ?? '');
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState<string | undefined>();
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | undefined>();
  const [bio, setBio] = useState('');
  const [available, setAvailable] = useState(true);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (artisan) {
      setCategory(serviceCategories.find((c) => c.name === artisan.profession)?.id ?? artisan.profession);
      setLocation('');
      setCoords(undefined);
      setBio(artisan.bio);
      setAvailable(artisan.isOnline);
    }
  }, [artisan?.id]);

  // Lets customers see real distance to this artisan — without this, they
  // never show up in anyone's "Nearby Artisans" list.
  async function useCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Location permission denied.', 'error');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
      const line1 = place
        ? [place.street, place.name].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', ') || place.district || 'Current location'
        : 'Current location';
      setLocation(line1);
      setCoords({ latitude, longitude });
    } catch {
      toast.show('Could not fetch your location. Please try again.', 'error');
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    try {
      await updateProfile.mutateAsync({
        category,
        bio,
        location: location || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        available,
      });
      await refetch();
      setEditing(false);
      toast.show('Profile updated', 'success');
    } catch {
      toast.show('Could not update your profile. Please try again.', 'error');
    }
  }

  async function toggleAvailable(value: boolean) {
    setAvailable(value);
    try {
      await updateProfile.mutateAsync({ available: value });
      refetch();
    } catch {
      setAvailable(!value);
      toast.show('Could not update availability', 'error');
    }
  }

  function handleLogout() {
    logout();
    router.replace('/(auth)/welcome');
  }

  async function uploadFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) await submitPortfolioPhoto(result.assets[0].uri);
  }

  async function uploadFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) await submitPortfolioPhoto(result.assets[0].uri);
  }

  async function submitPortfolioPhoto(uri: string) {
    try {
      await uploadPortfolioPhoto.mutateAsync({ uri });
      toast.show('Photo added to your portfolio', 'success');
    } catch {
      toast.show('Could not upload photo. Please try again.', 'error');
    }
  }

  async function removePortfolioPhoto(id: string) {
    try {
      await deletePortfolioPhoto.mutateAsync(id);
    } catch {
      toast.show('Could not remove photo. Please try again.', 'error');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.artisan} />
      </SafeAreaView>
    );
  }

  if (!artisan) {
    // A logged-in session whose own profile 404s (account deleted since the
    // token was issued — e.g. a database reset — or any other persistent
    // fetch failure) isn't something Retry can fix. GET /api/artisans/{id}
    // is a public endpoint, so this never goes through the 401/session-expiry
    // path (services/api/client.ts) — the user needs an explicit way out
    // rather than being stuck on a dead screen with no escape.
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 }]}>
        <Text style={styles.detailValue}>{isError ? "Couldn't load your profile." : 'Profile not found.'}</Text>
        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
          <Button label="Retry" size="sm" variant="outline" fullWidth={false} onPress={() => refetch()} />
          <Button label="Log Out" size="sm" fullWidth={false} onPress={handleLogout} style={{ backgroundColor: colors.danger }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.body}>
          <View style={styles.profileRow}>
            <Avatar name={artisan.name} uri={artisan.avatarUrl} size={72} />
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{artisan.name}</Text>
                {artisan.verified ? <VerifiedBadge size={16} /> : null}
              </View>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
            <TrustBadge score={artisan.trustScore} size="md" />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Star size={16} color={colors.gold} />
              <Text style={styles.statValue}>{artisan.reviewCount > 0 ? artisan.rating.toFixed(1) : 'New'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{artisan.completedJobs}</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{artisan.trustScore}%</Text>
              <Text style={styles.statLabel}>Trust Score</Text>
            </View>
          </View>

          <View style={styles.availabilityRow}>
            <Text style={styles.availabilityLabel}>Available for new jobs</Text>
            <Switch value={available} onValueChange={toggleAvailable} trackColor={{ true: colors.artisan }} />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profile Details</Text>
              <AnimatedPressable onPress={() => setEditing((e) => !e)} style={styles.editButton}>
                <Pencil size={14} color={colors.artisan} />
                <Text style={styles.editButtonLabel}>{editing ? 'Cancel' : 'Edit'}</Text>
              </AnimatedPressable>
            </View>

            {editing ? (
              <View style={{ gap: 16 }}>
                <View style={{ gap: 8 }}>
                  <Text style={styles.fieldLabel}>Service category</Text>
                  <View style={styles.categoryGrid}>
                    {serviceCategories.map((c) => (
                      <AnimatedPressable
                        key={c.id}
                        onPress={() => setCategory(c.id)}
                        style={[styles.categoryChip, category === c.id ? styles.categoryChipActive : null]}>
                        <Text style={[styles.categoryChipLabel, category === c.id ? styles.categoryChipLabelActive : null]}>
                          {c.name}
                        </Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                </View>
                <View style={{ gap: 8 }}>
                  <Input
                    label="Location"
                    placeholder="East Legon, Accra"
                    value={location}
                    onChangeText={(text) => {
                      setLocation(text);
                      setCoords(undefined);
                    }}
                  />
                  <AnimatedPressable onPress={useCurrentLocation} disabled={locating} style={styles.locateButton}>
                    <LocateFixed size={14} color={colors.artisan} />
                    <Text style={styles.locateButtonLabel}>{locating ? 'Locating…' : 'Use Current Location'}</Text>
                  </AnimatedPressable>
                </View>
                <Input
                  label="Bio"
                  multiline
                  style={{ minHeight: 70, textAlignVertical: 'top' }}
                  value={bio}
                  onChangeText={setBio}
                />
                <Button
                  label="Save Changes"
                  size="md"
                  loading={updateProfile.isPending}
                  onPress={handleSave}
                  style={{ backgroundColor: colors.artisan }}
                />
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <DetailRow label="Category" value={artisan.profession || 'Not set'} styles={styles} />
                <DetailRow label="Bio" value={artisan.bio || 'No bio yet'} styles={styles} />
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <AnimatedPressable onPress={uploadFromCamera} style={styles.portfolioPickerButton}>
                <Camera size={20} color={colors.artisan} />
                <Text style={styles.portfolioPickerLabel}>Camera</Text>
              </AnimatedPressable>
              <AnimatedPressable onPress={uploadFromGallery} style={styles.portfolioPickerButton}>
                <ImagePlus size={20} color={colors.artisan} />
                <Text style={styles.portfolioPickerLabel}>Gallery</Text>
              </AnimatedPressable>
            </View>
            {portfolio && portfolio.length > 0 ? (
              <FlatList
                data={portfolio}
                keyExtractor={(item) => item.id}
                numColumns={3}
                scrollEnabled={false}
                columnWrapperStyle={{ gap: 8 }}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => (
                  <View style={{ width: '31%', aspectRatio: 1 }}>
                    <Image source={{ uri: item.url }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                    <AnimatedPressable onPress={() => removePortfolioPhoto(item.id)} style={styles.portfolioRemoveButton}>
                      <X size={13} color="#FFFFFF" />
                    </AnimatedPressable>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.detailValue}>No portfolio photos yet — add some to showcase your work.</Text>
            )}
          </View>

          <AnimatedPressable onPress={handleLogout} style={styles.logoutRow}>
            <LogOut size={20} color={colors.danger} />
            <Text style={styles.logoutLabel}>Log Out</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    body: { paddingHorizontal: 24, paddingTop: 8, gap: 20 },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    email: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    statsRow: { flexDirection: 'row', gap: 12 },
    statBox: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
    statValue: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text },
    statLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, color: colors.textSecondary },
    availabilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
    },
    availabilityLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    sectionCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
    editButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    editButtonLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primary },
    fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    locateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: colors.background,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locateButtonLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.artisan },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: { backgroundColor: colors.background, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.border },
    categoryChipActive: { backgroundColor: colors.artisan, borderColor: colors.artisan },
    categoryChipLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text },
    categoryChipLabelActive: { color: '#FFFFFF' },
    detailLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    detailValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text, marginTop: 2 },
    logoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    logoutLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.danger },
    portfolioPickerButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingVertical: 18,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: `${colors.artisan}4D`,
    },
    portfolioPickerLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.artisan },
    portfolioRemoveButton: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: colors.danger,
      borderRadius: 999,
      width: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
