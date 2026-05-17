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
    NORMAL: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Normal' },
    MODERATE: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Moderate' },
    SEVERE: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200', label: 'Severe' },
  }[risk] || { dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-700 border-slate-200', label: risk })

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Screening History</h1>
            <p className="text-slate-500 text-sm mt-0.5">سجل الفحوصات</p>
          </div>
          <Link href="/screening/new" className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5">
            <Camera className="w-4 h-4" /> New
          </Link>
        </div>

        {children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <button
              onClick={() => setSelectedChildId(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                !selectedChildId ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              All Children
            </button>
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChildId(c.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedChildId === c.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : screenings.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No screenings yet</p>
            <p className="text-slate-400 text-sm mt-1">Start screening your children</p>
            <Link href="/screening/new" className="mt-4 inline-block bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
              First Screening
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
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 card-hover">
                      <div className={`w-3 h-3 rounded-full ${config.dot} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-slate-800 text-sm">{s.childName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${config.badge}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">MUAC: {s.muacValue?.toFixed(1)} cm</span>
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
    <Suspense fallback={<LoadingSpinner />}>
      <HistoryContent />
    </Suspense>
  )
}
