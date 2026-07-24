import {
  EscrowPayment,
  Invoice,
  PaymentMethod,
  WalletTransaction,
} from "@/types/payment";
import { create } from "zustand";

interface PaymentState {
  methods: PaymentMethod[];
  selectedMethodId: string | null;
  escrows: EscrowPayment[];
  invoices: Invoice[];
  // The wallet *balance* is real, server-side money now (see useWalletBalance /
  // walletService) — this transaction list is just a local activity log for
  // display, same "no backend model for history yet" simplification as
  // invoices/escrows below.
  transactions: WalletTransaction[];
  selectMethod: (id: string) => void;
  addEscrow: (escrow: EscrowPayment) => void;
  releaseEscrow: (id: string) => void;
  recordTransaction: (tx: Omit<WalletTransaction, "id" | "date">) => void;
}

// A brand-new real account has none of this yet — no linked payment methods,
// no transaction or invoice history. Everything here starts empty and only
// fills in as the account actually does things.
export const usePaymentStore = create<PaymentState>((set) => ({
  methods: [],
  selectedMethodId: null,
  escrows: [],
  invoices: [],
  transactions: [],
  selectMethod: (id) => set({ selectedMethodId: id }),
  addEscrow: (escrow) => set((s) => ({ escrows: [...s.escrows, escrow] })),
  releaseEscrow: (id) =>
    set((s) => ({
      escrows: s.escrows.map((e) =>
        e.id === id ? { ...e, status: "released" } : e,
      ),
    })),
  recordTransaction: (tx) =>
    set((s) => ({
      transactions: [
        { ...tx, id: `t-${Date.now()}`, date: new Date().toISOString().slice(0, 10) },
        ...s.transactions,
      ],
    })),
}));
