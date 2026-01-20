'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { kpisApi, campaignsApi } from '@/lib/api';
import { BadgeDisplay } from './BadgeDisplay';
import { KPIChart } from './KPIChart';
import { BadgeSummary } from './BadgeSummary';
import { Calendar, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface CampaignDashboardProps {
  campaignId: number;
}

type GroupBy = 'day' | 'week' | 'month';

function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function CampaignDashboard({ campaignId }: CampaignDashboardProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [dateRange, setDateRange] = useState(30);

  const { start, end } = getDateRange(dateRange);

  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  });

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpis', campaignId, start, end, groupBy],
    queryFn: () =>
      kpisApi.getCampaignKPIs(campaignId, {
        start_date: start,
        end_date: end,
        group_by: groupBy,
      }),
  });

  const { data: todayBadge } = useQuery({
    queryKey: ['badge', campaignId, 'today'],
    queryFn: () => kpisApi.getDailyBadge(campaignId),
  });

  if (campaignLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Campaign Not Found</h1>
          <p className="text-gray-500 mt-2">
            The campaign you&apos;re looking for doesn&apos;t exist
          </p>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-gray-500 mt-1">{campaign.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  campaign.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {campaign.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {campaign.agents.length} Agents
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Badge Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Today&apos;s Performance
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {todayBadge && (
                <BadgeDisplay
                  badge={todayBadge.badge}
                  hours={todayBadge.hours}
                  hoursToNext={todayBadge.hours_to_next}
                  nextBadge={todayBadge.next_badge}
                  threshold={todayBadge.threshold}
                />
              )}
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={Clock}
                label="Today's Hours"
                value={todayBadge?.hours.toFixed(1) || '0'}
                suffix="hrs"
                color="blue"
              />
              <StatCard
                icon={TrendingUp}
                label="Avg Daily Hours"
                value={kpiData?.summary.average_daily_hours.toFixed(1) || '0'}
                suffix="hrs"
                color="green"
              />
              <StatCard
                icon={BarChart3}
                label="Total Hours"
                value={kpiData?.summary.total_hours.toFixed(0) || '0'}
                suffix="hrs"
                color="purple"
              />
              <StatCard
                icon={Calendar}
                label="Days Tracked"
                value={kpiData?.summary.days_with_data.toString() || '0'}
                suffix="days"
                color="orange"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Performance History
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Period:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Past year</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Group by:</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                {(['day', 'week', 'month'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setGroupBy(option)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      groupBy === option
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Summary */}
        {kpiLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : kpiData ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <KPIChart data={kpiData.data} groupBy={groupBy} />
            </div>
            <div className="lg:col-span-1">
              <BadgeSummary
                breakdown={kpiData.summary.badge_breakdown}
                totalDays={kpiData.summary.days_with_data}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No KPI data available for this period
          </div>
        )}
      </main>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ icon: Icon, label, value, suffix, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div
        className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center mb-3`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>
      </p>
    </div>
  );
}
