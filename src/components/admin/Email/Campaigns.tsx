import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import EmailBuilder from './Builder';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  template_id?: string;
  recipient_list: string[];
  recipient_segments: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  sent_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
  updated_at: string;
}

interface RecipientSegment {
  id: string;
  name: string;
  criteria: any;
  member_count: number;
}

function EmailCampaigns() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'campaigns' | 'builder' | 'analytics'>('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['email-campaigns', statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as EmailCampaign[];
    }
  });

  // Fetch recipient segments
  const { data: segments } = useQuery({
    queryKey: ['recipient-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipient_segments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as RecipientSegment[];
    }
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at' | 'sent_count' | 'open_count' | 'click_count'>) => {
      const { error } = await supabase
        .from('email_campaigns')
        .insert([{
          ...campaign,
          sent_count: 0,
          open_count: 0,
          click_count: 0
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setShowNewCampaignForm(false);
    }
  });

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmailCampaign> }) => {
      const { error } = await supabase
        .from('email_campaigns')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    }
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      // In real implementation, this would trigger email sending service
      const { error } = await supabase
        .from('email_campaigns')
        .update({ 
          status: 'sending',
          sent_at: new Date().toISOString()
        })
        .eq('id', campaignId);
      
      if (error) throw error;
      
      // Simulate sending completion
      setTimeout(async () => {
        await supabase
          .from('email_campaigns')
          .update({ status: 'sent' })
          .eq('id', campaignId);
        queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      }, 3000);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
    }
  });

  const handleCreateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const segments = formData.getAll('segments').map(s => s.toString());
    
    const newCampaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at' | 'sent_count' | 'open_count' | 'click_count'> = {
      name: formData.get('name')?.toString() || '',
      subject: formData.get('subject')?.toString() || '',
      recipient_segments: segments,
      recipient_list: [],
      status: 'draft',
      scheduled_at: formData.get('scheduled_at')?.toString() || undefined,
      sent_at: undefined
    };
    
    createCampaignMutation.mutate(newCampaign);
  };

  const getStatusColor = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateOpenRate = (campaign: EmailCampaign) => {
    if (campaign.sent_count === 0) return 0;
    return Math.round((campaign.open_count / campaign.sent_count) * 100);
  };

  const calculateClickRate = (campaign: EmailCampaign) => {
    if (campaign.sent_count === 0) return 0;
    return Math.round((campaign.click_count / campaign.sent_count) * 100);
  };

  if (activeView === 'builder') {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setActiveView('campaigns')}
            className="px-4 py-2 text-jme-purple hover:text-jme-purple-dark"
          >
            ← Back to Campaigns
          </button>
        </div>
        <EmailBuilder />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Campaigns</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('builder')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Email Builder
          </button>
          <button
            onClick={() => setShowNewCampaignForm(true)}
            className="px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark"
          >
            New Campaign
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* New Campaign Form */}
      {showNewCampaignForm && (
        <form onSubmit={handleCreateCampaign} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Campaign</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              name="name"
              placeholder="Campaign Name"
              required
              className="px-4 py-2 border rounded-lg"
            />
            <input
              name="subject"
              placeholder="Email Subject"
              required
              className="px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Target Segments</label>
            <div className="grid grid-cols-3 gap-2">
              {segments?.map(segment => (
                <label key={segment.id} className="flex items-center gap-2">
                  <input type="checkbox" name="segments" value={segment.id} />
                  {segment.name} ({segment.member_count} members)
                </label>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Schedule Send (Optional)</label>
            <input
              name="scheduled_at"
              type="datetime-local"
              className="px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Campaign
            </button>
            <button
              type="button"
              onClick={() => setShowNewCampaignForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaignsLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No campaigns found
                  </td>
                </tr>
              ) : (
                campaigns?.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4 font-medium">{campaign.name}</td>
                    <td className="px-6 py-4">{campaign.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {campaign.sent_count > 0 ? campaign.sent_count : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {campaign.status === 'sent' ? `${calculateOpenRate(campaign)}%` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {campaign.status === 'sent' ? `${calculateClickRate(campaign)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {format(parseISO(campaign.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setActiveView('builder');
                              }}
                              className="text-jme-purple hover:text-jme-purple-dark text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => sendCampaignMutation.mutate(campaign.id)}
                              className="text-green-600 hover:text-green-700 text-sm"
                            >
                              Send
                            </button>
                          </>
                        )}
                        {campaign.status === 'sent' && (
                          <button
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            View Report
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Stats */}
      {campaigns && campaigns.filter(c => c.status === 'sent').length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Total Sent</h4>
            <p className="text-2xl font-bold">
              {campaigns.filter(c => c.status === 'sent').reduce((sum, c) => sum + c.sent_count, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Avg Open Rate</h4>
            <p className="text-2xl font-bold">
              {Math.round(
                campaigns
                  .filter(c => c.status === 'sent')
                  .reduce((sum, c) => sum + calculateOpenRate(c), 0) / 
                campaigns.filter(c => c.status === 'sent').length
              )}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Avg Click Rate</h4>
            <p className="text-2xl font-bold">
              {Math.round(
                campaigns
                  .filter(c => c.status === 'sent')
                  .reduce((sum, c) => sum + calculateClickRate(c), 0) / 
                campaigns.filter(c => c.status === 'sent').length
              )}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Active Campaigns</h4>
            <p className="text-2xl font-bold">
              {campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailCampaigns;