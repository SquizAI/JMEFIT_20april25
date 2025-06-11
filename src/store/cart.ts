import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { STRIPE_PRODUCTS, getPriceAmount, getPriceId } from '../lib/stripe-products';

interface CartItem {
  id: string;
  name: string;
  price: number;
  description: string;
  billingInterval?: 'month' | 'year' | 'one-time';
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
  updateItemInterval: (id: string, interval: 'month' | 'year' | 'one-time') => void;
  toggleGiftStatus: (id: string, isGift: boolean) => void;
  updateGiftRecipient: (id: string, giftRecipient: CartItem['giftRecipient']) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create(
  persist<CartStore>(
    (set, get) => ({
  items: [],
  total: 0,
  addItem: async (item) => {
    // Validate required item properties
    if (!item || !item.name) {
      console.error('Invalid item passed to addItem:', item);
      return;
    }
    
    // Set default billing interval based on product type
    let billingInterval = item.billingInterval || 'month';
    
    // Force one-time billing interval for one-time products
    if (item.name.includes('SHRED') || 
        item.name.includes('One-Time') || 
        item.name.includes('Macros Calculation')) {
      billingInterval = 'one-time';
    }
    
    try {
      // Check for duplicate items first
      const existingItemIndex = get().items.findIndex(existingItem => {
        // Normalize names for comparison
        const normalizeName = (name: string) => name.toLowerCase().replace(/\s+program\s*$/i, '').trim();
        const isSameProduct = normalizeName(existingItem.name) === normalizeName(item.name);
        const isSameBilling = existingItem.billingInterval === billingInterval;
        
        // Prevent exact duplicates (same product + same billing interval)
        return isSameProduct && isSameBilling;
      });
      
      if (existingItemIndex !== -1) {
        // Item already exists with same billing interval - don't add duplicate
        return;
      }
      
      // Map product names to STRIPE_PRODUCTS keys for consistent pricing
      const productNameMap: Record<string, keyof typeof STRIPE_PRODUCTS> = {
        "Nutrition Only Program": "NUTRITION_ONLY",
        "Nutrition Only": "NUTRITION_ONLY",
        "Nutrition Mastery Program": "NUTRITION_ONLY",
        "Nutrition & Training Program": "NUTRITION_TRAINING", 
        "Nutrition & Training": "NUTRITION_TRAINING",
        "Self-Led Training Program": "SELF_LED_TRAINING",
        "Self-Led Training": "SELF_LED_TRAINING",
        "Trainer Feedback Program": "TRAINER_FEEDBACK",
        "Trainer Feedback": "TRAINER_FEEDBACK",
        "One-Time Macros Calculation": "ONE_TIME_MACROS",
        "SHRED Challenge": "SHRED_CHALLENGE",
        "SHRED with JMEFit": "SHRED_CHALLENGE"
      };
      
      // Generate unique ID based on product name and billing interval
      const normalizedName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const uniqueId = `${normalizedName}-${billingInterval}`;
      
      // Create a new item with the correct billing interval
      const newItem = {
        ...item,
        id: uniqueId,
        billingInterval,
        yearlyDiscountApplied: billingInterval === 'year'
      };
      
      // Get the product key from the normalized name
      let productKey = productNameMap[item.name];
      let matchMethod = "exact match";
      
      // If not found by exact name, try matching with partial name
      if (!productKey) {
        matchMethod = "partial match";
        // Try to find by partial name match
        const itemNameLower = item.name.toLowerCase();
        if (itemNameLower.includes('nutrition only') || itemNameLower.includes('nutrition mastery')) {
          productKey = "NUTRITION_ONLY";
        } else if (itemNameLower.includes('nutrition & training') || itemNameLower.includes('nutrition and training')) {
          productKey = "NUTRITION_TRAINING";
        } else if (itemNameLower.includes('self-led') || itemNameLower.includes('self led')) {
          productKey = "SELF_LED_TRAINING";
        } else if (itemNameLower.includes('trainer feedback')) {
          productKey = "TRAINER_FEEDBACK";
        } else if (itemNameLower.includes('macros')) {
          productKey = "ONE_TIME_MACROS";
        } else if (itemNameLower.includes('shred')) {
          productKey = "SHRED_CHALLENGE";
        }
      }
      
      if (productKey) {
        // Use centralized pricing
        const intervalForPricing = billingInterval === 'one-time' ? undefined : billingInterval;
        const priceAmount = getPriceAmount(productKey, intervalForPricing);
        const priceId = getPriceId(productKey, intervalForPricing);
        
        newItem.price = priceAmount / 100; // Convert from cents to dollars
        newItem.stripe_price_id = priceId;
        console.log(`Using centralized pricing for ${item.name}: $${newItem.price} (${matchMethod} to ${productKey})`);
      } else {
        // Fallback to Supabase lookup if not in centralized config
        console.warn(`Product ${item.name} not found in centralized config, attempting Supabase lookup`);
        
        const { data: priceData, error } = await supabase
          .from('prices')
          .select('*, products(*)')
          .eq('active', true);
        
        if (error) throw error;
        
        // Find matching price in Supabase data with enhanced matching
        const matchingPrice = priceData.find(p => {
          const normalizeString = (str: string): string => {
            return str.toLowerCase()
              .replace(/\s+program\b/gi, '')
              .replace(/\b(nutrition|only|training|led|self|feedback|trainer|one-time|macros|shred)\b/gi, match => match.toLowerCase())
              .trim();
          };
          
          const normalizedProductName = normalizeString(p.products?.name || '');
          const normalizedItemName = normalizeString(item.name);
          
          const keyWordsMatch = (
            (p.products?.name?.toLowerCase().includes('nutrition only') && item.name.toLowerCase().includes('nutrition only')) ||
            (p.products?.name?.toLowerCase().includes('nutrition & training') && item.name.toLowerCase().includes('nutrition')) ||
            (p.products?.name?.toLowerCase().includes('self-led') && item.name.toLowerCase().includes('self-led')) ||
            (p.products?.name?.toLowerCase().includes('trainer feedback') && item.name.toLowerCase().includes('trainer feedback')) ||
            (p.products?.name?.toLowerCase().includes('macros') && item.name.toLowerCase().includes('macros')) ||
            (p.products?.name?.toLowerCase().includes('shred') && item.name.toLowerCase().includes('shred'))
          );
          
          const fallbackPartialMatch = (
            normalizedProductName.includes(normalizedItemName) ||
            normalizedItemName.includes(normalizedProductName)
          );
          
          const isOneTimeProduct = (
            item.name.toLowerCase().includes('one-time') || 
            item.name.toLowerCase().includes('shred')
          );
          
          const isIntervalMatch = isOneTimeProduct ? 
            (p.interval === 'one-time' || p.interval === billingInterval) : 
            p.interval === billingInterval;
          
          return (keyWordsMatch || fallbackPartialMatch) && isIntervalMatch;
        });
        
        if (matchingPrice) {
          newItem.price = matchingPrice.unit_amount / 100;
          newItem.stripe_price_id = matchingPrice.stripe_price_id;
          console.log(`Using Supabase price for ${item.name}: $${newItem.price}`);
        } else {
          console.warn(`No matching price found for ${item.name}, using provided price: $${item.price}`);
        }
      }
      
      set((state) => {
        const newItems = [...state.items, newItem];
        return {
          items: newItems,
          total: newItems.reduce((sum, item) => sum + item.price, 0)
        };
      });
    } catch (err) {
      console.error('Error adding item with pricing:', err);
      throw err;
    }
  },
  updateItemInterval: (itemId: string, newInterval: 'month' | 'year' | 'one-time') => {
    try {
      set((state) => {
        const itemToUpdate = state.items.find(item => item.id === itemId);
        if (!itemToUpdate) {
          return state; // Item not found, no change
        }
        
        // Don't allow changing billing interval for one-time products
        if (itemToUpdate.name.includes('SHRED') || 
            itemToUpdate.name.includes('One-Time') || 
            itemToUpdate.name.includes('Macros Calculation')) {
          return state;
        }
        
        // Check if changing to newInterval would create a duplicate
        const wouldCreateDuplicate = state.items.some(item => {
          if (item.id === itemId) return false; // Skip the current item
          const normalizeName = (name: string) => name.toLowerCase().replace(/\s+program\s*$/i, '').trim();
          return normalizeName(item.name) === normalizeName(itemToUpdate.name) && 
                 item.billingInterval === newInterval;
        });
        
        if (wouldCreateDuplicate) {
          // Prevent creating duplicate, but don't show notification
          return state;
        }
        
        const newItems = state.items.map(item => {
          if (item.id === itemId) {
            // Map product names to STRIPE_PRODUCTS keys
            const productNameMap: Record<string, keyof typeof STRIPE_PRODUCTS> = {
              "Nutrition Only Program": "NUTRITION_ONLY",
              "Nutrition Only": "NUTRITION_ONLY",
              "Nutrition & Training Program": "NUTRITION_TRAINING",
              "Nutrition & Training": "NUTRITION_TRAINING", 
              "Self-Led Training Program": "SELF_LED_TRAINING",
              "Self-Led Training": "SELF_LED_TRAINING",
              "Trainer Feedback Program": "TRAINER_FEEDBACK",
              "Trainer Feedback": "TRAINER_FEEDBACK"
            };
            
            const productKey = productNameMap[item.name];
            let newPrice = item.price;
            let stripePriceId = item.stripe_price_id;
            
            // Generate new unique ID for the updated billing interval
            const normalizedName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
            const newId = `${normalizedName}-${newInterval}`;
            
            if (productKey) {
              // Use centralized pricing
              const intervalForPricing = newInterval === 'one-time' ? undefined : newInterval;
              const priceAmount = getPriceAmount(productKey, intervalForPricing);
              const priceId = getPriceId(productKey, intervalForPricing);
              
              newPrice = priceAmount / 100; // Convert from cents to dollars
              stripePriceId = priceId;
            } else {
              // Fallback to hardcoded pricing if not in centralized config
              
              if (item.name.includes('Nutrition Only')) {
                newPrice = newInterval === 'month' ? 179.00 : 1718.40;
              } else if (item.name.includes('Nutrition & Training')) {
                newPrice = newInterval === 'month' ? 249.00 : 2390.40;
              } else if (item.name.includes('Self-Led Training')) {
                newPrice = newInterval === 'month' ? 24.99 : 239.90;
              } else if (item.name.includes('Trainer Feedback')) {
                newPrice = newInterval === 'month' ? 49.99 : 431.90;
              }
            }
            
            return {
              ...item,
              id: newId, // Update ID to reflect new billing interval
              billingInterval: newInterval,
              price: newPrice,
              stripe_price_id: stripePriceId,
              yearlyDiscountApplied: newInterval === 'year'
            };
          }
          return item;
        });

        return {
          items: newItems,
          total: newItems.reduce((sum, item) => sum + item.price, 0)
        };
      });
    } catch (error) {
      console.error('Error updating item interval:', error);
    }
  },
  removeItem: (id) => set((state) => {
    const newItems = state.items.filter(item => item.id !== id);
    return {
      items: newItems,
      total: newItems.reduce((sum, item) => sum + item.price, 0)
    };
  }),
  // Handle toggling gift status for an item
  
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
  
  clearCart: () => set({ items: [], total: 0 }),
}),
{
  name: 'jmefit-cart-storage', // unique name for localStorage key
  storage: createJSONStorage(() => localStorage), // use localStorage for persistence
}));