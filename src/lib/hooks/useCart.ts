import { useCartStore } from '../store/cart';
import { useMutation } from '@tanstack/react-query';
import { createOrder } from '../api/orders';
import { useNavigate } from 'react-router-dom';
import { AppError, ErrorCodes } from '../error';

export function useCart() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();

  const checkout = useMutation({
    mutationFn: async () => {
      const orderItems = items.map(item => ({
        productId: item.id,
        quantity: 1
      }));
      return createOrder(orderItems);
    },
    onError: (error) => {
      if (error instanceof AppError) {
        if (error.code === ErrorCodes.UNAUTHORIZED) {
          navigate('/auth', { state: { from: '/checkout' } });
        }
      }
    },
    onSuccess: ({ sessionId }) => {
      clearCart();
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    },
  });

  return {
    checkout,
    items,
    clearCart
  };
}