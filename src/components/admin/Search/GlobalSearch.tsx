import React from 'react';
import { X } from 'lucide-react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 px-4 py-2 bg-transparent focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-500 text-center">Start typing to search...</p>
        </div>
      </div>
    </div>
  );
} 