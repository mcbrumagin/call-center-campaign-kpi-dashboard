'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, Star, Target } from 'lucide-react';
import { BadgeType } from '@/lib/api';

interface BadgeDisplayProps {
  badge: BadgeType;
  hours: number;
  hoursToNext?: number;
  nextBadge?: BadgeType;
  threshold?: number;
}

const badgeConfig = {
  platinum: {
    icon: Trophy,
    gradient: 'from-slate-200 via-slate-300 to-slate-400',
    textColor: 'text-slate-800',
    borderColor: 'border-slate-300',
    glowColor: 'shadow-slate-300/50',
    bgColor: 'bg-slate-100',
    label: 'PLATINUM',
    description: 'Outstanding Performance!',
  },
  gold: {
    icon: Medal,
    gradient: 'from-yellow-300 via-yellow-400 to-yellow-500',
    textColor: 'text-yellow-900',
    borderColor: 'border-yellow-400',
    glowColor: 'shadow-yellow-400/50',
    bgColor: 'bg-yellow-50',
    label: 'GOLD',
    description: 'Excellent Work!',
  },
  silver: {
    icon: Award,
    gradient: 'from-gray-300 via-gray-350 to-gray-400',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-400',
    glowColor: 'shadow-gray-400/50',
    bgColor: 'bg-gray-50',
    label: 'SILVER',
    description: 'Great Progress!',
  },
  bronze: {
    icon: Star,
    gradient: 'from-orange-300 via-orange-400 to-orange-500',
    textColor: 'text-orange-900',
    borderColor: 'border-orange-400',
    glowColor: 'shadow-orange-400/50',
    bgColor: 'bg-orange-50',
    label: 'BRONZE',
    description: 'Good Start!',
  },
};

export function BadgeDisplay({
  badge,
  hours,
  hoursToNext,
  nextBadge,
  threshold,
}: BadgeDisplayProps) {
  if (!badge) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200"
      >
        <motion.div
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-6xl mb-4"
        >
          <Target className="w-16 h-16 text-gray-400" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-600">Keep Going!</h3>
        <p className="text-gray-500 mt-2">{hours.toFixed(1)} hours worked</p>
        {hoursToNext !== undefined && nextBadge && (
          <div className="mt-4 w-full max-w-xs">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progress to {nextBadge}</span>
              <span>{hoursToNext.toFixed(1)} hours to go</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${
                  badgeConfig[nextBadge]?.gradient || 'from-gray-400 to-gray-500'
                }`}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(
                    100,
                    (hours / (hours + hoursToNext)) * 100
                  )}%`,
                }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  const config = badgeConfig[badge];
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={badge}
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0, rotate: 180, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className={`flex flex-col items-center p-8 ${config.bgColor} rounded-2xl border-2 ${config.borderColor}`}
      >
        <motion.div
          animate={
            badge === 'platinum'
              ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 0 20px rgba(148, 163, 184, 0.3)',
                    '0 0 40px rgba(148, 163, 184, 0.6)',
                    '0 0 20px rgba(148, 163, 184, 0.3)',
                  ],
                }
              : badge === 'gold'
              ? {
                  scale: [1, 1.03, 1],
                  rotate: [0, 2, -2, 0],
                }
              : {
                  scale: [1, 1.02, 1],
                }
          }
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={`relative p-6 rounded-full bg-gradient-to-br ${config.gradient} shadow-2xl ${config.glowColor}`}
        >
          <Icon className={`w-16 h-16 ${config.textColor}`} />

          {/* Sparkle effects for platinum and gold */}
          {(badge === 'platinum' || badge === 'gold') && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </>
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`mt-6 text-3xl font-bold ${config.textColor}`}
        >
          {config.label}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mt-1"
        >
          {config.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center"
        >
          <p className="text-2xl font-bold text-gray-900">
            {hours.toFixed(1)} hours
          </p>
          {threshold && (
            <p className="text-sm text-gray-500">
              Threshold: {threshold} hours
            </p>
          )}
        </motion.div>

        {hoursToNext !== undefined && hoursToNext > 0 && nextBadge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 w-full max-w-xs"
          >
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Next: {nextBadge}</span>
              <span>{hoursToNext.toFixed(1)} hours to go</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${
                  badgeConfig[nextBadge]?.gradient || 'from-gray-400 to-gray-500'
                }`}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(
                    100,
                    (hours / (hours + hoursToNext)) * 100
                  )}%`,
                }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
