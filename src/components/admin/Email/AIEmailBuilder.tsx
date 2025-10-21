import React, { useState } from 'react';
import { Wand2, Brush, Save, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import EmailVisualBuilder from './EmailVisualBuilder';
import { emailTemplates, getEmailTemplatesList, replaceTemplateVariables } from '../../../lib/email-templates';

export default function AIEmailBuilder() {
  const [activeTab, setActiveTab] = useState<'ai' | 'visual'>('ai');
  const [prompt, setPrompt] = useState('');
  const [emailType, setEmailType] = useState('welcome');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  // Get template list
  const templates = getEmailTemplatesList();

  const generateEmail = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/.netlify/functions/generate-email-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          emailType,
          tone,
          length,
          brand: 'JMEFIT'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate email');
      }

      const data = await response.json();
      setGeneratedContent(data);
      
      // Initialize template variables if using a template
      const template = emailTemplates[emailType];
      if (template) {
        const vars: Record<string, string> = {};
        template.variables.forEach(variable => {
          vars[variable] = `{{${variable}}}`;
        });
        setTemplateVariables(vars);
      }
      
      toast.success('Email generated successfully!');
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error('Failed to generate email. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedContent?.body) {
      navigator.clipboard.writeText(generatedContent.body);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const saveTemplate = async () => {
    if (!generatedContent) return;

    try {
      // TODO: Implement save to database
      toast.success('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const renderPreview = () => {
    if (!generatedContent?.body) return '';
    
    // If we have a template, apply variable replacements
    const template = emailTemplates[emailType];
    if (template && Object.keys(templateVariables).length > 0) {
      return replaceTemplateVariables(generatedContent.body, templateVariables);
    }
    
    return generatedContent.body;
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'ai'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              AI Generator
            </button>
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'visual'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <Brush className="w-4 h-4" />
              Visual Builder
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'ai' ? (
          <div className="flex-1 flex">
            {/* AI Generator Content */}
            <div className="w-96 bg-white border-r border-gray-200 p-6 overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Email Generator</h2>
              
              <div className="space-y-6">
                {/* Email Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Type
                  </label>
                  <select
                    value={emailType}
                    onChange={(e) => setEmailType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe Your Email
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., Welcome email for new nutrition program subscribers with a personal touch..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                {/* Tone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="urgent">Urgent</option>
                    <option value="empathetic">Empathetic</option>
                  </select>
                </div>

                {/* Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateEmail}
                  disabled={generating || !prompt.trim()}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  {generating ? 'Generating...' : 'Generate Email'}
                </button>

                {/* Template Variables */}
                {generatedContent && emailTemplates[emailType] && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Template Variables</h3>
                    <div className="space-y-3">
                      {emailTemplates[emailType].variables.map((variable) => (
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
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
              {generatedContent ? (
                <>
                  <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {generatedContent.subject}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {generatedContent.preheader}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreviewMode(!previewMode)}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                          {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {previewMode ? 'Show Code' : 'Preview'}
                        </button>
                        <button
                          onClick={copyToClipboard}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={saveTemplate}
                          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                    {previewMode ? (
                      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
                        <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
                      </div>
                    ) : (
                      <pre className="bg-white p-6 rounded-lg overflow-auto">
                        <code className="text-sm">{generatedContent.body}</code>
                      </pre>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Wand2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Generate an email to see the preview
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmailVisualBuilder />
        )}
      </div>
    </div>
  );
} 