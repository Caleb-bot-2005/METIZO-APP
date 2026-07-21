import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Briefcase,
  Clock,
  MessageCircle,
  ShieldCheck,
  Star,
  TrendingUp,
} from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { ReviewCard } from '@/components/features/ReviewCard';
import { BeforeAfterSlider } from '@/components/features/BeforeAfterSlider';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useArtisan, useArtisanReviews } from '@/hooks/queries/useArtisans';
import { gradients, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function ArtisanProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: artisan, isLoading } = useArtisan(id);
  const { data: reviews } = useArtisanReviews(id);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (isLoading || !artisan) {
    return (
      <SafeAreaView style={[styles.screen, { paddingHorizontal: 24, paddingTop: 24 }]}>
        <SkeletonCard />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 220 }}>
          {artisan.coverUrl ? (
            <Image source={{ uri: artisan.coverUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            // Real backend artisans don't have a cover photo yet — a plain empty-string
            // image URI rendered nothing, leaving this whole header blank. Fall back to
            // the app's own gradient instead of depending on a placeholder photo service.
            <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: '100%', height: '100%' }} />
          )}
          <View style={{ position: 'absolute', top: 56, left: 24 }}>
            <BackButton />
          </View>
          <View style={{ position: 'absolute', bottom: -40, left: 24 }}>
            <Image
              source={{ uri: artisan.avatarUrl }}
              style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: colors.background }}
            />
          </View>
        </View>

        <View style={styles.body}>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{artisan.name}</Text>
              {artisan.verified ? <VerifiedBadge size={18} /> : null}
            </View>
            <Text style={styles.profession}>{artisan.profession}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatBox icon={Star} label="Rating" value={artisan.reviewCount > 0 ? artisan.rating.toFixed(1) : 'New'} />
            <StatBox icon={Briefcase} label="Jobs Done" value={`${artisan.completedJobs}`} />
            <StatBox icon={Clock} label="Response" value={artisan.responseRate > 0 ? `${artisan.responseRate}%` : '—'} />
          </View>

          <AnimatedPressable onPress={() => router.push(`/artisans/${artisan.id}/trust-score`)} style={styles.trustRow}>
            <View style={styles.trustIcon}>
              <ShieldCheck size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustLabel}>
                {artisan.completedJobs > 0 ? `Trust Score: ${artisan.trustScore}%` : 'New artisan — building trust score'}
              </Text>
              <Text style={styles.trustSubtext}>Tap to view full analytics</Text>
            </View>
            <TrendingUp size={18} color={colors.success} />
          </AnimatedPressable>

          <View style={styles.badgeRow}>
            {artisan.badges.map((badge) => (
              <View key={badge} style={styles.badge}>
                <Text style={styles.badgeLabel}>{badge}</Text>
              </View>
            ))}
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{artisan.bio}</Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.badgeRow}>
              {artisan.skills.map((skill) => (
                <View key={skill} style={styles.skillBadge}>
                  <Text style={styles.skillLabel}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          {artisan.portfolio.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.sectionTitle}>Before & After</Text>
              <BeforeAfterSlider beforeUrl={artisan.portfolio[0].beforeUrl} afterUrl={artisan.portfolio[0].afterUrl} />
              <Text style={styles.caption}>{artisan.portfolio[0].caption}</Text>
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <Text style={styles.sectionTitle}>Reviews ({reviews?.length ?? 0})</Text>
            <View style={{ gap: 12 }}>
              {reviews?.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Button
            label="Message"
            variant="outline"
            icon={<MessageCircle size={16} color={colors.primary} />}
            onPress={() => router.push('/(tabs)/messages')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Hire Now" onPress={() => router.push('/jobs/new/category')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.statBox}>
      <Icon size={16} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: 24, paddingTop: 56, gap: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: 'Inter_800ExtraBold', fontSize: 20, color: colors.text },
  profession: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.text },
  statLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, color: colors.textSecondary },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${colors.primary}0D`,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${colors.primary}1A`,
  },
  trustIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
  trustLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
  trustSubtext: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.border },
  badgeLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text },
  bio: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  skillBadge: { backgroundColor: `${colors.primary}1A`, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  skillLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primary },
  caption: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  });
}
