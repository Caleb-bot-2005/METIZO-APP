export type DispatchStatus = 'SEARCHING' | 'ASSIGNED' | 'FAILED' | 'CANCELLED';

// Backend DTO from EmergencyDispatchDtos.StatusResponse.
export interface EmergencyDispatchStatus {
  requestId: number;
  category: string;
  title: string;
  description: string;
  status: DispatchStatus;
  round: number;
  maxRounds: number;
  roundDeadlineEpochMs: number;
  estimatedAmount: number;
  currency: string;
  assignedArtisanId: number | null;
  assignedArtisanName: string | null;
  assignedArtisanRating: number | null;
  assignedArtisanTrustScore: number | null;
  distanceKm: number | null;
}

// Backend DTO from EmergencyDispatchDtos.OfferResponse.
export interface EmergencyOffer {
  offerId: number;
  requestId: number;
  category: string;
  title: string;
  description: string;
  location: string;
  estimatedAmount: number;
  currency: string;
  distanceKm: number | null;
  roundDeadlineEpochMs: number;
  status: string;
}

export interface CreateEmergencyRequest {
  category: string;
  problemType: string;
  note?: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

export interface EmergencyProblemType {
  id: string;
  label: string;
}
