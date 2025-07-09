import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import {
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  MousePointer,
  Eye,
  Target,
  ArrowRight,
  Calendar,
  Filter
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  LineChart,
  Line,
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

interface CampaignMetrics {
  id: string;
  campaign_id: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  spam_count: number;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  sent_at?: string;
  recipient_count: number;
  metrics?: CampaignMetrics;
  ab_test?: {
    variant_a: { subject: string; sent_count: number; open_rate: number };
    variant_b: { subject: string; sent_count: number; open_rate: number };
    winner?: 'a' | 'b';
  };
}

export function CampaignAnalytics() {
  const [dateRange, setDateRange] = useState(30); // days
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Fetch campaigns with metrics
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['email-campaigns', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), dateRange);
      
      const { data, error } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          email_campaign_metrics(*)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process campaign data with metrics
      return data?.map(campaign => ({
        ...campaign,
        metrics: campaign.email_campaign_metrics?.[0] || null
      }));
    }
  });

  // Calculate aggregate metrics
  const aggregateMetrics = campaigns?.reduce((acc, campaign) => {
    if (campaign.metrics) {
      acc.totalSent += campaign.metrics.sent_count;
      acc.totalOpened += campaign.metrics.opened_count;
      acc.totalClicked += campaign.metrics.clicked_count;
      acc.totalUnsubscribed += campaign.metrics.unsubscribed_count;
    }
    return acc;
  }, {
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalUnsubscribed: 0
  }) || { totalSent: 0, totalOpened: 0, totalClicked: 0, totalUnsubscribed: 0 };

  const overallOpenRate = aggregateMetrics.totalSent > 0 
    ? (aggregateMetrics.totalOpened / aggregateMetrics.totalSent * 100).toFixed(1)
    : '0';

  const overallClickRate = aggregateMetrics.totalOpened > 0
    ? (aggregateMetrics.totalClicked / aggregateMetrics.totalOpened * 100).toFixed(1)
    : '0';

  // Prepare chart data
  const performanceData = campaigns?.map(campaign => ({
    name: campaign.name.substring(0, 20) + (campaign.name.length > 20 ? '...' : ''),
    openRate: campaign.metrics ? (campaign.metrics.opened_count / campaign.metrics.sent_count * 100).toFixed(1) : 0,
    clickRate: campaign.metrics && campaign.metrics.opened_count > 0 
      ? (campaign.metrics.clicked_count / campaign.metrics.opened_count * 100).toFixed(1) 
      : 0
  })).slice(0, 10) || [];

  const engagementData = [
    { name: 'Opened', value: aggregateMetrics.totalOpened, color: '#10b981' },
    { name: 'Clicked', value: aggregateMetrics.totalClicked, color: '#3b82f6' },
    { name: 'Unopened', value: aggregateMetrics.totalSent - aggregateMetrics.totalOpened, color: '#e5e7eb' },
    { name: 'Unsubscribed', value: aggregateMetrics.totalUnsubscribed, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Campaign Analytics</h2>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-green-600">+12.5%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {aggregateMetrics.totalSent.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Emails Sent</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-green-600">+8.3%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overallOpenRate}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Open Rate</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <MousePointer className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-red-600">-2.1%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{overallClickRate}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Click Rate</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-yellow-600">0.2%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {aggregateMetrics.totalUnsubscribed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Unsubscribes</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          {/* Campaign Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="openRate" fill="#10b981" name="Open Rate %" />
                <Bar dataKey="clickRate" fill="#3b82f6" name="Click Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Engagement Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Engagement Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Campaign List with A/B Testing */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold">Recent Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left p-4">Campaign</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Sent</th>
                <th className="text-left p-4">Open Rate</th>
                <th className="text-left p-4">Click Rate</th>
                <th className="text-left p-4">A/B Test</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">Loading campaigns...</td>
                </tr>
              ) : campaigns?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">No campaigns found</td>
                </tr>
              ) : (
                campaigns?.map(campaign => {
                  const openRate = campaign.metrics && campaign.metrics.sent_count > 0
                    ? (campaign.metrics.opened_count / campaign.metrics.sent_count * 100).toFixed(1)
                    : '0';
                  const clickRate = campaign.metrics && campaign.metrics.opened_count > 0
                    ? (campaign.metrics.clicked_count / campaign.metrics.opened_count * 100).toFixed(1)
                    : '0';

                  return (
                    <tr key={campaign.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-gray-500">{campaign.subject}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                          campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {campaign.metrics?.sent_count.toLocaleString() || '0'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${openRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{openRate}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${clickRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{clickRate}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {campaign.ab_test ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">A/B Test</span>
                            </div>
                            {campaign.ab_test.winner && (
                              <div className="text-xs text-green-600">
                                Winner: Variant {campaign.ab_test.winner.toUpperCase()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedCampaign(campaign.id)}
                          className="text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* A/B Test Results Modal */}
      {selectedCampaign && (
        <ABTestResultsModal
          campaignId={selectedCampaign}
          campaign={campaigns?.find(c => c.id === selectedCampaign)}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}

// A/B Test Results Modal
function ABTestResultsModal({ campaignId, campaign, onClose }: any) {
  if (!campaign || !campaign.ab_test) return null;

  const variantAOpenRate = campaign.ab_test.variant_a.open_rate;
  const variantBOpenRate = campaign.ab_test.variant_b.open_rate;
  const improvement = ((variantBOpenRate - variantAOpenRate) / variantAOpenRate * 100).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold">A/B Test Results</h3>
            <p className="text-gray-600 dark:text-gray-400">{campaign.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className={`p-4 rounded-lg border-2 ${
            campaign.ab_test.winner === 'a' ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}>
            <h4 className="font-semibold mb-2">Variant A</h4>
            <p className="text-sm text-gray-600 mb-4">{campaign.ab_test.variant_a.subject}</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Sent to:</span>
                <span className="font-medium">{campaign.ab_test.variant_a.sent_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Open rate:</span>
                <span className="font-medium">{variantAOpenRate}%</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            campaign.ab_test.winner === 'b' ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}>
            <h4 className="font-semibold mb-2">Variant B</h4>
            <p className="text-sm text-gray-600 mb-4">{campaign.ab_test.variant_b.subject}</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Sent to:</span>
                <span className="font-medium">{campaign.ab_test.variant_b.sent_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Open rate:</span>
                <span className="font-medium">{variantBOpenRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {campaign.ab_test.winner && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-medium">
                Variant {campaign.ab_test.winner.toUpperCase()} performed {Math.abs(Number(improvement))}% 
                {Number(improvement) > 0 ? ' better' : ' worse'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 