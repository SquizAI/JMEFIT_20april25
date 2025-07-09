import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Percent, DollarSign, Calendar, Plus, Trash2, Copy, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';

interface Coupon {
  id: string;
  name: string;
  percent_off: number | null;
  amount_off: number | null;
  currency?: string;
  duration: 'once' | 'repeating' | 'forever';
  duration_in_months?: number;
  valid: boolean;
  created: number;
  redeem_by?: number; // Unix timestamp for expiration
  metadata?: Record<string, string>;
}

function DiscountCodes() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'percent' as 'percent' | 'amount',
    value: '',
    duration: 'once' as 'once' | 'repeating' | 'forever',
    duration_in_months: '3',
    has_expiration: false,
    expiration_date: '',
    expiration_time: '23:59',
    applicable_products: [] as string[]
  });

  // Fetch coupons from Stripe via MCP
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['stripe-coupons'],
    queryFn: async () => {
      const response = await fetch('/.netlify/functions/list-coupons');
      if (!response.ok) throw new Error('Failed to fetch coupons');
      return response.json();
    },
    refetchInterval: 60000 // Refetch every minute to update expiration status
  });

  // Create coupon mutation
  const createCoupon = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Combine date and time for expiration
      let redeem_by = undefined;
      if (data.has_expiration && data.expiration_date) {
        const dateTime = new Date(`${data.expiration_date}T${data.expiration_time}`);
        redeem_by = Math.floor(dateTime.getTime() / 1000); // Convert to Unix timestamp
      }

      const response = await fetch('/.netlify/functions/create-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          redeem_by
        })
      });
      if (!response.ok) throw new Error('Failed to create coupon');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-coupons'] });
      toast.success('Discount code created successfully!');
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create discount code: ${error.message}`);
    }
  });

  // Delete coupon mutation
  const deleteCoupon = useMutation({
    mutationFn: async (couponId: string) => {
      const response = await fetch('/.netlify/functions/delete-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId })
      });
      if (!response.ok) throw new Error('Failed to delete coupon');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-coupons'] });
      toast.success('Discount code deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete discount code: ${error.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'percent',
      value: '',
      duration: 'once',
      duration_in_months: '3',
      has_expiration: false,
      expiration_date: '',
      expiration_time: '23:59',
      applicable_products: []
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCoupon.mutate(formData);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const getExpirationStatus = (redeem_by?: number) => {
    if (!redeem_by) return null;
    
    const expirationDate = new Date(redeem_by * 1000);
    const now = new Date();
    
    if (isPast(expirationDate)) {
      return { status: 'expired', color: 'red', text: 'Expired' };
    }
    
    const threeDaysFromNow = addDays(now, 3);
    if (isWithinInterval(expirationDate, { start: now, end: threeDaysFromNow })) {
      return { 
        status: 'expiring-soon', 
        color: 'yellow', 
        text: `Expires ${formatDistanceToNow(expirationDate, { addSuffix: true })}` 
      };
    }
    
    return { 
      status: 'active', 
      color: 'green', 
      text: `Expires ${format(expirationDate, 'MMM d, yyyy h:mm a')}` 
    };
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Discount Codes</h3>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Discount Code
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Code Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., SUMMER2024, NEWCLIENT"
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Discount Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percent' | 'amount' })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="percent">Percentage Off</option>
                <option value="amount">Fixed Amount Off</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.type === 'percent' ? 'Percentage (%)' : 'Amount ($)'}
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === 'percent' ? '20' : '50'}
                min="0"
                max={formData.type === 'percent' ? '100' : undefined}
                step={formData.type === 'percent' ? '1' : '0.01'}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="once">Once</option>
                <option value="repeating">Multiple Months</option>
                <option value="forever">Forever</option>
              </select>
            </div>
          </div>

          {formData.duration === 'repeating' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Duration in Months</label>
              <input
                type="number"
                value={formData.duration_in_months}
                onChange={(e) => setFormData({ ...formData, duration_in_months: e.target.value })}
                min="1"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.has_expiration}
                onChange={(e) => setFormData({ ...formData, has_expiration: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Set Expiration Date</span>
            </label>
          </div>

          {formData.has_expiration && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  min={today}
                  className="w-full px-4 py-2 border rounded-lg"
                  required={formData.has_expiration}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expiration Time</label>
                <input
                  type="time"
                  value={formData.expiration_time}
                  onChange={(e) => setFormData({ ...formData, expiration_time: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required={formData.has_expiration}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createCoupon.isPending}
              className="px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark disabled:opacity-50"
            >
              {createCoupon.isPending ? 'Creating...' : 'Create Discount Code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8">Loading discount codes...</div>
        ) : coupons?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No discount codes yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3">Code</th>
                  <th className="text-left pb-3">Discount</th>
                  <th className="text-left pb-3">Duration</th>
                  <th className="text-left pb-3">Status</th>
                  <th className="text-left pb-3">Expiration</th>
                  <th className="text-left pb-3">Created</th>
                  <th className="text-right pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons?.map((coupon: Coupon) => {
                  const expiration = getExpirationStatus(coupon.redeem_by);
                  const isExpired = expiration?.status === 'expired';
                  
                  return (
                    <tr key={coupon.id} className={`border-b ${isExpired ? 'opacity-50' : ''}`}>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                            {coupon.id}
                          </code>
                          <button
                            onClick={() => copyCode(coupon.id)}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={isExpired}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">{coupon.name}</div>
                      </td>
                      <td className="py-3">
                        {coupon.percent_off ? (
                          <div className="flex items-center gap-1">
                            <Percent className="w-4 h-4 text-green-600" />
                            <span>{coupon.percent_off}% off</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span>{formatAmount(coupon.amount_off || 0)} off</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        {coupon.duration === 'once' && 'One time'}
                        {coupon.duration === 'repeating' && `${coupon.duration_in_months} months`}
                        {coupon.duration === 'forever' && 'Forever'}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          isExpired ? 'bg-gray-100 text-gray-800' :
                          coupon.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isExpired ? 'Expired' : coupon.valid ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3">
                        {expiration ? (
                          <div className="flex items-center gap-2">
                            {expiration.status === 'expiring-soon' && (
                              <AlertCircle className={`w-4 h-4 text-${expiration.color}-500`} />
                            )}
                            {expiration.status === 'expired' && (
                              <Clock className={`w-4 h-4 text-${expiration.color}-500`} />
                            )}
                            <span className={`text-sm ${
                              expiration.status === 'expired' ? 'text-red-600' :
                              expiration.status === 'expiring-soon' ? 'text-yellow-600' :
                              'text-gray-600'
                            }`}>
                              {expiration.text}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No expiration</span>
                        )}
                      </td>
                      <td className="py-3">
                        {new Date(coupon.created * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => deleteCoupon.mutate(coupon.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiscountCodes; 