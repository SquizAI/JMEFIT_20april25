import React from 'react';

interface AnalyticsProps {
  orders: any[];
  products: any[];
  dateRange: string;
}

export function Analytics({ orders, products, dateRange }: AnalyticsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
      <p className="text-gray-600 dark:text-gray-400">
        Analytics for {dateRange} - {orders.length} orders, {products.length} products
      </p>
      {/* TODO: Add charts and analytics */}
    </div>
  );
} 