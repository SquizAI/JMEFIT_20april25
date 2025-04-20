import { useQuery, useMutation } from '@tanstack/react-query';
import { getSubscriptionPlans, createSubscription } from '../api/subscriptions';
import { useNavigate } from 'react-router-dom';
import { AppError, ErrorCodes } from '../error';

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getSubscriptionPlans
  });
}

export function useCreateSubscription() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ priceId, interval }: { priceId: string; interval: 'month' | 'year' }) =>
      createSubscription(priceId, interval),
    onError: (error) => {
      if (error instanceof AppError && error.code === ErrorCodes.UNAUTHORIZED) {
        navigate('/auth', { state: { from: '/pricing' } });
      }
    },
    onSuccess: ({ sessionId }) => {
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    }
  });
}