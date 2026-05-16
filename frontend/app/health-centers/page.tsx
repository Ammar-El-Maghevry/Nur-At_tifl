'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Search, Navigation } from 'lucide-react'
import Navbar from '@/components/Navbar'
import HealthCenterCard from '@/components/HealthCenterCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { healthApi, type HealthCenter } from '@/services/api'

const WILAYAS = [
  'All Wilayas', 'Nouakchott', 'Adrar', 'Assaba', 'Brakna',
  'Dakhlet Nouadhibou', 'Gorgol', 'Guidimakha', 'Hodh Ech Chargui',
  'Hodh El Gharbi', 'Tagant', 'Tiris Zemmour', 'Trarza'
]

export default function HealthCentersPage() {
  const [centers, setCenters] = useState<HealthCenter[]>([])
  const [filtered, setFiltered] = useState<HealthCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWilaya, setSelectedWilaya] = useState('All Wilayas')
  const [search, setSearch] = useState('')
  const [locating, setLocating] = useState(false)
  const [distances, setDistances] = useState<Record<number, number>>({})

  useEffect(() => {
    healthApi.list()
      .then(res => {
        setCenters(res.data)
        setFiltered(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = centers
    if (selectedWilaya !== 'All Wilayas') {
      result = result.filter(c => c.wilaya?.toLowerCase() === selectedWilaya.toLowerCase())
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.wilaya?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [selectedWilaya, search, centers])

  const findNearest = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const res = await healthApi.nearest(pos.coords.latitude, pos.coords.longitude)
          const nearest: HealthCenter[] = res.data
          const distMap: Record<number, number> = {}
          nearest.forEach((c, i) => {
            if (c.latitude && c.longitude) {
              const R = 6371
              const dLat = (c.latitude - pos.coords.latitude) * Math.PI / 180
              const dLon = (c.longitude - pos.coords.longitude) * Math.PI / 180
              const a = Math.sin(dLat / 2) ** 2 + Math.cos(pos.coords.latitude * Math.PI / 180) * Math.cos(c.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2
              distMap[c.id] = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            }
          })
          setDistances(distMap)
          setFiltered(nearest)
          setSelectedWilaya('All Wilayas')
        } catch (e) {}
        setLocating(false)
      },
      () => {
        alert('Could not get your location. Please enable location access.')
        setLocating(false)
      }
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Health Centers</h1>
          <p className="text-slate-500 text-sm mt-0.5">المراكز الصحية في موريتانيا</p>
        </div>

        {/* Search + locate */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search centers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={findNearest}
            disabled={locating}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
          >
            <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            {locating ? '...' : 'Nearest'}
          </button>
        </div>

        {/* Wilaya filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {WILAYAS.map(w => (
            <button
              key={w}
              onClick={() => { setSelectedWilaya(w); setSearch('') }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedWilaya === w ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No health centers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">{filtered.length} centers found</p>
            {filtered.map((center, i) => (
              <motion.div
                key={center.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <HealthCenterCard center={center} distance={distances[center.id]} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
