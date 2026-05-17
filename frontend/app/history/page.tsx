'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp, Camera, ChevronRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { screeningApi, childApi, getStoredUser, type ScreeningResult } from '@/services/api'

function HistoryContent() {
  const searchParams = useSearchParams()
  const childIdParam = searchParams.get('childId')
  const [screenings, setScreenings] = useState<ScreeningResult[]>([])
  const [children, setChildren] = useState<any[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(childIdParam ? Number(childIdParam) : null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = getStoredUser()
    if (!u) return
    loadData()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      loadChildHistory(selectedChildId)
    } else {
      loadAllHistory()
    }
  }, [selectedChildId])

  const loadData = async () => {
    try {
      const [childRes] = await Promise.all([childApi.list()])
      setChildren(childRes.data)
    } catch (e) {}
  }

  const loadAllHistory = async () => {
    setLoading(true)
    try {
      const res = await screeningApi.userHistory()
      setScreenings(res.data)
    } catch (e) {} finally { setLoading(false) }
  }

  const loadChildHistory = async (childId: number) => {
    setLoading(true)
    try {
      const res = await screeningApi.history(childId)
      setScreenings(res.data)
    } catch (e) {} finally { setLoading(false) }
  }

  const getRiskConfig = (risk: string) => ({
    NORMAL:   { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Normale' },
    MODERATE: { dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Modéré' },
    SEVERE:   { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',             label: 'Grave' },
  }[risk] || { dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-700 border-slate-200', label: risk })

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Historique des dépistages</h1>
            <p className="text-slate-500 text-sm mt-0.5 font-arabic">سجل الفحوصات</p>
          </div>
          <Link href="/screening/new" className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-shadow">
            <Camera className="w-4 h-4" /> Nouveau
          </Link>
        </div>

        {children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <button
              onClick={() => setSelectedChildId(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !selectedChildId ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
              }`}
            >
              Tous les enfants
            </button>
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChildId(c.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedChildId === c.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Chargement de l'historique..." />
        ) : screenings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold">Aucun dépistage</p>
            <p className="text-slate-400 text-sm mt-1">Commencez le dépistage de vos enfants</p>
            <p className="text-xs text-slate-400 font-arabic mt-1">ابدأ فحص أطفالك</p>
            <Link href="/screening/new" className="mt-5 inline-block bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-sm">
              Premier dépistage
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {screenings.map((s, i) => {
              const config = getRiskConfig(s.riskLevel)
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/screening/${s.id}`}>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 card-hover hover:border-emerald-200 hover:shadow-md transition-all">
                      <div className={`w-3 h-3 rounded-full ${config.dot} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-slate-800 text-sm">{s.childName}</p>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${config.badge}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">PB : {s.muacValue?.toFixed(1)} cm</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(s.createdAt)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Chargement..." />}>
      <HistoryContent />
    </Suspense>
  )
}
