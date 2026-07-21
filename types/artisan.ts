export interface Artisan {
  id: string;
  name: string;
  avatarUrl: string;
  coverUrl: string;
  profession: string;
  trustScore: number;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  yearsExperience: number;
  distanceKm: number;
  etaMinutes: number;
  verified: boolean;
  badges: string[];
  responseRate: number;
  languages: string[];
  skills: string[];
  bio: string;
  portfolio: PortfolioItem[];
  isOnline: boolean;
}

export interface PortfolioItem {
  id: string;
  beforeUrl: string;
  afterUrl: string;
  caption: string;
}

// A single showcase photo an artisan uploads to their public profile
// (distinct from PortfolioItem's before/after job-comparison shots).
export interface PortfolioPhoto {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  artisanId: string;
  customerName: string;
  customerAvatarUrl: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  recommend: boolean;
}

export interface TrustScoreHistory {
  month: string;
  score: number;
}
