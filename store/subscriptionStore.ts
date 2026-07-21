import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandAsyncStorage } from '@/utils/storage';
import { BillingCycle, PlanId } from '@/types/subscription';

interface SubscriptionState {
  currentPlanId: PlanId;
  billingCycle: BillingCycle;
  setPlan: (planId: PlanId) => void;
  setBillingCycle: (cycle: BillingCycle) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      currentPlanId: 'free',
      billingCycle: 'monthly',
      setPlan: (planId) => set({ currentPlanId: planId }),
      setBillingCycle: (cycle) => set({ billingCycle: cycle }),
    }),
    { name: 'metizo-subscription', storage: createJSONStorage(() => zustandAsyncStorage) }
  )
);
