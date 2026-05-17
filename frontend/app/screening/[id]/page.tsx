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
      .catch(() => setError('Dépistage introuvable'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen bg-slate-50"><Navbar /><LoadingSpinner message="Chargement..." /></div>
  if (error) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-red-500">{error}</p>
        <Link href="/history" className="text-emerald-600 text-sm mt-2 block">← Retour à l'historique</Link>
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
        <Link href="/history" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'historique
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`bg-white rounded-3xl border-2 ${riskBorder} overflow-hidden shadow-lg mb-4`}>
            <div className={`${riskHeader} p-4 text-white text-center`}>
              <p className="font-semibold">Résultat du dépistage</p>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <RiskBadge risk={screening.riskLevel as any} muac={screening.muacValue ?? undefined} size="lg" />
              <div className="text-center">
                <p className="text-slate-500 text-sm font-medium">Périmètre brachial (PB)</p>
                <p className="text-5xl font-bold text-slate-800 mt-1">
                  {screening.muacValue?.toFixed(1) ?? '—'} <span className="text-2xl text-slate-500 font-normal">cm</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Confiance : {Math.round((screening.confidence || 0) * 100)}%</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
                <Baby className="w-4 h-4" />
                <span className="font-semibold text-slate-800">{screening.childName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{new Date(screening.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {screening.notes && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-2">Conseils</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{screening.notes}</p>
                {screening.arabicNotes && (
                  <p className="text-slate-500 text-sm font-arabic text-right mt-3 pt-3 border-t border-slate-100 leading-relaxed">{screening.arabicNotes}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Link href="/screening/new" className="py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-bold text-sm text-center shadow-sm">
                Nouveau dépistage
              </Link>
              <Link href="/chat" className="py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-sm text-center shadow-sm">
                Assistant IA
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
