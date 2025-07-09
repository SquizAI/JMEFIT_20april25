import React, { useState, useEffect } from 'react';
import { Eye, Code, Copy, Check, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface HtmlTemplate {
  name: string;
  filename: string;
  category: string;
  description: string;
}

const htmlTemplates: HtmlTemplate[] = [
  {
    name: 'Welcome Email',
    filename: 'welcome.html',
    category: 'transactional',
    description: 'Welcome new users to JMEFIT'
  },
  {
    name: 'Password Reset',
    filename: 'password-reset.html',
    category: 'transactional',
    description: 'Password reset request email'
  },
  {
    name: 'Subscription Confirmation',
    filename: 'subscription-confirmation.html',
    category: 'transactional',
    description: 'Confirm subscription activation'
  },
  {
    name: 'Thank You',
    filename: 'thank-you.html',
    category: 'transactional',
    description: 'Thank you for purchase'
  },
  {
    name: 'Verification',
    filename: 'verification.html',
    category: 'transactional',
    description: 'Email verification request'
  },
  {
    name: 'Cold Lead Welcome',
    filename: 'cold-lead-welcome.html',
    category: 'marketing',
    description: 'Welcome email for cold leads'
  },
  {
    name: 'Warm Lead Welcome',
    filename: 'warm-lead-welcome.html',
    category: 'marketing',
    description: 'Welcome email for warm leads with discount'
  },
  {
    name: 'Hot Lead Welcome',
    filename: 'hot-lead-welcome.html',
    category: 'marketing',
    description: 'Urgent welcome email for hot leads'
  },
  {
    name: 'One-Time Macros Welcome',
    filename: 'one-time-macros-welcome.html',
    category: 'program',
    description: 'Welcome email for macro calculation clients'
  },
  {
    name: 'Self-Led Training Welcome',
    filename: 'self-led-training-welcome.html',
    category: 'program',
    description: 'Welcome email for self-led training program'
  },
  {
    name: 'SHRED Challenge Welcome',
    filename: 'shred-challenge-welcome.html',
    category: 'program',
    description: 'Welcome email for SHRED challenge participants'
  },
  {
    name: 'Nutrition Programs Welcome',
    filename: 'nutrition-programs-welcome.html',
    category: 'program',
    description: 'Welcome email for nutrition program clients'
  }
];

interface HtmlTemplateViewerProps {
  onSelectTemplate?: (html: string, name: string) => void;
}

export function HtmlTemplateViewer({ onSelectTemplate }: HtmlTemplateViewerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<HtmlTemplate | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const loadTemplate = async (template: HtmlTemplate) => {
    setLoading(true);
    try {
      // Use Netlify function to load templates
      const response = await fetch(`/.netlify/functions/get-email-template?template=${template.filename}`);
      if (!response.ok) {
        throw new Error('Failed to load template');
      }
      const html = await response.text();
      setHtmlContent(html);
      setSelectedTemplate(template);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const copyHtml = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    toast.success('HTML copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.filename || 'email-template.html'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const useTemplate = () => {
    if (onSelectTemplate && htmlContent && selectedTemplate) {
      onSelectTemplate(htmlContent, selectedTemplate.name);
      toast.success('Template loaded in builder');
    }
  };

  const groupedTemplates = htmlTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, HtmlTemplate[]>);

  return (
    <div className="flex h-full">
      {/* Template List */}
      <div className="w-80 bg-gray-50 border-r overflow-y-auto">
        <div className="p-4 border-b bg-white">
          <h3 className="font-semibold text-lg">HTML Email Templates</h3>
          <p className="text-sm text-gray-600 mt-1">Professional, tested templates</p>
        </div>
        
        {Object.entries(groupedTemplates).map(([category, templates]) => (
          <div key={category} className="p-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              {category}
            </h4>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.filename}
                  onClick={() => loadTemplate(template)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedTemplate?.filename === template.filename
                      ? 'bg-purple-100 border-purple-500 border'
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Template Preview/Code */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedTemplate ? (
          <>
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
                  className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  {viewMode === 'preview' ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {viewMode === 'preview' ? 'View Code' : 'Preview'}
                </button>
                <button
                  onClick={copyHtml}
                  className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy HTML
                </button>
                <button
                  onClick={downloadHtml}
                  className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                {onSelectTemplate && (
                  <button
                    onClick={useTemplate}
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Use Template
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading template...</p>
                  </div>
                </div>
              ) : viewMode === 'preview' ? (
                <div className="p-8 bg-gray-100">
                  <div className="max-w-3xl mx-auto">
                    <iframe
                      srcDoc={htmlContent}
                      className="w-full h-[800px] bg-white rounded-lg shadow-lg"
                      title="Email Preview"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm">{htmlContent}</code>
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a template to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HtmlTemplateViewer; 