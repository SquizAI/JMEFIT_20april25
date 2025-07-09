import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, RefreshCw } from 'lucide-react';
import { EmailBlock } from './Builder';
import { toast } from 'react-hot-toast';

interface AIEmailGeneratorProps {
  onGenerate: (blocks: EmailBlock[], subject: string) => void;
  onClose: () => void;
}

export function AIEmailGenerator({ onGenerate, onClose }: AIEmailGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'motivational' | 'urgent'>('friendly');
  const [emailType, setEmailType] = useState<'welcome' | 'promotional' | 'newsletter' | 'reminder' | 'thank-you'>('welcome');
  const [includeDiscount, setIncludeDiscount] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    subject: string;
    blocks: EmailBlock[];
  } | null>(null);

  const emailTemplates = {
    welcome: {
      structure: ['header', 'text', 'button', 'text', 'divider', 'social'],
      style: 'warm and inviting'
    },
    promotional: {
      structure: ['header', 'text', 'discount', 'button', 'text', 'social'],
      style: 'exciting and persuasive'
    },
    newsletter: {
      structure: ['header', 'image', 'text', 'button', 'divider', 'text', 'social'],
      style: 'informative and engaging'
    },
    reminder: {
      structure: ['header', 'text', 'button', 'text'],
      style: 'clear and action-oriented'
    },
    'thank-you': {
      structure: ['header', 'text', 'text', 'social'],
      style: 'grateful and personal'
    }
  };

  const generateEmail = async () => {
    setIsGenerating(true);
    
    try {
      const template = emailTemplates[emailType];
      const systemPrompt = `You are an email copywriter for JMEFIT, a premium fitness and nutrition coaching service. 
        Generate email content with the following characteristics:
        - Tone: ${tone}
        - Style: ${template.style}
        - Brand voice: Empowering, supportive, and results-focused
        - Use "JME FIT" or "JMEFIT" consistently
        - Focus on transformation and personal growth
        ${includeDiscount ? '- Include a compelling reason to use the discount code' : ''}`;

      const userPrompt = prompt || `Create a ${emailType} email for JMEFIT`;

      const response = await fetch('/.netlify/functions/generate-email-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          emailType,
          tone,
          includeDiscount
        })
      });

      if (!response.ok) throw new Error('Failed to generate email');
      
      const data = await response.json();
      
      // Convert AI response to email blocks
      const blocks: EmailBlock[] = [];
      let blockId = 1;

      // Add header
      blocks.push({
        id: `block-${blockId++}`,
        type: 'header',
        content: { text: data.headerText || 'Welcome to JMEFIT!' },
        styles: {}
      });

      // Add main content blocks
      if (data.introText) {
        blocks.push({
          id: `block-${blockId++}`,
          type: 'text',
          content: { text: data.introText },
          styles: {}
        });
      }

      // Add discount if requested
      if (includeDiscount && data.discountCode) {
        blocks.push({
          id: `block-${blockId++}`,
          type: 'discount',
          content: {
            code: data.discountCode,
            description: data.discountDescription || 'Special offer for you',
            expiry: data.discountExpiry
          },
          styles: {}
        });
      }

      // Add CTA button
      if (data.ctaText) {
        blocks.push({
          id: `block-${blockId++}`,
          type: 'button',
          content: {
            text: data.ctaText,
            url: data.ctaUrl || 'https://jmefit.com'
          },
          styles: {}
        });
      }

      // Add additional content
      if (data.bodyText) {
        blocks.push({
          id: `block-${blockId++}`,
          type: 'text',
          content: { text: data.bodyText },
          styles: {}
        });
      }

      // Add divider before social
      blocks.push({
        id: `block-${blockId++}`,
        type: 'divider',
        content: {},
        styles: {}
      });

      // Add social links
      blocks.push({
        id: `block-${blockId++}`,
        type: 'social',
        content: {},
        styles: {}
      });

      setGeneratedContent({
        subject: data.subject || `${emailType} from JMEFIT`,
        blocks
      });

    } catch (error) {
      console.error('Error generating email:', error);
      toast.error('Failed to generate email content');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGenerated = () => {
    if (generatedContent) {
      onGenerate(generatedContent.blocks, generatedContent.subject);
      toast.success('Email content applied!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold">AI Email Generator</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left side - Configuration */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Type</label>
                <select
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value as any)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="welcome">Welcome Email</option>
                  <option value="promotional">Promotional Campaign</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="reminder">Class/Appointment Reminder</option>
                  <option value="thank-you">Thank You Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tone</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['professional', 'friendly', 'motivational', 'urgent'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-2 rounded-lg capitalize ${
                        tone === t
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Describe your email (optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., Announce our new SHRED program starting next month with early bird pricing"
                  className="w-full px-4 py-2 border rounded-lg h-24"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeDiscount"
                  checked={includeDiscount}
                  onChange={(e) => setIncludeDiscount(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeDiscount" className="text-sm">
                  Include discount code
                </label>
              </div>

              <button
                onClick={generateEmail}
                disabled={isGenerating}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Email
                  </>
                )}
              </button>
            </div>

            {/* Right side - Preview */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-4">Preview</h3>
              {generatedContent ? (
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm text-gray-500">Subject</div>
                    <div className="font-medium">{generatedContent.subject}</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded border">
                    {generatedContent.blocks.map((block, index) => (
                      <div key={block.id} className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">{block.type}</div>
                        {block.type === 'header' && (
                          <h2 className="text-xl font-bold">{block.content.text}</h2>
                        )}
                        {block.type === 'text' && (
                          <p className="text-gray-700">{block.content.text}</p>
                        )}
                        {block.type === 'button' && (
                          <button className="px-4 py-2 bg-purple-600 text-white rounded">
                            {block.content.text}
                          </button>
                        )}
                        {block.type === 'discount' && (
                          <div className="bg-purple-50 p-3 rounded border-2 border-dashed border-purple-300">
                            <div className="font-mono font-bold text-purple-600">
                              {block.content.code}
                            </div>
                            <div className="text-sm">{block.content.description}</div>
                          </div>
                        )}
                        {block.type === 'divider' && <hr className="my-2" />}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={applyGenerated}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Use This Email
                    </button>
                    <button
                      onClick={generateEmail}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Your AI-generated email will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Template Examples */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use <strong>Motivational</strong> tone for SHRED challenge announcements</li>
              <li>• <strong>Friendly</strong> tone works best for welcome and thank you emails</li>
              <li>• Include specific details in the description for more personalized content</li>
              <li>• The AI learns from JMEFIT's brand voice and existing email templates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 