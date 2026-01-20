'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star, Circle, TrendingUp } from 'lucide-react';
import type { BadgeType } from '@/lib/api';

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

const badges = [
  {
    key: 'platinum',
    label: 'Platinum',
    icon: Trophy,
    color: 'bg-slate-100',
    textColor: 'text-slate-600',
  },
  {
    key: 'gold',
    label: 'Gold',
    icon: Medal,
    color: 'bg-yellow-400',
    textColor: 'text-yellow-800',
  },
  {
    key: 'silver',
    label: 'Silver',
    icon: Award,
    color: 'bg-gray-300',
    textColor: 'text-gray-700',
  },
  {
    key: 'bronze',
    label: 'Bronze',
    icon: Star,
    color: 'bg-orange-400',
    textColor: 'text-orange-800',
  },
  {
    key: 'none',
    label: 'No Badge',
    icon: Circle,
    color: 'bg-gray-100',
    textColor: 'text-gray-500',
  },
];

function getBadgeConfig(badgeKey: string | null) {
  return badges.find((b) => b.key === (badgeKey || 'none')) || badges[badges.length - 1];
}

export function BadgeSummary({ breakdown, totalDays, averageBadge, averageDailyHours }: BadgeSummaryProps) {
  const avgBadgeConfig = getBadgeConfig(averageBadge);
  const AvgIcon = avgBadgeConfig.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Badge Summary</h3>
      
      {/* Average Badge Rating */}
      {averageDailyHours !== undefined && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 ${avgBadgeConfig.color} rounded-lg flex items-center justify-center`}
            >
              <AvgIcon className={`w-6 h-6 ${avgBadgeConfig.textColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Average Rating</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {avgBadgeConfig.label}
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
        {badges.map((badge, index) => {
          const count = breakdown[badge.key as keyof typeof breakdown];
          const percentage = totalDays > 0 ? (count / totalDays) * 100 : 0;
          const Icon = badge.icon;

          return (
            <motion.div
              key={badge.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 ${badge.color} rounded-lg flex items-center justify-center`}
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
                    className={badge.color}
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
