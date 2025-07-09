import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronRight, ChevronDown, Menu, X } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

interface SidebarSection {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface CollapsibleSidebarProps {
  items: SidebarItem[];
  sections?: SidebarSection[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  defaultCollapsed?: boolean;
}

export function CollapsibleSidebar({ 
  items, 
  sections = [], 
  activeTab, 
  onTabChange,
  defaultCollapsed = false 
}: CollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [expandedSections, setExpandedSections] = useState<string[]>(
    sections.map(s => s.id) // All sections expanded by default
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const groupedItems = items.reduce((acc, item) => {
    const section = item.section || 'default';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  const renderSection = (sectionId: string, sectionLabel: string, sectionIcon?: React.ReactNode) => {
    const sectionItems = groupedItems[sectionId] || [];
    const isExpanded = expandedSections.includes(sectionId);

    return (
      <div key={sectionId} className="mb-4">
        {sections.length > 0 && (
          <button
            onClick={() => toggleSection(sectionId)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <div className="flex items-center gap-2">
              {sectionIcon}
              {!isCollapsed && <span>{sectionLabel}</span>}
            </div>
            {!isCollapsed && (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        
        {isExpanded && (
          <div className={cn("mt-1", isCollapsed && "px-1")}>
            {sectionItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 mb-1 rounded-lg text-left transition-all",
                  activeTab === item.id
                    ? "bg-jme-purple text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={cn("flex-shrink-0", isCollapsed && "text-lg")}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 h-full shadow-lg transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Admin Panel</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {sections.length > 0 ? (
          sections.map(section => renderSection(section.id, section.label, section.icon))
        ) : (
          renderSection('default', 'Menu')
        )}
        
        {/* Render items without sections */}
        {groupedItems.default && sections.length === 0 && (
          <div>
            {groupedItems.default.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 mb-1 rounded-lg text-left transition-all",
                  activeTab === item.id
                    ? "bg-jme-purple text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={cn("flex-shrink-0", isCollapsed && "text-lg")}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Footer (optional) */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            JMEFIT Admin v2.0
          </div>
        </div>
      )}
    </div>
  );
}