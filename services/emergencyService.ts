import { apiClient } from './api/client';
import { CreateEmergencyRequest, EmergencyDispatchStatus, EmergencyOffer } from '@/types/emergency';

// Ride-hailing-style dispatch — deliberately not mock-backed like other
// services here. There's no meaningful way to simulate real-time multi-party
// matching (customer + several artisans racing to accept) with static mock
// data, so this always talks to the real backend.
export interface EmergencyEstimate {
  estimatedCost: number;
  lowEstimate: number;
  highEstimate: number;
  currency: string;
}

export const emergencyService = {
  async create(input: CreateEmergencyRequest): Promise<EmergencyDispatchStatus> {
    const { data } = await apiClient.post<EmergencyDispatchStatus>('/emergency/dispatch', input);
    return data;
  },

  // Live preview only — the real, authoritative estimate (with the emergency
  // surcharge) is computed again server-side at create() time.
  async getEstimate(category: string, problemType: string): Promise<EmergencyEstimate> {
    const { data } = await apiClient.post<EmergencyEstimate>('/pricing/estimate', {
      category,
      description: problemType,
      emergency: true,
    });
    return data;
  },

  async getStatus(requestId: string): Promise<EmergencyDispatchStatus> {
    const { data } = await apiClient.get<EmergencyDispatchStatus>(`/emergency/dispatch/${requestId}`);
    return data;
  },

  async cancel(requestId: string): Promise<EmergencyDispatchStatus> {
    const { data } = await apiClient.post<EmergencyDispatchStatus>(`/emergency/dispatch/${requestId}/cancel`);
    return data;
  },

  async rematch(requestId: string): Promise<EmergencyDispatchStatus> {
    const { data } = await apiClient.post<EmergencyDispatchStatus>(`/emergency/dispatch/${requestId}/rematch`);
    return data;
  },

  // Artisan-side.
  async myOffers(): Promise<EmergencyOffer[]> {
    const { data } = await apiClient.get<EmergencyOffer[]>('/emergency/offers/mine');
    return data;
  },

  async acceptOffer(offerId: string): Promise<EmergencyOffer> {
    const { data } = await apiClient.post<EmergencyOffer>(`/emergency/offers/${offerId}/accept`);
    return data;
  },

  async declineOffer(offerId: string): Promise<void> {
    await apiClient.post(`/emergency/offers/${offerId}/decline`);
  },
};
