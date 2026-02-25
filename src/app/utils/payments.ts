/**
 * Payment processing utilities for Connecta Store
 * Handles integration with payment providers
 */

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'crypto';
  label: string;
  icon: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  itemId: string;
  itemName: string;
  createdAt: Date;
}

export interface PurchasedItem {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  price: number;
  currency: string;
  purchasedAt: Date;
  expiresAt?: Date; // for subscriptions
  active: boolean;
}

/**
 * Available payment methods
 */
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', type: 'card', label: 'Credit/Debit Card', icon: '💳' },
  { id: 'paypal', type: 'paypal', label: 'PayPal', icon: '🅿️' },
  { id: 'crypto', type: 'crypto', label: 'Cryptocurrency', icon: '₿' },
];

/**
 * Create a payment intent (mock implementation)
 * In production, this would call your backend API which integrates with Stripe/PayPal
 */
export async function createPaymentIntent(
  itemId: string,
  itemName: string,
  amount: number,
  currency: string,
  _paymentMethod: string
): Promise<PaymentIntent> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  const intent: PaymentIntent = {
    id: `pi_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    amount,
    currency,
    status: 'pending',
    itemId,
    itemName,
    createdAt: new Date()
  };

  return intent;
}

/**
 * Process payment (mock implementation)
 * In production, this would confirm payment with the provider
 */
export async function processPayment(
  _paymentIntentId: string,
  _paymentMethod: string
): Promise<{ success: boolean; error?: string }> {
  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock success (90% success rate for testing)
  const success = Math.random() > 0.1;

  if (success) {
    return { success: true };
  } else {
    return { 
      success: false, 
      error: 'Payment declined. Please try another payment method.' 
    };
  }
}

/**
 * Get user's purchased items from localStorage
 */
export function getPurchasedItems(): PurchasedItem[] {
  const stored = localStorage.getItem('connecta_purchased_items');
  if (!stored) return [];
  
  return JSON.parse(stored).map((item: any) => ({
    ...item,
    purchasedAt: new Date(item.purchasedAt),
    expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined
  }));
}

/**
 * Add purchased item to user's inventory
 */
export function addPurchasedItem(item: Omit<PurchasedItem, 'id' | 'purchasedAt'>): void {
  const items = getPurchasedItems();
  
  const newItem: PurchasedItem = {
    ...item,
    id: `purchase_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    purchasedAt: new Date(),
    active: true
  };

  // For subscriptions, set expiration date
  if (item.itemType === 'subscription') {
    const expiresAt = new Date();
    if (item.itemName.toLowerCase().includes('yearly')) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }
    newItem.expiresAt = expiresAt;
  }

  items.push(newItem);
  localStorage.setItem('connecta_purchased_items', JSON.stringify(items));
}

/**
 * Check if user owns a specific item
 */
export function hasItem(itemId: string): boolean {
  const items = getPurchasedItems();
  return items.some(item => 
    item.itemId === itemId && 
    item.active &&
    (!item.expiresAt || item.expiresAt > new Date())
  );
}

/**
 * Check if user has active premium subscription
 */
export function hasPremium(): boolean {
  const items = getPurchasedItems();
  return items.some(item => 
    item.itemType === 'subscription' && 
    item.active &&
    (!item.expiresAt || item.expiresAt > new Date())
  );
}

/**
 * Get active subscriptions
 */
export function getActiveSubscriptions(): PurchasedItem[] {
  const items = getPurchasedItems();
  return items.filter(item => 
    item.itemType === 'subscription' && 
    item.active &&
    (!item.expiresAt || item.expiresAt > new Date())
  );
}

/**
 * Cancel subscription
 */
export function cancelSubscription(itemId: string): void {
  const items = getPurchasedItems();
  const updated = items.map(item => {
    if (item.itemId === itemId && item.itemType === 'subscription') {
      return { ...item, active: false };
    }
    return item;
  });
  localStorage.setItem('connecta_purchased_items', JSON.stringify(updated));
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Calculate discounted price
 */
export function calculateDiscount(price: number, discountPercent: number): number {
  return Math.floor(price * (1 - discountPercent / 100));
}

/**
 * Stripe integration (for production)
 * You would need to install @stripe/stripe-js and setup your publishable key
 */
export async function initializeStripe() {
  // const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  // return stripe;
  console.log('Stripe integration not yet configured');
  return null;
}

/**
 * Create Stripe checkout session (for production)
 */
export async function createStripeCheckoutSession(
  _itemId: string,
  _priceId: string,
  _successUrl: string,
  _cancelUrl: string
) {
  // In production, call your backend API:
  // const response = await fetch('/api/create-checkout-session', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ itemId, priceId, successUrl, cancelUrl })
  // });
  // return response.json();
  
  console.log('Stripe checkout not yet configured');
  return { url: '#' };
}
