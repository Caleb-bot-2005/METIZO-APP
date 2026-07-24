import { apiClient } from './api/client';

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

export const reviewService = {
  async leaveReview(requestId: string, rating: number, comment: string): Promise<void> {
    await apiClient.post<BackendReview>(`/requests/${requestId}/review`, {
      rating,
      comment: comment.trim() || null,
    });
  },
};
