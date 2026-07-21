import { apiClient } from './api/client';
import { mockDelay } from './mockDelay';
import { env } from '@/config/env';
import { PortfolioPhoto } from '@/types/artisan';

// Backend DTO from PortfolioPhotoDtos.Response.
interface BackendPortfolioPhoto {
  id: number;
  artisanUserId: number;
  caption: string | null;
  url: string;
  createdAt: string;
}

function toPortfolioPhoto(p: BackendPortfolioPhoto): PortfolioPhoto {
  return {
    id: String(p.id),
    url: `${env.apiOrigin}${p.url}`,
    caption: p.caption ?? undefined,
    createdAt: p.createdAt,
  };
}

// In-memory only (resets on reload) — lets upload/list/delete behave consistently
// within a mock session instead of upload appearing to vanish on the next refetch.
let mockPortfolio: PortfolioPhoto[] = [];

export const portfolioService = {
  async list(userId: string): Promise<PortfolioPhoto[]> {
    if (env.useMockData) return mockDelay(mockPortfolio);
    const { data } = await apiClient.get<BackendPortfolioPhoto[]>(`/artisans/${userId}/portfolio`);
    return data.map(toPortfolioPhoto);
  },

  async upload(uri: string, caption?: string): Promise<PortfolioPhoto> {
    if (env.useMockData) {
      const photo: PortfolioPhoto = { id: `local-${Date.now()}`, url: uri, caption, createdAt: new Date().toISOString() };
      mockPortfolio = [photo, ...mockPortfolio];
      return mockDelay(photo, 700);
    }
    const form = new FormData();
    form.append('file', {
      uri,
      name: `portfolio-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
    if (caption) form.append('caption', caption);

    const { data } = await apiClient.post<BackendPortfolioPhoto>('/artisans/me/portfolio', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toPortfolioPhoto(data);
  },

  async remove(photoId: string): Promise<void> {
    if (env.useMockData) {
      mockPortfolio = mockPortfolio.filter((p) => p.id !== photoId);
      return mockDelay(undefined);
    }
    await apiClient.delete(`/artisans/me/portfolio/${photoId}`);
  },
};
