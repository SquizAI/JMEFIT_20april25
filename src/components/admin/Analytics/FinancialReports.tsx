import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  AlertCircle,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'react-hot-toast';

interface RevenueMetric {
  metric_date: string;
  mrr: number;
  arr: number;
  new_mrr: number;
  churned_mrr: number;
  expansion_mrr: number;
  contraction_mrr: number;
  active_subscriptions: number;
  new_customers: number;
  churned_customers: number;
}

export function FinancialReports() {
  const [dateRange, setDateRange] = useState(6); // months
  const [selectedMetric, setSelectedMetric] = useState<'mrr' | 'customers' | 'churn'>('mrr');

  // Fetch revenue metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['revenue-metrics', dateRange],
    queryFn: async () => {
      const startDate = startOfMonth(subMonths(new Date(), dateRange));
      
      const { data, error } = await supabase
        .from('revenue_metrics')
        .select('*')
        .gte('metric_date', startDate.toISOString())
        .order('metric_date', { ascending: true });

      if (error) throw error;
      return data as RevenueMetric[];
    }
  });

  // Fetch payment failures
  const { data: paymentFailures } = useQuery({
    queryKey: ['payment-failures', dateRange],
    queryFn: async () => {
      const startDate = subMonths(new Date(), dateRange);
      
      const { data, error } = await supabase
        .from('payment_analytics')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Calculate current metrics
  const currentMetrics = metrics?.[metrics.length - 1];
  const previousMetrics = metrics?.[metrics.length - 2];

  const mrrGrowth = currentMetrics && previousMetrics
    ? ((currentMetrics.mrr - previousMetrics.mrr) / previousMetrics.mrr * 100).toFixed(1)
    : '0';

  const churnRate = currentMetrics && currentMetrics.active_subscriptions > 0
    ? (currentMetrics.churned_customers / currentMetrics.active_subscriptions * 100).toFixed(1)
    : '0';

  // Calculate CLV (Customer Lifetime Value)
  const avgRevPerCustomer = currentMetrics && currentMetrics.active_subscriptions > 0
    ? currentMetrics.mrr / currentMetrics.active_subscriptions
    : 0;
  const avgCustomerLifespan = Number(churnRate) > 0 ? 1 / (Number(churnRate) / 100) : 12; // months
  const clv = (avgRevPerCustomer * avgCustomerLifespan).toFixed(2);

  // Prepare chart data
  const mrrChartData = metrics?.map(m => ({
    date: format(new Date(m.metric_date), 'MMM yyyy'),
    MRR: m.mrr,
    'New MRR': m.new_mrr,
    'Churned MRR': -m.churned_mrr,
    'Expansion MRR': m.expansion_mrr,
    'Contraction MRR': -m.contraction_mrr
  })) || [];

  const customerChartData = metrics?.map(m => ({
    date: format(new Date(m.metric_date), 'MMM yyyy'),
    'Active Customers': m.active_subscriptions,
    'New Customers': m.new_customers,
    'Churned Customers': -m.churned_customers
  })) || [];

  const revenueBreakdown = [
    { name: 'New MRR', value: currentMetrics?.new_mrr || 0, color: '#10b981' },
    { name: 'Expansion MRR', value: currentMetrics?.expansion_mrr || 0, color: '#3b82f6' },
    { name: 'Recurring MRR', value: (currentMetrics?.mrr || 0) - (currentMetrics?.new_mrr || 0) - (currentMetrics?.expansion_mrr || 0), color: '#6366f1' },
    { name: 'Churned MRR', value: currentMetrics?.churned_mrr || 0, color: '#ef4444' }
  ];

  // Export financial report
  const exportReport = () => {
    if (!metrics) return;

    const csv = [
      ['Date', 'MRR', 'ARR', 'New MRR', 'Churned MRR', 'Active Subscriptions', 'Churn Rate'],
      ...metrics.map(m => [
        format(new Date(m.metric_date), 'yyyy-MM-dd'),
        m.mrr,
        m.arr,
        m.new_mrr,
        m.churned_mrr,
        m.active_subscriptions,
        m.active_subscriptions > 0 ? (m.churned_customers / m.active_subscriptions * 100).toFixed(2) + '%' : '0%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Financial report exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports & Analytics</h2>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
              <option value={24}>Last 24 months</option>
            </select>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className={`text-sm flex items-center gap-1 ${Number(mrrGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(mrrGrowth) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(Number(mrrGrowth))}%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${currentMetrics?.mrr.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Recurring Revenue</div>
            <div className="text-xs text-gray-500 mt-1">
              ARR: ${((currentMetrics?.mrr || 0) * 12).toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-green-600">
                +{currentMetrics?.new_customers || 0}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentMetrics?.active_subscriptions || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Subscriptions</div>
            <div className="text-xs text-gray-500 mt-1">
              Net: +{(currentMetrics?.new_customers || 0) - (currentMetrics?.churned_customers || 0)}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-600">CLV</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${clv}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Customer Lifetime Value</div>
            <div className="text-xs text-gray-500 mt-1">
              Avg lifespan: {avgCustomerLifespan.toFixed(1)} months
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-600">Monthly</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {churnRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Churn Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              Lost: {currentMetrics?.churned_customers || 0} customers
            </div>
          </div>
        </div>

        {/* Chart Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedMetric('mrr')}
            className={`px-4 py-2 rounded-lg ${
              selectedMetric === 'mrr' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            MRR Breakdown
          </button>
          <button
            onClick={() => setSelectedMetric('customers')}
            className={`px-4 py-2 rounded-lg ${
              selectedMetric === 'customers' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Customer Growth
          </button>
          <button
            onClick={() => setSelectedMetric('churn')}
            className={`px-4 py-2 rounded-lg ${
              selectedMetric === 'churn' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Revenue Breakdown
          </button>
        </div>

        {/* Charts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-gray-500">Loading financial data...</div>
            </div>
          ) : (
            <>
              {selectedMetric === 'mrr' && (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={mrrChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => typeof value === 'number' ? `$${value.toLocaleString()}` : '$0'} />
                    <Legend />
                    <Area type="monotone" dataKey="MRR" stackId="1" stroke="#6366f1" fill="#6366f1" />
                    <Area type="monotone" dataKey="New MRR" stackId="2" stroke="#10b981" fill="#10b981" />
                    <Area type="monotone" dataKey="Expansion MRR" stackId="2" stroke="#3b82f6" fill="#3b82f6" />
                    <Area type="monotone" dataKey="Churned MRR" stackId="2" stroke="#ef4444" fill="#ef4444" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {selectedMetric === 'customers' && (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={customerChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Active Customers" stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="New Customers" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="Churned Customers" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {selectedMetric === 'churn' && (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => typeof value === 'number' ? `$${value.toLocaleString()}` : '$0'} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment Failures */}
      {paymentFailures && paymentFailures.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold">Recent Payment Failures</h3>
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
              {paymentFailures.length} failures
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left pb-3">Date</th>
                  <th className="text-left pb-3">Customer</th>
                  <th className="text-left pb-3">Amount</th>
                  <th className="text-left pb-3">Reason</th>
                  <th className="text-left pb-3">Retries</th>
                </tr>
              </thead>
              <tbody>
                {paymentFailures.slice(0, 5).map((failure: any) => (
                  <tr key={failure.id} className="border-b dark:border-gray-700">
                    <td className="py-3 text-sm">
                      {format(new Date(failure.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3 text-sm">{failure.user_id}</td>
                    <td className="py-3 text-sm">${failure.amount}</td>
                    <td className="py-3 text-sm text-red-600">{failure.failure_reason}</td>
                    <td className="py-3 text-sm">{failure.retry_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 