import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, parseISO } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import { 
  Calendar, 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';

interface ShredCohort {
  id: string;
  cohort_name: string;
  start_date: string;
  end_date: string;
  enrollment_start: string;
  enrollment_end: string;
  max_participants: number;
  current_participants: number;
  price: number;
  status: 'planning' | 'enrolling' | 'active' | 'completed';
  description?: string;
  features?: string[];
  created_at: string;
}

interface ShredParticipant {
  id: string;
  user_id: string;
  cohort_id: string;
  enrolled_at: string;
  status: 'active' | 'completed' | 'dropped';
  progress_percentage: number;
  user?: {
    email: string;
    full_name: string;
  };
}

function ShredManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'cohorts' | 'participants' | 'analytics'>('cohorts');
  const [showNewCohortForm, setShowNewCohortForm] = useState(false);
  const [editingCohort, setEditingCohort] = useState<ShredCohort | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);

  // Fetch SHRED cohorts
  const { data: cohorts, isLoading: cohortsLoading } = useQuery({
    queryKey: ['shred-cohorts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shred_cohorts')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as ShredCohort[];
    }
  });

  // Fetch participants for selected cohort
  const { data: participants, isLoading: participantsLoading } = useQuery({
    queryKey: ['shred-participants', selectedCohort],
    queryFn: async () => {
      if (!selectedCohort) return [];
      
      const { data, error } = await supabase
        .from('shred_participants')
        .select(`
          *,
          user:profiles(email, full_name)
        `)
        .eq('cohort_id', selectedCohort)
        .order('enrolled_at', { ascending: false });
      
      if (error) throw error;
      return data as ShredParticipant[];
    },
    enabled: !!selectedCohort
  });

  // Create cohort mutation
  const createCohortMutation = useMutation({
    mutationFn: async (cohort: Omit<ShredCohort, 'id' | 'created_at' | 'current_participants'>) => {
      const { error } = await supabase
        .from('shred_cohorts')
        .insert([{ ...cohort, current_participants: 0 }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shred-cohorts'] });
      setShowNewCohortForm(false);
    }
  });

  // Update cohort mutation
  const updateCohortMutation = useMutation({
    mutationFn: async (cohort: ShredCohort) => {
      const { error } = await supabase
        .from('shred_cohorts')
        .update({
          cohort_name: cohort.cohort_name,
          start_date: cohort.start_date,
          end_date: cohort.end_date,
          enrollment_start: cohort.enrollment_start,
          enrollment_end: cohort.enrollment_end,
          max_participants: cohort.max_participants,
          price: cohort.price,
          status: cohort.status,
          description: cohort.description,
          features: cohort.features
        })
        .eq('id', cohort.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shred-cohorts'] });
      setEditingCohort(null);
    }
  });

  // Delete cohort mutation
  const deleteCohortMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shred_cohorts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shred-cohorts'] });
    }
  });

  const handleCreateCohort = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const startDate = formData.get('start_date')?.toString() || '';
    const endDate = addDays(parseISO(startDate), 42).toISOString(); // 6-week program
    
    const newCohort: Omit<ShredCohort, 'id' | 'created_at' | 'current_participants'> = {
      cohort_name: formData.get('cohort_name')?.toString() || '',
      start_date: startDate,
      end_date: endDate,
      enrollment_start: formData.get('enrollment_start')?.toString() || '',
      enrollment_end: formData.get('enrollment_end')?.toString() || '',
      max_participants: parseInt(formData.get('max_participants')?.toString() || '50'),
      price: parseFloat(formData.get('price')?.toString() || '297'),
      status: 'planning',
      description: formData.get('description')?.toString() || '',
      features: [
        '6-week intensive transformation program',
        'Daily workouts and meal plans',
        'Weekly check-ins with coaches',
        'Private community access',
        'Progress tracking and accountability'
      ]
    };
    
    createCohortMutation.mutate(newCohort);
  };

  const getStatusColor = (status: ShredCohort['status']) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'enrolling': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ShredCohort['status']) => {
    switch (status) {
      case 'planning': return <Clock className="w-4 h-4" />;
      case 'enrolling': return <Users className="w-4 h-4" />;
      case 'active': return <TrendingUp className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (cohortsLoading) {
    return <div className="text-center py-8">Loading SHRED data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">SHRED Program Management</h2>
            <p className="text-gray-600 mt-1">Manage cohorts, participants, and program dates</p>
          </div>
          <button
            onClick={() => setShowNewCohortForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark"
          >
            <Plus className="w-5 h-5" />
            New Cohort
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-6 border-b">
          <button
            onClick={() => setActiveTab('cohorts')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'cohorts' 
                ? 'border-jme-purple text-jme-purple' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Cohorts
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'participants' 
                ? 'border-jme-purple text-jme-purple' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Participants
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'analytics' 
                ? 'border-jme-purple text-jme-purple' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* New Cohort Form */}
      {showNewCohortForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Create New SHRED Cohort</h3>
          <form onSubmit={handleCreateCohort} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cohort Name</label>
                <input
                  name="cohort_name"
                  placeholder="e.g., Spring 2024 SHRED"
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue="297.00"
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Program Start Date</label>
                <input
                  name="start_date"
                  type="date"
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Participants</label>
                <input
                  name="max_participants"
                  type="number"
                  defaultValue="50"
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Enrollment Start</label>
                <input
                  name="enrollment_start"
                  type="date"
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Enrollment End</label>
                <input
                  name="enrollment_end"
                  type="date"
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Brief description of this cohort..."
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Cohort
              </button>
              <button
                type="button"
                onClick={() => setShowNewCohortForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cohorts Tab */}
      {activeTab === 'cohorts' && (
        <div className="space-y-4">
          {cohorts?.map((cohort) => (
            <div key={cohort.id} className="bg-white rounded-lg shadow p-6">
              {editingCohort?.id === cohort.id ? (
                // Edit mode
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      value={editingCohort.cohort_name}
                      onChange={(e) => setEditingCohort({ ...editingCohort, cohort_name: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      value={editingCohort.price}
                      onChange={(e) => setEditingCohort({ ...editingCohort, price: parseFloat(e.target.value) })}
                      className="px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={editingCohort.start_date.split('T')[0]}
                      onChange={(e) => setEditingCohort({ ...editingCohort, start_date: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <select
                      value={editingCohort.status}
                      onChange={(e) => setEditingCohort({ ...editingCohort, status: e.target.value as ShredCohort['status'] })}
                      className="px-4 py-2 border rounded-lg"
                    >
                      <option value="planning">Planning</option>
                      <option value="enrolling">Enrolling</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => updateCohortMutation.mutate(editingCohort)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCohort(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-semibold">{cohort.cohort_name}</h3>
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusColor(cohort.status)}`}>
                        {getStatusIcon(cohort.status)}
                        {cohort.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Start Date:</span>
                        <p className="font-medium">{format(parseISO(cohort.start_date), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">End Date:</span>
                        <p className="font-medium">{format(parseISO(cohort.end_date), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Participants:</span>
                        <p className="font-medium">{cohort.current_participants} / {cohort.max_participants}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <p className="font-medium">${cohort.price}</p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">Enrollment:</span> {format(parseISO(cohort.enrollment_start), 'MMM d')} - {format(parseISO(cohort.enrollment_end), 'MMM d, yyyy')}</p>
                    </div>

                    {cohort.description && (
                      <p className="text-sm text-gray-600 mt-2">{cohort.description}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCohort(cohort.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View participants"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setEditingCohort(cohort)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this cohort?')) {
                          deleteCohortMutation.mutate(cohort.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div className="bg-white rounded-lg shadow">
          {selectedCohort ? (
            <>
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">
                  Participants - {cohorts?.find(c => c.id === selectedCohort)?.cohort_name}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {participants?.map((participant) => (
                      <tr key={participant.id}>
                        <td className="px-6 py-4">{participant.user?.full_name || 'N/A'}</td>
                        <td className="px-6 py-4">{participant.user?.email}</td>
                        <td className="px-6 py-4">{format(parseISO(participant.enrolled_at), 'MMM d, yyyy')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-jme-purple h-2 rounded-full"
                                style={{ width: `${participant.progress_percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{participant.progress_percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            participant.status === 'active' ? 'bg-green-100 text-green-800' :
                            participant.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {participant.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-gray-500">
              Select a cohort from the Cohorts tab to view participants
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Total Revenue</h3>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold">
              ${cohorts?.reduce((sum, c) => sum + (c.current_participants * c.price), 0).toLocaleString() || '0'}
            </p>
            <p className="text-sm text-gray-600 mt-1">Across all cohorts</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Total Participants</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">
              {cohorts?.reduce((sum, c) => sum + c.current_participants, 0) || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Active and completed</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Completion Rate</h3>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">87%</p>
            <p className="text-sm text-gray-600 mt-1">Average across cohorts</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShredManager;