'use client'

import { motion } from 'framer-motion'
import type { RiskLevel } from '@/services/api'

interface RiskBadgeProps {
  risk: RiskLevel
  muac?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animate?: boolean
}

const riskConfig = {
  NORMAL: {
    bg: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-emerald-400',
    text: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Normal',
    arabicLabel: 'طبيعي',
    emoji: '✓',
    pulse: 'bg-emerald-400',
  },
  MODERATE: {
    bg: 'bg-amber-500',
    gradient: 'from-amber-500 to-yellow-400',
    text: 'text-amber-700',
    bgLight: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Moderate Risk',
    arabicLabel: 'خطر متوسط',
    emoji: '!',
    pulse: 'bg-amber-400',
  },
  SEVERE: {
    bg: 'bg-red-500',
    gradient: 'from-red-600 to-red-400',
    text: 'text-red-700',
    bgLight: 'bg-red-50',
    border: 'border-red-200',
    label: 'Severe — Act Now',
    arabicLabel: 'حرج — تصرف الآن',
    emoji: '!',
    pulse: 'bg-red-400',
  },
}

const sizes = {
  sm: { circle: 'w-8 h-8', text: 'text-sm', label: 'text-xs' },
  md: { circle: 'w-16 h-16', text: 'text-2xl', label: 'text-sm' },
  lg: { circle: 'w-32 h-32', text: 'text-5xl font-bold', label: 'text-base' },
}

export default function RiskBadge({ risk, muac, size = 'md', showLabel = true, animate = true }: RiskBadgeProps) {
  const config = riskConfig[risk]
  const s = sizes[size]

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {animate && risk !== 'NORMAL' && (
          <motion.div
            className={`absolute inset-0 rounded-full ${config.pulse} opacity-40`}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <motion.div
          className={`${s.circle} rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
          initial={animate ? { scale: 0 } : undefined}
          animate={animate ? { scale: 1 } : undefined}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {muac && size === 'lg' ? (
            <div className="text-center text-white">
              <div className={s.text}>{muac.toFixed(1)}</div>
              <div className="text-xs opacity-80 font-normal">cm</div>
            </div>
          ) : (
            <span className={`${s.text} text-white font-bold`}>{config.emoji}</span>
          )}
        </motion.div>
      </div>

      {showLabel && (
        <motion.div
          className={`px-3 py-1 rounded-full text-center ${config.bgLight} ${config.border} border`}
          initial={animate ? { opacity: 0, y: 10 } : undefined}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.3 }}
        >
          <div className={`${s.label} font-semibold ${config.text}`}>{config.label}</div>
          <div className={`text-xs font-arabic ${config.text} opacity-80`}>{config.arabicLabel}</div>
        </motion.div>
      )}
    </div>
  )
}
