export type PaymentMethodType = 'card' | 'mobile_money' | 'bank' | 'wallet';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  detail: string;
  isDefault?: boolean;
}

export type EscrowStatus = 'pending' | 'secured' | 'released' | 'refunded';

export interface EscrowPayment {
  id: string;
  jobId: string;
  amount: number;
  serviceFee: number;
  total: number;
  status: EscrowStatus;
  methodId: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  jobId: string;
  artisanName: string;
  amount: number;
  date: string;
  status: 'paid' | 'refunded';
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  label: string;
  amount: number;
  date: string;
}

// Backend DTO from EscrowDtos.Response — the real escrow ledger entry created
// automatically when a bid is accepted. paidAt is null until Paystack confirms
// the customer actually paid it (status HELD just means "assigned & locked in").
export interface EscrowRecord {
  id: number;
  serviceRequestId: number;
  customerId: number;
  artisanId: number;
  amount: number;
  commission: number | null;
  artisanPayout: number | null;
  status: 'HELD' | 'RELEASED' | 'REFUNDED';
  createdAt: string;
  settledAt: string | null;
  paidAt: string | null;
}

export type PaystackPurpose = 'ESCROW' | 'WALLET_TOPUP' | 'MARKETPLACE_ORDER';

export interface PaystackInitResult {
  authorizationUrl: string;
  reference: string;
}

export interface PaystackVerifyResult {
  success: boolean;
  purpose: PaystackPurpose;
  requestId: number | null;
  amount: number;
}
