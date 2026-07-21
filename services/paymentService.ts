import { mockDelay } from './mockDelay';
import { EscrowPayment } from '@/types/payment';

// The backend has no standalone "create escrow" or "release escrow" endpoints —
// escrow is created automatically when a bid is accepted (POST /bids/{id}/accept)
// and released automatically when the customer confirms completion
// (POST /requests/{id}/confirm). There's only a read-only GET /requests/{id}/escrow
// to view the ledger entry. This screen's "choose a method and pay" flow doesn't
// map onto that, so it stays mock-only until that flow is redesigned around the
// real bid-accept step. Wallet/payment-method data (in paymentStore) is also mock —
// the backend doesn't model wallets or payment methods at all yet.
export const paymentService = {
  async createEscrow(jobId: string, amount: number, methodId: string): Promise<EscrowPayment> {
    const serviceFee = Math.round(amount * 0.05);
    return mockDelay(
      {
        id: `escrow-${Date.now()}`,
        jobId,
        amount,
        serviceFee,
        total: amount + serviceFee,
        status: 'secured',
        methodId,
        createdAt: new Date().toISOString(),
      },
      1500
    );
  },

  async release(escrowId: string): Promise<{ success: boolean }> {
    return mockDelay({ success: true }, 900);
  },
};
