import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
}

function StatsCard({ title, value, icon: Icon, iconColor = 'text-jme-purple' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
    </div>
  );
}

export default StatsCard;