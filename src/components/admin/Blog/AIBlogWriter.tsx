import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AIBlogWriterProps {
  onGenerate: (content: { title: string; content: string; excerpt: string; metaDescription: string }) => void;
}

const AIBlogWriter: React.FC<AIBlogWriterProps> = ({ onGenerate }) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [keywords, setKeywords] = useState('');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const generateBlogPost = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/.netlify/functions/generate-blog-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          tone,
          length,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          brand: 'JMEFIT'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setPreview(data);
      toast.success('Blog post generated successfully!');
    } catch (error) {
      console.error('Error generating blog post:', error);
      toast.error('Failed to generate blog post. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const applyContent = () => {
    if (preview) {
      onGenerate(preview);
      setPreview(null);
      setTopic('');
      setKeywords('');
      toast.success('Content applied to editor!');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Blog Writer</h3>
      </div>

      {!preview ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Topic or Title
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 5 Essential HIIT Workouts for Beginners"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="motivational">Motivational</option>
                <option value="educational">Educational</option>
                <option value="conversational">Conversational</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Length
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="short">Short (300-500 words)</option>
                <option value="medium">Medium (600-800 words)</option>
                <option value="long">Long (1000-1500 words)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SEO Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="fitness, workout, HIIT, beginners, exercise"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={generateBlogPost}
            disabled={generating || !topic.trim()}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Blog Post
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-white">{preview.title}</h4>
              <button
                onClick={() => copyToClipboard(preview.title)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Excerpt:</strong> {preview.excerpt}
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Meta Description:</strong> {preview.metaDescription}
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-h-64 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: preview.content }} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={applyContent}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Apply to Editor
            </button>
            <button
              onClick={() => setPreview(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Generate New
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIBlogWriter; 