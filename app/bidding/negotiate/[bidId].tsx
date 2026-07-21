import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useAcceptBid, useCounterOffer } from '@/hooks/queries/useBidding';
import { useBiddingStore } from '@/store/biddingStore';
import { useJobStore } from '@/store/jobStore';
import { formatCurrency } from '@/utils/format';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function NegotiationScreen() {
  const { bidId } = useLocalSearchParams<{ bidId: string }>();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const bids = useBiddingStore((s) => s.bids);
  const bid = bids.find((b) => b.id === bidId);
  const allOffers = useBiddingStore((s) => s.offers);
  const offers = useMemo(() => allOffers.filter((o) => o.bidId === bidId), [allOffers, bidId]);
  const addOffer = useBiddingStore((s) => s.addOffer);
  const acceptBidLocal = useBiddingStore((s) => s.acceptBid);
  const updateJobStatus = useJobStore((s) => s.updateJobStatus);
  const counterOffer = useCounterOffer();
  const acceptBid = useAcceptBid();
  const toast = useToast();
  const [customPrice, setCustomPrice] = useState('');

  if (!bid) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.notFound}>Bid not found</Text>
      </SafeAreaView>
    );
  }

  const suggestedPrices = [bid.price - 30, Math.round((bid.price + bid.artisan.trustScore) / 2) - 10, bid.price - 10].filter((p) => p > 0);

  async function sendOffer(price: number) {
    await counterOffer.mutateAsync({ bidId: bidId!, price });
    addOffer({ id: `offer-${Date.now()}`, bidId: bidId!, sender: 'customer', price, createdAt: 'Now' });
    setCustomPrice('');

    setTimeout(() => {
      const willAccept = price >= bid!.price - 40;
      if (willAccept) {
        addOffer({ id: `offer-${Date.now() + 1}`, bidId: bidId!, sender: 'artisan', price, message: 'Deal! I accept your offer.', createdAt: 'Now' });
      } else {
        const counter = Math.round((price + bid!.price) / 2);
        addOffer({ id: `offer-${Date.now() + 1}`, bidId: bidId!, sender: 'artisan', price: counter, message: `I can do ${formatCurrency(counter)} instead.`, createdAt: 'Now' });
      }
    }, 1400);
  }

  async function acceptFinal(price: number) {
    try {
      // Passes the negotiated price through so escrow locks in what was actually
      // agreed in this chat, not the artisan's original quoted amount (see
      // BidDtos.AcceptRequest on the backend).
      await acceptBid.mutateAsync({ bidId: bidId!, agreedAmount: price });
      acceptBidLocal(bidId!);
      updateJobStatus(bid!.jobId, 'accepted');
      toast.show('Bid accepted! Artisan notified.', 'success');
      router.replace(`/jobs/${bid!.jobId}`);
    } catch {
      toast.show('Could not accept the bid. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <BackButton />
          <Image source={{ uri: bid.artisan.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.artisanName}>{bid.artisan.name}</Text>
            <Text style={styles.originalQuote}>Original quote: {formatCurrency(bid.price)}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, gap: 10 }}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <View style={styles.startedPill}>
              <Text style={styles.startedLabel}>Negotiation started</Text>
            </View>
          </View>
          {offers.map((offer) => (
            <View key={offer.id} style={{ flexDirection: 'row', justifyContent: offer.sender === 'customer' ? 'flex-end' : 'flex-start' }}>
              <View
                style={[
                  styles.bubble,
                  offer.sender === 'customer'
                    ? { backgroundColor: colors.primary, borderBottomRightRadius: 6 }
                    : { backgroundColor: colors.card, borderBottomLeftRadius: 6 },
                ]}>
                <Text style={[styles.bubblePrice, { color: offer.sender === 'customer' ? '#FFFFFF' : colors.text }]}>
                  {formatCurrency(offer.price)}
                </Text>
                {offer.message ? (
                  <Text style={[styles.bubbleMessage, { color: offer.sender === 'customer' ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
                    {offer.message}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
          {offers.length > 0 && offers[offers.length - 1].sender === 'artisan' ? (
            <AnimatedPressable onPress={() => acceptFinal(offers[offers.length - 1].price)} style={styles.acceptButton}>
              <Text style={styles.acceptLabel}>Accept {formatCurrency(offers[offers.length - 1].price)}</Text>
            </AnimatedPressable>
          ) : null}
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {suggestedPrices.map((price) => (
              <AnimatedPressable key={price} onPress={() => sendOffer(price)} style={styles.suggestedChip}>
                <Text style={styles.suggestedLabel}>{formatCurrency(price)}</Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={customPrice}
              onChangeText={setCustomPrice}
              placeholder="Enter your offer (GH₵)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              style={styles.customInput}
            />
            <AnimatedPressable onPress={() => customPrice && sendOffer(Number(customPrice))} style={styles.sendButton}>
              <Send size={18} color="#FFFFFF" />
            </AnimatedPressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    notFound: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textSecondary },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    artisanName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text },
    originalQuote: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    startedPill: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
    startedLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSecondary },
    bubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
    bubblePrice: { fontFamily: 'Inter_700Bold', fontSize: 16 },
    bubbleMessage: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
    acceptButton: { alignSelf: 'flex-start', backgroundColor: `${colors.success}1A`, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 },
    acceptLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.success },
    suggestedChip: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    suggestedLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primary },
    customInput: { flex: 1, backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
    sendButton: { backgroundColor: colors.primary, borderRadius: 16, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  });
}
