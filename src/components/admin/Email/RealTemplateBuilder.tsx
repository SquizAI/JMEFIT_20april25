import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { emailTemplates, emailCategories, EmailTemplate } from './templates';
import { 
  Mail, 
  Eye, 
  Save, 
  Send, 
  Copy, 
  Check,
  Edit3,
  FileText,
  Sparkles,
  X
} from 'lucide-react';

interface TemplateVariable {
  name: string;
  value: string;
  description?: string;
}

interface SavedEmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  category: string;
  variables: Record<string, string>;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

function RealTemplateBuilder() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

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
    }
  });

  // Default variable values
  const defaultVariables: Record<string, Record<string, string>> = {
    common: {
      logoUrl: 'https://jmefit.com/images/JME_fit_black_purple.png',
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
      shipping: '0.00',
      total: '249.00'
    }
  };

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEmailSubject(template.subject);
    
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
    if (!selectedTemplate) return '';
    
    let html = selectedTemplate.html;
    
    // Replace all variables
    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    });
    
    return html;
  };

  const copyHtml = () => {
    const html = renderPreview();
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    
    const template: Omit<SavedEmailTemplate, 'id' | 'created_at' | 'updated_at'> = {
      name: templateName,
      subject: emailSubject,
      html_content: renderPreview(),
      category: selectedTemplate.category,
      variables: templateVariables,
      is_template: true
    };
    
    saveTemplateMutation.mutate(template);
  };

  const filteredTemplates = Object.values(emailTemplates).filter(template => 
    activeCategory === 'all' || template.category === activeCategory
  );

  return (
    <div className="flex h-full">
      {/* Sidebar - Template Selection */}
      <div className="w-80 bg-gray-50 border-r overflow-y-auto">
        <div className="p-4 border-b bg-white">
          <h3 className="font-semibold text-lg">Email Templates</h3>
          <p className="text-sm text-gray-600 mt-1">Select a template to customize</p>
        </div>

        {/* Category Tabs */}
        <div className="p-4 bg-white border-b">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeCategory === 'all' 
                  ? 'bg-jme-purple text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Templates
            </button>
            {Object.entries(emailCategories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === key 
                    ? 'bg-jme-purple text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Template List */}
        <div className="p-4 space-y-3">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => selectTemplate(template)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-jme-purple bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {emailCategories[template.category]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {template.variables.length} variables
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Saved Templates */}
        {savedTemplates && savedTemplates.length > 0 && (
          <>
            <div className="p-4 border-t">
              <h4 className="font-medium text-gray-700 mb-3">Saved Templates</h4>
              <div className="space-y-2">
                {savedTemplates.map(template => (
                  <div
                    key={template.id}
                    className="p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{template.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {selectedTemplate ? (
          <>
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="text-xl font-semibold w-full border-0 focus:ring-0 focus:outline-none"
                    placeholder="Email Subject"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Template: {selectedTemplate.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      previewMode 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    {previewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {previewMode ? 'Edit' : 'Preview'}
                  </button>
                  <button
                    onClick={copyHtml}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy HTML'}
                  </button>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    className="px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Test
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {previewMode ? (
                <div className="p-6 bg-gray-100">
                  <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                    <iframe
                      srcDoc={renderPreview()}
                      className="w-full h-full min-h-[800px]"
                      title="Email Preview"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="max-w-2xl mx-auto">
                    <h3 className="text-lg font-semibold mb-4">Template Variables</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Customize the variables below to personalize your email
                    </p>
                    
                    <div className="space-y-4">
                      {selectedTemplate.variables.map(variable => (
                        <div key={variable} className="group">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {variable.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={templateVariables[variable] || ''}
                            onChange={(e) => setTemplateVariables({
                              ...templateVariables,
                              [variable]: e.target.value
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                            placeholder={`Enter ${variable}`}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Variable: {`{{${variable}}}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a Template to Get Started
              </h3>
              <p className="text-gray-500">
                Choose from our professionally designed email templates
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Save Email Template</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
              autoFocus
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RealTemplateBuilder; 