'use client'

import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

interface LoadingSpinnerProps {
  message?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <motion.div
          className="w-16 h-16 border-4 border-emerald-200 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ borderTopColor: '#059669' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Heart className="w-6 h-6 text-emerald-600 fill-emerald-600" />
        </div>
      </div>
      <p className="text-slate-600 text-sm font-medium">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return <div className="flex justify-center items-center py-12">{content}</div>
}

export function AnalyzingSpinner() {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 border-4 border-emerald-200 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ borderTopColor: '#059669', borderRightColor: '#10b981' }}
        />
        {/* Inner pulse */}
        <motion.div
          className="absolute inset-3 bg-emerald-50 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Heart className="w-8 h-8 text-emerald-600 fill-emerald-600" />
        </motion.div>
        {/* Scanning line */}
        <motion.div
          className="absolute left-4 right-4 h-0.5 bg-emerald-500 opacity-70 top-1/2"
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="text-center space-y-1">
        <motion.p
          className="text-emerald-700 font-semibold text-lg"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          AI is analyzing...
        </motion.p>
        <p className="text-slate-500 text-sm">Measuring MUAC with computer vision</p>
        <p className="text-xs text-slate-400 font-arabic">جاري تحليل الصورة...</p>
      </div>

      <div className="flex gap-2">
        {['Detecting arm', 'Measuring MUAC', 'Classifying risk'].map((step, i) => (
          <motion.div
            key={step}
            className="flex items-center gap-1 text-xs text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.8, repeat: Infinity, repeatDelay: 2.4 }}
          >
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
