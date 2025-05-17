import { useState, useEffect } from 'react';
import { StripeProduct, StripePrice } from '../types';
import { useCartStore } from '../../../stores/cart';

interface UseStripeProductsReturn {
  products: StripeProduct[];
  prices: StripePrice[];
  loading: boolean;
  error: string | null;
  selectedItems: Record<string, { price: string; quantity: number }>;
  setSelectedItems: React.Dispatch<React.SetStateAction<Record<string, { price: string; quantity: number }>>>;
  togglePrice: (price: StripePrice) => void;
  getProductPrices: (productId: string) => StripePrice[];
  getProductBillingType: (productId: string) => 'one-time' | 'subscription';
  getPriceBillingInterval: (priceId: string) => 'one-time' | 'month' | 'year';
}

// Define the mapping of price IDs to their conceptual billing intervals
const SUBSCRIPTION_PRICES_MAP: Record<string, { interval: 'month' | 'year' }> = {
  // Trainer Feedback Program
  'price_1RPpiBG00IiCtQkDBBgajsyo': { interval: 'month' },
  'price_1RPb4CG00IiCtQkDWk5SOKce': { interval: 'year' },
  
  // Self-Led Training Program
  'price_1RPb3wG00IiCtQkDGn5dPucz': { interval: 'year' },
  'price_1RPb3rG00IiCtQkDWSMYE6VP': { interval: 'month' },
  
  // Nutrition & Training
  'price_1RPb3fG00IiCtQkDkYMCoapu': { interval: 'year' },
  'price_1RPb3aG00IiCtQkD8Jd1Rvdj': { interval: 'month' },
  
  // Nutrition Only
  'price_1RPb3NG00IiCtQkDRzrvSEOk': { interval: 'year' },
  'price_1RPb3HG00IiCtQkDK6blELBN': { interval: 'month' }
};

// Define the one-time products
const ONE_TIME_PRODUCTS = [
  'prod_SKFZCf3jJcOY2r', // SHRED with JMEFit
  'prod_SKFZ9bT2D7uuwg'  // One-Time Macros Calculation
];

export function useStripeProducts(): UseStripeProductsReturn {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, { price: string; quantity: number }>>({});
  
  const { items } = useCartStore();

  // Helper function to determine if a product is a one-time or subscription product
  const getProductBillingType = (productId: string): 'one-time' | 'subscription' => {
    return ONE_TIME_PRODUCTS.includes(productId) ? 'one-time' : 'subscription';
  };

  // Helper function to get a price's billing interval (one-time, month, year)
  const getPriceBillingInterval = (priceId: string): 'one-time' | 'month' | 'year' => {
    const price = prices.find(p => p.id === priceId);
    
    // If price doesn't exist, return one-time as default
    if (!price) return 'one-time';
    
    // Check if price has recurring property (true subscription)
    if (price.recurring) {
      return price.recurring.interval as 'month' | 'year';
    }
    
    // Check if price is in our subscription map
    if (SUBSCRIPTION_PRICES_MAP[priceId]) {
      return SUBSCRIPTION_PRICES_MAP[priceId].interval;
    }
    
    // Default to one-time
    return 'one-time';
  };

  // Load products and prices from serverless function
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call our serverless function to get products and prices
        const response = await fetch('/.netlify/functions/get-products');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data.products);
        setPrices(data.prices);
        
        // Pre-select items that are in the cart
        const initialSelected: Record<string, { price: string; quantity: number }> = {};
        items.forEach(item => {
          if (item.stripe_price_id) {
            initialSelected[item.stripe_price_id] = {
              price: item.stripe_price_id,
              quantity: 1
            };
          }
        });
        
        setSelectedItems(initialSelected);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [items]);

  // Get prices for a product
  const getProductPrices = (productId: string) => {
    return prices.filter(price => price.product === productId);
  };

  // Toggle selection of a price
  const togglePrice = (price: StripePrice) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      
      if (updated[price.id]) {
        // If already selected, remove it
        delete updated[price.id];
      } else {
        // Otherwise add it
        updated[price.id] = {
          price: price.id,
          quantity: 1
        };
      }
      
      return updated;
    });
  };

  return {
    products,
    prices,
    loading,
    error,
    selectedItems,
    setSelectedItems,
    togglePrice,
    getProductPrices,
    getProductBillingType,
    getPriceBillingInterval
  };
}
