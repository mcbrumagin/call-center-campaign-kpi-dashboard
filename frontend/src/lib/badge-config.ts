import { Trophy, Medal, Award, Star, Circle, Target } from 'lucide-react';
import type { BadgeType } from './api';

// Badge thresholds (hours per day)
export const BADGE_THRESHOLDS = {
  platinum: 240,
  gold: 180,
  silver: 120,
  bronze: 60,
} as const;

// Badge colors using CSS variables for chart compatibility
export const badgeColors = {
  platinum: 'var(--color-slate-100)',
  gold: 'var(--color-yellow-400)',
  silver: 'var(--color-gray-300)',
  bronze: 'var(--color-orange-400)',
  none: 'var(--color-blue-100)',
} as const;

// Badge configuration for UI components
export const badgeConfig = {
  platinum: {
    key: 'platinum' as const,
    label: 'Platinum',
    icon: Trophy,
    // Tailwind classes for backgrounds
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
    // Extended config for BadgeDisplay
    gradient: 'from-slate-200 via-slate-300 to-slate-400',
    borderColor: 'border-slate-300',
    glowColor: 'shadow-slate-300/50',
    bgColorLight: 'bg-slate-50',
    description: 'Outstanding Performance!',
  },
  gold: {
    key: 'gold' as const,
    label: 'Gold',
    icon: Medal,
    bgColor: 'bg-yellow-400',
    textColor: 'text-yellow-800',
    gradient: 'from-yellow-300 via-yellow-400 to-yellow-500',
    borderColor: 'border-yellow-400',
    glowColor: 'shadow-yellow-400/50',
    bgColorLight: 'bg-yellow-50',
    description: 'Excellent Work!',
  },
  silver: {
    key: 'silver' as const,
    label: 'Silver',
    icon: Award,
    bgColor: 'bg-gray-300',
    textColor: 'text-gray-700',
    gradient: 'from-gray-300 via-gray-350 to-gray-400',
    borderColor: 'border-gray-400',
    glowColor: 'shadow-gray-400/50',
    bgColorLight: 'bg-gray-50',
    description: 'Great Progress!',
  },
  bronze: {
    key: 'bronze' as const,
    label: 'Bronze',
    icon: Star,
    bgColor: 'bg-orange-400',
    textColor: 'text-orange-800',
    gradient: 'from-orange-300 via-orange-400 to-orange-500',
    borderColor: 'border-orange-400',
    glowColor: 'shadow-orange-400/50',
    bgColorLight: 'bg-orange-50',
    description: 'Good Start!',
  },
  none: {
    key: 'none' as const,
    label: 'No Badge',
    icon: Circle,
    bgColor: 'bg-blue-100',
    textColor: 'text-gray-500',
    gradient: 'from-gray-100 to-gray-200',
    borderColor: 'border-gray-200',
    glowColor: 'shadow-gray-200/50',
    bgColorLight: 'bg-gray-50',
    description: 'Keep Going!',
  },
} as const;

// Ordered list of badges for iteration (highest to lowest, then none)
export const badgeOrder = ['platinum', 'gold', 'silver', 'bronze', 'none'] as const;

// Helper to get badge config, defaulting to 'none' for null badges
export function getBadgeConfig(badge: BadgeType | 'none' | null) {
  const key = badge || 'none';
  return badgeConfig[key];
}

// Icon for "no badge" progress display
export const NoBadgeIcon = Target;

// Type for badge keys including 'none'
export type BadgeKey = keyof typeof badgeConfig;
