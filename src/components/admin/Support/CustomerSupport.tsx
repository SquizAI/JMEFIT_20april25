import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import {
  MessageSquare,
  Ticket,
  Bot,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Send,
  Search,
  Filter,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  HelpCircle,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
  satisfaction_rating?: number;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'agent' | 'bot';
  sender_id: string;
  message: string;
  created_at: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
  not_helpful_count: number;
}

export function CustomerSupport() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'chat' | 'faq'>('tickets');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [replyMessage, setReplyMessage] = useState('');
  const queryClient = useQueryClient();

  // Fetch tickets
  const { data: tickets } = useQuery({
    queryKey: ['support-tickets', statusFilter],
    queryFn: async () => {
      let query = supabase.from('support_tickets').select('*, messages(*)');
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as SupportTicket[];
    }
  });

  // Fetch FAQs
  const { data: faqs } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .order('helpful_count', { ascending: false });
      
      if (error) throw error;
      return data as FAQ[];
    }
  });

  // Update ticket status
  const updateTicket = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket updated!');
    }
  });

  // Send reply
  const sendReply = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { error } = await supabase
        .from('ticket_messages')
        .insert([{
          ticket_id: ticketId,
          sender_type: 'agent',
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          message
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setReplyMessage('');
      toast.success('Reply sent!');
    }
  });

  const ticketStats = {
    open: tickets?.filter(t => t.status === 'open').length || 0,
    inProgress: tickets?.filter(t => t.status === 'in_progress').length || 0,
    resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
    avgResponseTime: '2.5 hours'
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Customer Support</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'tickets' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Ticket className="w-4 h-4 inline mr-2" />
              Tickets
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'chat' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Live Chat
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'faq' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Bot className="w-4 h-4 inline mr-2" />
              FAQ Bot
            </button>
          </div>
        </div>

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="col-span-1 space-y-4">
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{ticketStats.open}</div>
                  <div className="text-xs text-gray-600">Open</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{ticketStats.inProgress}</div>
                  <div className="text-xs text-gray-600">In Progress</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{ticketStats.resolved}</div>
                  <div className="text-xs text-gray-600">Resolved</div>
                </div>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">All Tickets</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {tickets?.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedTicket?.id === ticket.id 
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(ticket.created_at), 'MMM d')}
                      </span>
                    </div>
                    <div className="font-medium text-sm truncate">{ticket.subject}</div>
                    <div className="text-xs text-gray-500 truncate">{ticket.user_email}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket Details */}
            <div className="col-span-2 border-l dark:border-gray-700 pl-6">
              {selectedTicket ? (
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{selectedTicket.subject}</h3>
                      <p className="text-sm text-gray-500">{selectedTicket.user_email}</p>
                    </div>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => updateTicket.mutate({
                        id: selectedTicket.id,
                        status: e.target.value
                      })}
                      className="px-3 py-1 border rounded-lg text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                    {selectedTicket.messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.sender_type === 'user' 
                            ? 'bg-gray-100 dark:bg-gray-700' 
                            : 'bg-purple-100 dark:bg-purple-900/20 ml-8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.sender_type === 'user' ? 
                            <User className="w-4 h-4" /> : 
                            <MessageCircle className="w-4 h-4" />
                          }
                          <span className="text-xs text-gray-500">
                            {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-2 border rounded-lg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && replyMessage) {
                          sendReply.mutate({
                            ticketId: selectedTicket.id,
                            message: replyMessage
                          });
                        }
                      }}
                    />
                    <button
                      onClick={() => sendReply.mutate({
                        ticketId: selectedTicket.id,
                        message: replyMessage
                      })}
                      disabled={!replyMessage}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-20">
                  Select a ticket to view details
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Chat Tab */}
        {activeTab === 'chat' && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Live Chat Coming Soon</h3>
            <p className="text-gray-500">Real-time chat support will be available soon</p>
          </div>
        )}

        {/* FAQ Bot Tab */}
        {activeTab === 'faq' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold">JME FIT Support Bot</h3>
                  <p className="text-sm text-gray-600">AI-powered answers to common questions</p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Ask me anything about JME FIT..."
                  className="w-full pl-10 pr-4 py-3 border rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Popular Questions</h4>
              {faqs?.map((faq) => (
                <div key={faq.id} className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-medium mb-2">{faq.question}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <button className="text-xs text-gray-500 hover:text-green-600">
                          <ThumbsUp className="w-4 h-4 inline mr-1" />
                          Helpful ({faq.helpful_count})
                        </button>
                        <button className="text-xs text-gray-500 hover:text-red-600">
                          <ThumbsDown className="w-4 h-4 inline mr-1" />
                          Not helpful ({faq.not_helpful_count})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 