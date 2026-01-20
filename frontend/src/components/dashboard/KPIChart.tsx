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
  startDate: string;
  endDate: string;
  showEmptyDays: boolean;
}

// Badge thresholds are always daily values
const BADGE_THRESHOLDS = {
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
  none: 'var(--color-blue-100)',
};

function formatDate(dateStr: string, groupBy: string): string {
  const date = new Date(dateStr);
  if (groupBy === 'month') {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  } else if (groupBy === 'week') {
    return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Generate all dates between start and end (inclusive)
function getAllDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Fill in missing dates with zero-hour entries
function fillEmptyDays(
  data: KPIDataPoint[],
  startDate: string,
  endDate: string
): KPIDataPoint[] {
  const allDates = getAllDatesInRange(startDate, endDate);
  const dataByDate = new Map(data.map((d) => [d.date, d]));
  
  return allDates.map((date) => {
    const existing = dataByDate.get(date);
    if (existing) {
      return existing;
    }
    // Create empty day entry
    return {
      date,
      hours: 0,
      badge: null,
      days_in_period: 1,
      is_complete: true,
    };
  });
}

interface ChartDataPoint extends KPIDataPoint {
  formattedDate: string;
  avgDailyHours: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartDataPoint }>;
  label?: string;
  groupBy: string;
}

function CustomTooltip({ active, payload, label, groupBy }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const badge = data.badge;
    const isPartial = !data.is_complete;
    const showTotalHours = groupBy !== 'day';

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
          {data.avgDailyHours.toFixed(1)} hrs/day
        </p>
        {showTotalHours && (
          <p className="text-sm text-gray-500">
            {data.hours.toFixed(1)} hrs total
          </p>
        )}
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

export function KPIChart({ data, groupBy, startDate, endDate, showEmptyDays }: KPIChartProps) {
  // Fill in empty days if enabled and viewing daily grouping
  const processedData = groupBy === 'day' && showEmptyDays
    ? fillEmptyDays(data, startDate, endDate)
    : data;

  // Normalize data to daily average hours
  const chartData: ChartDataPoint[] = processedData.map((d) => ({
    ...d,
    formattedDate: formatDate(d.date, groupBy),
    avgDailyHours: d.hours / Math.max(d.days_in_period, 1),
  }));

  const maxAvgHours = Math.max(
    ...chartData.map((d) => d.avgDailyHours),
    BADGE_THRESHOLDS.platinum + 20
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Average Daily Hours
        </h3>
        <div className="flex items-center gap-4 text-sm">
          {Object.entries(BADGE_THRESHOLDS)
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
              domain={[0, maxAvgHours]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip content={<CustomTooltip groupBy={groupBy} />} />

            {/* Badge threshold lines - always at daily values */}
            <ReferenceLine
              y={BADGE_THRESHOLDS.platinum}
              stroke={badgeColors.platinum}
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <ReferenceLine
              y={BADGE_THRESHOLDS.gold}
              stroke={badgeColors.gold}
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <ReferenceLine
              y={BADGE_THRESHOLDS.silver}
              stroke={badgeColors.silver}
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <ReferenceLine
              y={BADGE_THRESHOLDS.bronze}
              stroke={badgeColors.bronze}
              strokeDasharray="5 5"
              strokeWidth={2}
            />

            <Area
              type="monotone"
              dataKey="avgDailyHours"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorHours)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                const badge = payload.badge as keyof typeof badgeColors | null;
                const isPartial = !payload.is_complete;
                
                // Don't render dot for empty days (0 hours)
                if (payload.hours === 0) {
                  return null;
                }
                
                return (
                  <circle
                    key={`dot-${payload.date}`}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={badgeColors[badge || 'none']}
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
