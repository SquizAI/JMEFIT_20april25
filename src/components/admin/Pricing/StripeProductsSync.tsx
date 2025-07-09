import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { STRIPE_PRODUCTS } from '../../../lib/stripe-products';
import { RefreshCw, Check, AlertCircle, DollarSign } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  stripe_product_id: string;
  active: boolean;
  created_at: string;
}

interface Price {
  id: string;
  product_id: string;
  stripe_price_id: string;
  unit_amount: number;
  interval: string;
  active: boolean;
}

function StripeProductsSync() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  // Fetch products from database
  const { data: dbProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['stripe-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    }
  });

  // Fetch prices from database
  const { data: dbPrices, isLoading: pricesLoading } = useQuery({
    queryKey: ['stripe-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .order('unit_amount');
      
      if (error) throw error;
      return data as Price[];
    }
  });

  // Sync products from Stripe
  const syncProductsMutation = useMutation({
    mutationFn: async () => {
      setSyncing(true);
      
      try {
        // Call Netlify function to sync all products at once
        const response = await fetch('/.netlify/functions/sync-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Sync failed');
        }
        
        const result = await response.json();
        
        // Update sync status for all products as success
        const newStatus: Record<string, 'success' | 'error'> = {};
        Object.keys(STRIPE_PRODUCTS).forEach(key => {
          newStatus[key] = 'success';
        });
        setSyncStatus(newStatus);
        
        return result;
      } catch (error) {
        // Update sync status for all products as error
        const newStatus: Record<string, 'success' | 'error'> = {};
        Object.keys(STRIPE_PRODUCTS).forEach(key => {
          newStatus[key] = 'error';
        });
        setSyncStatus(newStatus);
        throw error;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['stripe-products'] });
      queryClient.invalidateQueries({ queryKey: ['stripe-prices'] });
      
      // Show success message
      console.log('Sync completed:', result);
      
      setTimeout(() => {
        setSyncing(false);
        setSyncStatus({});
      }, 3000);
    },
    onError: (error: Error) => {
      console.error('Sync failed:', error);
      setSyncing(false);
    }
  });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const getProductPrices = (productId: string) => {
    return dbPrices?.filter(price => price.product_id === productId) || [];
  };

  const getStripeProductInfo = (productName: string) => {
    // Find matching product in STRIPE_PRODUCTS
    const entry = Object.entries(STRIPE_PRODUCTS).find(([_, product]) => 
      product.name === productName || 
      productName.includes(product.name)
    );
    return entry ? { key: entry[0], product: entry[1] } : null;
  };

  return (
    <div className="space-y-6">
      {/* Sync Status Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Stripe Products Sync</h3>
            <p className="text-sm text-gray-600 mt-1">
              Sync products and prices between Stripe and your database
            </p>
          </div>
          <button
            onClick={() => syncProductsMutation.mutate()}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync All Products'}
          </button>
        </div>

        {/* Sync Progress */}
        {syncing && Object.keys(syncStatus).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(syncStatus).map(([key, status]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                {status === 'pending' && <div className="w-4 h-4 border-2 border-jme-purple border-t-transparent rounded-full animate-spin" />}
                {status === 'success' && <Check className="w-4 h-4 text-green-500" />}
                {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                <span className={status === 'error' ? 'text-red-600' : ''}>{key}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Products from Catalog */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Product Catalog</h3>
          <p className="text-sm text-gray-600 mt-1">
            These are the official products defined in your Stripe catalog
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Savings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(STRIPE_PRODUCTS).map(([key, product]) => {
                const prices = 'one_time' in product.prices ? null : product.prices;
                const oneTimePrice = 'one_time' in product.prices ? product.prices.one_time : null;
                
                return (
                  <tr key={key}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {prices ? (
                        <div>
                          <div className="font-medium">{formatPrice(prices.month.amount)}</div>
                          <div className="text-xs text-gray-500">ID: {prices.month.id}</div>
                        </div>
                      ) : oneTimePrice ? (
                        <span className="text-gray-400">One-time only</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {prices && prices.year ? (
                        <div>
                          <div className="font-medium">{formatPrice(prices.year.amount)}</div>
                          <div className="text-xs text-gray-500">ID: {prices.year.id}</div>
                        </div>
                      ) : oneTimePrice ? (
                        <div>
                          <div className="font-medium">{formatPrice(oneTimePrice.amount)}</div>
                          <div className="text-xs text-gray-500">ID: {oneTimePrice.id}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {prices && prices.year?.savings ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {prices.year.savings}% off
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {syncStatus[key] === 'success' ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Synced
                        </span>
                      ) : syncStatus[key] === 'error' ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> Error
                        </span>
                      ) : (
                        <span className="text-gray-500">Ready</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Products */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Database Products</h3>
          <p className="text-sm text-gray-600 mt-1">
            Products currently stored in your database
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stripe Product ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prices</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catalog Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productsLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : dbProducts?.map((product) => {
                const prices = getProductPrices(product.id);
                const catalogMatch = getStripeProductInfo(product.name);
                
                return (
                  <tr key={product.id}>
                    <td className="px-6 py-4 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.stripe_product_id}</td>
                    <td className="px-6 py-4">
                      {prices.map(price => (
                        <div key={price.id} className="text-sm">
                          {formatPrice(price.unit_amount)} 
                          {price.interval && ` / ${price.interval}`}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {catalogMatch ? (
                        <span className="text-green-600 text-sm flex items-center gap-1">
                          <Check className="w-4 h-4" /> {catalogMatch.key}
                        </span>
                      ) : (
                        <span className="text-yellow-600 text-sm">No match</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StripeProductsSync; 