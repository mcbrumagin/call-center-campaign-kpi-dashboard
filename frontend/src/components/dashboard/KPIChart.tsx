'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { KPIDataPoint } from '@/lib/api';

interface KPIChartProps {
  data: KPIDataPoint[];
  groupBy: 'day' | 'week' | 'month';
}

const DAILY_BADGE_THRESHOLDS = {
  platinum: 240,
  gold: 180,
  silver: 120,
  bronze: 60,
};

const badgeColors = {
  platinum: 'var(--color-slate-100)',
  gold: 'var(--color-yellow-400)',
  silver: 'var(--color-gray-300)',
  bronze: 'var(--color-orange-400)',
};

// Get multiplier for threshold scaling based on grouping
function getThresholdMultiplier(groupBy: 'day' | 'week' | 'month'): number {
  switch (groupBy) {
    case 'week':
      return 7;
    case 'month':
      return 30; // Approximate average days per month
    default:
      return 1;
  }
}

function getScaledThresholds(groupBy: 'day' | 'week' | 'month') {
  const multiplier = getThresholdMultiplier(groupBy);
  return {
    platinum: DAILY_BADGE_THRESHOLDS.platinum * multiplier,
    gold: DAILY_BADGE_THRESHOLDS.gold * multiplier,
    silver: DAILY_BADGE_THRESHOLDS.silver * multiplier,
    bronze: DAILY_BADGE_THRESHOLDS.bronze * multiplier,
  };
}

function formatDate(dateStr: string, groupBy: string): string {
  const date = new Date(dateStr);
  if (groupBy === 'month') {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  } else if (groupBy === 'week') {
    return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: KPIDataPoint }>;
  label?: string;
  groupBy: string;
}

function CustomTooltip({ active, payload, label, groupBy }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const badge = data.badge;
    const isPartial = !data.is_complete;

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900">
          {formatDate(label || '', groupBy)}
          {isPartial && groupBy !== 'day' && (
            <span className="ml-2 text-xs text-amber-600 font-normal">
              (partial: {data.days_in_period} day{data.days_in_period !== 1 ? 's' : ''})
            </span>
          )}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {data.hours.toFixed(1)} hours
        </p>
        {badge && (
          <div className="mt-2 flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: badgeColors[badge] }}
            />
            <span className="text-sm font-medium capitalize">{badge} Badge</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export function KPIChart({ data, groupBy }: KPIChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    formattedDate: formatDate(d.date, groupBy),
  }));

  const thresholds = getScaledThresholds(groupBy);
  const maxHours = Math.max(...data.map((d) => d.hours), thresholds.platinum + 50);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Hours Worked</h3>
        <div className="flex items-center gap-4 text-sm">
          {Object.entries(thresholds)
            .reverse()
            .map(([badge, threshold]) => (
              <div key={badge} className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: badgeColors[badge as keyof typeof badgeColors],
                  }}
                />
                <span className="text-gray-600 capitalize">{badge}</span>
                <span className="text-gray-400">({threshold}h)</span>
              </div>
            ))}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[0, maxHours]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip content={<CustomTooltip groupBy={groupBy} />} />

            {/* Badge threshold lines */}
            <ReferenceLine
              y={thresholds.platinum}
              stroke={badgeColors.platinum}
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <ReferenceLine
              y={thresholds.gold}
              stroke={badgeColors.gold}
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <ReferenceLine
              y={thresholds.silver}
              stroke={badgeColors.silver}
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <ReferenceLine
              y={thresholds.bronze}
              stroke={badgeColors.bronze}
              strokeDasharray="5 5"
              strokeWidth={2}
            />

            <Area
              type="monotone"
              dataKey="hours"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorHours)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                const badge = payload.badge as keyof typeof badgeColors | null;
                const isPartial = !payload.is_complete;
                if (!badge) return null;
                return (
                  <circle
                    key={`dot-${payload.date}`}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={badgeColors[badge]}
                    stroke={isPartial ? 'var(--color-amber-500)' : 'var(--color-gray-400)'}
                    strokeWidth={isPartial ? 2 : 1}
                    strokeDasharray={isPartial ? '2 2' : undefined}
                  />
                );
              }}
              activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
