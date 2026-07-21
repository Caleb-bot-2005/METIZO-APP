import { create } from 'zustand';
import { CartItem, Material, Order } from '@/types/marketplace';

interface MarketplaceState {
  cart: CartItem[];
  orders: Order[];
  addToCart: (material: Material) => void;
  removeFromCart: (materialId: string) => void;
  updateQuantity: (materialId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (order: Order) => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  cart: [],
  orders: [],
  addToCart: (material) =>
    set((s) => {
      const existing = s.cart.find((c) => c.material.id === material.id);
      if (existing) {
        return {
          cart: s.cart.map((c) =>
            c.material.id === material.id ? { ...c, quantity: c.quantity + 1 } : c
          ),
        };
      }
      return { cart: [...s.cart, { material, quantity: 1 }] };
    }),
  removeFromCart: (materialId) => set((s) => ({ cart: s.cart.filter((c) => c.material.id !== materialId) })),
  updateQuantity: (materialId, quantity) =>
    set((s) => ({
      cart: s.cart.map((c) => (c.material.id === materialId ? { ...c, quantity } : c)),
    })),
  clearCart: () => set({ cart: [] }),
  placeOrder: (order) => set((s) => ({ orders: [order, ...s.orders], cart: [] })),
}));
