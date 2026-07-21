import { Artisan } from './artisan';

export type BidStatus = 'pending' | 'accepted' | 'declined' | 'negotiating' | 'expired';

export interface Bid {
  id: string;
  jobId: string;
  artisan: Artisan;
  price: number;
  estimatedDurationMinutes: number;
  message?: string;
  status: BidStatus;
  createdAt: string;
}

export type SortOption = 'lowest_price' | 'highest_trust' | 'fastest_arrival' | 'best_value';

export interface NegotiationOffer {
  id: string;
  bidId: string;
  sender: 'customer' | 'artisan';
  price: number;
  message?: string;
  createdAt: string;
}
