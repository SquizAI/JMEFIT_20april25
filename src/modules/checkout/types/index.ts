// Define types for Stripe products and prices
export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'month' | 'year';
  };
  product: string;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  default_price?: string;
  metadata: Record<string, string>;
  active: boolean;
}

export interface CheckoutItem {
  price: string; // Stripe price ID
  quantity: number;
}

export type BillingInterval = 'month' | 'year' | 'one-time';
