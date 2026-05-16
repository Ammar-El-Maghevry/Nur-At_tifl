'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, MessageCircle, Zap } from 'lucide-react'
import Navbar from '@/components/Navbar'
import ChatBubble, { TypingIndicator } from '@/components/ChatBubble'
import { chatApi, getStoredUser } from '@/services/api'

interface Message {
  id: number
  text: string
  isUser: boolean
  timestamp: string
  verified?: boolean
  sources?: string[]
}

const QUICK_QUESTIONS = [
  { text: 'What should I feed my 8-month-old?', ar: 'ماذا أطعم طفلي عمره 8 أشهر؟' },
  { text: 'What are signs of malnutrition?', ar: 'ما هي علامات سوء التغذية؟' },
  { text: 'How do I measure MUAC correctly?', ar: 'كيف أقيس محيط الذراع بشكل صحيح؟' },
  { text: 'When should I see a doctor?', ar: 'متى يجب أن أذهب للطبيب؟' },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: 'مرحباً! أنا NurAI، مساعدك لتغذية الأطفال. كيف يمكنني مساعدتك اليوم؟\n\nHello! I\'m NurAI, your child nutrition assistant. All my answers are based on WHO and UNICEF guidelines. How can I help you?',
      isUser: false,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      verified: true,
      sources: ['who_guidelines', 'unicef_nutrition']
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [language, setLanguage] = useState('ar')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = getStoredUser()
    if (u?.languagePref) setLanguage(u.languagePref)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text?: string) => {
    const question = (text || input).trim()
    if (!question || isTyping) return

    const userMsg: Message = {
      id: Date.now(),
      text: question,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await chatApi.ask(question, language)
      const { answer, sources } = res.data
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: answer,
        isUser: false,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        verified: true,
        sources
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: language === 'ar'
          ? 'أعتذر، حدث خطأ. يرجى المحاولة مرة أخرى.'
          : 'Sorry, an error occurred. Please try again.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        verified: false
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Chat header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">NurAI Nutrition Assistant</p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <p className="text-xs text-slate-500">Online · WHO/UNICEF verified</p>
              </div>
            </div>
          </div>
          {/* Language switcher */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            {[{ v: 'ar', l: 'عر' }, { v: 'hsn', l: 'حسن' }, { v: 'fr', l: 'Fr' }].map(lang => (
              <button
                key={lang.v}
                onClick={() => setLanguage(lang.v)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  language === lang.v ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                {lang.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          {messages.map(msg => (
            <ChatBubble
              key={msg.id}
              message={msg.text}
              isUser={msg.isUser}
              timestamp={msg.timestamp}
              verified={msg.verified}
              sources={msg.sources}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick questions */}
      {messages.length <= 2 && (
        <div className="max-w-lg mx-auto w-full px-4 pb-2">
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Quick questions
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(language === 'ar' || language === 'hsn' ? q.ar : q.text)}
                className="flex-shrink-0 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
              >
                {language === 'ar' || language === 'hsn' ? q.ar : q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'ar' || language === 'hsn' ? 'اكتب سؤالك هنا...' : 'Ask about child nutrition...'}
            disabled={isTyping}
            dir={language === 'ar' || language === 'hsn' ? 'rtl' : 'ltr'}
            className={`flex-1 px-4 py-3 bg-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 ${language === 'ar' || language === 'hsn' ? 'font-arabic text-right' : ''}`}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
