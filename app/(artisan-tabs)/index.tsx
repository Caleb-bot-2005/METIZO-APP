import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell, Briefcase, MapPin } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useJobFeed } from '@/hooks/queries/useJobs';
import { useUnreadNotificationCount } from '@/hooks/queries/useNotifications';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/format';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { gradients, ThemeColors } from '@/theme/colors';

export default function ArtisanFeedScreen() {
  const { data: jobs, isLoading } = useJobFeed();
  const { data: unreadCount } = useUnreadNotificationCount();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <LinearGradient colors={gradients.artisan} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeLabel}>ARTISAN</Text>
            </View>
            <Text style={styles.heroGreeting}>Hi, {firstName} 👋</Text>
            <Text style={styles.heroSubtitle}>Open requests you can bid on</Text>
          </View>
          <AnimatedPressable onPress={() => router.push('/notifications')} style={styles.iconButton}>
            <Bell size={20} color="#FFFFFF" />
            {unreadCount ? (
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </AnimatedPressable>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={{ padding: 24, gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Briefcase size={40} color={colors.textSecondary} />
              <Text style={styles.emptyLabel}>No open jobs right now</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AnimatedPressable onPress={() => router.push({ pathname: '/artisan/jobs/[id]', params: { id: item.id } })}>
              <Card style={styles.jobCard}>
                <Text style={styles.jobTitle}>{item.categoryName}</Text>
                <Text style={styles.jobDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.jobFooter}>
                  <View style={styles.metaItem}>
                    <MapPin size={12} color={colors.textSecondary} />
                    <Text style={styles.jobAddress} numberOfLines={1}>
                      {item.address || 'Location not set'}
                    </Text>
                  </View>
                  <Text style={styles.jobPrice}>{formatCurrency(item.aiEstimatedPrice)}</Text>
                </View>
              </Card>
            </AnimatedPressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    hero: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 24,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    proBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 6,
    },
    proBadgeLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF', letterSpacing: 0.5 },
    heroGreeting: { fontFamily: 'Inter_800ExtraBold', fontSize: 22, color: '#FFFFFF' },
    heroSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.artisan,
    },
    badgeLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#FFFFFF' },
    empty: { alignItems: 'center', gap: 12, marginTop: 64 },
    emptyLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    jobCard: { borderLeftWidth: 3, borderLeftColor: colors.artisan },
    jobTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text, marginBottom: 4 },
    jobDescription: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
    jobFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
    jobAddress: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    jobPrice: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.artisan },
  });
}
