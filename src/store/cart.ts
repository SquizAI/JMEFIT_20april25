import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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
    // Set default billing interval based on product type
    // SHRED Challenge and other one-time products should always be one-time
    let billingInterval = item.billingInterval || 'month';
    
    // Force one-time billing interval for SHRED Challenge
    if (item.name.includes('SHRED')) {
      billingInterval = 'one-time';
    }
    
    try {
      // Get the product and its prices from Supabase
      const { data: priceData, error } = await supabase
        .from('prices')
        .select('*, products(*)')
        .eq('active', true);
      
      if (error) throw error;
      
      console.log('Available prices:', priceData);
      console.log('Looking for product:', item.name, 'with interval:', billingInterval);
      
      // First, try an exact match
      let matchingPrice = priceData.find(p => {
        const exactMatch = p.products?.name === item.name && p.interval === billingInterval;
        if (exactMatch) {
          console.log(`Found exact match for ${item.name} with interval ${billingInterval}`);
        }
        return exactMatch;
      });

      // If no exact match, try partial name matching
      if (!matchingPrice) {
        console.log(`No exact match found, trying partial matches for ${item.name} with interval ${billingInterval}`);
        
        matchingPrice = priceData.find(p => {
          // Check if product names partially match (case insensitive match in either direction)
          // Normalize both strings for comparison: remove 'Program', extra spaces, etc.
          const normalizeString = (str: string): string => {
            return str.toLowerCase()
              .replace(/\s+program\b/gi, '')
              .replace(/\b(nutrition|only|training|led|self|feedback|trainer)\b/gi, match => match.toLowerCase())
              .trim();
          };
          
          const normalizedProductName = normalizeString(p.products?.name || '');
          const normalizedItemName = normalizeString(item.name);
          
          // Check if key identifying words match
          const keyWordsMatch = (
            // Nutrition Only
            (p.products?.name?.toLowerCase().includes('nutrition only') && item.name.toLowerCase().includes('nutrition only')) ||
            // Nutrition & Training
            (p.products?.name?.toLowerCase().includes('nutrition & training') && item.name.toLowerCase().includes('nutrition')) ||
            // Self-Led Training
            (p.products?.name?.toLowerCase().includes('self-led') && item.name.toLowerCase().includes('self-led')) ||
            // Trainer Feedback
            (p.products?.name?.toLowerCase().includes('trainer feedback') && item.name.toLowerCase().includes('trainer feedback')) ||
            // One-Time Macros
            (p.products?.name?.toLowerCase().includes('macros') && item.name.toLowerCase().includes('macros')) ||
            // SHRED
            (p.products?.name?.toLowerCase().includes('shred') && item.name.toLowerCase().includes('shred'))
          );
          
          // Check for more general partial matches if no key word matches
          const fallbackPartialMatch = (
            normalizedProductName.includes(normalizedItemName) ||
            normalizedItemName.includes(normalizedProductName)
          );
          
          // Check if interval matches the requested billing interval
          const intervalMatches = p.interval === billingInterval;
          
          // For one-time products, don't strictly require interval match
          const isOneTimeProduct = (
            item.name.toLowerCase().includes('one-time') || 
            item.name.toLowerCase().includes('shred')
          );
          
          const isIntervalMatch = isOneTimeProduct ? 
            (p.interval === 'one-time' || intervalMatches) : 
            intervalMatches;
          
          console.log(
            `Checking price: ${p.stripe_price_id} - ${p.products?.name} (${p.interval}) - ` +
            `Key words match: ${keyWordsMatch}, Fallback match: ${fallbackPartialMatch}, ` +
            `Interval match: ${isIntervalMatch}, Amount: ${p.unit_amount/100}`
          );
          
          return (keyWordsMatch || fallbackPartialMatch) && isIntervalMatch;
        });
      }
      
      // Create a new item with the correct billing interval
      const newItem = {
        ...item,
        billingInterval,
        yearlyDiscountApplied: billingInterval === 'year'
      };
      
      // Force SHRED Challenge price to always be $297.00
      if (item.name.includes('SHRED')) {
        newItem.price = 297.00;
        console.log('Forcing SHRED Challenge price to $297.00');
      }
      
      // Use price from Supabase if available, otherwise use the provided price
      if (matchingPrice) {
        newItem.price = matchingPrice.unit_amount / 100; // Convert from cents
        newItem.stripe_price_id = matchingPrice.stripe_price_id;
        console.log(`Using Supabase price for ${item.name}: $${newItem.price}`);
      } else {
        // If no matching price found in Supabase, use the fallback price from the item
        console.warn(`No price found in database for ${item.name} with interval ${billingInterval}, using fallback price: $${item.price}`);
        
        // Make sure we have a valid price
        if (typeof item.price !== 'number' || isNaN(item.price)) {
          // Use hardcoded fallback prices based on product name
          if (item.name.includes('One-Time Macros')) {
            newItem.price = 99.00;
          } else if (item.name.includes('SHRED')) {
            newItem.price = 297.00;
          } else if (item.name.includes('Nutrition Only')) {
            newItem.price = billingInterval === 'month' ? 179.00 : 1718.40;
          } else if (item.name.includes('Nutrition & Training')) {
            newItem.price = billingInterval === 'month' ? 249.00 : 2390.40;
          } else if (item.name.includes('Self-Led Training')) {
            newItem.price = billingInterval === 'month' ? 24.99 : 239.90;
          } else if (item.name.includes('Trainer Feedback')) {
            newItem.price = billingInterval === 'month' ? 49.99 : 431.90;
          } else {
            newItem.price = 0;
          }
          console.log(`Using hardcoded fallback price for ${item.name}: $${newItem.price}`);
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
      console.error('Error adding item with Supabase prices:', err);
      toast.error('Failed to add item. Price data could not be retrieved from the database.');
      // Re-throw the error so the UI can handle it
      throw err;
    }
  },
  updateItemInterval: async (id, interval) => {
    // First get the current state to find the item
    const currentState = get();
    const itemToUpdate = currentState.items.find((item: CartItem) => item.id === id);
    
    if (!itemToUpdate) return;
    
    try {
      // Get the product and its prices from Supabase
      let query = supabase
        .from('prices')
        .select('*, products(*)')
        .eq('active', true);
      
      // Try to find the product by name or by stripe_product_id
      const { data: priceData, error } = await query;
      
      if (error) throw error;
      
      console.log('Available prices for interval update:', priceData);
      console.log('Looking to update product:', itemToUpdate.name, 'to interval:', interval);
      
      // First, try an exact match
      let matchingPrice = priceData.find(p => {
        const exactMatch = p.products?.name === itemToUpdate.name && p.interval === interval;
        if (exactMatch) {
          console.log(`Found exact match for ${itemToUpdate.name} with interval ${interval}`);
        }
        return exactMatch;
      });

      // If no exact match, try partial name matching
      if (!matchingPrice) {
        console.log(`No exact match found for interval update, trying partial matches for ${itemToUpdate.name} with interval ${interval}`);
        
        matchingPrice = priceData.find(p => {
          // Check if product names partially match (case insensitive match in either direction)
          // Normalize both strings for comparison: remove 'Program', extra spaces, etc.
          const normalizeString = (str: string): string => {
            return str.toLowerCase()
              .replace(/\s+program\b/gi, '')
              .replace(/\b(nutrition|only|training|led|self|feedback|trainer)\b/gi, match => match.toLowerCase())
              .trim();
          };
          
          const normalizedProductName = normalizeString(p.products?.name || '');
          const normalizedItemName = normalizeString(itemToUpdate.name);
          
          // Check if key identifying words match
          const keyWordsMatch = (
            // Nutrition Only
            (p.products?.name?.toLowerCase().includes('nutrition only') && itemToUpdate.name.toLowerCase().includes('nutrition only')) ||
            // Nutrition & Training
            (p.products?.name?.toLowerCase().includes('nutrition & training') && itemToUpdate.name.toLowerCase().includes('nutrition')) ||
            // Self-Led Training
            (p.products?.name?.toLowerCase().includes('self-led') && itemToUpdate.name.toLowerCase().includes('self-led')) ||
            // Trainer Feedback
            (p.products?.name?.toLowerCase().includes('trainer feedback') && itemToUpdate.name.toLowerCase().includes('trainer feedback')) ||
            // One-Time Macros
            (p.products?.name?.toLowerCase().includes('macros') && itemToUpdate.name.toLowerCase().includes('macros')) ||
            // SHRED
            (p.products?.name?.toLowerCase().includes('shred') && itemToUpdate.name.toLowerCase().includes('shred'))
          );
          
          // Check for more general partial matches if no key word matches
          const fallbackPartialMatch = (
            normalizedProductName.includes(normalizedItemName) ||
            normalizedItemName.includes(normalizedProductName)
          );
          
          // Check if interval matches the requested billing interval
          const intervalMatches = p.interval === interval;
          
          // For one-time products, don't strictly require interval match
          const isOneTimeProduct = (
            itemToUpdate.name.toLowerCase().includes('one-time') || 
            itemToUpdate.name.toLowerCase().includes('shred')
          );
          
          const isIntervalMatch = isOneTimeProduct ? 
            (p.interval === 'one-time' || intervalMatches) : 
            intervalMatches;
          
          console.log(
            `Checking price for update: ${p.stripe_price_id} - ${p.products?.name} (${p.interval}) - ` +
            `Key words match: ${keyWordsMatch}, Fallback match: ${fallbackPartialMatch}, ` +
            `Interval match: ${isIntervalMatch}, Amount: ${p.unit_amount/100}`
          );
          
          return (keyWordsMatch || fallbackPartialMatch) && isIntervalMatch;
        });
      }
      
      // Update the state with the new pricing information
      set((state) => {
        const newItems = state.items.map(item => {
          if (item.id === id) {
            // Get price from Supabase if available, otherwise use default values
            let updatedPrice = item.price; // Default: keep existing price
            let newStripePriceId = item.stripe_price_id;
            
            if (matchingPrice) {
              updatedPrice = matchingPrice.unit_amount / 100; // Convert from cents
              newStripePriceId = matchingPrice.stripe_price_id;
              console.log(`Using Supabase price for ${item.name}: $${updatedPrice}`);
            } else {
              // If no matching price found in Supabase, use fallback prices
              console.warn(`No price found in database for ${item.name} with interval ${interval}, using fallback price`);
              
              // Use hardcoded fallback prices based on product name
              if (item.name.includes('One-Time Macros')) {
                updatedPrice = 99.00;
              } else if (item.name.includes('SHRED')) {
                updatedPrice = 297.00;
              } else if (item.name.includes('Nutrition Only')) {
                updatedPrice = interval === 'month' ? 179.00 : 1718.40;
              } else if (item.name.includes('Nutrition & Training')) {
                updatedPrice = interval === 'month' ? 249.00 : 2390.40;
              } else if (item.name.includes('Self-Led Training')) {
                updatedPrice = interval === 'month' ? 24.99 : 239.90;
              } else if (item.name.includes('Trainer Feedback')) {
                updatedPrice = interval === 'month' ? 49.99 : 431.90;
              }
              console.log(`Using hardcoded fallback price for ${item.name}: $${updatedPrice}`);
            }
            
            return {
              ...item,
              billingInterval: interval,
              yearlyDiscountApplied: interval === 'year',
              price: updatedPrice,
              stripe_price_id: newStripePriceId
            };
          }
          return item;
        });
        
        return {
          items: newItems,
          total: newItems.reduce((sum, item) => sum + item.price, 0)
        };
      });
    } catch (err) {
      console.error('Error updating item interval:', err);
      toast.error('Failed to update billing interval. Price data could not be retrieved from the database.');
      // Re-throw the error so the UI can handle it
      throw err;
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