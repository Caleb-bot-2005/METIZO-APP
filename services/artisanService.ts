import { apiClient } from './api/client';
import { mockDelay } from './mockDelay';
import { env } from '@/config/env';
import { mockArtisans, mockReviews, mockTrustHistory } from '@/constants/mockData';
import { Artisan, Review, TrustScoreHistory } from '@/types/artisan';

// Backend DTO from ArtisanDtos.Response.
interface BackendArtisan {
  profileId: number;
  userId: number;
  fullName: string;
  category: string | null;
  bio: string | null;
  location: string | null;
  available: boolean;
  verified: boolean;
  jobsCompleted: number;
  ratingCount: number;
  averageRating: number;
  trustScore: number;
}

interface BackendReview {
  id: number;
  serviceRequestId: number;
  artisanId: number;
  customerId: number;
  customerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

// Several fields the frontend's Artisan card/profile UI expects (distance, ETA,
// portfolio, languages, badges, response rate) simply aren't tracked by the
// backend yet — filled with harmless defaults rather than fabricated data.
// `verified` is real (an admin-set identity/business check), not derived from
// trust score — trust score is performance-based and starts at 0 for everyone,
// so deriving "verified" from it meant no artisan could ever be verified on day one.
function toArtisan(a: BackendArtisan): Artisan {
  return {
    id: String(a.userId),
    name: a.fullName,
    avatarUrl: `https://i.pravatar.cc/150?u=${a.userId}`,
    coverUrl: '',
    profession: a.category ?? '',
    trustScore: a.trustScore,
    rating: a.averageRating,
    reviewCount: a.ratingCount,
    completedJobs: a.jobsCompleted,
    yearsExperience: 0,
    distanceKm: 0,
    etaMinutes: 0,
    verified: a.verified,
    badges: [],
    responseRate: 0,
    languages: [],
    skills: a.category ? [a.category] : [],
    bio: a.bio ?? '',
    portfolio: [],
    isOnline: a.available,
  };
}

function toReview(r: BackendReview): Review {
  return {
    id: String(r.id),
    artisanId: String(r.artisanId),
    customerName: r.customerName,
    customerAvatarUrl: `https://i.pravatar.cc/150?u=customer-${r.customerId}`,
    rating: r.rating,
    comment: r.comment ?? '',
    createdAt: r.createdAt,
    recommend: r.rating >= 4,
  };
}

export const artisanService = {
  async list(): Promise<Artisan[]> {
    if (env.useMockData) return mockDelay(mockArtisans);
    const { data } = await apiClient.get<BackendArtisan[]>('/artisans');
    return data.map(toArtisan);
  },

  async getById(id: string): Promise<Artisan | undefined> {
    if (env.useMockData) return mockDelay(mockArtisans.find((a) => a.id === id));
    const { data } = await apiClient.get<BackendArtisan>(`/artisans/${id}`);
    return toArtisan(data);
  },

  async getReviews(artisanId: string): Promise<Review[]> {
    if (env.useMockData) return mockDelay(mockReviews.filter((r) => r.artisanId === artisanId));
    const { data } = await apiClient.get<BackendReview[]>(`/artisans/${artisanId}/reviews`);
    return data.map(toReview);
  },

  // No trust-score-history endpoint on the backend yet — stays mock-only.
  async getTrustHistory(_artisanId: string): Promise<TrustScoreHistory[]> {
    return mockDelay(mockTrustHistory);
  },

  // Artisan-side: edit own profile (bio, category, location, availability).
  async updateMyProfile(input: { category?: string; bio?: string; location?: string; available?: boolean }): Promise<Artisan> {
    if (env.useMockData) return mockDelay({ ...mockArtisans[0], ...input, isOnline: input.available ?? true } as Artisan, 700);
    const { data } = await apiClient.put<BackendArtisan>('/artisans/me', input);
    return toArtisan(data);
  },
};
