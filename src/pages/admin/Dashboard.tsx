import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import SEO from '../../components/SEO';
import { AdminSidebar } from '../../components/admin/Sidebar';
import Overview from '../../components/admin/Overview';
import PricingManager from '../../components/admin/Pricing';
import DateManager from '../../components/admin/DateManager';
import { EmailCampaigns } from '../../components/admin/Email';
import { ThemeToggle } from '../../components/admin/Theme';
import { Analytics } from '../../components/admin/Analytics';
import { GlobalSearch } from '../../components/admin/Search';
import { QuickActions } from '../../components/admin/QuickActions';
import { ActivityTimeline } from '../../components/admin/ActivityTimeline';
import { UserManagement } from '../../components/admin/Users/UserManagement';
import { CustomizableDashboard } from '../../components/admin/Dashboard/CustomizableDashboard';
import { IntegrationHub } from '../../components/admin/Integrations/IntegrationHub';
import { NotificationCenter } from '../../components/admin/Notifications/NotificationCenter';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Mail,
  Clock,
  Package,
  FileText,
  BarChart3,
  MessageSquare,
  Search,
  Bell,
  Link2,
  Home,
  ShoppingCart,
  TrendingUp,
  GitBranch,
  HelpCircle,
  Settings,
  BarChart,
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { FinancialReports } from '../../components/admin/Analytics/FinancialReports';
import { ContentManagement } from '../../components/admin/Content/ContentManagement';
import { AutomatedWorkflows } from '../../components/admin/Workflows/AutomatedWorkflows';
import { CustomerSupport } from '../../components/admin/Support/CustomerSupport';
import { AdvancedScheduling } from '../../components/admin/Scheduling/AdvancedScheduling';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboard' | 'users' | 'pricing' | 'dates' | 'invoices' | 'merchandise' | 'waitlist' | 'analytics' | 'communications' | 'notifications' | 'integrations' | 'orders' | 'settings' | 'financial' | 'content' | 'workflows' | 'support' | 'scheduling'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [exportLoading, setExportLoading] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Queries
  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        ...(csvData || []).map(row => Object.values(row))
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

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'dashboard', label: 'Custom Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'users', label: 'Users', icon: <Users size={20} /> },
    { id: 'pricing', label: 'Pricing', icon: <DollarSign size={20} /> },
    { id: 'dates', label: 'Dates', icon: <Calendar size={20} /> },
    { id: 'invoices', label: 'Invoices', icon: <FileText size={20} /> },
    { id: 'merchandise', label: 'Merchandise', icon: <Package size={20} /> },
    { id: 'waitlist', label: 'SHRED Waitlist', icon: <Clock size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'communications', label: 'Communications', icon: <Mail size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'integrations', label: 'Integrations', icon: <Link2 size={20} /> }
  ];

  const tabOptions = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'dates', label: 'Dates', icon: Calendar },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'financial', label: 'Financial', icon: TrendingUp },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'workflows', label: 'Workflows', icon: GitBranch },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'scheduling', label: 'Scheduling', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <SEO 
        title="Admin Dashboard" 
        noindex={true}
      />
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowGlobalSearch(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Search size={16} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Search...</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">⌘K</kbd>
                </button>
                <ThemeToggle />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
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

        {activeTab === 'pricing' && <PricingManager />}
        
        {activeTab === 'dates' && <DateManager />}
        
        {activeTab === 'communications' && <EmailCampaigns />}

        {activeTab === 'analytics' && (
          <Analytics 
            orders={getFilteredOrders()} 
            products={products || []} 
            dateRange={dateRange}
          />
        )}

        {activeTab === 'dashboard' && <CustomizableDashboard />}

        {activeTab === 'users' && (
          <UserManagement />
        )}

        {activeTab === 'notifications' && <NotificationCenter />}

        {activeTab === 'integrations' && <IntegrationHub />}

        {activeTab === 'waitlist' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SHRED Waitlist Entries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
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

        {activeTab === 'financial' && <FinancialReports />}
        {activeTab === 'content' && <ContentManagement />}
        {activeTab === 'workflows' && <AutomatedWorkflows />}
        {activeTab === 'support' && <CustomerSupport />}
        {activeTab === 'scheduling' && <AdvancedScheduling />}

            {/* Other tabs remain unchanged */}
          </div>
        </div>
      </div>
      <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
      <QuickActions />
    </>
  );
}

export default AdminDashboard;