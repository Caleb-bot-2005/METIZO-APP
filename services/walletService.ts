import { apiClient } from './api/client';

export type WalletPayPurpose = 'ESCROW' | 'SUBSCRIPTION' | 'MARKETPLACE_ORDER';

interface PayInput {
  purpose: WalletPayPurpose;
  requestId?: string;
  amount?: number;
}

export const walletService = {
  async getBalance(): Promise<number> {
    const { data } = await apiClient.get<{ balance: number }>('/wallet');
    return data.balance;
  },

  async pay(input: PayInput): Promise<{ amountPaid: number; newBalance: number }> {
    const { data } = await apiClient.post<{ amountPaid: number; newBalance: number }>('/wallet/pay', {
      purpose: input.purpose,
      requestId: input.requestId ? Number(input.requestId) : undefined,
      amount: input.amount,
    });
    return data;
  },
};
