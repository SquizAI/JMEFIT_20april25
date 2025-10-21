import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Type,
  Image,
  Square,
  Columns,
  Link,
  Minus,
  Circle,
  Mail,
  Calendar,
  MapPin,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Hash,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Copy,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  Grid3x3,
  Layers,
  MousePointer2
} from 'lucide-react';

// Available wireframe components
const WIREFRAME_COMPONENTS = {
  text: {
    icon: Type,
    name: 'Text Block',
    defaultProps: {
      text: 'Lorem ipsum dolor sit amet...',
      align: 'left',
      fontSize: '16px',
      color: '#1F2937'
    }
  },
  heading: {
    icon: Hash,
    name: 'Heading',
    defaultProps: {
      text: 'Section Heading',
      level: 'h2',
      align: 'center',
      color: '#1F2937'
    }
  },
  image: {
    icon: Image,
    name: 'Image',
    defaultProps: {
      src: '/api/placeholder/600/300',
      alt: 'Image description',
      width: '100%',
      align: 'center'
    }
  },
  button: {
    icon: MousePointer2,
    name: 'Button',
    defaultProps: {
      text: 'Call to Action',
      url: '#',
      align: 'center',
      backgroundColor: '#8B5CF6',
      color: '#FFFFFF',
      borderRadius: '6px',
      padding: '12px 24px'
    }
  },
  divider: {
    icon: Minus,
    name: 'Divider',
    defaultProps: {
      height: '1px',
      color: '#E5E7EB',
      margin: '20px 0'
    }
  },
  spacer: {
    icon: Square,
    name: 'Spacer',
    defaultProps: {
      height: '40px'
    }
  },
  columns: {
    icon: Columns,
    name: 'Columns',
    defaultProps: {
      columns: 2,
      gap: '20px',
      responsive: true
    }
  },
  social: {
    icon: Globe,
    name: 'Social Links',
    defaultProps: {
      platforms: ['facebook', 'instagram', 'twitter'],
      align: 'center',
      iconSize: '24px',
      gap: '12px'
    }
  }
};

interface WireframeBlock {
  id: string;
  type: keyof typeof WIREFRAME_COMPONENTS;
  props: any;
  children?: WireframeBlock[];
}

interface SortableItemProps {
  block: WireframeBlock;
  onUpdate: (id: string, props: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

function SortableItem({ block, onUpdate, onDelete, onDuplicate }: SortableItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const component = WIREFRAME_COMPONENTS[block.type];
  const Icon = component.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg mb-3 ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}
    >
      <div className="flex items-center p-3 border-b">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move mr-3 text-gray-400 hover:text-gray-600"
        >
          <Grid3x3 className="h-4 w-4" />
        </div>
        
        <Icon className="h-4 w-4 text-gray-600 mr-2" />
        <span className="text-sm font-medium flex-1">{component.name}</span>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Settings className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={() => onDuplicate(block.id)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Copy className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={() => onDelete(block.id)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {/* Visual Preview */}
          <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
            {renderPreview(block)}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="space-y-3 pt-3 border-t">
              {renderSettings(block, onUpdate)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Render preview based on block type
function renderPreview(block: WireframeBlock) {
  switch (block.type) {
    case 'text':
      return (
        <p style={{ textAlign: block.props.align, fontSize: block.props.fontSize, color: block.props.color }}>
          {block.props.text}
        </p>
      );
    
    case 'heading':
      const HeadingTag = block.props.level as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag style={{ textAlign: block.props.align, color: block.props.color, margin: 0 }}>
          {block.props.text}
        </HeadingTag>
      );
    
    case 'image':
      return (
        <div style={{ textAlign: block.props.align }}>
          <div className="bg-gray-200 rounded" style={{ width: block.props.width, height: '200px', display: 'inline-block' }}>
            <div className="flex items-center justify-center h-full text-gray-400">
              <Image className="h-12 w-12" />
            </div>
          </div>
        </div>
      );
    
    case 'button':
      return (
        <div style={{ textAlign: block.props.align }}>
          <button
            style={{
              backgroundColor: block.props.backgroundColor,
              color: block.props.color,
              borderRadius: block.props.borderRadius,
              padding: block.props.padding,
              border: 'none',
              fontWeight: 'bold'
            }}
          >
            {block.props.text}
          </button>
        </div>
      );
    
    case 'divider':
      return (
        <hr
          style={{
            height: block.props.height,
            backgroundColor: block.props.color,
            border: 'none',
            margin: block.props.margin
          }}
        />
      );
    
    case 'spacer':
      return (
        <div style={{ height: block.props.height }} className="bg-gray-100 rounded" />
      );
    
    case 'columns':
      return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${block.props.columns}, 1fr)` }}>
          {Array.from({ length: block.props.columns }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded p-4 text-center text-gray-400">
              Column {i + 1}
            </div>
          ))}
        </div>
      );
    
    case 'social':
      return (
        <div style={{ textAlign: block.props.align }}>
          <div className="inline-flex" style={{ gap: block.props.gap }}>
            {block.props.platforms.map((platform: string) => {
              const icons: any = {
                facebook: Facebook,
                instagram: Instagram,
                twitter: Twitter,
                linkedin: Linkedin,
                youtube: Youtube
              };
              const SocialIcon = icons[platform] || Globe;
              return (
                <div key={platform} className="text-gray-600">
                  <SocialIcon style={{ height: block.props.iconSize, width: block.props.iconSize }} />
                </div>
              );
            })}
          </div>
        </div>
      );
    
    default:
      return null;
  }
}

// Render settings based on block type
function renderSettings(block: WireframeBlock, onUpdate: (id: string, props: any) => void) {
  const updateProp = (key: string, value: any) => {
    onUpdate(block.id, { ...block.props, [key]: value });
  };

  switch (block.type) {
    case 'text':
    case 'heading':
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
            <input
              type="text"
              value={block.props.text}
              onChange={(e) => updateProp('text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alignment</label>
            <div className="flex space-x-2">
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => updateProp('align', align)}
                  className={`p-2 rounded ${block.props.align === align ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'}`}
                >
                  {align === 'left' && <AlignLeft className="h-4 w-4" />}
                  {align === 'center' && <AlignCenter className="h-4 w-4" />}
                  {align === 'right' && <AlignRight className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </>
      );
    
    case 'button':
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
            <input
              type="text"
              value={block.props.text}
              onChange={(e) => updateProp('text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="text"
              value={block.props.url}
              onChange={(e) => updateProp('url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
            <input
              type="color"
              value={block.props.backgroundColor}
              onChange={(e) => updateProp('backgroundColor', e.target.value)}
              className="w-full h-10"
            />
          </div>
        </>
      );
    
    default:
      return <div className="text-sm text-gray-500">No settings available</div>;
  }
}

interface WireframeBuilderProps {
  blocks: WireframeBlock[];
  onBlocksChange: (blocks: WireframeBlock[]) => void;
}

export default function WireframeBuilder({ blocks, onBlocksChange }: WireframeBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over?.id);
      onBlocksChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const addBlock = (type: keyof typeof WIREFRAME_COMPONENTS) => {
    const newBlock: WireframeBlock = {
      id: `block-${Date.now()}`,
      type,
      props: { ...WIREFRAME_COMPONENTS[type].defaultProps }
    };
    onBlocksChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, props: any) => {
    onBlocksChange(blocks.map(block => 
      block.id === id ? { ...block, props } : block
    ));
  };

  const deleteBlock = (id: string) => {
    onBlocksChange(blocks.filter(block => block.id !== id));
  };

  const duplicateBlock = (id: string) => {
    const blockToDuplicate = blocks.find(b => b.id === id);
    if (blockToDuplicate) {
      const newBlock = {
        ...blockToDuplicate,
        id: `block-${Date.now()}`
      };
      const index = blocks.findIndex(b => b.id === id);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      onBlocksChange(newBlocks);
    }
  };

  return (
    <div className="flex h-full">
      {/* Component Palette */}
      <div className="w-64 bg-gray-50 border-r p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Components</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(WIREFRAME_COMPONENTS).map(([type, component]) => {
            const Icon = component.icon;
            return (
              <button
                key={type}
                onClick={() => addBlock(type as keyof typeof WIREFRAME_COMPONENTS)}
                className="p-3 bg-white border rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors flex flex-col items-center space-y-1"
              >
                <Icon className="h-5 w-5 text-gray-600" />
                <span className="text-xs text-gray-600">{component.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-6 overflow-auto bg-gray-100">
        <div className="max-w-2xl mx-auto">
          {blocks.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No blocks yet</p>
              <p className="text-sm text-gray-400">Add components from the left panel to start building</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blocks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {blocks.map((block) => (
                  <SortableItem
                    key={block.id}
                    block={block}
                    onUpdate={updateBlock}
                    onDelete={deleteBlock}
                    onDuplicate={duplicateBlock}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
} 