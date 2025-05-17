import { StripeProduct, StripePrice } from '../types';

interface ProductSelectorProps {
  product: StripeProduct;
  prices: StripePrice[];
  selectedItems: Record<string, { price: string; quantity: number }>;
  onSelectPrice: (price: StripePrice) => void;
}

export default function ProductSelector({ 
  product, 
  prices, 
  selectedItems, 
  onSelectPrice 
}: ProductSelectorProps) {
  // Format price for display
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
      <div className="p-6 flex-grow">
        <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
        <p className="text-gray-600 mb-6">{product.description}</p>
        
        <div className="space-y-3">
          {prices.map(price => (
            <div 
              key={price.id}
              className={`
                border rounded-md p-3 cursor-pointer flex justify-between items-center
                ${selectedItems[price.id] ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}
              `}
              onClick={() => onSelectPrice(price)}
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
  );
}
