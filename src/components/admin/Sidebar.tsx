import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Mail, 
  CreditCard, 
  Calendar,
  Tag,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BarChart,
  FileText,
  DollarSign,
  UserPlus,
  Package
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  tabId?: string;
  children?: MenuItem[];
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    tabId: 'overview'
  },
  {
    label: 'Custom Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    tabId: 'dashboard'
  },
  {
    label: 'Users',
    icon: <Users className="w-5 h-5" />,
    tabId: 'users'
  },
  {
    label: 'Orders',
    icon: <ShoppingBag className="w-5 h-5" />,
    children: [
      {
        label: 'All Orders',
        icon: <ShoppingBag className="w-4 h-4" />,
        tabId: 'orders'
      },
      {
        label: 'Invoices',
        icon: <FileText className="w-4 h-4" />,
        tabId: 'invoices'
      }
    ]
  },
  {
    label: 'Products',
    icon: <Package className="w-5 h-5" />,
    children: [
      {
        label: 'Merchandise',
        icon: <Package className="w-4 h-4" />,
        tabId: 'merchandise'
      },
      {
        label: 'SHRED Waitlist',
        icon: <Users className="w-4 h-4" />,
        tabId: 'waitlist'
      }
    ]
  },
  {
    label: 'Communications',
    icon: <Mail className="w-5 h-5" />,
    tabId: 'communications'
  },
  {
    label: 'Pricing',
    icon: <CreditCard className="w-5 h-5" />,
    children: [
      {
        label: 'Service Pricing',
        icon: <CreditCard className="w-4 h-4" />,
        tabId: 'pricing'
      },
      {
        label: 'Discount Codes',
        icon: <Tag className="w-4 h-4" />,
        tabId: 'pricing'
      }
    ]
  },
  {
    label: 'Schedule',
    icon: <Calendar className="w-5 h-5" />,
    tabId: 'dates'
  },
  {
    label: 'Analytics',
    icon: <BarChart className="w-5 h-5" />,
    tabId: 'analytics'
  },
  {
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    tabId: 'settings'
  }
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleExpanded = (label: string) => {
    if (!isCollapsed) {
      setExpandedItems(prev => 
        prev.includes(label) 
          ? prev.filter(item => item !== label)
          : [...prev, label]
      );
    }
  };

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  const isActive = (tabId?: string) => {
    return tabId === activeTab;
  };

  const isParentActive = (item: MenuItem) => {
    if (item.tabId) return isActive(item.tabId);
    return item.children?.some(child => isActive(child.tabId));
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const active = isParentActive(item);

    if (hasChildren && !isCollapsed) {
      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => toggleExpanded(item.label)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
              active ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="font-medium whitespace-nowrap">{item.label}</span>
            </div>
            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </div>
          </div>
        </div>
      );
    }

    // For collapsed state with children, just show the parent icon
    if (hasChildren && isCollapsed) {
      return (
        <div key={item.label} className="relative group">
          <button
            onClick={() => {
              // Click the first child's tab when collapsed
              if (item.children && item.children[0].tabId) {
                handleTabClick(item.children[0].tabId);
              }
            }}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
              active ? 'bg-purple-600 text-white hover:bg-purple-700' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {item.icon}
          </button>
          
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {item.label}
          </div>
        </div>
      );
    }

    return (
      <div key={item.label} className="relative group">
        <button
          onClick={() => item.tabId && handleTabClick(item.tabId)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
            isActive(item.tabId) 
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : 'text-gray-700 dark:text-gray-300'
          } ${level > 0 && !isCollapsed ? 'pl-12' : ''} ${isCollapsed ? 'justify-center' : ''}`}
        >
          {item.icon}
          {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
        </button>
        
        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`
      relative bg-white dark:bg-gray-800 shadow-lg
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-20' : 'w-72'}
      overflow-y-auto overflow-x-hidden flex flex-col h-full
    `}>
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-50 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      <div className="p-6">
        <div className={`flex items-center gap-3 mb-8 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">JF</span>
          </div>
          <div className={`transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} overflow-hidden`}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">JMEFIT Admin</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Management Dashboard</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
      </div>

      {/* User Info */}
      <div className="mt-auto p-6 border-t dark:border-gray-700">
        <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} overflow-hidden`}>
            <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">Admin User</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">jme@jmefit.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
} 