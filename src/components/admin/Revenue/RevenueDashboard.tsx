import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Calendar,
  ArrowUp,
  ArrowDown,
  CreditCard,
  RefreshCw,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface RevenueMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface ProductRevenue {
  name: string;
  revenue: number;
  units: number;
  percentage: number;
}

function RevenueDashboard() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);

  // Fetch revenue data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-metrics', dateRange],
    queryFn: async () => {
      // Get date range
      const endDate = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate = startOfMonth(endDate);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch orders within date range
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            quantity,
            price,
            products(name, category)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, order) => 
        sum + (order.order_items?.reduce((itemSum: number, item: any) => 
          itemSum + (item.price * item.quantity), 0) || 0), 0) || 0;

      const totalOrders = orders?.length || 0;
      const uniqueCustomers = new Set(orders?.map(o => o.user_id)).size;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get previous period data for comparison
      let previousStartDate = new Date(startDate);
      let previousEndDate = new Date(startDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);
      
      switch (dateRange) {
        case 'week':
          previousStartDate.setDate(previousStartDate.getDate() - 7);
          break;
        case 'month':
          previousStartDate = startOfMonth(subMonths(startDate, 1));
          previousEndDate = endOfMonth(subMonths(startDate, 1));
          break;
        case 'quarter':
          previousStartDate.setMonth(previousStartDate.getMonth() - 3);
          break;
        case 'year':
          previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
          break;
      }

      const { data: previousOrders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            quantity,
            price
          )
        `)
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString())
        .eq('status', 'completed');

      const previousRevenue = previousOrders?.reduce((sum, order) => 
        sum + (order.order_items?.reduce((itemSum: number, item: any) => 
          itemSum + (item.price * item.quantity), 0) || 0), 0) || 0;

      const previousOrderCount = previousOrders?.length || 0;
      const previousCustomers = new Set(previousOrders?.map(o => o.user_id)).size;

      // Calculate changes
      const revenueChange = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;
      const ordersChange = previousOrderCount > 0 
        ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 
        : 0;
      const customersChange = previousCustomers > 0 
        ? ((uniqueCustomers - previousCustomers) / previousCustomers) * 100 
        : 0;

      return {
        metrics: {
          totalRevenue,
          totalOrders,
          uniqueCustomers,
          averageOrderValue,
          revenueChange,
          ordersChange,
          customersChange
        },
        orders,
        timeSeriesData: generateTimeSeriesData(orders || [], dateRange),
        productRevenue: calculateProductRevenue(orders || [])
      };
    }
  });

  // Fetch subscription metrics
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: async () => {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      const monthlyRecurringRevenue = subscriptions?.reduce((sum, sub) => {
        const amount = sub.price_per_month || 0;
        return sum + amount;
      }, 0) || 0;

      const annualRecurringRevenue = monthlyRecurringRevenue * 12;
      const activeSubscriptions = subscriptions?.length || 0;

      // Calculate churn (simplified - would need historical data for accuracy)
      const churnRate = 5; // Placeholder - implement actual churn calculation

      return {
        mrr: monthlyRecurringRevenue,
        arr: annualRecurringRevenue,
        activeSubscriptions,
        churnRate
      };
    }
  });

  const generateTimeSeriesData = (orders: any[], range: string): RevenueData[] => {
    // Group orders by date
    const grouped = orders.reduce((acc, order) => {
      const date = format(parseISO(order.created_at), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { revenue: 0, orders: 0, customers: new Set() };
      }
      
      const orderRevenue = order.order_items?.reduce((sum: number, item: any) => 
        sum + (item.price * item.quantity), 0) || 0;
      
      acc[date].revenue += orderRevenue;
      acc[date].orders += 1;
      acc[date].customers.add(order.user_id);
      
      return acc;
    }, {} as Record<string, any>);

    // Convert to array format
    return Object.entries(grouped).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
      customers: data.customers.size
    })).sort((a, b) => a.date.localeCompare(b.date));
  };

  const calculateProductRevenue = (orders: any[]): ProductRevenue[] => {
    const productTotals = orders.reduce((acc, order) => {
      order.order_items?.forEach((item: any) => {
        const productName = item.products?.name || 'Unknown Product';
        if (!acc[productName]) {
          acc[productName] = { revenue: 0, units: 0 };
        }
        acc[productName].revenue += item.price * item.quantity;
        acc[productName].units += item.quantity;
      });
      return acc;
    }, {} as Record<string, any>);

    const totalRevenue = Object.values(productTotals).reduce((sum: number, p: any) => 
      sum + p.revenue, 0);

    return Object.entries(productTotals)
      .map(([name, data]: [string, any]) => ({
        name,
        revenue: data.revenue,
        units: data.units,
        percentage: (data.revenue / totalRevenue) * 100
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 products
  };

  const metrics: RevenueMetric[] = [
    {
      label: 'Total Revenue',
      value: revenueData?.metrics.totalRevenue || 0,
      change: revenueData?.metrics.revenueChange || 0,
      trend: (revenueData?.metrics.revenueChange || 0) > 0 ? 'up' : 'down',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-green-600'
    },
    {
      label: 'Total Orders',
      value: revenueData?.metrics.totalOrders || 0,
      change: revenueData?.metrics.ordersChange || 0,
      trend: (revenueData?.metrics.ordersChange || 0) > 0 ? 'up' : 'down',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'text-blue-600'
    },
    {
      label: 'Unique Customers',
      value: revenueData?.metrics.uniqueCustomers || 0,
      change: revenueData?.metrics.customersChange || 0,
      trend: (revenueData?.metrics.customersChange || 0) > 0 ? 'up' : 'down',
      icon: <Users className="w-6 h-6" />,
      color: 'text-purple-600'
    },
    {
      label: 'Average Order Value',
      value: revenueData?.metrics.averageOrderValue || 0,
      change: 0, // Calculate if needed
      trend: 'neutral',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'text-orange-600'
    }
  ];

  const subscriptionMetrics: RevenueMetric[] = [
    {
      label: 'Monthly Recurring Revenue',
      value: subscriptionData?.mrr || 0,
      change: 0,
      trend: 'neutral',
      icon: <RefreshCw className="w-6 h-6" />,
      color: 'text-indigo-600'
    },
    {
      label: 'Annual Recurring Revenue',
      value: subscriptionData?.arr || 0,
      change: 0,
      trend: 'neutral',
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-pink-600'
    }
  ];

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const exportData = () => {
    // Implement CSV export
    const csvData = revenueData?.timeSeriesData.map(row => ({
      Date: row.date,
      Revenue: row.revenue,
      Orders: row.orders,
      Customers: row.customers
    }));
    
    console.log('Export data:', csvData);
    // Implement actual CSV download
  };

  if (revenueLoading || subscriptionLoading) {
    return <div className="text-center py-8">Loading revenue data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h2>
            <p className="text-gray-600 mt-1">Track your business performance and growth</p>
          </div>
          <div className="flex gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={metric.color}>{metric.icon}</div>
              {metric.trend !== 'neutral' && (
                <div className={`flex items-center gap-1 text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(metric.change).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">{metric.label}</p>
            <p className="text-2xl font-bold mt-1">
              {metric.label.includes('Revenue') || metric.label.includes('Value') 
                ? `$${metric.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : metric.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Subscription Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subscriptionMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={metric.color}>{metric.icon}</div>
            </div>
            <p className="text-sm text-gray-600">{metric.label}</p>
            <p className="text-2xl font-bold mt-1">
              ${metric.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-6">Revenue Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData?.timeSeriesData || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(parseISO(date), 'MMM d')}
            />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <Tooltip 
              formatter={(value: any) => `$${value.toLocaleString()}`}
              labelFormatter={(date) => format(parseISO(date), 'MMM d, yyyy')}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#8b5cf6" 
              fill="#8b5cf6" 
              fillOpacity={0.3} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders and Customers Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-6">Orders & Customers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData?.timeSeriesData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(parseISO(date), 'MMM d')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(parseISO(date), 'MMM d, yyyy')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#3b82f6" 
                name="Orders"
              />
              <Line 
                type="monotone" 
                dataKey="customers" 
                stroke="#10b981" 
                name="Customers"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-6">Top Products by Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueData?.productRevenue || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} (${entry.percentage.toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {revenueData?.productRevenue.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Product Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {revenueData?.productRevenue.map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 font-medium">{product.name}</td>
                  <td className="px-6 py-4">${product.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4">{product.units}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-jme-purple h-2 rounded-full"
                          style={{ width: `${product.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{product.percentage.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RevenueDashboard;