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

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <LoadingSpinner message="Loading dashboard..." />
    </div>
  )

  const greeting = user?.languagePref === 'ar' ? 'مرحباً' : 'Welcome'
  const firstName = user?.fullName?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -right-2 bottom-0 w-16 h-16 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 fill-white text-white" />
              <span className="text-emerald-200 text-xs uppercase tracking-wider">NurAI Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold">{greeting}, {firstName}!</h1>
            <p className="text-emerald-200 text-sm mt-1">
              {user?.wilaya && `📍 ${user.wilaya} · `}
              {children.length} {children.length === 1 ? 'child' : 'children'} tracked · {totalScreenings} screenings
            </p>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-semibold text-slate-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: '/screening/new', icon: <Camera className="w-6 h-6" />, label: 'New Screening', labelAr: 'فحص جديد', color: 'bg-emerald-600 text-white' },
              { href: '/chat', icon: <MessageCircle className="w-6 h-6" />, label: 'AI Chat', labelAr: 'المساعد', color: 'bg-blue-600 text-white' },
              { href: '/health-centers', icon: <MapPin className="w-6 h-6" />, label: 'Health Centers', labelAr: 'مراكز صحية', color: 'bg-purple-600 text-white' },
            ].map((action, i) => (
              <Link key={action.href} href={action.href}>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className={`${action.color} rounded-2xl p-4 text-center cursor-pointer shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex justify-center mb-2">{action.icon}</div>
                  <div className="text-xs font-semibold">{action.label}</div>
                  <div className="text-xs opacity-70 font-arabic">{action.labelAr}</div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Children */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">My Children</h2>
            <Link href="/screening/new" className="text-sm text-emerald-600 font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Child
            </Link>
          </div>

          {children.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <Baby className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No children added yet</p>
              <Link href="/screening/new" className="text-emerald-600 text-sm font-medium hover:underline mt-1 block">
                Add your first child →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {children.map(child => (
                <Link key={child.id} href={`/history?childId=${child.id}`}>
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 hover:border-emerald-200 transition-colors card-hover">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Baby className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{child.name}</p>
                      <p className="text-xs text-slate-500">
                        {child.gender === 'M' ? 'Boy' : child.gender === 'F' ? 'Girl' : ''}
                        {child.birthDate && ` · Born ${new Date(child.birthDate).getFullYear()}`}
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
              <h2 className="font-semibold text-slate-800">Recent Screenings</h2>
              <Link href="/history" className="text-sm text-emerald-600 font-medium">View all</Link>
            </div>

            <div className="space-y-2">
              {recentScreenings.map(s => (
                <Link key={s.id} href={`/screening/${s.id}`}>
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 card-hover">
                    <div className={`w-3 h-3 rounded-full ${getRiskDot(s.riskLevel)} flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 text-sm">{s.childName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getRiskColor(s.riskLevel)}`}>
                          {s.riskLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">MUAC: {s.muacValue?.toFixed(1)} cm · {getTimeAgo(s.createdAt)}</p>
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
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-slate-800">{totalScreenings}</div>
              <div className="text-xs text-slate-500">Total Screenings</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <Baby className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-slate-800">{children.length}</div>
              <div className="text-xs text-slate-500">Children Tracked</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
