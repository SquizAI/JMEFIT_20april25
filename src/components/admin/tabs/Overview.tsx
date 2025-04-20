import React from 'react';
import { Package, CreditCard, TrendingUp } from 'lucide-react';
import StatsCard from '../StatsCard';
import DataTable from '../DataTable';
import StatusBadge from '../StatusBadge';
import { format } from 'date-fns';
import type { Order, Product } from '../../../lib/types/database';

interface OverviewProps {
  stats: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: string;
    activeProducts: number;
  };
  orders: Order[];
  products: Product[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
}

function Overview({
  stats,
  orders,
  products,
  loading,
  searchTerm,
  onSearchChange,
  onExport
}: OverviewProps) {
  const orderColumns = [
    { header: 'Order ID', accessor: 'id', cell: (value) => value.slice(0, 8) },
    { header: 'Customer', accessor: 'profiles.email' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value) => (
        <StatusBadge
          status={value}
          variant={value === 'paid' ? 'success' : value === 'pending' ? 'warning' : 'error'}
        />
      )
    },
    {
      header: 'Total',
      accessor: 'total',
      cell: (value) => `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    },
    {
      header: 'Date',
      accessor: 'created_at',
      cell: (value) => format(new Date(value), 'MMM d, yyyy')
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={Package}
        />
        <StatsCard
          title="Revenue"
          value={`$${stats.totalRevenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
          icon={CreditCard}
          iconColor="text-green-500"
        />
        <StatsCard
          title="Avg Order Value"
          value={`$${stats.averageOrderValue}`}
          icon={TrendingUp}
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Active Products"
          value={stats.activeProducts.toLocaleString()}
          icon={Package}
          iconColor="text-yellow-500"
        />
      </div>

      <DataTable
        title="Recent Orders"
        columns={orderColumns}
        data={orders}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onExport={onExport}
        loading={loading}
      />
    </div>
  );
}

export default Overview;