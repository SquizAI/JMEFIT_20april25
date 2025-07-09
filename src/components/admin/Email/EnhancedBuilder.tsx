import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '../../../lib/supabase';
import { ChevronDown, ChevronRight, Wand2, Save, Send, Eye, Edit, X, Menu, FileText, Image, Type, Square, Link2, Minus, Space, Share2, Sparkles } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  json_content: any;
  category: 'marketing' | 'transactional' | 'newsletter' | 'notification';
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailBlock {
  id: string;
  type: 'logo' | 'header' | 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'columns' | 'social' | 'footer';
  content: any;
  styles: any;
}

interface DraggableBlockProps {
  block: EmailBlock;
  index: number;
  moveBlock: (dragIndex: number, hoverIndex: number) => void;
  updateBlock: (blockId: string, updates: Partial<EmailBlock>) => void;
  deleteBlock: (blockId: string) => void;
}

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const AIPromptModal: React.FC<AIPromptModalProps> = ({ isOpen, onClose, onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('');
  const [emailType, setEmailType] = useState('marketing');
  
  if (!isOpen) return null;

  const examplePrompts = [
    "Create a welcome email for new gym members with a special offer",
    "Design a class reminder email with schedule details",
    "Build a nutrition program announcement with testimonials",
    "Generate a motivational newsletter with fitness tips",
    "Create a payment reminder email with renewal options"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-jme-purple" />
            AI Email Template Generator
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Email Type</label>
          <select
            value={emailType}
            onChange={(e) => setEmailType(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:border-jme-purple outline-none"
          >
            <option value="marketing">Marketing</option>
            <option value="transactional">Transactional</option>
            <option value="newsletter">Newsletter</option>
            <option value="notification">Notification</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Describe your email</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Create a welcome email for new members with class schedule and special offer..."
            className="w-full px-4 py-3 border rounded-lg focus:border-jme-purple outline-none min-h-[120px]"
          />
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Example prompts:</p>
          <div className="space-y-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="text-left w-full px-3 py-2 text-sm bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const fullPrompt = `${emailType} email: ${prompt}`;
              onGenerate(fullPrompt);
            }}
            disabled={!prompt || isGenerating}
            className="flex-1 px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Template
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const DraggableBlock: React.FC<DraggableBlockProps> = ({ block, index, moveBlock, updateBlock, deleteBlock }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [{ handlerId }, drop] = useDrop({
    accept: 'block',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      moveBlock(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'block',
    item: () => ({ id: block.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const renderBlockContent = () => {
    switch (block.type) {
      case 'logo':
        return (
          <div className="text-center p-4">
            <img 
              src={block.content.url || '/logo.png'} 
              alt="JMEFIT Logo" 
              className="h-16 mx-auto"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/200x60?text=JMEFIT';
              }}
            />
          </div>
        );

      case 'header':
        return (
          <div className="text-center p-4">
            {isEditing ? (
              <input
                type="text"
                value={block.content.text || ''}
                onChange={(e) => updateBlock(block.id, { content: { ...block.content, text: e.target.value } })}
                className="w-full text-2xl font-bold border-b-2 border-gray-300 focus:border-jme-purple outline-none"
                onBlur={() => setIsEditing(false)}
                autoFocus
              />
            ) : (
              <h1 
                className="text-2xl font-bold cursor-text hover:bg-gray-100 rounded px-2 py-1"
                onClick={() => setIsEditing(true)}
              >
                {block.content.text || 'Click to edit header'}
              </h1>
            )}
          </div>
        );
      
      case 'text':
        return (
          <div className="p-4">
            {isEditing ? (
              <textarea
                value={block.content.text || ''}
                onChange={(e) => updateBlock(block.id, { content: { ...block.content, text: e.target.value } })}
                className="w-full min-h-[100px] border rounded p-2 focus:border-jme-purple outline-none"
                onBlur={() => setIsEditing(false)}
                autoFocus
              />
            ) : (
              <p 
                className="cursor-text hover:bg-gray-100 rounded p-2 whitespace-pre-wrap"
                onClick={() => setIsEditing(true)}
              >
                {block.content.text || 'Click to edit text'}
              </p>
            )}
          </div>
        );
      
      case 'button':
        return (
          <div className="text-center p-4">
            <button
              className="px-6 py-3 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark transition-colors"
              contentEditable={isEditing}
              suppressContentEditableWarning
              onClick={() => setIsEditing(true)}
              onBlur={() => setIsEditing(false)}
            >
              {block.content.text || 'Click to edit button'}
            </button>
            {isEditing && (
              <input
                type="text"
                placeholder="Button URL"
                value={block.content.url || ''}
                onChange={(e) => updateBlock(block.id, { content: { ...block.content, url: e.target.value } })}
                className="mt-2 w-full px-3 py-1 border rounded text-sm"
              />
            )}
          </div>
        );
      
      case 'image':
        return (
          <div className="p-4 text-center">
            {block.content.url ? (
              <img src={block.content.url} alt={block.content.alt || ''} className="max-w-full mx-auto rounded" />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Image URL"
                  onChange={(e) => updateBlock(block.id, { content: { ...block.content, url: e.target.value } })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            )}
          </div>
        );
      
      case 'divider':
        return <hr className="my-4 border-gray-300" />;
      
      case 'spacer':
        return <div style={{ height: block.content.height || '20px' }} />;
      
      case 'social':
        return (
          <div className="flex justify-center gap-4 p-4">
            {['facebook', 'twitter', 'instagram', 'linkedin'].map(platform => (
              <a key={platform} href="#" className="text-gray-600 hover:text-jme-purple transition-colors">
                <span className="text-2xl">
                  {platform === 'facebook' && '📘'}
                  {platform === 'twitter' && '🐦'}
                  {platform === 'instagram' && '📷'}
                  {platform === 'linkedin' && '💼'}
                </span>
              </a>
            ))}
          </div>
        );

      case 'footer':
        return (
          <div className="text-center p-4 text-sm text-gray-600">
            <p>© 2024 JMEFIT. All rights reserved.</p>
            <p className="mt-2">
              <a href="#" className="underline">Unsubscribe</a> | 
              <a href="#" className="underline ml-2">Update Preferences</a>
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`relative group border-2 rounded-lg mb-2 ${
        isDragging ? 'opacity-50' : ''
      } ${isEditing ? 'border-jme-purple' : 'border-transparent hover:border-gray-300'}`}
    >
      {renderBlockContent()}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          onClick={() => deleteBlock(block.id)}
          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

function EnhancedEmailBuilder() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [emailBlocks, setEmailBlocks] = useState<EmailBlock[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<EmailTemplate['category']>('marketing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['components', 'templates']);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Fetch email templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_template', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailTemplate[];
    }
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('email_templates')
        .insert([template]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setSavingTemplate(false);
      setTemplateName('');
    }
  });

  const blockComponents = [
    { type: 'logo', label: 'Logo', icon: <Image className="w-5 h-5" /> },
    { type: 'header', label: 'Header', icon: <Type className="w-5 h-5" /> },
    { type: 'text', label: 'Text', icon: <FileText className="w-5 h-5" /> },
    { type: 'image', label: 'Image', icon: <Image className="w-5 h-5" /> },
    { type: 'button', label: 'Button', icon: <Square className="w-5 h-5" /> },
    { type: 'divider', label: 'Divider', icon: <Minus className="w-5 h-5" /> },
    { type: 'spacer', label: 'Spacer', icon: <Space className="w-5 h-5" /> },
    { type: 'social', label: 'Social Links', icon: <Share2 className="w-5 h-5" /> },
    { type: 'footer', label: 'Footer', icon: <FileText className="w-5 h-5" /> },
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const generateAITemplate = async (prompt: string) => {
    setIsGeneratingAI(true);
    
    // Simulate AI generation (in a real implementation, this would call an AI API)
    try {
      // Parse the prompt to determine email type and requirements
      const emailType = prompt.toLowerCase().includes('welcome') ? 'welcome' :
                       prompt.toLowerCase().includes('reminder') ? 'reminder' :
                       prompt.toLowerCase().includes('newsletter') ? 'newsletter' :
                       prompt.toLowerCase().includes('payment') ? 'payment' :
                       'general';

      // Generate appropriate blocks based on email type
      const generatedBlocks: EmailBlock[] = [
        {
          id: `block-${Date.now()}-1`,
          type: 'logo',
          content: { url: '/logo.png' },
          styles: {}
        }
      ];

      // Add header
      if (emailType === 'welcome') {
        generatedBlocks.push({
          id: `block-${Date.now()}-2`,
          type: 'header',
          content: { text: 'Welcome to JMEFIT!' },
          styles: {}
        });
        generatedBlocks.push({
          id: `block-${Date.now()}-3`,
          type: 'text',
          content: { text: 'We\'re thrilled to have you join our fitness community! Get ready to transform your life with personalized training, nutrition guidance, and ongoing support from our expert team.' },
          styles: {}
        });
        generatedBlocks.push({
          id: `block-${Date.now()}-4`,
          type: 'button',
          content: { text: 'Get Started', url: 'https://jmefit.com/dashboard' },
          styles: {}
        });
        generatedBlocks.push({
          id: `block-${Date.now()}-5`,
          type: 'text',
          content: { text: 'As a special welcome gift, enjoy 20% off your first month with code: WELCOME20' },
          styles: {}
        });
      } else if (emailType === 'reminder') {
        generatedBlocks.push({
          id: `block-${Date.now()}-2`,
          type: 'header',
          content: { text: 'Class Reminder' },
          styles: {}
        });
        generatedBlocks.push({
          id: `block-${Date.now()}-3`,
          type: 'text',
          content: { text: 'Don\'t forget! You have a class scheduled tomorrow:\n\n📅 Date: Tomorrow\n⏰ Time: 9:00 AM\n📍 Location: Main Studio\n👥 Instructor: Jane Smith' },
          styles: {}
        });
        generatedBlocks.push({
          id: `block-${Date.now()}-4`,
          type: 'button',
          content: { text: 'View Schedule', url: 'https://jmefit.com/schedule' },
          styles: {}
        });
      } else if (emailType === 'newsletter') {
        generatedBlocks.push({
          id: `block-${Date.now()}-2`,
          type: 'header',
          content: { text: 'JMEFIT Monthly Newsletter' },
          styles: {}
        });
        generatedBlocks.push({
          id: `block-${Date.now()}-3`,
          type: 'image',
          content: { url: 'https://via.placeholder.com/600x300?text=Newsletter+Header', alt: 'Newsletter Header' },
          styles: {}
        });
        generatedBlocks.push({
          id: `block-${Date.now()}-4`,
          type: 'text',
          content: { text: 'This month\'s highlights:\n\n• New HIIT classes starting next week\n• Nutrition workshop on Saturday\n• Member spotlight: Sarah\'s 50lb transformation\n• Tips for staying motivated during winter' },
          styles: {}
        });
        generatedBlocks.push({
          id: `block-${Date.now()}-5`,
          type: 'button',
          content: { text: 'Read Full Newsletter', url: 'https://jmefit.com/newsletter' },
          styles: {}
        });
      }

      // Add footer and social links
      generatedBlocks.push({
        id: `block-${Date.now()}-footer-divider`,
        type: 'divider',
        content: {},
        styles: {}
      });
      generatedBlocks.push({
        id: `block-${Date.now()}-social`,
        type: 'social',
        content: {},
        styles: {}
      });
      generatedBlocks.push({
        id: `block-${Date.now()}-footer`,
        type: 'footer',
        content: {},
        styles: {}
      });

      setEmailBlocks(generatedBlocks);
      setEmailSubject(
        emailType === 'welcome' ? 'Welcome to JMEFIT - Let\'s Start Your Journey!' :
        emailType === 'reminder' ? 'Reminder: Your Class Tomorrow' :
        emailType === 'newsletter' ? 'JMEFIT Monthly Update - New Classes & Tips' :
        'Important Update from JMEFIT'
      );
      
      setShowAIModal(false);
    } catch (error) {
      console.error('Error generating AI template:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addBlock = (type: EmailBlock['type']) => {
    const newBlock: EmailBlock = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      styles: {}
    };
    setEmailBlocks([...emailBlocks, newBlock]);
  };

  const getDefaultContent = (type: EmailBlock['type']) => {
    switch (type) {
      case 'logo':
        return { url: '/logo.png' };
      case 'header':
        return { text: 'Your Header Here' };
      case 'text':
        return { text: 'Your content here...' };
      case 'button':
        return { text: 'Click Here', url: '#' };
      case 'image':
        return { url: '', alt: 'Image' };
      case 'spacer':
        return { height: '20px' };
      case 'footer':
        return {};
      default:
        return {};
    }
  };

  const moveBlock = (dragIndex: number, hoverIndex: number) => {
    const draggedBlock = emailBlocks[dragIndex];
    const newBlocks = [...emailBlocks];
    newBlocks.splice(dragIndex, 1);
    newBlocks.splice(hoverIndex, 0, draggedBlock);
    setEmailBlocks(newBlocks);
  };

  const updateBlock = (blockId: string, updates: Partial<EmailBlock>) => {
    setEmailBlocks(emailBlocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (blockId: string) => {
    setEmailBlocks(emailBlocks.filter(block => block.id !== blockId));
  };

  const loadTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEmailSubject(template.subject);
    if (template.json_content?.blocks) {
      setEmailBlocks(template.json_content.blocks);
    }
    setShowTemplateLibrary(false);
  };

  const generateHtml = () => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .content { padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #6B46C1; color: white; text-decoration: none; border-radius: 8px; }
          .button:hover { background-color: #553C9A; }
          .social-links { text-align: center; padding: 20px; }
          .social-links a { margin: 0 10px; text-decoration: none; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .footer a { color: #6B46C1; text-decoration: underline; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
    `;

    emailBlocks.forEach(block => {
      switch (block.type) {
        case 'logo':
          html += `<div style="text-align: center; padding: 20px 0;">
            <img src="${block.content.url || 'https://via.placeholder.com/200x60?text=JMEFIT'}" alt="JMEFIT Logo" style="height: 60px;">
          </div>`;
          break;
        case 'header':
          html += `<h1 style="text-align: center; color: #6B46C1; margin: 20px 0;">${block.content.text}</h1>`;
          break;
        case 'text':
          html += `<p style="margin: 15px 0; white-space: pre-wrap;">${block.content.text}</p>`;
          break;
        case 'button':
          html += `<div style="text-align: center; margin: 25px 0;">
            <a href="${block.content.url}" class="button">${block.content.text}</a>
          </div>`;
          break;
        case 'image':
          if (block.content.url) {
            html += `<div style="text-align: center; margin: 20px 0;">
              <img src="${block.content.url}" alt="${block.content.alt}" style="max-width: 100%; border-radius: 8px;">
            </div>`;
          }
          break;
        case 'divider':
          html += `<hr style="border: 1px solid #e0e0e0; margin: 25px 0;">`;
          break;
        case 'spacer':
          html += `<div style="height: ${block.content.height};"></div>`;
          break;
        case 'social':
          html += `<div class="social-links">
            <a href="#">Facebook</a>
            <a href="#">Twitter</a>
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
          </div>`;
          break;
        case 'footer':
          html += `<div class="footer">
            <p>© 2024 JMEFIT. All rights reserved.</p>
            <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
          </div>`;
          break;
      }
    });

    html += `
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  };

  const handleSaveTemplate = () => {
    const template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'> = {
      name: templateName,
      subject: emailSubject,
      html_content: generateHtml(),
      json_content: { blocks: emailBlocks },
      category: templateCategory,
      is_template: true
    };
    
    saveTemplateMutation.mutate(template);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full">
        {/* Collapsible Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-gray-100 border-r transition-all duration-300 flex flex-col`}>
          <div className="p-4 border-b bg-white">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-between text-gray-700 hover:text-gray-900"
            >
              <span className={`font-semibold ${sidebarCollapsed ? 'hidden' : 'block'}`}>Email Builder</span>
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {/* AI Generator Button */}
            <button
              onClick={() => setShowAIModal(true)}
              className={`w-full mb-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'}`}
            >
              <Sparkles className="w-5 h-5" />
              {!sidebarCollapsed && <span>AI Template Generator</span>}
            </button>

            {/* Components Section */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection('components')}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} text-sm font-semibold text-gray-700 mb-2`}
              >
                {!sidebarCollapsed && <span>Components</span>}
                {!sidebarCollapsed && (expandedSections.includes('components') ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {(!sidebarCollapsed && expandedSections.includes('components')) && (
                <div className="space-y-2">
                  {blockComponents.map(component => (
                    <button
                      key={component.type}
                      onClick={() => addBlock(component.type as EmailBlock['type'])}
                      className="w-full px-3 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                    >
                      {component.icon}
                      <span className="text-sm">{component.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Templates Section */}
            <div>
              <button
                onClick={() => toggleSection('templates')}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} text-sm font-semibold text-gray-700 mb-2`}
              >
                {!sidebarCollapsed && <span>Templates</span>}
                {!sidebarCollapsed && (expandedSections.includes('templates') ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {(!sidebarCollapsed && expandedSections.includes('templates')) && (
                <button
                  onClick={() => setShowTemplateLibrary(true)}
                  className="w-full px-3 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark transition-colors text-sm"
                >
                  Browse Templates
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 p-6 bg-gray-50">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex-1 mr-4">
              <input
                type="text"
                placeholder="Email Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-lg font-semibold focus:border-jme-purple outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                {previewMode ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={() => setSavingTemplate(true)}
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

          <div className="bg-white border rounded-lg shadow-sm p-6 min-h-[600px]">
            {previewMode ? (
              <div className="max-w-2xl mx-auto">
                <div dangerouslySetInnerHTML={{ __html: generateHtml() }} />
              </div>
            ) : (
              <div>
                {emailBlocks.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <Wand2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="mb-4 text-lg">Start building your email</p>
                    <p className="text-sm">Add components from the sidebar or use AI to generate a template</p>
                  </div>
                ) : (
                  emailBlocks.map((block, index) => (
                    <DraggableBlock
                      key={block.id}
                      block={block}
                      index={index}
                      moveBlock={moveBlock}
                      updateBlock={updateBlock}
                      deleteBlock={deleteBlock}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Modal */}
        <AIPromptModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onGenerate={generateAITemplate}
          isGenerating={isGeneratingAI}
        />

        {/* Template Library Modal */}
        {showTemplateLibrary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Email Templates</h2>
                <button
                  onClick={() => setShowTemplateLibrary(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {templates && templates.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:border-jme-purple cursor-pointer transition-colors"
                      onClick={() => loadTemplate(template)}
                    >
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.category}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Template Modal */}
        {savingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Save Email Template</h3>
              <input
                type="text"
                placeholder="Template Name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mb-4 focus:border-jme-purple outline-none"
              />
              <select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value as EmailTemplate['category'])}
                className="w-full px-4 py-2 border rounded-lg mb-4 focus:border-jme-purple outline-none"
              >
                <option value="marketing">Marketing</option>
                <option value="transactional">Transactional</option>
                <option value="newsletter">Newsletter</option>
                <option value="notification">Notification</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setSavingTemplate(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

export default EnhancedEmailBuilder;