'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Baby, Plus, AlertTriangle, MapPin, Phone, CheckCircle, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import CameraCapture from '@/components/CameraCapture'
import RiskBadge from '@/components/RiskBadge'
import { AnalyzingSpinner } from '@/components/LoadingSpinner'
import { childApi, screeningApi, healthApi, getStoredUser, type ScreeningResult, type HealthCenter } from '@/services/api'
import Link from 'next/link'

export default function NewScreeningPage() {
  const router = useRouter()
  const [step, setStep] = useState<'select-child' | 'capture' | 'analyzing' | 'result'>('select-child')
  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChild, setNewChild] = useState({ name: '', gender: '', birthDate: '' })
  const [result, setResult] = useState<ScreeningResult | null>(null)
  const [nearestCenters, setNearestCenters] = useState<HealthCenter[]>([])
  const [addingChild, setAddingChild] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const u = getStoredUser()
    if (!u) { router.push('/login'); return }
    loadChildren()
  }, [])

  const loadChildren = async () => {
    try {
      const res = await childApi.list()
      setChildren(res.data)
      if (res.data.length === 0) setShowAddChild(true)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddChild = async () => {
    if (!newChild.name.trim()) return
    setAddingChild(true)
    try {
      const res = await childApi.add(newChild)
      const added = res.data
      setChildren(prev => [added, ...prev])
      setSelectedChild(added)
      setShowAddChild(false)
      setNewChild({ name: '', gender: '', birthDate: '' })
    } catch (e: any) {
      setError('Failed to add child')
    } finally {
      setAddingChild(false)
    }
  }

  const handleCapture = async (file: File) => {
    if (!selectedChild) return
    setStep('analyzing')
    setError('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('childId', String(selectedChild.id))
      const res = await screeningApi.analyze(formData)
      setResult(res.data)

      if (res.data.riskLevel === 'SEVERE') {
        try {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async pos => {
              const centers = await healthApi.nearest(pos.coords.latitude, pos.coords.longitude)
              setNearestCenters(centers.data?.slice(0, 3) || [])
            }, () => {
              healthApi.list('Nouakchott').then(r => setNearestCenters(r.data?.slice(0, 3) || []))
            })
          } else {
            healthApi.list('Nouakchott').then(r => setNearestCenters(r.data?.slice(0, 3) || []))
          }
        } catch (e) {}
      }
      setStep('result')
    } catch (e: any) {
      setError('Analysis failed. Please try again.')
      setStep('capture')
    }
  }

  const riskColors = {
    NORMAL: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-600' },
    MODERATE: { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-500' },
    SEVERE: { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-600' },
  }
  const risk = result?.riskLevel as keyof typeof riskColors || 'NORMAL'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Back button */}
        {step !== 'analyzing' && step !== 'result' && (
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        )}

        <AnimatePresence mode="wait">

          {/* Step 1: Select child */}
          {step === 'select-child' && (
            <motion.div key="select-child" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">New Screening</h1>
              <p className="text-slate-500 text-sm mb-6">Select a child to screen</p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
              )}

              {/* Children list */}
              {children.length > 0 && (
                <div className="space-y-2 mb-4">
                  {children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child)}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        selectedChild?.id === child.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedChild?.id === child.id ? 'bg-emerald-600' : 'bg-slate-100'}`}>
                        <Baby className={`w-5 h-5 ${selectedChild?.id === child.id ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-slate-800">{child.name}</p>
                        <p className="text-xs text-slate-500">
                          {child.gender === 'M' ? 'Boy' : child.gender === 'F' ? 'Girl' : 'Unknown gender'}
                          {child.birthDate && ` · ${new Date(child.birthDate).getFullYear()}`}
                        </p>
                      </div>
                      {selectedChild?.id === child.id && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Add child form */}
              {showAddChild ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 space-y-3">
                  <h3 className="font-semibold text-slate-800">Add New Child</h3>
                  <input
                    type="text"
                    placeholder="Child's name"
                    value={newChild.name}
                    onChange={e => setNewChild(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newChild.gender}
                      onChange={e => setNewChild(p => ({ ...p, gender: e.target.value }))}
                      className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Gender</option>
                      <option value="M">Boy</option>
                      <option value="F">Girl</option>
                    </select>
                    <input
                      type="date"
                      value={newChild.birthDate}
                      onChange={e => setNewChild(p => ({ ...p, birthDate: e.target.value }))}
                      className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddChild(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium">Cancel</button>
                    <button
                      onClick={handleAddChild}
                      disabled={addingChild || !newChild.name.trim()}
                      className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                    >
                      {addingChild ? 'Adding...' : 'Add Child'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => setShowAddChild(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors text-sm font-medium mb-4"
                >
                  <Plus className="w-4 h-4" /> Add a new child
                </button>
              )}

              <button
                disabled={!selectedChild}
                onClick={() => setStep('capture')}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-semibold transition-all shadow-sm"
              >
                {selectedChild ? `Screen ${selectedChild.name}` : 'Select a child first'}
              </button>
            </motion.div>
          )}

          {/* Step 2: Camera */}
          {step === 'capture' && (
            <motion.div key="capture" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('select-child')} className="p-2 rounded-xl hover:bg-slate-100">
                  <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Capture Photo</h1>
                  <p className="text-sm text-slate-500">Screening: <span className="text-emerald-600 font-medium">{selectedChild?.name}</span></p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-700">
                <p className="font-medium mb-0.5">📸 Tips for best results:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-blue-600">
                  <li>Center the upper arm (between shoulder and elbow)</li>
                  <li>Good lighting — no shadows</li>
                  <li>Hold phone 20-30cm from arm</li>
                  <li className="font-arabic">ضع الذراع العلوية في مركز الصورة</li>
                </ul>
              </div>

              <CameraCapture onCapture={handleCapture} />
            </motion.div>
          )}

          {/* Step 3: Analyzing */}
          {step === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalyzingSpinner />
            </motion.div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>

              {/* Severe alert banner */}
              {result.riskLevel === 'SEVERE' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-600 text-white rounded-2xl p-4 mb-4 flex items-start gap-3"
                >
                  <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-lg">URGENT — Go to Health Center NOW</p>
                    <p className="text-red-100 text-sm mt-1 font-arabic">طارئ — اذهب إلى المركز الصحي فوراً</p>
                  </div>
                </motion.div>
              )}

              {/* Main result card */}
              <div className={`bg-white rounded-3xl border-2 ${riskColors[risk].border} overflow-hidden shadow-sm mb-4`}>
                <div className={`${riskColors[risk].header} p-4 text-white text-center`}>
                  <p className="text-sm font-medium opacity-80">Result for {result.childName}</p>
                </div>
                <div className="p-6 flex flex-col items-center gap-4">
                  <RiskBadge risk={result.riskLevel as any} muac={result.muacValue} size="lg" />
                  <div className="text-center">
                    <p className="text-slate-500 text-sm">MUAC Measurement</p>
                    <p className="text-4xl font-bold text-slate-800">{result.muacValue?.toFixed(1)} <span className="text-xl text-slate-500">cm</span></p>
                    <p className="text-xs text-slate-400 mt-1">Confidence: {Math.round((result.confidence || 0) * 100)}%</p>
                  </div>
                </div>
              </div>

              {/* Advice */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
                <h3 className="font-semibold text-slate-800 mb-2">Advice</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{result.notes}</p>
                {result.arabicNotes && (
                  <p className="text-slate-500 text-sm font-arabic text-right mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                    {result.arabicNotes}
                  </p>
                )}
              </div>

              {/* Nearest health centers for severe cases */}
              {result.riskLevel === 'SEVERE' && nearestCenters.length > 0 && (
                <div className="bg-red-50 rounded-2xl border border-red-200 p-4 mb-4">
                  <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Nearest Health Centers
                  </h3>
                  <div className="space-y-2">
                    {nearestCenters.map(center => (
                      <div key={center.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{center.name}</p>
                          <p className="text-xs text-slate-500">{center.address}</p>
                        </div>
                        {center.phone && (
                          <a href={`tel:${center.phone}`} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                            <Phone className="w-3 h-3" /> Call
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setStep('select-child'); setResult(null) }}
                  className="py-3 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm"
                >
                  New Screening
                </button>
                <Link href="/history" className="py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm text-center">
                  View History
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
