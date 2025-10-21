import React from 'react';
import { Eye, Code, Save, Download, Smartphone, Monitor } from 'lucide-react';

interface ContentPreviewProps {
  type: 'email' | 'blog';
  content: {
    subject?: string;
    title?: string;
    body: string;
    preheader?: string;
    excerpt?: string;
    metadata?: any;
  };
  showCode: boolean;
  onToggleCode: () => void;
  onSave: () => void;
  onExport?: () => void;
  previewMode?: 'desktop' | 'mobile';
  onPreviewModeChange?: (mode: 'desktop' | 'mobile') => void;
  customizations?: {
    fontFamily?: string;
    primaryColor?: string;
  };
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  type,
  content,
  showCode,
  onToggleCode,
  onSave,
  onExport,
  previewMode = 'desktop',
  onPreviewModeChange,
  customizations = {},
}) => {
  const isEmail = type === 'email';
  
  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
      {content ? (
        <div className={`mx-auto transition-all duration-300 ${
          previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-2xl'
        }`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Preview Header */}
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {isEmail ? 'Subject:' : 'Title:'}
                  </p>
                  <p className="font-medium">
                    {content.subject || content.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onPreviewModeChange && (
                    <div className="flex items-center gap-1 mr-2">
                      <button
                        onClick={() => onPreviewModeChange('desktop')}
                        className={`p-1.5 rounded ${
                          previewMode === 'desktop' 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onPreviewModeChange('mobile')}
                        className={`p-1.5 rounded ${
                          previewMode === 'mobile' 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={onToggleCode}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                  >
                    {showCode ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                    {showCode ? 'Preview' : 'HTML'}
                  </button>
                  <button
                    onClick={onSave}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  {onExport && (
                    <button
                      onClick={onExport}
                      className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  )}
                </div>
              </div>
              {(content.preheader || content.excerpt) && (
                <p className="text-sm text-gray-500 mt-1">
                  {content.preheader || content.excerpt}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {showCode ? (
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{content.body}</code>
                </pre>
              ) : (
                <div 
                  dangerouslySetInnerHTML={{ __html: content.body }}
                  style={{ 
                    fontFamily: customizations.fontFamily || 'Arial, sans-serif',
                    '--primary-color': customizations.primaryColor || '#8B5CF6'
                  } as React.CSSProperties}
                  className="prose prose-purple max-w-none"
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-4">
              {isEmail ? '✉️' : '📝'}
            </div>
            <p className="text-gray-600 mb-2">
              No {type} generated yet
            </p>
            <p className="text-sm text-gray-500">
              Use the form on the left to create your {type}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 