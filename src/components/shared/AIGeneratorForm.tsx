import React from 'react';
import { Sparkles } from 'lucide-react';
import { TONE_DESCRIPTIONS, LENGTH_GUIDELINES } from '../../lib/ai/shared';

interface AIGeneratorFormProps {
  type: 'email' | 'blog';
  prompt: string;
  onPromptChange: (value: string) => void;
  tone: string;
  onToneChange: (value: string) => void;
  length: string;
  onLengthChange: (value: string) => void;
  additionalFields?: React.ReactNode;
  onGenerate: () => void;
  isGenerating: boolean;
  customizations?: {
    primaryColor?: string;
    fontFamily?: string;
  };
  onCustomizationChange?: (key: string, value: string) => void;
}

export const AIGeneratorForm: React.FC<AIGeneratorFormProps> = ({
  type,
  prompt,
  onPromptChange,
  tone,
  onToneChange,
  length,
  onLengthChange,
  additionalFields,
  onGenerate,
  isGenerating,
  customizations,
  onCustomizationChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe Your {type === 'email' ? 'Email' : 'Blog Post'}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={
            type === 'email'
              ? 'E.g., Create a welcome email for new fitness program subscribers...'
              : 'E.g., Write about the benefits of morning workouts...'
          }
          className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Tone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tone
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(TONE_DESCRIPTIONS).map((t) => (
            <button
              key={t}
              onClick={() => onToneChange(t)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                tone === t
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                  : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
              }`}
              title={TONE_DESCRIPTIONS[t as keyof typeof TONE_DESCRIPTIONS]}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Length */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Length
        </label>
        <div className="flex gap-2">
          {Object.entries(LENGTH_GUIDELINES).map(([l, guidelines]) => (
            <button
              key={l}
              onClick={() => onLengthChange(l)}
              className={`flex-1 px-4 py-2 rounded-lg capitalize transition-colors ${
                length === l
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                  : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
              }`}
              title={`${guidelines.words} words, ${guidelines.paragraphs} paragraphs`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Fields */}
      {additionalFields}

      {/* Customization Options */}
      {customizations && onCustomizationChange && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Customization</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customizations.primaryColor || '#8B5CF6'}
                  onChange={(e) => onCustomizationChange('primaryColor', e.target.value)}
                  className="w-12 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={customizations.primaryColor || '#8B5CF6'}
                  onChange={(e) => onCustomizationChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Font Family</label>
              <select
                value={customizations.fontFamily || 'Arial, sans-serif'}
                onChange={(e) => onCustomizationChange('fontFamily', e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="Arial, sans-serif">Arial</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="Verdana, sans-serif">Verdana</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate {type === 'email' ? 'Email' : 'Blog Post'}
          </>
        )}
      </button>
    </div>
  );
}; 