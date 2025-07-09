import React, { useState, useEffect } from 'react';
import { EMAIL_TEMPLATES, EmailTemplateConfig, getTemplatesByCategory } from '../../../lib/email-templates';
import { Mail, Tag, Eye, Copy, Edit } from 'lucide-react';

interface TemplateGalleryProps {
  onSelectTemplate: (template: EmailTemplateConfig, htmlContent: string) => void;
  onClose: () => void;
}

function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | EmailTemplateConfig['category']>('all');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateConfig | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const categories: Array<{ value: 'all' | EmailTemplateConfig['category']; label: string; color: string }> = [
    { value: 'all', label: 'All Templates', color: 'bg-gray-100 text-gray-800' },
    { value: 'transactional', label: 'Transactional', color: 'bg-blue-100 text-blue-800' },
    { value: 'marketing', label: 'Marketing', color: 'bg-green-100 text-green-800' },
    { value: 'notification', label: 'Notifications', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'lead-nurture', label: 'Lead Nurture', color: 'bg-purple-100 text-purple-800' }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? EMAIL_TEMPLATES 
    : getTemplatesByCategory(selectedCategory);

  const loadTemplateHtml = async (template: EmailTemplateConfig) => {
    setLoading(true);
    try {
      const response = await fetch(template.htmlFile);
      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Error loading template:', error);
      return '<p>Error loading template</p>';
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (template: EmailTemplateConfig) => {
    const html = await loadTemplateHtml(template);
    setPreviewHtml(html);
    setPreviewTemplate(template);
  };

  const handleSelect = async (template: EmailTemplateConfig) => {
    const html = await loadTemplateHtml(template);
    onSelectTemplate(template, html);
  };

  const getCategoryColor = (category: EmailTemplateConfig['category']) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Email Template Gallery</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b">
          <div className="flex gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.value
                    ? 'bg-jme-purple text-white'
                    : category.color
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex">
          <div className={`${previewTemplate ? 'w-1/2' : 'w-full'} p-6 overflow-y-auto max-h-[calc(90vh-140px)]`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:border-jme-purple transition-colors cursor-pointer"
                  onClick={() => handlePreview(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-jme-purple" />
                      <h3 className="font-semibold">{template.name}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {template.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs rounded">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    <strong>Variables:</strong> {template.variables.join(', ')}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(template);
                      }}
                      className="flex-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(template);
                      }}
                      className="flex-1 px-3 py-1 text-sm bg-jme-purple text-white hover:bg-jme-purple-dark rounded flex items-center justify-center gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Panel */}
          {previewTemplate && (
            <div className="w-1/2 border-l bg-gray-50 p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{previewTemplate.name}</h3>
                  <p className="text-sm text-gray-600">Subject: {previewTemplate.subject}</p>
                </div>
                <button
                  onClick={() => {
                    setPreviewTemplate(null);
                    setPreviewHtml('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jme-purple mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading preview...</p>
                  </div>
                ) : (
                  <div 
                    className="email-preview"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                )}
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleSelect(previewTemplate)}
                  className="flex-1 px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Use This Template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemplateGallery; 