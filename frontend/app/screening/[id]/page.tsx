'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Baby } from 'lucide-react'
import Navbar from '@/components/Navbar'
import RiskBadge from '@/components/RiskBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { screeningApi, type ScreeningResult } from '@/services/api'

export default function ScreeningDetailPage() {
  const { id } = useParams()
  const [screening, setScreening] = useState<ScreeningResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    screeningApi.get(Number(id))
      .then(res => setScreening(res.data))
      .catch(() => setError('Screening not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen bg-slate-50"><Navbar /><LoadingSpinner /></div>
  if (error) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-red-500">{error}</p>
        <Link href="/history" className="text-emerald-600 text-sm mt-2 block">← Back to history</Link>
      </div>
    </div>
  )
  if (!screening) return null

  const riskBorder = screening.riskLevel === 'SEVERE' ? 'border-red-200' : screening.riskLevel === 'MODERATE' ? 'border-amber-200' : 'border-emerald-200'
  const riskHeader = screening.riskLevel === 'SEVERE' ? 'bg-red-600' : screening.riskLevel === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-600'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <Link href="/history" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to history
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`bg-white rounded-3xl border-2 ${riskBorder} overflow-hidden shadow-sm mb-4`}>
            <div className={`${riskHeader} p-4 text-white text-center`}>
              <p className="font-semibold">Screening Result</p>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <RiskBadge risk={screening.riskLevel as any} muac={screening.muacValue} size="lg" />
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-800">{screening.muacValue?.toFixed(1)} <span className="text-xl text-slate-500">cm</span></p>
                <p className="text-xs text-slate-400 mt-1">Confidence: {Math.round((screening.confidence || 0) * 100)}%</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
                <Baby className="w-4 h-4" />
                <span className="font-medium text-slate-800">{screening.childName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{new Date(screening.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {screening.notes && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-800 mb-2">Recommendations</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{screening.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Link href="/screening/new" className="py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm text-center">
                New Screening
              </Link>
              <Link href="/chat" className="py-3 bg-blue-600 text-white rounded-xl font-medium text-sm text-center">
                Ask AI Chat
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
