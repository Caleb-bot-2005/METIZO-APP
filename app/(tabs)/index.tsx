import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell, ChevronDown, MapPin, Plus } from 'lucide-react-native';
import { SearchBar } from '@/components/ui/SearchBar';
import { CategoryCard } from '@/components/features/CategoryCard';
import { ArtisanCard } from '@/components/features/ArtisanCard';
import { EmergencyBanner } from '@/components/features/EmergencyBanner';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { TabScreen } from '@/components/ui/TabScreen';
import { useArtisans } from '@/hooks/queries/useArtisans';
import { seededShuffle } from '@/utils/seededShuffle';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { serviceCategories } from '@/constants/categories';
import { gradients, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/hooks/use-translation';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const currentAddress = useLocationStore((s) => s.currentAddress);
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const { data: artisans, isLoading, dataUpdatedAt } = useArtisans();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const nearbySectionArtisans = useMemo(() => {
    // Only artisans with real coordinates and known distance from the customer
    // count as genuinely "nearby" — distanceKm is 0 for anyone missing either
    // side's location (see artisanService.toArtisan). Real distances are a
    // meaningful signal, so this order is left as-is.
    const nearbyArtisans = [...(artisans ?? [])]
      .filter((a) => a.distanceKm > 0)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    if (nearbyArtisans.length > 0) return nearbyArtisans;

    // Most artisans won't have set their location yet, which would otherwise
    // leave this section permanently empty even when people are actually
    // online and available — fall back to showing those rather than a dead end.
    // With no real distance to rank by, always showing the exact same
    // trust-sorted list forever reads as frozen/broken once useArtisans' 5s
    // poll brings back identical data — so rotate a fresh random sample (still
    // biased toward the most trusted) each time a poll actually lands.
    const pool = [...(artisans ?? [])]
      .filter((a) => a.isOnline && a.distanceKm === 0)
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, 15);
    return seededShuffle(pool, dataUpdatedAt).slice(0, 8);
  }, [artisans, dataUpdatedAt]);

  return (
    <TabScreen routeIndex={0}>
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroRow}>
            <AnimatedPressable onPress={() => router.push('/(location)/saved')} style={{ flex: 1 }}>
              <View style={styles.addressRow}>
                <Text numberOfLines={1} style={styles.heroAddress}>
                  {currentAddress?.line1 ?? t('home_set_location')}
                </Text>
                <ChevronDown size={14} color="rgba(255,255,255,0.7)" />
              </View>
              <Text numberOfLines={1} style={styles.heroGreeting}>{t('home_greeting')} {firstName} 👋</Text>
            </AnimatedPressable>
            <AnimatedPressable onPress={() => router.push('/notifications')} style={styles.bellButton}>
              <Bell size={20} color="#FFFFFF" />
              {unreadCount > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeLabel}>{unreadCount}</Text>
                </View>
              ) : null}
            </AnimatedPressable>
          </View>
          <SearchBar onPress={() => router.push('/(tabs)/categories')} editable={false} />
        </LinearGradient>

        <View style={styles.body}>
          <EmergencyBanner onPress={() => router.push('/jobs/emergency')} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home_popular_categories')}</Text>
              <Text style={styles.sectionLink} onPress={() => router.push('/(tabs)/categories')}>
                {t('home_see_all')}
              </Text>
            </View>
            <View style={styles.categoryGrid}>
              {serviceCategories.slice(0, 6).map((category) => (
                <View key={category.id} style={{ width: '31%' }}>
                  <CategoryCard
                    category={category}
                    onPress={() => router.push({ pathname: '/jobs/new/describe', params: { categoryId: category.id, categoryName: category.name } })}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home_nearby_artisans')}</Text>
              <Text style={styles.sectionLink} onPress={() => router.push('/(tabs)/categories')}>
                {t('home_see_all')}
              </Text>
            </View>
            {isLoading ? (
              <GHScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                <View style={styles.nearbySkeleton}><SkeletonCard /></View>
                <View style={styles.nearbySkeleton}><SkeletonCard /></View>
                <View style={styles.nearbySkeleton}><SkeletonCard /></View>
              </GHScrollView>
            ) : !currentAddress && nearbySectionArtisans.length === 0 ? (
              <AnimatedPressable onPress={() => router.push('/(location)/search')} style={styles.nearbyPrompt}>
                <MapPin size={18} color={colors.primary} />
                <Text style={styles.nearbyPromptText}>Set your location to see artisans near you</Text>
              </AnimatedPressable>
            ) : nearbySectionArtisans.length === 0 ? (
              <View style={styles.nearbyPrompt}>
                <MapPin size={18} color={colors.textSecondary} />
                <Text style={styles.nearbyPromptText}>No nearby artisans yet — check back soon</Text>
              </View>
            ) : (
              <GHScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {nearbySectionArtisans.map((artisan) => (
                  <ArtisanCard key={artisan.id} artisan={artisan} compact onPress={() => router.push(`/artisans/${artisan.id}`)} />
                ))}
              </GHScrollView>
            )}
          </View>

          {artisans && artisans.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('home_recommended')}</Text>
              <View style={{ gap: 12 }}>
                {artisans.slice(0, 2).map((artisan) => (
                  <ArtisanCard key={artisan.id} artisan={artisan} onPress={() => router.push(`/artisans/${artisan.id}`)} />
                ))}
              </View>
            </View>
          ) : null}

          <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promoCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=200' }}
              style={{ width: 56, height: 56, borderRadius: 16 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle} numberOfLines={1}>
                Upgrade to Home+
              </Text>
              <Text style={styles.promoSubtitle} numberOfLines={1}>
                Priority booking & lower fees
              </Text>
            </View>
            <AnimatedPressable onPress={() => router.push('/subscriptions')} style={styles.promoButton}>
              <Text style={styles.promoButtonLabel}>View</Text>
            </AnimatedPressable>
          </LinearGradient>
        </View>
      </ScrollView>

      <AnimatedPressable onPress={() => router.push('/jobs/new/category')} style={styles.fab}>
        <Plus size={28} color="#FFFFFF" />
      </AnimatedPressable>
    </SafeAreaView>
    </TabScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: 20,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroAddress: { fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.7)', flexShrink: 1 },
  heroGreeting: { fontFamily: 'Inter_800ExtraBold', fontSize: 24, color: '#FFFFFF', marginTop: 4 },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#FFFFFF' },
  body: { paddingHorizontal: 24, marginTop: 24, gap: 32 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
  sectionLink: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primary },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  nearbySkeleton: { width: 168 },
  nearbyPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nearbyPromptText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSecondary },
  promoCard: { borderRadius: 24, overflow: 'hidden', padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  promoTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
  promoSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, color: `${colors.text}CC`, marginTop: 2 },
  promoButton: { backgroundColor: `${colors.text}1A`, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  promoButtonLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: colors.primary,
    borderRadius: 999,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  });
}
