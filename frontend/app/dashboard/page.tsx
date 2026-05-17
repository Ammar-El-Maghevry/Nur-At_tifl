'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Camera, MessageCircle, MapPin, TrendingUp, Baby, ChevronRight, Plus, Heart } from 'lucide-react'
import Navbar from '@/components/Navbar'
import RiskBadge from '@/components/RiskBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { childApi, screeningApi, getStoredUser, type ScreeningResult } from '@/services/api'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [children, setChildren] = useState<any[]>([])
  const [recentScreenings, setRecentScreenings] = useState<ScreeningResult[]>([])
  const [loading, setLoading] = useState(true)
  const [totalScreenings, setTotalScreenings] = useState(0)

  useEffect(() => {
    setUser(getStoredUser())
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [childrenRes, historyRes] = await Promise.all([
        childApi.list(),
        screeningApi.userHistory()
      ])
      setChildren(childrenRes.data)
      const history: ScreeningResult[] = historyRes.data
      setRecentScreenings(history.slice(0, 5))
      setTotalScreenings(history.length)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk: string) => {
    if (risk === 'SEVERE') return 'text-red-600 bg-red-50 border-red-200'
    if (risk === 'MODERATE') return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  }

  const getRiskDot = (risk: string) => {
    if (risk === 'SEVERE') return 'bg-red-500'
    if (risk === 'MODERATE') return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getRiskLabel = (risk: string) => {
    if (risk === 'SEVERE') return 'Grave'
    if (risk === 'MODERATE') return 'Modéré'
    return 'Normale'
  }

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Hier'
    return `Il y a ${days} jours`
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <LoadingSpinner message="Chargement du tableau de bord..." />
    </div>
  )

  const greeting = user?.languagePref === 'ar' || user?.languagePref === 'hsn' ? 'مرحباً' : 'Bonjour'
  const firstName = user?.fullName?.split(' ')[0] || ''

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-emerald-200/50"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute right-4 bottom-0 w-20 h-20 bg-white/5 rounded-full" />
          <div className="absolute -left-4 bottom-4 w-16 h-16 bg-emerald-500/30 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 fill-white text-white" />
              </div>
              <span className="text-emerald-200 text-xs uppercase tracking-widest font-semibold">NurAI</span>
            </div>
            <h1 className="text-2xl font-bold">{greeting}{firstName ? `, ${firstName}` : ''} !</h1>
            <p className="text-emerald-200 text-sm mt-1.5">
              {user?.wilaya && `📍 ${user.wilaya} · `}
              {children.length} enfant{children.length !== 1 ? 's' : ''} suivi{children.length !== 1 ? 's' : ''} · {totalScreenings} dépistage{totalScreenings !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Actions rapides</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: '/screening/new', icon: <Camera className="w-6 h-6" />, label: 'Dépistage', labelAr: 'فحص جديد', color: 'from-emerald-600 to-emerald-700', shadow: 'shadow-emerald-200/60' },
              { href: '/chat', icon: <MessageCircle className="w-6 h-6" />, label: 'Assistant IA', labelAr: 'المساعد', color: 'from-blue-600 to-blue-700', shadow: 'shadow-blue-200/60' },
              { href: '/health-centers', icon: <MapPin className="w-6 h-6" />, label: 'Centres santé', labelAr: 'مراكز صحية', color: 'from-violet-600 to-violet-700', shadow: 'shadow-violet-200/60' },
            ].map(action => (
              <Link key={action.href} href={action.href}>
                <motion.div
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ y: -2 }}
                  className={`bg-gradient-to-br ${action.color} rounded-2xl p-4 text-center cursor-pointer shadow-lg ${action.shadow} transition-shadow`}
                >
                  <div className="flex justify-center mb-2 text-white">{action.icon}</div>
                  <div className="text-xs font-bold text-white">{action.label}</div>
                  <div className="text-xs text-white/70 font-arabic mt-0.5">{action.labelAr}</div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Children */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Mes enfants</h2>
            <Link href="/screening/new" className="text-sm text-emerald-600 font-semibold flex items-center gap-1 hover:text-emerald-700 transition-colors">
              <Plus className="w-4 h-4" /> Ajouter
            </Link>
          </div>

          {children.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Baby className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Aucun enfant ajouté</p>
              <p className="text-xs text-slate-400 font-arabic mt-1">لم يتم إضافة أي طفل بعد</p>
              <Link href="/screening/new" className="text-emerald-600 text-sm font-semibold hover:underline mt-3 block">
                Ajouter votre premier enfant →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {children.map(child => (
                <Link key={child.id} href={`/history?childId=${child.id}`}>
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 hover:border-emerald-200 hover:shadow-md transition-all">
                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center">
                      <Baby className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{child.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {child.gender === 'M' ? 'Garçon' : child.gender === 'F' ? 'Fille' : ''}
                        {child.birthDate && ` · Né en ${new Date(child.birthDate).getFullYear()}`}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent screenings */}
        {recentScreenings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Dépistages récents</h2>
              <Link href="/history" className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">Voir tout</Link>
            </div>

            <div className="space-y-2">
              {recentScreenings.map(s => (
                <Link key={s.id} href={`/screening/${s.id}`}>
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 hover:border-emerald-200 hover:shadow-md transition-all">
                    <div className={`w-3 h-3 rounded-full ${getRiskDot(s.riskLevel)} flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 text-sm">{s.childName}</p>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getRiskColor(s.riskLevel)}`}>
                          {getRiskLabel(s.riskLevel)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">PB : {s.muacValue?.toFixed(1)} cm · {getTimeAgo(s.createdAt)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-sm">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-slate-800">{totalScreenings}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Dépistages total</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Baby className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-800">{children.length}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Enfants suivis</div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
