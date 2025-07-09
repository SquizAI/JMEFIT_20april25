import React from 'react';
import { CampaignAnalytics } from '../Email/CampaignAnalytics';
import { FinancialReports } from './FinancialReports';

export function Analytics() {
  return (
    <div className="space-y-8">
      <FinancialReports />
      <CampaignAnalytics />
    </div>
  );
} 