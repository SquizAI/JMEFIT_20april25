import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import SEO from '../../components/SEO';
import TabButton from '../../components/admin/TabButton';
import Overview from '../../components/admin/tabs/Overview';
import { supabase } from '../../lib/supabase';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'pricing' | 'invoices' | 'merchandise' | 'waitlist'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [exportLoading, setExportLoading] = useState(false);

  // Queries
  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id(email, full_name),
          order_items(
            *,
            products(*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Query SHRED waitlist
  const { data: waitlistEntries, isLoading: waitlistLoading } = useQuery({
    queryKey: ['shred-waitlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shred_waitlist_view')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: shredOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['shred-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shred_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Set up real-time subscriptions
  useEffect(() => {
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        refetchOrders();
      })
      .subscribe();

    const productsSubscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        refetchProducts();
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      productsSubscription.unsubscribe();
    };
  }, [refetchOrders, refetchProducts]);

  // Calculate filtered orders based on date range
  const getFilteredOrders = () => {
    if (!orders) return [];
    const now = new Date();
    const filtered = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      switch (dateRange) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          return orderDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
          return orderDate >= yearAgo;
        default:
          return true;
      }
    });
    return filtered;
  };

  // Stats calculation
  const stats = React.useMemo(() => {
    const filteredOrders = getFilteredOrders();
    return {
      totalOrders: filteredOrders.length,
      totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
      activeProducts: products?.filter(p => p.active).length || 0,
      averageOrderValue: filteredOrders.length > 0 
        ? (filteredOrders.reduce((sum, order) => sum + order.total, 0) / filteredOrders.length).toFixed(2)
        : '0'
    };
  }, [orders, products, dateRange]);

  // Export functionality
  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const csvData = orders?.map(order => ({
        id: order.id,
        date: format(new Date(order.created_at), 'yyyy-MM-dd'),
        customer: order.profiles?.email,
        total: order.total,
        status: order.status
      }));

      const csv = [
        ['Order ID', 'Date', 'Customer', 'Total', 'Status'],
        ...csvData.map(row => Object.values(row))
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Admin Dashboard" 
        noindex={true}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent bg-white"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              Overview
            </TabButton>
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
              Users
            </TabButton>
            <TabButton active={activeTab === 'pricing'} onClick={() => setActiveTab('pricing')}>
              Pricing
            </TabButton>
            <TabButton active={activeTab === 'invoices'} onClick={() => setActiveTab('invoices')}>
              Invoices
            </TabButton>
            <TabButton active={activeTab === 'merchandise'} onClick={() => setActiveTab('merchandise')}>
              Merchandise
            </TabButton>
            <TabButton active={activeTab === 'waitlist'} onClick={() => setActiveTab('waitlist')}>
              SHRED Waitlist
            </TabButton>
          </div>
        </div>

        {activeTab === 'overview' && (
          <Overview
            stats={stats}
            orders={getFilteredOrders()}
            products={products || []}
            loading={false}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onExport={handleExportData}
          />
        )}

        {activeTab === 'waitlist' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">SHRED Waitlist Entries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Preferred Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Signed Up
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {waitlistLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Loading waitlist entries...
                      </td>
                    </tr>
                  ) : waitlistEntries?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No waitlist entries found
                      </td>
                    </tr>
                  ) : (
                    waitlistEntries?.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.first_name} {entry.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(entry.preferred_start_date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(entry.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'waitlist' && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">SHRED Orders</h3>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Loading orders...
                      </td>
                    </tr>
                  ) : shredOrders?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    shredOrders?.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.first_name} {order.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(order.start_date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(order.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Other tabs remain unchanged */}
      </div>
    </>
  );
}

export default AdminDashboard;