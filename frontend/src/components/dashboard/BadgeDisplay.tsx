'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BadgeType } from '@/lib/api';
import { badgeConfig, getBadgeConfig, NoBadgeIcon } from '@/lib/badge-config';

interface BadgeDisplayProps {
  badge: BadgeType;
  hours: number;
  hoursToNext?: number;
  nextBadge?: BadgeType;
  threshold?: number;
}

export function BadgeDisplay({
  badge,
  hours,
  hoursToNext,
  nextBadge,
  threshold,
}: BadgeDisplayProps) {
  if (!badge) {
    const nextBadgeConfig = nextBadge ? getBadgeConfig(nextBadge) : null;
    
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
          <NoBadgeIcon className="w-16 h-16 text-gray-400" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-600">Keep Going!</h3>
        <p className="text-gray-500 mt-2">{hours.toFixed(1)} hours worked</p>
        {hoursToNext !== undefined && nextBadge && nextBadgeConfig && (
          <div className="mt-4 w-full max-w-xs">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progress to {nextBadge}</span>
              <span>{hoursToNext.toFixed(1)} hours to go</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${nextBadgeConfig.gradient}`}
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

  const config = getBadgeConfig(badge);
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={badge}
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0, rotate: 180, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className={`flex flex-col items-center p-8 ${config.bgColorLight} rounded-2xl border-2 ${config.borderColor}`}
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
          {config.label.toUpperCase()}
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
                className={`h-full bg-gradient-to-r ${getBadgeConfig(nextBadge).gradient}`}
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
