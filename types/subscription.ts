export type PlanId = 'free' | 'home_plus' | 'home_pro' | 'business';
export type BillingCycle = 'monthly' | 'yearly';

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
  customPricing?: boolean;
}
