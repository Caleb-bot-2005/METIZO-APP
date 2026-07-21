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
