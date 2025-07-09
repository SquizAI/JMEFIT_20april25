import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { calculateYearlyPrice } from '../../../lib/pricing';
import StripeProductsSync from './StripeProductsSync';
import DiscountCodes from './DiscountCodes';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  is_popular: boolean;
  active: boolean;
  created_at: string;
}

interface ServicePricing {
  id: string;
  service_name: string;
  base_price: number;
  discount_percentage?: number;
  promotion_end_date?: string;
  active: boolean;
}

function PricingManager() {
  const [activeTab, setActiveTab] = useState<'pricing-plans' | 'service-pricing' | 'stripe-sync' | 'discount-codes'>('pricing-plans');
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [editingService, setEditingService] = useState<ServicePricing | null>(null);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);

  // Fetch pricing plans
  const { data: pricingPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('monthly_price', { ascending: true });
      
      if (error) throw error;
      return data as PricingPlan[];
    }
  });

  // Fetch service pricing
  const { data: servicePricing, isLoading: servicesLoading } = useQuery({
    queryKey: ['service-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .order('service_name', { ascending: true });
      
      if (error) throw error;
      return data as ServicePricing[];
    }
  });

  // Update pricing plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (plan: PricingPlan) => {
      const { error } = await supabase
        .from('pricing_plans')
        .update({
          name: plan.name,
          description: plan.description,
          monthly_price: plan.monthly_price,
          yearly_price: plan.yearly_price,
          features: plan.features,
          is_popular: plan.is_popular,
          active: plan.active
        })
        .eq('id', plan.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      setEditingPlan(null);
    }
  });

  // Update service pricing mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (service: ServicePricing) => {
      const { error } = await supabase
        .from('service_pricing')
        .update({
          service_name: service.service_name,
          base_price: service.base_price,
          discount_percentage: service.discount_percentage,
          promotion_end_date: service.promotion_end_date,
          active: service.active
        })
        .eq('id', service.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-pricing'] });
      setEditingService(null);
    }
  });

  // Create new pricing plan
  const createPlanMutation = useMutation({
    mutationFn: async (plan: Omit<PricingPlan, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('pricing_plans')
        .insert([plan]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      setShowNewPlanForm(false);
    }
  });

  // Create new service pricing
  const createServiceMutation = useMutation({
    mutationFn: async (service: Omit<ServicePricing, 'id'>) => {
      const { error } = await supabase
        .from('service_pricing')
        .insert([service]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-pricing'] });
      setShowNewServiceForm(false);
    }
  });

  // Delete pricing plan
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
    }
  });

  const handleSavePlan = (plan: PricingPlan) => {
    // Auto-calculate yearly price with 20% discount
    const updatedPlan = {
      ...plan,
      yearly_price: calculateYearlyPrice(plan.monthly_price)
    };
    updatePlanMutation.mutate(updatedPlan);
  };

  const handleCreatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const features = formData.get('features')?.toString().split('\n').filter(f => f.trim()) || [];
    const monthlyPrice = parseFloat(formData.get('monthly_price')?.toString() || '0');
    
    const newPlan: Omit<PricingPlan, 'id' | 'created_at'> = {
      name: formData.get('name')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      monthly_price: monthlyPrice,
      yearly_price: calculateYearlyPrice(monthlyPrice),
      features: features,
      is_popular: formData.get('is_popular') === 'on',
      active: true
    };
    
    createPlanMutation.mutate(newPlan);
  };

  const handleCreateService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newService: Omit<ServicePricing, 'id'> = {
      service_name: formData.get('service_name')?.toString() || '',
      base_price: parseFloat(formData.get('base_price')?.toString() || '0'),
      discount_percentage: formData.get('discount_percentage') ? parseFloat(formData.get('discount_percentage')?.toString() || '0') : undefined,
      promotion_end_date: formData.get('promotion_end_date')?.toString() || undefined,
      active: true
    };
    
    createServiceMutation.mutate(newService);
  };

  if (plansLoading || servicesLoading) {
    return <div className="text-center py-8">Loading pricing data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pricing-plans')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'pricing-plans'
                ? 'bg-jme-purple text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pricing Plans
          </button>
          <button
            onClick={() => setActiveTab('service-pricing')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'service-pricing'
                ? 'bg-jme-purple text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Service Pricing
          </button>
          <button
            onClick={() => setActiveTab('stripe-sync')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'stripe-sync'
                ? 'bg-jme-purple text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Stripe Sync
          </button>
          <button
            onClick={() => setActiveTab('discount-codes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'discount-codes'
                ? 'bg-jme-purple text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Discount Codes
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'stripe-sync' ? (
        <StripeProductsSync />
      ) : activeTab === 'discount-codes' ? (
        <DiscountCodes />
      ) : activeTab === 'pricing-plans' ? (
        /* Subscription Plans Section */
        <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Subscription Plans</h3>
          <button
            onClick={() => setShowNewPlanForm(true)}
            className="px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark transition-colors"
          >
            Add New Plan
          </button>
        </div>
        
        {showNewPlanForm && (
          <form onSubmit={handleCreatePlan} className="p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                name="name"
                placeholder="Plan Name"
                required
                className="px-4 py-2 border rounded-lg"
              />
              <input
                name="monthly_price"
                type="number"
                step="0.01"
                placeholder="Monthly Price"
                required
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <textarea
              name="description"
              placeholder="Description"
              rows={2}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <textarea
              name="features"
              placeholder="Features (one per line)"
              rows={4}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_popular" />
                Mark as Popular
              </label>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Plan
              </button>
              <button
                type="button"
                onClick={() => setShowNewPlanForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yearly Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popular</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pricingPlans?.map((plan) => (
                <tr key={plan.id}>
                  {editingPlan?.id === plan.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          value={editingPlan.name}
                          onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                          className="px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={editingPlan.monthly_price}
                          onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price: parseFloat(e.target.value) })}
                          className="px-2 py-1 border rounded w-24"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        ${calculateYearlyPrice(editingPlan.monthly_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={editingPlan.is_popular}
                          onChange={(e) => setEditingPlan({ ...editingPlan, is_popular: e.target.checked })}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editingPlan.active ? 'active' : 'inactive'}
                          onChange={(e) => setEditingPlan({ ...editingPlan, active: e.target.value === 'active' })}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSavePlan(editingPlan)}
                          className="text-green-600 hover:text-green-900 mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPlan(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium">{plan.name}</td>
                      <td className="px-6 py-4">${plan.monthly_price.toFixed(2)}</td>
                      <td className="px-6 py-4">${plan.yearly_price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {plan.is_popular && (
                          <span className="px-2 py-1 text-xs bg-jme-purple text-white rounded-full">Popular</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setEditingPlan(plan)}
                          className="text-jme-purple hover:text-jme-purple-dark mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this plan?')) {
                              deletePlanMutation.mutate(plan.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : activeTab === 'service-pricing' ? (
        /* Service Pricing Section */
        <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Service Pricing</h3>
          <button
            onClick={() => setShowNewServiceForm(true)}
            className="px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark transition-colors"
          >
            Add New Service
          </button>
        </div>

        {showNewServiceForm && (
          <form onSubmit={handleCreateService} className="p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                name="service_name"
                placeholder="Service Name"
                required
                className="px-4 py-2 border rounded-lg"
              />
              <input
                name="base_price"
                type="number"
                step="0.01"
                placeholder="Base Price"
                required
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                name="discount_percentage"
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="Discount % (optional)"
                className="px-4 py-2 border rounded-lg"
              />
              <input
                name="promotion_end_date"
                type="date"
                placeholder="Promotion End Date"
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Service
              </button>
              <button
                type="button"
                onClick={() => setShowNewServiceForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promo Ends</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {servicePricing?.map((service) => (
                <tr key={service.id}>
                  {editingService?.id === service.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          value={editingService.service_name}
                          onChange={(e) => setEditingService({ ...editingService, service_name: e.target.value })}
                          className="px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={editingService.base_price}
                          onChange={(e) => setEditingService({ ...editingService, base_price: parseFloat(e.target.value) })}
                          className="px-2 py-1 border rounded w-24"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={editingService.discount_percentage || ''}
                          onChange={(e) => setEditingService({ 
                            ...editingService, 
                            discount_percentage: e.target.value ? parseFloat(e.target.value) : undefined 
                          })}
                          className="px-2 py-1 border rounded w-20"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          value={editingService.promotion_end_date || ''}
                          onChange={(e) => setEditingService({ 
                            ...editingService, 
                            promotion_end_date: e.target.value || undefined 
                          })}
                          className="px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editingService.active ? 'active' : 'inactive'}
                          onChange={(e) => setEditingService({ ...editingService, active: e.target.value === 'active' })}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => updateServiceMutation.mutate(editingService)}
                          className="text-green-600 hover:text-green-900 mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingService(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium">{service.service_name}</td>
                      <td className="px-6 py-4">${service.base_price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {service.discount_percentage ? `${service.discount_percentage}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {service.promotion_end_date ? new Date(service.promotion_end_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          service.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setEditingService(service)}
                          className="text-jme-purple hover:text-jme-purple-dark"
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}
    </div>
  );
}

export default PricingManager;