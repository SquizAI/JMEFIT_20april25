import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '../../../lib/supabase';
import { X, Sparkles } from 'lucide-react';
import { AIEmailGenerator } from './AIEmailGenerator';

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
  type: 'header' | 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'columns' | 'social' | 'discount';
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

const DraggableBlock: React.FC<DraggableBlockProps> = ({ block, index, moveBlock, updateBlock, deleteBlock }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscountSelector, setShowDiscountSelector] = useState(false);
  
  // Fetch available discount codes
  const { data: discountCodes } = useQuery({
    queryKey: ['stripe-coupons'],
    queryFn: async () => {
      const response = await fetch('/.netlify/functions/list-coupons');
      if (!response.ok) throw new Error('Failed to fetch coupons');
      return response.json();
    },
    enabled: block.type === 'discount'
  });

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
                className="cursor-text hover:bg-gray-100 rounded p-2"
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
              <img src={block.content.url} alt={block.content.alt || ''} className="max-w-full mx-auto" />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
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
              <a key={platform} href="#" className="text-gray-600 hover:text-jme-purple">
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
      
      case 'discount':
        return (
          <div className="p-4">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-dashed border-purple-300 rounded-lg p-6 text-center relative">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={block.content.code || ''}
                      onChange={(e) => updateBlock(block.id, { content: { ...block.content, code: e.target.value } })}
                      className="flex-1 text-2xl font-bold text-center border-b-2 border-purple-300 bg-transparent focus:border-purple-500 outline-none"
                      placeholder="DISCOUNT CODE"
                    />
                    <button
                      onClick={() => setShowDiscountSelector(true)}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    >
                      Select Code
                    </button>
                  </div>
                  <input
                    type="text"
                    value={block.content.description || ''}
                    onChange={(e) => updateBlock(block.id, { content: { ...block.content, description: e.target.value } })}
                    className="w-full text-center border-b border-purple-200 bg-transparent focus:border-purple-400 outline-none"
                    placeholder="e.g., Save 20% on your first order"
                  />
                  <input
                    type="text"
                    value={block.content.expiry || ''}
                    onChange={(e) => updateBlock(block.id, { content: { ...block.content, expiry: e.target.value } })}
                    className="w-full text-sm text-center border-b border-purple-200 bg-transparent focus:border-purple-400 outline-none"
                    placeholder="Valid until Dec 31, 2024"
                  />
                  <button
                    onClick={() => setIsEditing(false)}
                    className="mt-2 text-sm text-purple-600 hover:text-purple-800"
                  >
                    Done Editing
                  </button>
                </div>
              ) : (
                <div onClick={() => setIsEditing(true)} className="cursor-pointer">
                  <div className="text-purple-600 text-sm font-medium mb-2">EXCLUSIVE OFFER</div>
                  <div className="text-3xl font-bold text-purple-800 mb-2 font-mono">
                    {block.content.code || 'SAVE20'}
                  </div>
                  <div className="text-gray-700 mb-1">
                    {block.content.description || 'Click to edit discount details'}
                  </div>
                  {block.content.expiry && (
                    <div className="text-sm text-gray-500 mt-2">
                      {block.content.expiry}
                    </div>
                  )}
                </div>
              )}
              
              {/* Discount Code Selector Modal */}
              {showDiscountSelector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Select Discount Code</h3>
                      <button
                        onClick={() => setShowDiscountSelector(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {discountCodes?.map((coupon: any) => (
                        <button
                          key={coupon.id}
                          onClick={() => {
                            updateBlock(block.id, {
                              content: {
                                ...block.content,
                                code: coupon.id,
                                description: coupon.percent_off 
                                  ? `Save ${coupon.percent_off}% on your purchase`
                                  : `Save $${(coupon.amount_off / 100).toFixed(2)} on your purchase`
                              }
                            });
                            setShowDiscountSelector(false);
                          }}
                          className="w-full p-3 border rounded-lg hover:bg-gray-50 text-left"
                        >
                          <div className="font-mono font-bold text-purple-600">{coupon.id}</div>
                          <div className="text-sm text-gray-600">
                            {coupon.name} - {coupon.percent_off ? `${coupon.percent_off}% off` : `$${(coupon.amount_off / 100).toFixed(2)} off`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
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

function EmailBuilder() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [emailBlocks, setEmailBlocks] = useState<EmailBlock[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<EmailTemplate['category']>('marketing');
  const [showAIGenerator, setShowAIGenerator] = useState(false);

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
    { type: 'header', label: 'Header', icon: '📝' },
    { type: 'text', label: 'Text', icon: '📄' },
    { type: 'image', label: 'Image', icon: '🖼️' },
    { type: 'button', label: 'Button', icon: '🔘' },
    { type: 'discount', label: 'Discount Code', icon: '🎫' },
    { type: 'divider', label: 'Divider', icon: '➖' },
    { type: 'spacer', label: 'Spacer', icon: '⬜' },
    { type: 'social', label: 'Social Links', icon: '🔗' },
  ];

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
      case 'discount':
        return { code: 'SAVE20', description: 'Save 20% on your next purchase', expiry: '' };
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #6B46C1; color: white; text-decoration: none; border-radius: 8px; }
          .social-links { text-align: center; padding: 20px; }
          .social-links a { margin: 0 10px; }
        </style>
      </head>
      <body>
        <div class="container">
    `;

    emailBlocks.forEach(block => {
      switch (block.type) {
        case 'header':
          html += `<h1 style="text-align: center; color: #6B46C1;">${block.content.text}</h1>`;
          break;
        case 'text':
          html += `<p>${block.content.text}</p>`;
          break;
        case 'button':
          html += `<div style="text-align: center; margin: 20px 0;">
            <a href="${block.content.url}" class="button">${block.content.text}</a>
          </div>`;
          break;
        case 'image':
          html += `<div style="text-align: center; margin: 20px 0;">
            <img src="${block.content.url}" alt="${block.content.alt}" style="max-width: 100%;">
          </div>`;
          break;
        case 'divider':
          html += `<hr style="border: 1px solid #e0e0e0; margin: 20px 0;">`;
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
        case 'discount':
          html += `
            <div style="margin: 30px 0; text-align: center;">
              <div style="background: linear-gradient(135deg, #f3e7ff 0%, #ffe0f7 100%); border: 2px dashed #9333ea; border-radius: 12px; padding: 30px; max-width: 400px; margin: 0 auto;">
                <div style="color: #7c3aed; font-size: 14px; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Exclusive Offer</div>
                <div style="color: #6b21a8; font-size: 36px; font-weight: bold; margin-bottom: 10px; font-family: monospace; letter-spacing: 2px;">${block.content.code}</div>
                <div style="color: #374151; font-size: 16px; margin-bottom: 5px;">${block.content.description}</div>
                ${block.content.expiry ? `<div style="color: #6b7280; font-size: 14px; margin-top: 10px;">${block.content.expiry}</div>` : ''}
              </div>
            </div>
          `;
          break;
      }
    });

    html += `
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

  const prebuiltTemplates = [
    {
      name: 'Welcome Email',
      category: 'transactional' as const,
      blocks: [
        { id: '1', type: 'header' as const, content: { text: 'Welcome to JMEFIT!' }, styles: {} },
        { id: '2', type: 'text' as const, content: { text: 'We\'re excited to have you join our fitness community. Get ready to transform your life with personalized training and nutrition guidance.' }, styles: {} },
        { id: '3', type: 'button' as const, content: { text: 'Get Started', url: '#' }, styles: {} },
        { id: '4', type: 'divider' as const, content: {}, styles: {} },
        { id: '5', type: 'social' as const, content: {}, styles: {} }
      ]
    },
    {
      name: 'Promotional Email',
      category: 'marketing' as const,
      blocks: [
        { id: '1', type: 'header' as const, content: { text: 'Special Offer Just for You!' }, styles: {} },
        { id: '2', type: 'text' as const, content: { text: 'As a valued member of our community, we\'re offering you an exclusive discount on your next program.' }, styles: {} },
        { id: '3', type: 'discount' as const, content: { code: 'SAVE20', description: 'Save 20% on any program', expiry: 'Valid until Dec 31, 2024' }, styles: {} },
        { id: '4', type: 'button' as const, content: { text: 'Shop Now', url: '#' }, styles: {} },
        { id: '5', type: 'text' as const, content: { text: 'Use the code at checkout to apply your discount. Don\'t miss out!' }, styles: {} }
      ]
    },
    {
      name: 'Class Reminder',
      category: 'notification' as const,
      blocks: [
        { id: '1', type: 'header' as const, content: { text: 'Your Class is Tomorrow!' }, styles: {} },
        { id: '2', type: 'text' as const, content: { text: 'Don\'t forget about your upcoming class tomorrow at 9:00 AM.' }, styles: {} },
        { id: '3', type: 'button' as const, content: { text: 'View Schedule', url: '#' }, styles: {} }
      ]
    },
    {
      name: 'Monthly Newsletter',
      category: 'newsletter' as const,
      blocks: [
        { id: '1', type: 'header' as const, content: { text: 'JMEFIT Monthly Update' }, styles: {} },
        { id: '2', type: 'image' as const, content: { url: '/api/placeholder/600/300', alt: 'Newsletter Header' }, styles: {} },
        { id: '3', type: 'text' as const, content: { text: 'Check out what\'s new this month at JMEFIT...' }, styles: {} },
        { id: '4', type: 'button' as const, content: { text: 'Read More', url: '#' }, styles: {} }
      ]
    }
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full">
        {/* Sidebar - Block Components */}
        <div className="w-64 bg-gray-100 p-4 border-r">
          <h3 className="font-semibold mb-4">Email Components</h3>
          <div className="space-y-2">
            {blockComponents.map(component => (
              <button
                key={component.type}
                onClick={() => addBlock(component.type as EmailBlock['type'])}
                className="w-full px-4 py-3 bg-white rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
              >
                <span className="text-2xl">{component.icon}</span>
                <span>{component.label}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-8">
            <button
              onClick={() => setShowTemplateLibrary(true)}
              className="w-full px-4 py-3 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark transition-colors"
            >
              Browse Templates
            </button>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 p-6">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex-1 mr-4">
              <input
                type="text"
                placeholder="Email Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-lg font-semibold"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAIGenerator(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI Generate
              </button>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={() => setSavingTemplate(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Template
              </button>
              <button
                className="px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark"
              >
                Send Test Email
              </button>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 min-h-[600px]">
            {previewMode ? (
              <div dangerouslySetInnerHTML={{ __html: generateHtml() }} />
            ) : (
              <div>
                {emailBlocks.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <p className="mb-4">Start building your email by adding components from the sidebar</p>
                    <p className="text-sm">or choose from our pre-built templates</p>
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
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Pre-built Templates */}
                <div className="col-span-3">
                  <h3 className="font-semibold mb-3">Pre-built Templates</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {prebuiltTemplates.map((template, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:border-jme-purple cursor-pointer"
                        onClick={() => {
                          setEmailBlocks(template.blocks);
                          setEmailSubject(template.name);
                          setShowTemplateLibrary(false);
                        }}
                      >
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {template.category}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Saved Templates */}
                {templates && templates.length > 0 && (
                  <div className="col-span-3 mt-6">
                    <h3 className="font-semibold mb-3">Saved Templates</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="border rounded-lg p-4 hover:border-jme-purple cursor-pointer"
                          onClick={() => loadTemplate(template)}
                        >
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {template.category}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                className="w-full px-4 py-2 border rounded-lg mb-4"
              />
              <select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value as EmailTemplate['category'])}
                className="w-full px-4 py-2 border rounded-lg mb-4"
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

        {/* AI Email Generator */}
        {showAIGenerator && (
          <AIEmailGenerator
            onGenerate={(blocks, subject) => {
              setEmailBlocks(blocks);
              setEmailSubject(subject);
              setShowAIGenerator(false);
            }}
            onClose={() => setShowAIGenerator(false)}
          />
        )}
      </div>
    </DndProvider>
  );
}

export default EmailBuilder;

// Export types for AIEmailGenerator
export type { EmailBlock };