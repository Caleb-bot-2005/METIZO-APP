export type JobStatus =
  | 'draft'
  | 'bidding'
  | 'accepted'
  | 'traveling'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type JobTiming = 'today' | 'tomorrow' | 'scheduled';

export interface JobPhoto {
  id: string;
  uri: string;
}

// Proof-of-work photos the artisan attaches to a specific job (backend
// WorkPhoto) — distinct from JobPhoto above, which is the customer's own
// photos of the problem attached when creating the request.
export interface JobWorkPhoto {
  id: string;
  url: string;
  type: 'before' | 'after';
  createdAt: string;
}

export type ProgressStage = 'started' | 'materials_purchased' | 'almost_done' | 'done';

export interface Job {
  id: string;
  categoryId: string;
  categoryName: string;
  description: string;
  photos: JobPhoto[];
  latitude: number;
  longitude: number;
  address: string;
  budgetMin: number;
  budgetMax: number;
  aiEstimatedPrice: number;
  timing: JobTiming;
  scheduledAt?: string;
  status: JobStatus;
  progressStage?: ProgressStage;
  assignedArtisanId?: string;
  emergency?: boolean;
  createdAt: string;
  acceptedBidId?: string;
}

export interface JobTimelineStep {
  key:
    | 'requested'
    | 'accepted'
    | 'traveling'
    | 'arrived'
    | 'started'
    | 'materials'
    | 'almost_done'
    | 'completed'
    | 'confirmed';
  label: string;
  timestamp?: string;
  done: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  emergencyAvailable?: boolean;
}
