'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import type { BadgeType } from '@/lib/api';
import { badgeConfig, badgeOrder, getBadgeConfig } from '@/lib/badge-config';

interface BadgeSummaryProps {
  breakdown: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
    none: number;
  };
  totalDays: number;
  averageBadge?: BadgeType;
  averageDailyHours?: number;
}

export function BadgeSummary({ breakdown, totalDays, averageBadge, averageDailyHours }: BadgeSummaryProps) {
  const avgBadge = getBadgeConfig(averageBadge ?? null);
  const AvgIcon = avgBadge.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Badge Summary</h3>
      
      {/* Average Badge Rating */}
      {averageDailyHours !== undefined && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 ${avgBadge.bgColor} rounded-lg flex items-center justify-center`}
            >
              <AvgIcon className={`w-6 h-6 ${avgBadge.textColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Average Rating</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {avgBadge.label}
              </p>
              <p className="text-sm text-gray-500">
                {averageDailyHours.toFixed(1)} hrs/day avg
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Badge Breakdown */}
      <div className="space-y-3">
        {badgeOrder.map((badgeKey, index) => {
          const badge = badgeConfig[badgeKey];
          const count = breakdown[badgeKey];
          const percentage = totalDays > 0 ? (count / totalDays) * 100 : 0;
          const Icon = badge.icon;

          return (
            <motion.div
              key={badgeKey}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 ${badge.bgColor} rounded-lg flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${badge.textColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {badge.label}
                  </span>
                  <span className="text-sm text-gray-500">
                    {count} day{count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={badge.bgColor}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
