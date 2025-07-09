import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { 
  Search, 
  Filter, 
  Download, 
  Mail, 
  Tag, 
  MoreVertical,
  Calendar,
  DollarSign,
  Activity,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string;
  subscription_status?: string;
  subscription_plan?: string;
  total_spent?: number;
  tags?: string[];
  notes?: string;
  is_active: boolean;
}

export function UserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'subscribed'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');

  // Fetch users with their subscription data
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', filterStatus, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          orders(total, created_at),
          subscriptions(status, price_id, current_period_end)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filterStatus === 'active') {
        query = query.eq('is_active', true);
      } else if (filterStatus === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Apply date range filter
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process user data
      return data?.map(user => ({
        ...user,
        total_spent: user.orders?.reduce((sum: number, order: any) => sum + order.total, 0) || 0,
        subscription_status: user.subscriptions?.[0]?.status || 'none',
        subscription_plan: user.subscriptions?.[0]?.price_id || null,
        is_active: user.last_sign_in_at ? 
          new Date(user.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : 
          false
      }));
    }
  });

  // User activity timeline
  const { data: activities } = useQuery({
    queryKey: ['user-activities', showUserDetails],
    queryFn: async () => {
      if (!showUserDetails) return [];
      
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', showUserDetails)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      return data;
    },
    enabled: !!showUserDetails
  });

  // Bulk email mutation
  const sendBulkEmail = useMutation({
    mutationFn: async ({ userIds, subject, content }: { userIds: string[], subject: string, content: string }) => {
      const response = await fetch('/.netlify/functions/send-bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, subject, content })
      });
      if (!response.ok) throw new Error('Failed to send emails');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Emails sent successfully!');
      setSelectedUsers([]);
      setShowBulkActions(false);
    }
  });

  // Tag users mutation
  const tagUsers = useMutation({
    mutationFn: async ({ userIds, tags }: { userIds: string[], tags: string[] }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ tags })
        .in('id', userIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Tags updated successfully!');
      setSelectedUsers([]);
    }
  });

  // Export users
  const exportUsers = () => {
    const filteredUsers = getFilteredUsers();
    const csv = [
      ['Name', 'Email', 'Joined', 'Last Active', 'Subscription', 'Total Spent', 'Tags'],
      ...filteredUsers.map(user => [
        user.full_name || '',
        user.email,
        format(new Date(user.created_at), 'yyyy-MM-dd'),
        user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'yyyy-MM-dd') : 'Never',
        user.subscription_status,
        `$${(user.total_spent / 100).toFixed(2)}`,
        user.tags?.join(', ') || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Filter users based on search
  const getFilteredUsers = () => {
    if (!users) return [];
    
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' ||
        (filterStatus === 'subscribed' && user.subscription_status === 'active');
        
      return matchesSearch && matchesFilter;
    });
  };

  const filteredUsers = getFilteredUsers();

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <div className="flex gap-3">
            <button
              onClick={exportUsers}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Users</option>
            <option value="active">Active Users</option>
            <option value="inactive">Inactive Users</option>
            <option value="subscribed">Subscribed Users</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-purple-700 dark:text-purple-300">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkActions(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30">
                  <Tag className="w-4 h-4" />
                  Tag
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{users?.length || 0}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {users?.filter(u => u.is_active).length || 0}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Subscribers</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {users?.filter(u => u.subscription_status === 'active').length || 0}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${((users?.reduce((sum, u) => sum + u.total_spent, 0) || 0) / 100).toFixed(0)}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left pb-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={selectAllUsers}
                    className="rounded"
                  />
                </th>
                <th className="text-left pb-3">User</th>
                <th className="text-left pb-3">Status</th>
                <th className="text-left pb-3">Subscription</th>
                <th className="text-left pb-3">Joined</th>
                <th className="text-left pb-3">Last Active</th>
                <th className="text-left pb-3">Total Spent</th>
                <th className="text-left pb-3">Tags</th>
                <th className="text-right pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-3">
                      {user.is_active ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {user.subscription_status === 'active' ? (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                      {user.last_sign_in_at ? 
                        formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true }) :
                        'Never'
                      }
                    </td>
                    <td className="py-3">
                      ${(user.total_spent / 100).toFixed(2)}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {user.tags?.map((tag: string) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setShowUserDetails(user.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && (
        <UserDetailsModal
          userId={showUserDetails}
          user={users?.find(u => u.id === showUserDetails)}
          activities={activities}
          onClose={() => setShowUserDetails(null)}
        />
      )}
    </div>
  );
}

// User Details Modal Component
function UserDetailsModal({ userId, user, activities, onClose }: any) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.full_name || 'No name'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Account Information</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Joined</dt>
                  <dd>{format(new Date(user.created_at), 'MMM d, yyyy')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Last Active</dt>
                  <dd>{user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy') : 'Never'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Total Spent</dt>
                  <dd>${(user.total_spent / 100).toFixed(2)}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Subscription Details</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Status</dt>
                  <dd>{user.subscription_status || 'None'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Plan</dt>
                  <dd>{user.subscription_plan || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Activity Timeline */}
          <div>
            <h4 className="font-semibold mb-4">Activity Timeline</h4>
            <div className="space-y-4">
              {activities?.length === 0 ? (
                <p className="text-gray-500">No activities recorded</p>
              ) : (
                activities?.map((activity: any) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 