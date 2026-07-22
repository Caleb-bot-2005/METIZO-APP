import { apiClient } from './api/client';
import { mockDelay } from './mockDelay';
import { env } from '@/config/env';
import { EscrowRecord, PaystackInitResult, PaystackPurpose, PaystackVerifyResult } from '@/types/payment';

type InitializeInput = { purpose: 'ESCROW'; requestId: string } | { purpose: 'WALLET_TOPUP'; amount: number };

// Escrow is created automatically server-side when a bid is accepted (see
// authService's note on the real accept-bid flow) — this screen only reads
// that ledger entry and then collects real payment for it via Paystack.
// Wallet top-ups have no backend model at all; verifying the Paystack charge
// is enough proof to credit the local wallet balance client-side.
export const paymentService = {
  async getEscrow(requestId: string): Promise<EscrowRecord | null> {
    if (env.useMockData) {
      return mockDelay({
        id: 1,
        serviceRequestId: Number(requestId) || 0,
        customerId: 0,
        artisanId: 0,
        amount: 280,
        commission: null,
        artisanPayout: null,
        status: 'HELD',
        createdAt: new Date().toISOString(),
        settledAt: null,
        paidAt: null,
      });
    }
    try {
      const { data } = await apiClient.get<EscrowRecord>(`/requests/${requestId}/escrow`);
      return data;
    } catch {
      return null;
    }
  },

  async initializePaystack(input: InitializeInput): Promise<PaystackInitResult> {
    if (env.useMockData) {
      return mockDelay({ authorizationUrl: '', reference: `mock-${Date.now()}` }, 500);
    }
    const body =
      input.purpose === 'ESCROW'
        ? { purpose: 'ESCROW' as PaystackPurpose, requestId: Number(input.requestId) }
        : { purpose: 'WALLET_TOPUP' as PaystackPurpose, amount: input.amount };
    const { data } = await apiClient.post<PaystackInitResult>('/payments/paystack/initialize', body);
    return data;
  },

  async verifyPaystack(reference: string): Promise<PaystackVerifyResult> {
    if (env.useMockData) {
      return mockDelay({ success: true, purpose: 'ESCROW', requestId: null, amount: 0 });
    }
    const { data } = await apiClient.post<PaystackVerifyResult>('/payments/paystack/verify', { reference });
    return data;
  },
};
