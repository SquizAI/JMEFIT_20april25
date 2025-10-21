import React, { useState, useRef, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Type, 
  Image, 
  Square, 
  Columns, 
  Link,
  FileText,
  Code,
  Palette,
  Settings,
  Eye,
  Save,
  Download,
  Smartphone,
  Monitor,
  X,
  GripVertical,
  Copy,
  Trash2
} from 'lucide-react';

interface EmailBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'columns' | 'spacer' | 'html';
  content: any;
  styles: any;
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="group relative">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move" {...listeners}>
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
        {children}
      </div>
    </div>
  );
};

const EmailVisualBuilder: React.FC = () => {
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [emailSettings, setEmailSettings] = useState({
    backgroundColor: '#f7fafc',
    contentBackgroundColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    primaryColor: '#8B5CF6',
    width: 600,
    padding: 20,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const blockTypes = [
    { type: 'text', icon: Type, label: 'Text' },
    { type: 'image', icon: Image, label: 'Image' },
    { type: 'button', icon: Square, label: 'Button' },
    { type: 'divider', icon: FileText, label: 'Divider' },
    { type: 'columns', icon: Columns, label: 'Columns' },
    { type: 'spacer', icon: Square, label: 'Spacer' },
    { type: 'html', icon: Code, label: 'HTML' },
  ];

  const addBlock = (type: string) => {
    const newBlock: EmailBlock = {
      id: `block-${Date.now()}`,
      type: type as any,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type),
    };
    setBlocks([...blocks, newBlock]);
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text':
        return {
          text: '<p>Enter your text here...</p>',
        };
      case 'image':
        return {
          src: 'https://via.placeholder.com/600x300',
          alt: 'Image description',
          link: '',
        };
      case 'button':
        return {
          text: 'Click Here',
          link: 'https://example.com',
        };
      case 'divider':
        return {
          height: 1,
          color: '#e2e8f0',
        };
      case 'columns':
        return {
          columns: [
            { content: '<p>Column 1</p>', width: 50 },
            { content: '<p>Column 2</p>', width: 50 },
          ],
        };
      case 'spacer':
        return {
          height: 20,
        };
      case 'html':
        return {
          code: '<!-- Custom HTML -->',
        };
      default:
        return {};
    }
  };

  const getDefaultStyles = (type: string) => {
    switch (type) {
      case 'text':
        return {
          fontSize: 16,
          color: '#1a202c',
          lineHeight: 1.5,
          textAlign: 'left',
          padding: '10px 0',
        };
      case 'button':
        return {
          backgroundColor: '#8B5CF6',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: 6,
          fontSize: 16,
          textAlign: 'center',
          textDecoration: 'none',
          display: 'inline-block',
        };
      case 'image':
        return {
          width: '100%',
          maxWidth: '100%',
          height: 'auto',
        };
      default:
        return {};
    }
  };

  const updateBlock = (id: string, updates: Partial<EmailBlock>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    if (selectedBlock === id) {
      setSelectedBlock(null);
    }
  };

  const duplicateBlock = (id: string) => {
    const blockToDuplicate = blocks.find(block => block.id === id);
    if (blockToDuplicate) {
      const newBlock = {
        ...blockToDuplicate,
        id: `block-${Date.now()}`,
      };
      const index = blocks.findIndex(block => block.id === id);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const renderBlock = (block: EmailBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <div 
            style={block.styles}
            dangerouslySetInnerHTML={{ __html: block.content.text }}
          />
        );
      case 'image':
        return (
          <img 
            src={block.content.src} 
            alt={block.content.alt}
            style={block.styles}
          />
        );
      case 'button':
        return (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <a 
              href={block.content.link}
              style={block.styles}
            >
              {block.content.text}
            </a>
          </div>
        );
      case 'divider':
        return (
          <hr style={{
            height: block.content.height,
            backgroundColor: block.content.color,
            border: 'none',
            margin: '20px 0',
          }} />
        );
      case 'spacer':
        return (
          <div style={{ height: block.content.height }} />
        );
      case 'columns':
        return (
          <div style={{ display: 'flex', gap: '20px' }}>
            {block.content.columns.map((col: any, idx: number) => (
              <div 
                key={idx}
                style={{ flex: col.width / 100 }}
                dangerouslySetInnerHTML={{ __html: col.content }}
              />
            ))}
          </div>
        );
      case 'html':
        return (
          <div dangerouslySetInnerHTML={{ __html: block.content.code }} />
        );
      default:
        return null;
    }
  };

  const generateHTML = () => {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: ${emailSettings.fontFamily};
      background-color: ${emailSettings.backgroundColor};
    }
    .email-container {
      max-width: ${emailSettings.width}px;
      margin: 0 auto;
      background-color: ${emailSettings.contentBackgroundColor};
      padding: ${emailSettings.padding}px;
    }
  </style>
</head>
<body>
  <div class="email-container">`;

    blocks.forEach(block => {
      // Convert block to HTML string
      // This is simplified - in production you'd want more robust HTML generation
      const blockHtml = renderBlockAsHTML(block);
      html += blockHtml;
    });

    html += `
  </div>
</body>
</html>`;

    return html;
  };

  const renderBlockAsHTML = (block: EmailBlock): string => {
    // Convert React elements to HTML strings
    // This is a simplified version - you'd want more robust conversion
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = ''; // Render block content as HTML
    return tempDiv.innerHTML;
  };

  const exportHTML = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-template.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Block Types */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Email Blocks</h3>
        <div className="space-y-2">
          {blockTypes.map((blockType) => {
            const Icon = blockType.icon;
            return (
              <button
                key={blockType.type}
                onClick={() => addBlock(blockType.type)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium">{blockType.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <h3 className="font-semibold text-gray-900 mb-4">Email Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Background Color</label>
              <input
                type="color"
                value={emailSettings.backgroundColor}
                onChange={(e) => setEmailSettings({ ...emailSettings, backgroundColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Content Background</label>
              <input
                type="color"
                value={emailSettings.contentBackgroundColor}
                onChange={(e) => setEmailSettings({ ...emailSettings, contentBackgroundColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Width (px)</label>
              <input
                type="number"
                value={emailSettings.width}
                onChange={(e) => setEmailSettings({ ...emailSettings, width: parseInt(e.target.value) })}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Email Builder */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
            >
              <Smartphone className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </button>
            <button 
              onClick={exportHTML}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export HTML
            </button>
          </div>
        </div>

        {/* Email Canvas */}
        <div className="flex-1 overflow-auto p-8">
          <div 
            className="mx-auto transition-all duration-300"
            style={{
              maxWidth: previewMode === 'mobile' ? '375px' : `${emailSettings.width}px`,
              backgroundColor: emailSettings.backgroundColor,
              minHeight: '600px',
            }}
          >
            <div 
              style={{
                backgroundColor: emailSettings.contentBackgroundColor,
                padding: `${emailSettings.padding}px`,
                minHeight: '500px',
              }}
            >
              {blocks.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-lg mb-2">Start building your email</p>
                  <p className="text-sm">Drag blocks from the sidebar or click to add</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {blocks.map((block) => (
                      <SortableItem key={block.id} id={block.id}>
                        <div
                          className={`relative group border-2 transition-all ${
                            selectedBlock === block.id 
                              ? 'border-purple-500' 
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedBlock(block.id)}
                        >
                          {renderBlock(block)}
                          
                          {/* Block Actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateBlock(block.id);
                              }}
                              className="p-1.5 bg-white rounded shadow-sm hover:shadow-md"
                            >
                              <Copy className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBlock(block.id);
                              }}
                              className="p-1.5 bg-white rounded shadow-sm hover:shadow-md"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                  <DragOverlay>
                    {activeId ? (
                      <div className="opacity-50">
                        {renderBlock(blocks.find(b => b.id === activeId)!)}
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedBlock && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Block Properties</h3>
            <button
              onClick={() => setSelectedBlock(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Dynamic property editor based on block type */}
          <BlockPropertyEditor
            block={blocks.find(b => b.id === selectedBlock)!}
            onUpdate={(updates) => updateBlock(selectedBlock, updates)}
          />
        </div>
      )}
    </div>
  );
};

// Property editor component for different block types
const BlockPropertyEditor: React.FC<{
  block: EmailBlock;
  onUpdate: (updates: Partial<EmailBlock>) => void;
}> = ({ block, onUpdate }) => {
  switch (block.type) {
    case 'text':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Text Content</label>
            <textarea
              value={block.content.text}
              onChange={(e) => onUpdate({ content: { ...block.content, text: e.target.value } })}
              className="w-full h-32 px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Font Size</label>
            <input
              type="number"
              value={block.styles.fontSize}
              onChange={(e) => onUpdate({ styles: { ...block.styles, fontSize: parseInt(e.target.value) } })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Text Color</label>
            <input
              type="color"
              value={block.styles.color}
              onChange={(e) => onUpdate({ styles: { ...block.styles, color: e.target.value } })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Text Align</label>
            <select
              value={block.styles.textAlign}
              onChange={(e) => onUpdate({ styles: { ...block.styles, textAlign: e.target.value } })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
        </div>
      );

    case 'button':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Button Text</label>
            <input
              type="text"
              value={block.content.text}
              onChange={(e) => onUpdate({ content: { ...block.content, text: e.target.value } })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Link URL</label>
            <input
              type="url"
              value={block.content.link}
              onChange={(e) => onUpdate({ content: { ...block.content, link: e.target.value } })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Background Color</label>
            <input
              type="color"
              value={block.styles.backgroundColor}
              onChange={(e) => onUpdate({ styles: { ...block.styles, backgroundColor: e.target.value } })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Text Color</label>
            <input
              type="color"
              value={block.styles.color}
              onChange={(e) => onUpdate({ styles: { ...block.styles, color: e.target.value } })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Image URL</label>
            <input
              type="url"
              value={block.content.src}
              onChange={(e) => onUpdate({ content: { ...block.content, src: e.target.value } })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Alt Text</label>
            <input
              type="text"
              value={block.content.alt}
              onChange={(e) => onUpdate({ content: { ...block.content, alt: e.target.value } })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Link URL (optional)</label>
            <input
              type="url"
              value={block.content.link}
              onChange={(e) => onUpdate({ content: { ...block.content, link: e.target.value } })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      );

    default:
      return <div>Properties for {block.type}</div>;
  }
};

export default EmailVisualBuilder; 