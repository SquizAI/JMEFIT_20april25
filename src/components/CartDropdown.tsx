import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Clock } from 'lucide-react';
import { useCartStore } from '../store/cart';
import PricingToggle from './PricingToggle';
import { useAuth } from '../contexts/AuthContext';

interface CartDropdownProps {
  onClose: () => void;
}

function CartDropdown({ onClose }: CartDropdownProps) {
  const { items, removeItem, updateItemInterval, total } = useCartStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const cartRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Format price to display with exactly 2 decimal places
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  // Get the monthly price based on the product name
  const getMonthlyPrice = (productName: string) => {
    switch (productName) {
      case "Nutrition Only":
      case "Nutrition Only Program":
        return 179.00;
      case "Nutrition & Training":
      case "Nutrition & Training Program":
        return 249.00;
      case "Self-Led Training":
      case "Self-Led Training Program":
        return 24.99;
      case "Trainer Feedback":
      case "Trainer Feedback Program":
        return 49.99;
      case "SHRED Challenge":
        return 297.00;
      case "One-Time Macros Calculation":
        return 99.00;
      default:
        return 179.00; // Default fallback
    }
  };

  useEffect(() => {
    setIsAnimating(true);
    
    // Add event listener to detect clicks outside the cart
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // Prevent scrolling of the body when cart is open
    document.body.style.overflow = 'hidden';
    
    // Add the event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      // Clean up
      setIsAnimating(false);
      document.body.style.overflow = '';
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Create portal to render at the document body level
  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-[9999] flex justify-center items-center overflow-hidden animate-fadeIn">
      <div 
        ref={cartRef}
        className={`w-full max-w-[95vw] sm:max-w-[650px] bg-white rounded-xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-auto m-4 transition-all duration-300 ${isAnimating ? 'translate-y-0 opacity-100 animate-scaleIn' : 'translate-y-8 opacity-0'}`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Shopping Cart</h3>
            </div>
            <button 
              onClick={() => {
                onClose();
              }} 
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all duration-300 hover:rotate-90"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {items.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <button
                onClick={() => {
                  onClose();
                  navigate('/programs'); // Navigate to programs page
                }}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-jme-purple bg-purple-50 rounded-lg hover:bg-purple-100"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 max-h-[40vh] sm:max-h-[50vh] overflow-auto pr-1">
                {items.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start p-3 sm:p-4 bg-gray-50 rounded-lg mb-4 shadow-sm w-full">
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    {/* Only show billing interval toggle for subscription products */}
                    {item.billingInterval && 
                     !item.name.includes('SHRED') && 
                     !item.name.includes('One-Time') &&
                     !item.name.includes('Macros Calculation') &&
                     item.billingInterval !== 'one-time' && (
                      <div className="mt-4">
                        <PricingToggle
                          interval={item.billingInterval}
                          onChange={(newInterval) => updateItemInterval(item.id, newInterval)}
                          monthlyPrice={getMonthlyPrice(item.name)}
                        />
                        {item.billingInterval === 'year' && (
                          <p className="text-xs text-green-600 font-medium mt-2">
                            You save 20% with annual billing
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-[180px] sm:ml-4 mt-3 sm:mt-0">
                    <div className="text-right">
                      <span className="font-bold text-lg">${formatPrice(item.price)}</span>
                      {item.billingInterval && (
                        <div className="text-sm text-gray-500">
                          {item.billingInterval === 'year' ? 'per year' : 
                           item.billingInterval === 'one-time' ? 'one-time payment' : 'per month'}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        removeItem(item.id);
                        
                        // Don't close the cart dropdown when removing an item
                        // Only navigate away if the cart becomes empty
                        if (items.length <= 1) {
                          onClose();
                          // Don't navigate away, just close the cart
                        }
                      }}
                      className="ml-2 sm:ml-4 p-2.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:rotate-90 touch-manipulation"
                      aria-label="Remove item"
                      title="Remove from cart"
                    >
                      <X className="w-6 h-6 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">Total</span>
                <span className="text-xl font-bold">${formatPrice(total)}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/programs'); // Navigate to programs page
                  }}
                  className="py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-300 font-medium hover:shadow-md order-2 sm:order-1"
                >
                  Continue Shopping
                </button>
                
                {user ? (
                  <Link
                    to="/checkout"
                    onClick={onClose}
                    className="flex-1 bg-gradient-to-r from-jme-purple to-purple-700 text-white text-center py-3 px-6 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] duration-300 btn-hover-effect order-1 sm:order-2"
                  >
                    🚀 Proceed to Checkout
                  </Link>
                ) : (
                  <Link
                    to={`/auth?returnUrl=${encodeURIComponent('/checkout')}`}
                    onClick={() => {
                      onClose();
                    }}
                    className="flex-1 bg-gradient-to-r from-jme-purple to-purple-700 text-white text-center py-3 px-6 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] duration-300 btn-hover-effect order-1 sm:order-2"
                  >
                    🚀 Sign In & Checkout
                  </Link>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Clock className="w-4 h-4 text-gray-400" />
                <p className="text-xs text-center text-gray-500">
                  Secure checkout powered by Stripe
                </p>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CartDropdown;