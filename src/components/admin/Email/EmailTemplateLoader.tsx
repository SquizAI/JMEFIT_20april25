import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { 
  Mail, 
  Copy, 
  Check, 
  Save,
  Eye,
  EyeOff,
  Filter,
  Search,
  Download,
  Upload,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { emailTemplates, getEmailTemplatesList, replaceTemplateVariables } from '../../../lib/email-templates';

interface SavedEmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  json_content?: any;
  category: string;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

// Default variable values
const defaultVariables: Record<string, Record<string, string>> = {
  common: {
    logoUrl: 'https://jmefit.com/JME_fit_black_purple.png',
    privacyUrl: 'https://jmefit.com/privacy',
    unsubscribeUrl: 'https://jmefit.com/unsubscribe'
  },
  user: {
    fullName: 'John Doe',
    userName: 'John',
    clientName: 'John',
    email: 'john@example.com'
  },
  urls: {
    dashboardUrl: 'https://jmefit.com/dashboard',
    verificationUrl: 'https://jmefit.com/verify?token=abc123',
    resetPasswordUrl: 'https://jmefit.com/reset-password?token=xyz789',
    orderTrackingUrl: 'https://jmefit.com/orders/track'
  },
  subscription: {
    planName: 'Nutrition & Training',
    billingCycle: 'monthly',
    amount: '249',
    nextBillingDate: 'January 1, 2025'
  },
  order: {
    orderNumber: '12345',
    items: 'Nutrition & Training Program',
    shipping: '0.00',
    total: '249.00'
  }
};

function EmailTemplateLoader() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<typeof emailTemplates[keyof typeof emailTemplates] | null>(null);
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Get all templates
  const templates = getEmailTemplatesList();

  // Fetch saved templates
  const { data: savedTemplates } = useQuery({
    queryKey: ['saved-email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedEmailTemplate[];
    }
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: Omit<SavedEmailTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('email_templates')
        .insert([template]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-email-templates'] });
      setShowSaveModal(false);
      setTemplateName('');
      toast.success('Template saved successfully!');
    }
  });

  const selectTemplate = (template: typeof emailTemplates[keyof typeof emailTemplates]) => {
    setSelectedTemplate(template);
    setEmailSubject(template.subject);
    setTemplateHtml(template.html);
    
    // Initialize variables with defaults
    const vars: Record<string, string> = {};
    template.variables.forEach(variable => {
      // Check all default categories for the variable
      let defaultValue = '';
      Object.values(defaultVariables).forEach(category => {
        if (category[variable]) {
          defaultValue = category[variable];
        }
      });
      vars[variable] = defaultValue || `{{${variable}}}`;
    });
    setTemplateVariables(vars);
    setPreviewMode(false);
  };

  const renderPreview = () => {
    if (!selectedTemplate || !templateHtml) return '';
    return replaceTemplateVariables(templateHtml, templateVariables);
  };

  const copyHtml = () => {
    const html = previewMode ? renderPreview() : templateHtml;
    navigator.clipboard.writeText(html);
    setCopied(true);
    toast.success('HTML copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHtml = () => {
    const html = previewMode ? renderPreview() : templateHtml;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.name.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const saveAsTemplate = () => {
    if (!selectedTemplate || !templateName) return;
    
    const html = previewMode ? renderPreview() : templateHtml;
    
    saveTemplateMutation.mutate({
      name: templateName,
      subject: emailSubject,
      html_content: html,
      category: selectedTemplate.category,
      is_template: true
    });
  };

  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Email Template Library</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveCategory('transactional')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === 'transactional'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Transactional
            </button>
            <button
              onClick={() => setActiveCategory('marketing')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === 'marketing'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Marketing
            </button>
            <button
              onClick={() => setActiveCategory('program')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === 'program'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Program
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Template List */}
        <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-2">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => selectTemplate(template)}
                className={`p-4 bg-white rounded-lg border cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-purple-500 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
                    {template.description && (
                      <p className="text-xs text-gray-400 mt-2">{template.description}</p>
                    )}
                  </div>
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex gap-2 mt-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    template.category === 'transactional' ? 'bg-blue-100 text-blue-700' :
                    template.category === 'marketing' ? 'bg-green-100 text-green-700' :
                    template.category === 'program' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {template.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {template.variables.length} variables
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Saved Templates Section */}
          {savedTemplates && savedTemplates.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Saved Templates</h3>
              <div className="space-y-2">
                {savedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-3 bg-white rounded-lg border border-gray-200 text-sm"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Saved {format(new Date(template.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Template Editor/Preview */}
        {selectedTemplate ? (
          <div className="flex-1 flex flex-col">
            {/* Editor Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedTemplate.name}</h3>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="mt-2 w-full px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    placeholder="Email subject..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {previewMode ? 'Edit' : 'Preview'}
                  </button>
                  <button
                    onClick={copyHtml}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    Copy HTML
                  </button>
                  <button
                    onClick={downloadHtml}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Variables Editor */}
            {!previewMode && (
              <div className="bg-gray-50 border-b border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Template Variables</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {variable}
                      </label>
                      <input
                        type="text"
                        value={templateVariables[variable] || ''}
                        onChange={(e) => setTemplateVariables({
                          ...templateVariables,
                          [variable]: e.target.value
                        })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                        placeholder={`{{${variable}}}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {previewMode ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
                </div>
              ) : (
                <textarea
                  value={templateHtml}
                  onChange={(e) => setTemplateHtml(e.target.value)}
                  className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded-lg resize-none"
                  placeholder="HTML content..."
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a template to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Save Template</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setTemplateName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={saveAsTemplate}
                disabled={!templateName}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailTemplateLoader; 