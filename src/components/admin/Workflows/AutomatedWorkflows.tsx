import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import {
  GitBranch,
  Mail,
  ShoppingCart,
  Clock,
  Users,
  Zap,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  Filter,
  Target,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Workflow {
  id: string;
  name: string;
  type: 'email_sequence' | 'cart_recovery' | 'welcome_series' | 'win_back' | 'custom';
  status: 'active' | 'paused' | 'draft';
  trigger: string;
  conditions: any[];
  actions: WorkflowAction[];
  stats: {
    enrolled: number;
    completed: number;
    conversion_rate: number;
    revenue_generated: number;
  };
  created_at: string;
  updated_at: string;
}

interface WorkflowAction {
  id: string;
  type: 'send_email' | 'wait' | 'condition' | 'tag' | 'webhook';
  config: any;
  order: number;
}

export function AutomatedWorkflows() {
  const [activeTab, setActiveTab] = useState<'workflows' | 'sequences' | 'recovery'>('workflows');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Workflow[];
    }
  });

  // Fetch cart recovery stats
  const { data: cartRecoveryStats } = useQuery({
    queryKey: ['cart-recovery-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cart_recovery_analytics')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Toggle workflow status
  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'paused' }) => {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow status updated!');
    }
  });

  // Delete workflow
  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted!');
    }
  });

  const workflowTemplates = [
    {
      type: 'email_sequence',
      name: 'Welcome Series',
      description: 'Onboard new subscribers with a 5-email sequence',
      icon: Mail,
      color: 'blue'
    },
    {
      type: 'cart_recovery',
      name: 'Cart Recovery',
      description: 'Recover abandoned carts with timed reminders',
      icon: ShoppingCart,
      color: 'green'
    },
    {
      type: 'win_back',
      name: 'Win-Back Campaign',
      description: 'Re-engage inactive customers',
      icon: Users,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Automated Workflows</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'workflows' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Workflows
            </button>
            <button
              onClick={() => setActiveTab('sequences')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'sequences' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Email Sequences
            </button>
            <button
              onClick={() => setActiveTab('recovery')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'recovery' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Cart Recovery
            </button>
          </div>
        </div>

        {/* All Workflows Tab */}
        {activeTab === 'workflows' && (
          <div>
            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600">Active</span>
                </div>
                <div className="text-2xl font-bold">{workflows?.filter(w => w.status === 'active').length || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Workflows</div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-600">Total</span>
                </div>
                <div className="text-2xl font-bold">
                  {workflows?.reduce((sum, w) => sum + (w.stats?.enrolled || 0), 0) || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Users Enrolled</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-purple-600">Avg</span>
                </div>
                <div className="text-2xl font-bold">
                  {workflows?.length 
                    ? (workflows.reduce((sum, w) => sum + (w.stats?.conversion_rate || 0), 0) / workflows.length).toFixed(1)
                    : '0'}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-yellow-600">Revenue</span>
                </div>
                <div className="text-2xl font-bold">
                  ${workflows?.reduce((sum, w) => sum + (w.stats?.revenue_generated || 0), 0).toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Generated</div>
              </div>
            </div>

            {/* Workflow Templates */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Quick Start Templates</h3>
              <div className="grid grid-cols-3 gap-4">
                {workflowTemplates.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => {
                      setEditingWorkflow({
                        id: '',
                        name: template.name,
                        type: template.type as Workflow['type'],
                        status: 'draft',
                        trigger: '',
                        conditions: [],
                        actions: [],
                        stats: { enrolled: 0, completed: 0, conversion_rate: 0, revenue_generated: 0 },
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      });
                      setShowBuilder(true);
                    }}
                    className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <template.icon className={`w-6 h-6 text-${template.color}-600`} />
                      <h4 className="font-medium">{template.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Workflows List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left pb-3">Workflow</th>
                    <th className="text-left pb-3">Type</th>
                    <th className="text-left pb-3">Status</th>
                    <th className="text-left pb-3">Enrolled</th>
                    <th className="text-left pb-3">Conversion</th>
                    <th className="text-left pb-3">Revenue</th>
                    <th className="text-left pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows?.map((workflow) => (
                    <tr key={workflow.id} className="border-b dark:border-gray-700">
                      <td className="py-3">
                        <div className="font-medium">{workflow.name}</div>
                        <div className="text-sm text-gray-500">
                          Created {format(new Date(workflow.created_at), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                          {workflow.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => toggleWorkflow.mutate({
                            id: workflow.id,
                            status: workflow.status === 'active' ? 'paused' : 'active'
                          })}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            workflow.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {workflow.status === 'active' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                          {workflow.status}
                        </button>
                      </td>
                      <td className="py-3 text-sm">{workflow.stats.enrolled}</td>
                      <td className="py-3 text-sm">{workflow.stats.conversion_rate}%</td>
                      <td className="py-3 text-sm">${workflow.stats.revenue_generated.toLocaleString()}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingWorkflow(workflow);
                              setShowBuilder(true);
                            }}
                            className="p-1 text-gray-600 hover:text-purple-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this workflow?')) {
                                deleteWorkflow.mutate(workflow.id);
                              }
                            }}
                            className="p-1 text-gray-600 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Email Sequences Tab */}
        {activeTab === 'sequences' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Active Email Sequences</h3>
              <div className="space-y-4">
                {workflows?.filter(w => w.type === 'email_sequence' || w.type === 'welcome_series').map((sequence) => (
                  <div key={sequence.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{sequence.name}</h4>
                        <p className="text-sm text-gray-500">
                          {sequence.actions.filter(a => a.type === 'send_email').length} emails
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sequence.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {sequence.status}
                      </span>
                    </div>
                    
                    {/* Email Flow Visualization */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {sequence.actions.map((action, index) => (
                        <React.Fragment key={action.id}>
                          {index > 0 && <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                          <div className={`px-3 py-1 rounded-lg text-xs flex-shrink-0 ${
                            action.type === 'send_email' 
                              ? 'bg-blue-100 text-blue-800' 
                              : action.type === 'wait'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {action.type === 'send_email' ? `Email ${index + 1}` : 
                             action.type === 'wait' ? `Wait ${action.config.duration}` : 
                             action.type}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                    
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Enrolled:</span>
                        <span className="ml-1 font-medium">{sequence.stats.enrolled}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Completed:</span>
                        <span className="ml-1 font-medium">{sequence.stats.completed}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Conversion:</span>
                        <span className="ml-1 font-medium">{sequence.stats.conversion_rate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cart Recovery Tab */}
        {activeTab === 'recovery' && (
          <div className="space-y-6">
            {/* Cart Recovery Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="w-5 h-5 text-red-600" />
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold">{cartRecoveryStats?.abandoned_carts || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Abandoned Carts</div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600">
                    {cartRecoveryStats?.recovery_rate || 0}%
                  </span>
                </div>
                <div className="text-2xl font-bold">{cartRecoveryStats?.recovered_carts || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Recovered Carts</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-purple-600">Sent</span>
                </div>
                <div className="text-2xl font-bold">{cartRecoveryStats?.emails_sent || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Recovery Emails</div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-yellow-600">Revenue</span>
                </div>
                <div className="text-2xl font-bold">
                  ${cartRecoveryStats?.revenue_recovered?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Recovered Revenue</div>
              </div>
            </div>

            {/* Cart Recovery Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Cart Recovery Sequence</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium">1 Hour After Abandonment</div>
                      <div className="text-sm text-gray-500">Gentle reminder with cart contents</div>
                    </div>
                  </div>
                  <span className="text-sm text-green-600">28% open rate</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium">24 Hours After Abandonment</div>
                      <div className="text-sm text-gray-500">10% discount code included</div>
                    </div>
                  </div>
                  <span className="text-sm text-green-600">22% open rate</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium">72 Hours After Abandonment</div>
                      <div className="text-sm text-gray-500">Final reminder with urgency</div>
                    </div>
                  </div>
                  <span className="text-sm text-green-600">18% open rate</span>
                </div>
              </div>
              
              <button className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Configure Recovery Sequence
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingWorkflow?.id ? 'Edit Workflow' : 'Create Workflow'}
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Workflow Name</label>
                <input
                  type="text"
                  value={editingWorkflow?.name || ''}
                  onChange={(e) => setEditingWorkflow(prev => prev ? {...prev, name: e.target.value} : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Trigger</label>
                <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <option>User signs up</option>
                  <option>User makes purchase</option>
                  <option>Cart abandoned</option>
                  <option>User inactive for X days</option>
                  <option>Custom event</option>
                </select>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Workflow Actions</h4>
                <div className="space-y-3">
                  <button className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Plus className="w-5 h-5 mx-auto mb-1" />
                    Add Action
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBuilder(false);
                  setEditingWorkflow(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Save Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 