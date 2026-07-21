import { create } from 'zustand';
import { Bid, NegotiationOffer, SortOption } from '@/types/bidding';

interface BiddingState {
  bids: Bid[];
  jobId: string | null;
  sortOption: SortOption;
  acceptedBidId: string | null;
  offers: NegotiationOffer[];
  setBids: (bids: Bid[], jobId: string) => void;
  setSortOption: (option: SortOption) => void;
  acceptBid: (id: string) => void;
  declineBid: (id: string) => void;
  addOffer: (offer: NegotiationOffer) => void;
}

export const useBiddingStore = create<BiddingState>((set) => ({
  bids: [],
  jobId: null,
  sortOption: 'best_value',
  acceptedBidId: null,
  offers: [],
  setBids: (bids, jobId) => set({ bids, jobId }),
  setSortOption: (option) => set({ sortOption: option }),
  acceptBid: (id) =>
    set((s) => ({
      acceptedBidId: id,
      bids: s.bids.map((b) => (b.id === id ? { ...b, status: 'accepted' } : b)),
    })),
  declineBid: (id) =>
    set((s) => ({ bids: s.bids.map((b) => (b.id === id ? { ...b, status: 'declined' } : b)) })),
  addOffer: (offer) => set((s) => ({ offers: [...s.offers, offer] })),
}));
