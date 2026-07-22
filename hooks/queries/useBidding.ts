import { useMutation, useQuery } from '@tanstack/react-query';
import { biddingService } from '@/services/biddingService';

export function useBidsForJob(jobId: string) {
  // This screen is branded "Live Bidding" but only ever fetched bids once on
  // mount — simulated (or real) bids that arrive seconds later were silently
  // missed unless the user navigated away and back. Poll while it's open.
  return useQuery({
    queryKey: ['bids', jobId],
    queryFn: () => biddingService.listForJob(jobId),
    enabled: !!jobId,
    refetchInterval: 3000,
  });
}

export function useAcceptBid() {
  return useMutation({
    mutationFn: ({ bidId, agreedAmount }: { bidId: string; agreedAmount?: number }) =>
      biddingService.accept(bidId, agreedAmount),
  });
}

// Artisan-side: revise the amount on their own still-pending bid.
export function useReviseBid() {
  return useMutation({
    mutationFn: ({ bidId, amount }: { bidId: string; amount: number }) => biddingService.revise(bidId, amount),
  });
}

export function useCounterOffer() {
  return useMutation({
    mutationFn: ({ bidId, price }: { bidId: string; price: number }) => biddingService.counterOffer(bidId, price),
  });
}

// Artisan-side: bids the current artisan has placed, and placing a new one.
// Polls so an accepted/declined status shows up without a manual refresh.
export function useMyBids() {
  return useQuery({ queryKey: ['bids', 'mine'], queryFn: biddingService.myBids, refetchInterval: 5000 });
}

export function usePlaceBid() {
  return useMutation({
    mutationFn: ({ jobId, amount, estimatedTime, message }: { jobId: string; amount: number; estimatedTime: string; message?: string }) =>
      biddingService.placeBid(jobId, { amount, estimatedTime, message }),
  });
}
