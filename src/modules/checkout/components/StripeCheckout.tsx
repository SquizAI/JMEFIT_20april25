import { useStripeProducts } from '../hooks/useStripeProducts';
import ProductSelector from './ProductSelector';
import CheckoutFooter from './CheckoutFooter';

export default function StripeCheckout() {
  const {
    products,
    prices,
    loading,
    error,
    selectedItems,
    togglePrice,
    getProductPrices
  } = useStripeProducts();

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

  // Filter out inactive products
  const activeProducts = products.filter(p => p.active !== false);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 mb-20">
      <h1 className="text-3xl font-bold mb-8 text-center">JMEFit Programs</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {activeProducts.map(product => (
          <ProductSelector
            key={product.id}
            product={product}
            prices={getProductPrices(product.id)}
            selectedItems={selectedItems}
            onSelectPrice={togglePrice}
          />
        ))}
      </div>
      
      <CheckoutFooter 
        selectedItems={selectedItems}
        prices={prices}
      />
    </div>
  );
}
