import { apiClient } from './api/client';
import { mockDelay } from './mockDelay';
import { env } from '@/config/env';
import { mockBids } from '@/constants/mockData';
import { Bid } from '@/types/bidding';
import { Artisan } from '@/types/artisan';

// Backend DTO from BidDtos.Response — much leaner than the frontend's Bid, which
// expects a full nested Artisan. Fields the backend doesn't track (ETA, distance,
// portfolio, etc.) are filled with harmless defaults below.
interface BackendBid {
  id: number;
  serviceRequestId: number;
  artisanId: number;
  artisanName: string;
  artisanTrustScore: number;
  amount: number;
  estimatedTime: string | null;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
}

const statusMap: Record<BackendBid['status'], Bid['status']> = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'declined',
  WITHDRAWN: 'expired',
};

function parseDurationMinutes(text: string | null): number {
  if (!text) return 60;
  const match = text.match(/(\d+)/);
  if (!match) return 60;
  const value = Number(match[1]);
  return /hr|hour/i.test(text) ? value * 60 : value;
}

// The backend only returns id/name/trustScore for the bidding artisan (not the full
// profile) — this stub fills in the rest of the frontend's Artisan shape so bid
// cards don't crash. Real distance/ETA/rating/portfolio aren't tracked server-side yet.
function toArtisanStub(id: number, name: string, trustScore: number): Artisan {
  return {
    id: String(id),
    name,
    avatarUrl: `https://i.pravatar.cc/150?u=${id}`,
    coverUrl: '',
    profession: '',
    trustScore,
    rating: Math.min(5, trustScore / 20),
    reviewCount: 0,
    completedJobs: 0,
    yearsExperience: 0,
    distanceKm: 0,
    etaMinutes: 0,
    // The bid response doesn't include the artisan's real (admin-set) verified
    // flag, and trust score isn't a substitute for identity verification — so
    // this honestly defaults to false rather than guessing from the score.
    verified: false,
    badges: [],
    responseRate: 0,
    languages: [],
    skills: [],
    bio: '',
    portfolio: [],
    isOnline: true,
  };
}

function toBid(b: BackendBid): Bid {
  return {
    id: String(b.id),
    jobId: String(b.serviceRequestId),
    artisan: toArtisanStub(b.artisanId, b.artisanName, b.artisanTrustScore),
    price: b.amount,
    estimatedDurationMinutes: parseDurationMinutes(b.estimatedTime),
    message: b.message ?? undefined,
    status: statusMap[b.status],
    createdAt: b.createdAt,
  };
}

export const biddingService = {
  async listForJob(jobId: string): Promise<Bid[]> {
    if (env.useMockData) return mockDelay(mockBids.map((b) => ({ ...b, jobId })));
    const { data } = await apiClient.get<BackendBid[]>(`/requests/${jobId}/bids`);
    return data.map(toBid);
  },

  // agreedAmount lets a customer lock in a negotiated price instead of the bid's
  // original amount (see BidDtos.AcceptRequest on the backend).
  async accept(bidId: string, agreedAmount?: number): Promise<{ success: boolean }> {
    if (env.useMockData) return mockDelay({ success: true }, 800);
    await apiClient.post(`/bids/${bidId}/accept`, agreedAmount ? { agreedAmount } : {});
    return { success: true };
  },

  // Artisan-side: revise the amount on their own still-pending bid.
  async revise(bidId: string, amount: number): Promise<Bid> {
    if (env.useMockData) return mockDelay({ ...mockBids[0], id: bidId, price: amount, status: 'pending' }, 700);
    const { data } = await apiClient.put<BackendBid>(`/bids/${bidId}/revise`, { amount });
    return toBid(data);
  },

  // Artisan-side: bids the current artisan has placed, and placing a new one.
  async myBids(): Promise<Bid[]> {
    if (env.useMockData) return mockDelay(mockBids);
    const { data } = await apiClient.get<BackendBid[]>('/bids/mine');
    return data.map(toBid);
  },

  async placeBid(jobId: string, input: { amount: number; estimatedTime: string; message?: string }): Promise<Bid> {
    if (env.useMockData) {
      return mockDelay(
        { ...mockBids[0], jobId, price: input.amount, message: input.message, status: 'pending' },
        900
      );
    }
    const { data } = await apiClient.post<BackendBid>(`/requests/${jobId}/bids`, input);
    return toBid(data);
  },

  // No counter-offer/negotiation endpoint on the backend yet — stays mock-only.
  async counterOffer(bidId: string, price: number): Promise<{ success: boolean }> {
    return mockDelay({ success: true }, 700);
  },
};
