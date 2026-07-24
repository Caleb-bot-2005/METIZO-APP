import { apiClient } from './api/client';
import { mockDelay } from './mockDelay';
import { env } from '@/config/env';
import { getActiveApiOrigin } from '@/store/apiConfigStore';
import { JobWorkPhoto } from '@/types/job';

// Backend DTO from WorkPhotoDtos.Response.
interface BackendWorkPhoto {
  id: number;
  serviceRequestId: number;
  uploadedById: number;
  type: 'BEFORE' | 'AFTER';
  originalFilename: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
}

function toWorkPhoto(p: BackendWorkPhoto): JobWorkPhoto {
  return {
    id: String(p.id),
    url: `${getActiveApiOrigin()}${p.url}`,
    type: p.type === 'AFTER' ? 'after' : 'before',
    createdAt: p.createdAt,
  };
}

// In-memory only (resets on reload) — mirrors portfolioService's mock approach
// so upload/list behave consistently within a mock session.
const mockPhotosByRequest: Record<string, JobWorkPhoto[]> = {};

export const workPhotoService = {
  async list(requestId: string): Promise<JobWorkPhoto[]> {
    if (env.useMockData) return mockDelay(mockPhotosByRequest[requestId] ?? []);
    const { data } = await apiClient.get<BackendWorkPhoto[]>(`/requests/${requestId}/photos`);
    return data.map(toWorkPhoto);
  },

  async upload(requestId: string, type: 'before' | 'after', uri: string): Promise<JobWorkPhoto> {
    if (env.useMockData) {
      const photo: JobWorkPhoto = { id: `local-${Date.now()}`, url: uri, type, createdAt: new Date().toISOString() };
      mockPhotosByRequest[requestId] = [...(mockPhotosByRequest[requestId] ?? []), photo];
      return mockDelay(photo, 700);
    }
    const form = new FormData();
    // Spring's @RequestParam("type") reads from multipart form fields exactly
    // like this — see WorkPhotoController.upload / the backend README example.
    form.append('type', type === 'after' ? 'AFTER' : 'BEFORE');
    form.append('file', {
      uri,
      name: `${type}-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);

    const { data } = await apiClient.post<BackendWorkPhoto>(`/requests/${requestId}/photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toWorkPhoto(data);
  },
};
