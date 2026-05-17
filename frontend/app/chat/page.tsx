'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Zap } from 'lucide-react'
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
  { fr: 'Que donner à manger à mon bébé de 8 mois ?', ar: 'ماذا أطعم طفلي عمره 8 أشهر؟' },
  { fr: 'Quels sont les signes de malnutrition ?', ar: 'ما هي علامات سوء التغذية؟' },
  { fr: 'Comment mesurer le PB correctement ?', ar: 'كيف أقيس محيط الذراع بشكل صحيح؟' },
  { fr: 'Quand consulter un médecin ?', ar: 'متى يجب أن أذهب للطبيب؟' },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: 'مرحباً! أنا NurAI، مساعدك لتغذية الأطفال. كيف يمكنني مساعدتك اليوم؟\n\nBonjour ! Je suis NurAI, votre assistant en nutrition infantile. Toutes mes réponses sont basées sur les recommandations de l\'OMS et de l\'UNICEF. Comment puis-je vous aider ?',
      isUser: false,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      verified: true,
      sources: ['who_guidelines', 'unicef_nutrition']
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [language, setLanguage] = useState('fr')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = getStoredUser()
    if (u?.languagePref) setLanguage(u.languagePref === 'en' ? 'fr' : u.languagePref)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const isRtl = language === 'ar' || language === 'hsn'

  const sendMessage = async (text?: string) => {
    const question = (text || input).trim()
    if (!question || isTyping) return

    const userMsg: Message = {
      id: Date.now(),
      text: question,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        verified: true,
        sources
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: isRtl
          ? 'أعتذر، حدث خطأ. يرجى المحاولة مرة أخرى.'
          : 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
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
      <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">IA</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Assistant Nutrition NurAI</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-xs text-slate-500">En ligne · Vérifié OMS/UNICEF</p>
              </div>
            </div>
          </div>
          {/* Language switcher */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {[{ v: 'fr', l: 'Fr' }, { v: 'ar', l: 'عر' }, { v: 'hsn', l: 'حسن' }].map(lang => (
              <button
                key={lang.v}
                onClick={() => setLanguage(lang.v)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  language === lang.v
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
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
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1 font-medium">
            <Zap className="w-3 h-3" /> Questions rapides
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(isRtl ? q.ar : q.fr)}
                className="flex-shrink-0 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm"
              >
                {isRtl ? q.ar : q.fr}
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
            placeholder={isRtl ? 'اكتب سؤالك هنا...' : 'Posez votre question sur la nutrition...'}
            disabled={isTyping}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`flex-1 px-4 py-3 bg-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all ${isRtl ? 'font-arabic text-right' : ''}`}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-2xl flex items-center justify-center transition-all flex-shrink-0 shadow-sm disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
