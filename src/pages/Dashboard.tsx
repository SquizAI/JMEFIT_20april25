import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { linkIdentity, unlinkIdentity, getUserIdentities } from '../lib/auth';
import { format } from 'date-fns';
import { Activity, Calendar, CreditCard, Dumbbell, Settings, ShoppingBag, TrendingUp, ToggleLeft as Google } from 'lucide-react';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';
import SubscriptionManager from '../components/SubscriptionManager';

function Dashboard() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'orders' | 'subscriptions' | 'settings'>('overview');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [identities, setIdentities] = useState<any[]>([]);
  const [linkingLoading, setLinkingLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getUserIdentities().then(setIdentities).catch(console.error);
    }
  }, [user]);

  const handleLinkGoogle = async () => {
    setLinkingLoading(true);
    try {
      await linkIdentity('google');
      toast.success('Google account linked successfully');
      // Refresh identities
      const newIdentities = await getUserIdentities();
      setIdentities(newIdentities);
    } catch (error) {
      console.error('Failed to link Google account:', error);
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleUnlinkIdentity = async (identity: any) => {
    try {
      await unlinkIdentity(identity);
      // Refresh identities
      const newIdentities = await getUserIdentities();
      setIdentities(newIdentities);
    } catch (error) {
      console.error('Failed to unlink account:', error);
    }
  };

  // Fetch user's orders
  const { data: orders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Fetch user's workout logs
  const { data: workoutLogs } = useQuery({
    queryKey: ['workout_logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id as any)
        .order('workout_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  // Fetch user's active subscription
  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id as any)
        .eq('status', 'active' as any)
        .single();

      return data || null;
    }
  });

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const updates = {
      full_name: formData.get('fullName') as string,
    };

    try {
      await updateProfile(updates);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Dashboard" />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.user_metadata?.full_name || 'Athlete'}!
            </h1>
            <p className="text-gray-600">Track your progress and manage your account</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-jme-purple text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Activity className="w-5 h-5 inline-block mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('workouts')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'workouts'
                  ? 'bg-jme-purple text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Dumbbell className="w-5 h-5 inline-block mr-2" />
              Workouts
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'orders'
                  ? 'bg-jme-purple text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="w-5 h-5 inline-block mr-2" />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'subscriptions'
                  ? 'bg-jme-purple text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-5 h-5 inline-block mr-2" />
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-jme-purple text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5 inline-block mr-2" />
              Settings
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Active Subscription</h3>
                      <CreditCard className="w-6 h-6 text-jme-purple" />
                    </div>
                    {subscription && typeof subscription === 'object' ? (
                      <>
                        <p className="text-2xl font-bold text-gray-900 mb-2">
                          {(subscription as any).plan_id || 'No Plan'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Next billing date:{' '}
                          {(subscription as any).current_period_end 
                            ? format(new Date((subscription as any).current_period_end), 'MMM d, yyyy')
                            : 'N/A'}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">No active subscription</p>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Total Orders</h3>
                      <ShoppingBag className="w-6 h-6 text-jme-purple" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {orders?.length || 0}
                    </p>
                    <p className="text-sm text-gray-500">Lifetime purchases</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Workouts Logged</h3>
                      <Dumbbell className="w-6 h-6 text-jme-purple" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {workoutLogs?.length || 0}
                    </p>
                    <p className="text-sm text-gray-500">This month</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {orders && orders.slice(0, 3).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            <div>
                              <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(order.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-green-600">
                            ${order.total_amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'workouts' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Workout History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Program
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {workoutLogs && Array.isArray(workoutLogs) && workoutLogs.map(log => (
                        <tr key={(log as any).id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date((log as any).workout_date), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(log as any).program_id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {(log as any).notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Order History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders && Array.isArray(orders) && orders.map(order => (
                        <tr key={(order as any).id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {(order as any).id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date((order as any).created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(order as any).order_items?.length || 0} items
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              (order as any).status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : (order as any).status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {(order as any).status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${(order as any).total_amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setOrderDetailsOpen(true);
                              }}
                              className="text-jme-purple hover:text-purple-700"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <SubscriptionManager />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Account Settings</h3>
                </div>
                <div className="p-6">
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        defaultValue={user?.user_metadata?.full_name || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-jme-purple focus:ring-jme-purple"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-jme-purple text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t">
                    <h4 className="text-base font-medium text-gray-900 mb-4">Connected Accounts</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Google className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm text-gray-700">Google</span>
                        </div>
                        {identities.some(id => id.provider === 'google') ? (
                          <button
                            onClick={() => handleUnlinkIdentity(identities.find(id => id.provider === 'google'))}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={handleLinkGoogle}
                            disabled={linkingLoading}
                            className="text-sm text-jme-purple hover:text-purple-700"
                          >
                            {linkingLoading ? 'Connecting...' : 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {orderDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Order Details</h3>
                <button
                  onClick={() => setOrderDetailsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Order ID</h4>
                  <p className="text-gray-900">{selectedOrder.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Date</h4>
                  <p className="text-gray-900">{format(new Date(selectedOrder.created_at), 'MMMM d, yyyy h:mm a')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedOrder.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : selectedOrder.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Total</h4>
                  <p className="text-gray-900 font-medium">${selectedOrder.total_amount}</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-base font-medium text-gray-900 mb-4">Order Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.order_items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.product_name || 'Product'}</p>
                                <p className="text-xs text-gray-500">{item.stripe_product_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">${item.price}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;