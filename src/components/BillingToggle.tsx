import React from 'react';

interface BillingToggleProps {
  billingInterval: 'month' | 'year';
  onChange: (interval: 'month' | 'year') => void;
  className?: string;
}

const BillingToggle: React.FC<BillingToggleProps> = ({
  billingInterval,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center justify-center space-x-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => onChange('month')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            billingInterval === 'month'
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => onChange('year')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            billingInterval === 'year'
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400'
          }`}
        >
          Yearly
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full">
            Save 20%
          </span>
        </button>
      </div>
    </div>
  );
};

export default BillingToggle;
