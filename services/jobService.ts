import { apiClient } from './api/client';
import { mockDelay } from './mockDelay';
import { env } from '@/config/env';
import { mockJob } from '@/constants/mockData';
import { serviceCategories } from '@/constants/categories';
import { Job, JobStatus } from '@/types/job';

// Backend DTO from ServiceRequestDtos.Response.
interface BackendRequest {
  id: number;
  customerId: number;
  customerName: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number | null;
  emergency: boolean;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedArtisanId: number | null;
  agreedAmount: number | null;
  createdAt: string;
}

const statusMap: Record<BackendRequest['status'], JobStatus> = {
  OPEN: 'bidding',
  ASSIGNED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

function toJob(r: BackendRequest): Job {
  const category = serviceCategories.find((c) => c.id === r.category);
  const amount = r.agreedAmount ?? r.budget ?? 0;
  return {
    id: String(r.id),
    categoryId: r.category,
    categoryName: category?.name ?? r.category,
    description: r.description ?? '',
    photos: [],
    // The backend only stores a free-text location, not coordinates yet.
    latitude: 0,
    longitude: 0,
    address: r.location ?? '',
    budgetMin: amount,
    budgetMax: amount,
    aiEstimatedPrice: amount,
    timing: 'today',
    status: statusMap[r.status],
    createdAt: r.createdAt,
  };
}

export const jobService = {
  async create(job: Partial<Job>): Promise<Job> {
    if (env.useMockData) {
      return mockDelay({ ...mockJob, ...job, id: `job-${Date.now()}`, createdAt: new Date().toISOString() }, 1100);
    }
    const { data } = await apiClient.post<BackendRequest>('/requests', {
      title: job.categoryName ? `${job.categoryName} service` : 'Service request',
      description: job.description,
      category: job.categoryId,
      location: job.address,
      budget: job.aiEstimatedPrice ?? job.budgetMax ?? job.budgetMin ?? null,
      emergency: false,
    });
    return toJob(data);
  },

  async getEstimate(description: string, categoryId: string): Promise<{ price: number; min: number; max: number; complexity: 'Simple' | 'Moderate' | 'Complex'; durationLabel: string }> {
    if (env.useMockData) {
      const base = 150 + description.length * 2 + categoryId.length * 5;
      const price = Math.round(base / 10) * 10;
      return mockDelay(
        {
          price,
          min: Math.round(price * 0.8),
          max: Math.round(price * 1.3),
          complexity: price > 350 ? 'Complex' : price > 200 ? 'Moderate' : 'Simple',
          durationLabel: price > 350 ? '3-5 hrs' : price > 200 ? '1-2 hrs' : '30-60 min',
        },
        1200
      );
    }
    const { data } = await apiClient.post('/pricing/estimate', { category: categoryId, description, emergency: false });
    const price = Math.round(data.estimatedCost);
    return {
      price,
      min: Math.round(data.lowEstimate),
      max: Math.round(data.highEstimate),
      complexity: price > 350 ? 'Complex' : price > 200 ? 'Moderate' : 'Simple',
      durationLabel: data.estimatedTime,
    };
  },

  // The customer's own requests (backend also has GET /requests, the open feed artisans browse).
  async list(): Promise<Job[]> {
    if (env.useMockData) return mockDelay([mockJob]);
    const { data } = await apiClient.get<BackendRequest[]>('/requests/mine');
    return data.map(toJob);
  },

  async get(id: string): Promise<Job | undefined> {
    if (env.useMockData) return mockDelay(mockJob.id === id ? mockJob : undefined);
    const { data } = await apiClient.get<BackendRequest>(`/requests/${id}`);
    return toJob(data);
  },

  // Artisan-side: the open marketplace feed (jobs anyone can still bid on).
  async listOpenFeed(category?: string): Promise<Job[]> {
    if (env.useMockData) return mockDelay([mockJob]);
    const { data } = await apiClient.get<BackendRequest[]>('/requests', { params: category ? { category } : undefined });
    return data.map(toJob);
  },

  // Artisan marks an assigned job as started.
  async markInProgress(id: string): Promise<Job> {
    if (env.useMockData) return mockDelay({ ...mockJob, id, status: 'in_progress' }, 600);
    const { data } = await apiClient.post<BackendRequest>(`/requests/${id}/start`);
    return toJob(data);
  },
};
