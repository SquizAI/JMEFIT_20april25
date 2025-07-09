import React from 'react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition-colors ${
        active ? 'bg-jme-purple text-white' : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

export default TabButton;