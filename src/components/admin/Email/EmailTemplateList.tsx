import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Mail, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { format } from 'date-fns';

// Pre-built templates that exist as HTML files
const preBuiltTemplates = [
  { name: 'Welcome Email', subject: 'Welcome to JMEFIT!', category: 'transactional', file: 'welcome.html' },
  { name: 'Password Reset', subject: 'Reset Your JMEFIT Password', category: 'transactional', file: 'password-reset.html' },
  { name: 'Subscription Confirmation', subject: 'Your JMEFIT Subscription is Active!', category: 'transactional', file: 'subscription-confirmation.html' },
  { name: 'Thank You', subject: 'Thank You for Your Purchase!', category: 'transactional', file: 'thank-you.html' },
  { name: 'Cold Lead Welcome', subject: 'Start Your Fitness Journey with JMEFIT', category: 'marketing', file: 'cold-lead-welcome.html' },
  { name: 'Hot Lead Welcome', subject: 'Your JMEFIT Journey Begins Now!', category: 'marketing', file: 'hot-lead-welcome.html' },
  { name: 'Warm Lead Welcome', subject: 'Welcome Back to JMEFIT!', category: 'marketing', file: 'warm-lead-welcome.html' },
  { name: 'SHRED Challenge Welcome', subject: 'Welcome to the SHRED Challenge!', category: 'transactional', file: 'shred-challenge-welcome.html' },
  { name: 'Self-Led Training Welcome', subject: 'Your Self-Led Training Program is Ready!', category: 'transactional', file: 'self-led-training-welcome.html' },
  { name: 'One-Time Macros Welcome', subject: 'Your Custom Macro Plan is Ready!', category: 'transactional', file: 'one-time-macros-welcome.html' },
  { name: 'Nutrition Programs Welcome', subject: 'Welcome to JMEFIT Nutrition!', category: 'transactional', file: 'nutrition-programs-welcome.html' },
  { name: 'Email Verification', subject: 'Verify Your JMEFIT Email', category: 'transactional', file: 'verification.html' }
];

interface EmailTemplateListProps {
  onSelectTemplate: (template: any) => void;
  onEditTemplate: (template: any) => void;
}

export function EmailTemplateList({ onSelectTemplate, onEditTemplate }: EmailTemplateListProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'marketing' | 'transactional' | 'newsletter'>('all');

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_template', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching templates:', error);
        // Return pre-built templates if database fetch fails
        return preBuiltTemplates.map((t, index) => ({
          id: `prebuilt-${index}`,
          ...t,
          html_content: `<p>Template content from ${t.file}</p>`,
          is_template: true,
          created_at: new Date().toISOString()
        }));
      }
      
      // If no templates in database, return pre-built ones
      if (!data || data.length === 0) {
        return preBuiltTemplates.map((t, index) => ({
          id: `prebuilt-${index}`,
          ...t,
          html_content: `<p>Template content from ${t.file}</p>`,
          is_template: true,
          created_at: new Date().toISOString()
        }));
      }
      
      return data;
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error.message}</div>;
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-8">
        <p>No email templates found. Please add one.</p>
        <button
          onClick={() => onSelectTemplate({ name: 'New Template', subject: 'New Subject', html_content: '<p>New Template Content</p>' })}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Add New Template
        </button>
      </div>
    );
  }

  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Email Templates</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-md ${selectedCategory === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          All Templates
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category as 'marketing' | 'transactional' | 'newsletter')}
            className={`px-4 py-2 rounded-md ${selectedCategory === category ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Subject</th>
              <th className="py-2 px-4 border-b text-left">Category</th>
              <th className="py-2 px-4 border-b text-left">Created At</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates
              .filter(template => selectedCategory === 'all' || template.category === selectedCategory)
              .map((template) => (
                <tr key={template.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{template.name}</td>
                  <td className="py-2 px-4 border-b">{template.subject}</td>
                  <td className="py-2 px-4 border-b">{template.category}</td>
                  <td className="py-2 px-4 border-b">{format(new Date(template.created_at), 'MM/dd/yyyy HH:mm')}</td>
                  <td className="py-2 px-4 border-b text-right">
                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="text-green-600 hover:text-green-900 mr-2"
                      title="Select Template"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => onEditTemplate(template)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                      title="Edit Template"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => {
                        // Implement delete logic here
                        console.log('Delete template:', template);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Template"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 