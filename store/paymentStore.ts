import { create } from 'zustand';
import { EscrowPayment, Invoice, PaymentMethod, WalletTransaction } from '@/types/payment';

interface PaymentState {
  methods: PaymentMethod[];
  selectedMethodId: string | null;
  escrows: EscrowPayment[];
  invoices: Invoice[];
  walletBalance: number;
  transactions: WalletTransaction[];
  selectMethod: (id: string) => void;
  addEscrow: (escrow: EscrowPayment) => void;
  releaseEscrow: (id: string) => void;
  topUpWallet: (amount: number) => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  methods: [
    { id: 'pm1', type: 'mobile_money', label: 'MTN Mobile Money', detail: '024•••4521', isDefault: true },
    { id: 'pm2', type: 'card', label: 'Visa Card', detail: '•••• 4242' },
    { id: 'pm3', type: 'bank', label: 'GCB Bank', detail: '•••• 8890' },
    { id: 'pm4', type: 'wallet', label: 'METIZO Wallet', detail: 'GH₵450 available' },
  ],
  selectedMethodId: 'pm1',
  escrows: [],
  invoices: [
    { id: 'inv1', jobId: 'job-old-1', artisanName: 'Ama Boateng', amount: 320, date: '2026-06-20', status: 'paid' },
  ],
  walletBalance: 450,
  transactions: [
    { id: 't1', type: 'credit', label: 'Wallet top-up', amount: 200, date: '2026-07-01' },
    { id: 't2', type: 'debit', label: 'Job payment - Ama Boateng', amount: 320, date: '2026-06-20' },
  ],
  selectMethod: (id) => set({ selectedMethodId: id }),
  addEscrow: (escrow) => set((s) => ({ escrows: [...s.escrows, escrow] })),
  releaseEscrow: (id) =>
    set((s) => ({ escrows: s.escrows.map((e) => (e.id === id ? { ...e, status: 'released' } : e)) })),
  topUpWallet: (amount) =>
    set((s) => ({
      walletBalance: s.walletBalance + amount,
      transactions: [
        { id: `t-${Date.now()}`, type: 'credit', label: 'Wallet top-up', amount, date: new Date().toISOString().slice(0, 10) },
        ...s.transactions,
      ],
    })),
}));
