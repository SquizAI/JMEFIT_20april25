import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  plan_id: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  created_at: string;
}

interface Payment {
  id: string;
  stripe_invoice_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function SubscriptionManager() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
      fetchPayments();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      console.log('Fetching subscriptions for user:', user?.id);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Subscriptions query error:', error);
        throw error;
      }
      console.log('Subscriptions data:', data);
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error(`Failed to load subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const fetchPayments = async () => {
    try {
      console.log('Fetching payments for user:', user?.id);
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Payments query error:', error);
        throw error;
      }
      console.log('Payments data:', data);
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error(`Failed to load payment history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    setCancelLoading(subscriptionId);
    try {
      // Call Netlify function to cancel subscription
      const response = await fetch('/.netlify/functions/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          cancelAtPeriodEnd: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast.success('Subscription will be cancelled at the end of the billing period');
      fetchSubscriptions(); // Refresh subscriptions
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelLoading(null);
    }
  };

  const handleReactivateSubscription = async (subscriptionId: string) => {
    setCancelLoading(subscriptionId);
    try {
      // Call Netlify function to reactivate subscription
      const response = await fetch('/.netlify/functions/reactivate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      toast.success('Subscription reactivated successfully');
      fetchSubscriptions(); // Refresh subscriptions
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Failed to reactivate subscription');
    } finally {
      setCancelLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
      case 'canceled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'past_due':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPlanName = (planId: string) => {
    // Map Stripe price IDs to readable names
    const planNames: { [key: string]: string } = {
      'price_1RPq5RG00IiCtQkD94kNa9AQ': 'SHRED Challenge',
      'price_monthly_basic': 'Monthly Basic',
      'price_monthly_premium': 'Monthly Premium',
      'price_yearly_basic': 'Yearly Basic',
      'price_yearly_premium': 'Yearly Premium'
    };
    
    return planNames[planId] || planId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Subscriptions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
            Active Subscriptions
          </h3>
        </div>
        <div className="p-6">
          {subscriptions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active subscriptions</p>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {getStatusIcon(subscription.status)}
                      <div className="ml-3">
                        <h4 className="font-medium">{getPlanName(subscription.plan_id)}</h4>
                        <p className="text-sm text-gray-500">
                          Subscription ID: {subscription.stripe_subscription_id}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                      {subscription.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Current Period: {format(new Date(subscription.current_period_start), 'MMM d, yyyy')} - {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Next billing: {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
                    </div>
                  </div>
                  
                  {subscription.cancel_at_period_end && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        This subscription will be cancelled at the end of the current billing period.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                      <button
                        onClick={() => handleCancelSubscription(subscription.id)}
                        disabled={cancelLoading === subscription.id}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancelLoading === subscription.id ? 'Cancelling...' : 'Cancel Subscription'}
                      </button>
                    )}
                    
                    {subscription.cancel_at_period_end && (
                      <button
                        onClick={() => handleReactivateSubscription(subscription.id)}
                        disabled={cancelLoading === subscription.id}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {cancelLoading === subscription.id ? 'Reactivating...' : 'Reactivate Subscription'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No payment history
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(payment.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.stripe_invoice_id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 