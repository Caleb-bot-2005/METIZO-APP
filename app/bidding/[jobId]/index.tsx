import { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { BidCard } from '@/components/features/BidCard';
import { useBidsForJob, useAcceptBid } from '@/hooks/queries/useBidding';
import { useBiddingStore } from '@/store/biddingStore';
import { useJobStore } from '@/store/jobStore';
import { useToast } from '@/components/ui/Toast';
import { SortOption } from '@/types/bidding';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

const sortOptions: { key: SortOption; label: string }[] = [
  { key: 'best_value', label: 'Best Value' },
  { key: 'lowest_price', label: 'Lowest Price' },
  { key: 'highest_trust', label: 'Highest Trust' },
  { key: 'fastest_arrival', label: 'Fastest Arrival' },
];

function sortBids(bids: ReturnType<typeof useBidsForJob>['data'], sort: SortOption) {
  if (!bids) return [];
  const copy = [...bids];
  switch (sort) {
    case 'lowest_price':
      return copy.sort((a, b) => a.price - b.price);
    case 'highest_trust':
      return copy.sort((a, b) => b.artisan.trustScore - a.artisan.trustScore);
    case 'fastest_arrival':
      return copy.sort((a, b) => a.artisan.etaMinutes - b.artisan.etaMinutes);
    default:
      return copy.sort((a, b) => b.artisan.trustScore / b.price - a.artisan.trustScore / a.price);
  }
}

export default function LiveBiddingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { data: bids, isLoading, isRefetching, refetch } = useBidsForJob(jobId);
  const setBids = useBiddingStore((s) => s.setBids);
  const storeBids = useBiddingStore((s) => s.bids);
  const storeJobId = useBiddingStore((s) => s.jobId);
  const sortOption = useBiddingStore((s) => s.sortOption);
  const setSortOption = useBiddingStore((s) => s.setSortOption);
  const acceptBidLocal = useBiddingStore((s) => s.acceptBid);
  const declineBidLocal = useBiddingStore((s) => s.declineBid);
  const acceptBid = useAcceptBid();
  const updateJobStatus = useJobStore((s) => s.updateJobStatus);
  const toast = useToast();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  useEffect(() => {
    if (bids) setBids(bids, jobId);
  }, [bids, jobId]);

  // storeBids can briefly hold the previous job's bids (or be mid-refetch for
  // this one) right after navigating here, so only trust it once it's tagged
  // with the job we're actually viewing — otherwise fall back to raw query data.
  const activeBids = storeJobId === jobId ? storeBids : bids;
  const sorted = sortBids(activeBids, sortOption).filter((b) => b.status === 'pending');

  async function handleAccept(bidId: string) {
    await acceptBid.mutateAsync({ bidId });
    acceptBidLocal(bidId);
    updateJobStatus(jobId, 'accepted');
    toast.show('Bid accepted! Secure the payment to confirm the artisan.', 'success');
    router.replace(`/payments/escrow/${jobId}`);
  }

  async function handleRefresh() {
    if (isRefetching) return;
    await refetch();
    toast.show('Bids refreshed', 'success');
  }

  function handleSort(option: SortOption, label: string) {
    setSortOption(option);
    toast.show(`Sorted by ${label}`, 'success');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Live Bidding</Text>
          <Text style={styles.headerSubtitle}>{sorted.length} artisans competing</Text>
        </View>
        <AnimatedPressable onPress={handleRefresh} disabled={isRefetching} style={styles.refreshButton} hitSlop={8}>
          {isRefetching ? <ActivityIndicator size="small" color={colors.primary} /> : <RefreshCw size={18} color={colors.primary} />}
        </AnimatedPressable>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={sortOptions}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <AnimatedPressable
              onPress={() => handleSort(item.key, item.label)}
              style={[styles.sortChip, { backgroundColor: sortOption === item.key ? colors.primary : colors.card }]}>
              <Text style={[styles.sortLabel, { color: sortOption === item.key ? '#FFFFFF' : colors.textSecondary }]}>
                {item.label}
              </Text>
            </AnimatedPressable>
          )}
        />
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, gap: 12 }}
          renderItem={({ item, index }) => (
            <BidCard
              bid={item}
              index={index}
              onAccept={() => handleAccept(item.id)}
              onDecline={() => declineBidLocal(item.id)}
              onNegotiate={() => router.push(`/bidding/negotiate/${item.id}`)}
              onPress={() => router.push(`/artisans/${item.artisan.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.text },
    headerSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    refreshButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center' },
    sortChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    sortLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  });
}
