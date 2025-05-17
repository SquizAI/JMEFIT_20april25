import { useState, useEffect } from 'react';
import { useCartStore } from '../stores/cart';
import { toast } from 'react-hot-toast';

// Define types for Stripe products and prices
interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'month' | 'year';
  };
  product: string;
}

interface StripeProduct {
  id: string;
  name: string;
  description: string;
  default_price?: string;
  metadata: Record<string, string>;
}

interface CheckoutItem {
  price: string; // Stripe price ID
  quantity: number;
}

export default function StripeProductCheckout() {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, CheckoutItem>>({});
  
  const { items, clearCart } = useCartStore();

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
        const initialSelected: Record<string, CheckoutItem> = {};
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

  // Format price for display
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
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

  // Create checkout session
  const handleCheckout = async () => {
    try {
      if (Object.keys(selectedItems).length === 0) {
        toast.error('Please select at least one product');
        return;
      }
      
      setIsCheckingOut(true);
      
      // Determine if we have one-time or subscription items
      const lineItems = Object.values(selectedItems);
      const hasSubscription = prices
        .filter(price => Object.keys(selectedItems).includes(price.id))
        .some(price => price.recurring);
      
      // Call the appropriate serverless function
      const endpoint = hasSubscription 
        ? '/.netlify/functions/create-subscription-checkout'
        : '/.netlify/functions/create-checkout';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: lineItems,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout?canceled=true`,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const data = await response.json();
      
      // Clear cart and redirect to Stripe
      clearCart();
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">JMEFit Programs</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {products.filter(p => p.active !== false).map(product => (
          <div 
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
          >
            <div className="p-6 flex-grow">
              <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
              <p className="text-gray-600 mb-6">{product.description}</p>
              
              <div className="space-y-3">
                {getProductPrices(product.id).map(price => (
                  <div 
                    key={price.id}
                    className={`
                      border rounded-md p-3 cursor-pointer flex justify-between items-center
                      ${selectedItems[price.id] ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}
                    `}
                    onClick={() => togglePrice(price)}
                  >
                    <div>
                      <div className="font-medium">
                        {formatPrice(price.unit_amount, price.currency)}
                        {price.recurring && <span className="text-sm text-gray-500 ml-1">/{price.recurring.interval}</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {price.recurring ? 'Subscription' : 'One-time payment'}
                      </div>
                    </div>
                    <div>
                      <input 
                        type="checkbox" 
                        checked={!!selectedItems[price.id]} 
                        onChange={() => {}} // Handled by the onClick on the parent div
                        className="h-5 w-5 text-purple-600 rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md p-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <span className="font-medium">Selected: {Object.keys(selectedItems).length} item(s)</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut || Object.keys(selectedItems).length === 0}
            className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
