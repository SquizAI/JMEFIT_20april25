import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  description: string;
  billingInterval?: 'month' | 'year';
  yearlyDiscountApplied?: boolean;
  isGift?: boolean;
  stripe_price_id?: string; // Added for database-driven checkout
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    startDate?: Date;
  };
  giftRecipient?: {
    firstName: string;
    lastName: string;
    email: string;
    message?: string;
  };
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateItemInterval: (id: string, interval: 'month' | 'year') => void;
  toggleGiftStatus: (id: string, isGift: boolean) => void;
  updateGiftRecipient: (id: string, giftRecipient: CartItem['giftRecipient']) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  total: 0,
  addItem: (item) => set((state) => {
    // Set default billing interval to year if not specified
    // For subscription products, we assume the price is already the yearly price with discount applied
    let price = item.price;
    const billingInterval = item.billingInterval || 'year';
    
    // For yearly billing, we assume the price is already the yearly price with discount
    // No need to apply additional calculations here as we're passing the correct price from the component
    
    const newItem = {
      ...item,
      billingInterval,
      price,
      yearlyDiscountApplied: billingInterval === 'year' ? true : false
    };
    
    const newItems = [...state.items, newItem];
    return {
      items: newItems,
      total: newItems.reduce((sum, item) => sum + item.price, 0)
    };
  }),
  updateItemInterval: (id, interval) => set((state) => {
    const newItems = state.items.map(item => {
      if (item.id === id) {
        let newPrice = item.price;
        
        // If switching from monthly to yearly
        if (item.billingInterval === 'month' && interval === 'year') {
          // Apply 20% discount for yearly
          newPrice = parseFloat((item.price * 12 * 0.8).toFixed(2)); // Ensure 2 decimal places
          return {
            ...item,
            billingInterval: interval,
            price: newPrice,
            yearlyDiscountApplied: true
          };
        }
        // If switching from yearly to monthly
        else if (item.billingInterval === 'year' && interval === 'month') {
          // Convert back to monthly price
          newPrice = parseFloat(((item.price / 0.8) / 12).toFixed(2)); // Ensure 2 decimal places
          return {
            ...item,
            billingInterval: interval,
            price: newPrice,
            yearlyDiscountApplied: false
          };
        }

        return {
          ...item,
          billingInterval: interval,
          price: newPrice
        };
      }
      return item;
    });
    return {
      items: newItems,
      total: newItems.reduce((sum, item) => sum + item.price, 0)
    };
  }),
  removeItem: (id) => set((state) => {
    const newItems = state.items.filter(item => item.id !== id);
    return {
      items: newItems,
      total: newItems.reduce((sum, item) => sum + item.price, 0)
    };
  }),
  clearCart: () => set({ items: [], total: 0 }),
  
  toggleGiftStatus: (id, isGift) => set((state) => {
    const newItems = state.items.map(item => {
      if (item.id === id) {
        return { ...item, isGift };
      }
      return item;
    });
    
    return {
      items: newItems,
      total: newItems.reduce((sum, item) => sum + item.price, 0)
    };
  }),
  
  updateGiftRecipient: (id, giftRecipient) => set((state) => {
    const newItems = state.items.map(item => {
      if (item.id === id) {
        return { ...item, giftRecipient, isGift: true };
      }
      return item;
    });
    
    return {
      items: newItems,
      total: newItems.reduce((sum, item) => sum + item.price, 0)
    };
  }),
}));