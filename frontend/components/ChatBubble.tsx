'use client'

import { motion } from 'framer-motion'
import { Shield, User } from 'lucide-react'

interface ChatBubbleProps {
  message: string
  isUser: boolean
  timestamp?: string
  verified?: boolean
  sources?: string[]
}

export default function ChatBubble({ message, isUser, timestamp, verified, sources }: ChatBubbleProps) {
  const isArabic = /[؀-ۿ]/.test(message)

  if (isUser) {
    return (
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-[80%]">
          <div className="chat-bubble-user px-4 py-3 text-white shadow-sm">
            <p className={`text-sm leading-relaxed ${isArabic ? 'font-arabic text-right' : ''}`}>{message}</p>
          </div>
          {timestamp && <p className="text-xs text-slate-400 text-right mt-1">{timestamp}</p>}
        </div>
        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center ml-2 flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-emerald-600" />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex justify-start"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1 shadow-sm">
        <span className="text-white text-xs font-bold">IA</span>
      </div>
      <div className="max-w-[80%]">
        <div className="chat-bubble-ai px-4 py-3">
          {verified && (
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
              <Shield className="w-3 h-3 text-emerald-600" />
              <span className="text-xs text-emerald-600 font-medium">Vérifié OMS/UNICEF</span>
            </div>
          )}
          <p className={`text-sm text-slate-700 leading-relaxed ${isArabic ? 'font-arabic text-right' : ''}`}>
            {message}
          </p>
          {sources && sources.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Sources : {sources.map(s => s.replace(/_/g, ' ')).join(', ')}
              </p>
            </div>
          )}
        </div>
        {timestamp && <p className="text-xs text-slate-400 mt-1">{timestamp}</p>}
      </div>
    </motion.div>
  )
}

export function TypingIndicator() {
  return (
    <motion.div
      className="flex justify-start"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
        <span className="text-white text-xs font-bold">IA</span>
      </div>
      <div className="chat-bubble-ai px-4 py-3">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-emerald-500 rounded-full"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
