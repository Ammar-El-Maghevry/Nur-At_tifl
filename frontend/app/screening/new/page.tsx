'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Baby, Plus, AlertTriangle, MapPin, Phone, CheckCircle, ArrowLeft, XCircle, Camera, RefreshCw } from 'lucide-react'
import Navbar from '@/components/Navbar'
import CameraCapture from '@/components/CameraCapture'
import RiskBadge from '@/components/RiskBadge'
import { AnalyzingSpinner } from '@/components/LoadingSpinner'
import { childApi, screeningApi, healthApi, getStoredUser, type ScreeningResult, type HealthCenter } from '@/services/api'
import Link from 'next/link'

export default function NewScreeningPage() {
  const [step, setStep] = useState<'select-child' | 'capture' | 'analyzing' | 'result' | 'rejected'>('select-child')
  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChild, setNewChild] = useState({ name: '', gender: '', birthDate: '' })
  const [result, setResult] = useState<ScreeningResult | null>(null)
  const [nearestCenters, setNearestCenters] = useState<HealthCenter[]>([])
  const [addingChild, setAddingChild] = useState(false)
  const [error, setError] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
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
    } catch {
      setError('Impossible d\'ajouter l\'enfant')
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
      const data: ScreeningResult = res.data

      if (data.riskLevel === 'REJECTED') {
        setRejectionReason(data.notes || '')
        setStep('rejected')
        return
      }

      setResult(data)

      if (data.riskLevel === 'SEVERE') {
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
        } catch {}
      }
      setStep('result')
    } catch {
      setError('Analyse échouée. Veuillez réessayer.')
      setStep('capture')
    }
  }

  const riskColors = {
    NORMAL:   { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-600' },
    MODERATE: { bg: 'bg-amber-50',   border: 'border-amber-200',   header: 'bg-amber-500' },
    SEVERE:   { bg: 'bg-red-50',     border: 'border-red-200',     header: 'bg-red-600' },
  }
  const risk = result?.riskLevel as keyof typeof riskColors || 'NORMAL'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">

        {step !== 'analyzing' && step !== 'result' && step !== 'rejected' && (
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Tableau de bord
          </Link>
        )}

        <AnimatePresence mode="wait">

          {/* Étape 1 : Sélectionner l'enfant */}
          {step === 'select-child' && (
            <motion.div key="select-child" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Nouveau dépistage</h1>
              <p className="text-slate-500 text-sm mb-1">Sélectionner un enfant à dépister</p>
              <p className="text-xs text-slate-400 font-arabic mb-6">اختر طفلاً للفحص</p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
              )}

              {children.length > 0 && (
                <div className="space-y-2 mb-4">
                  {children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child)}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        selectedChild?.id === child.id
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${selectedChild?.id === child.id ? 'bg-emerald-600' : 'bg-slate-100'}`}>
                        <Baby className={`w-5 h-5 ${selectedChild?.id === child.id ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-slate-800">{child.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {child.gender === 'M' ? 'Garçon' : child.gender === 'F' ? 'Fille' : 'Genre inconnu'}
                          {child.birthDate && ` · ${new Date(child.birthDate).getFullYear()}`}
                        </p>
                      </div>
                      {selectedChild?.id === child.id && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              )}

              {showAddChild ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 space-y-3 shadow-sm">
                  <h3 className="font-bold text-slate-800">Ajouter un nouvel enfant</h3>
                  <input
                    type="text"
                    placeholder="Nom de l'enfant"
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
                      <option value="">Genre</option>
                      <option value="M">Garçon</option>
                      <option value="F">Fille</option>
                    </select>
                    <input
                      type="date"
                      value={newChild.birthDate}
                      onChange={e => setNewChild(p => ({ ...p, birthDate: e.target.value }))}
                      className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddChild(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Annuler</button>
                    <button
                      onClick={handleAddChild}
                      disabled={addingChild || !newChild.name.trim()}
                      className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-emerald-700 transition-colors"
                    >
                      {addingChild ? 'Ajout...' : 'Ajouter'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => setShowAddChild(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-all text-sm font-semibold mb-4"
                >
                  <Plus className="w-4 h-4" /> Ajouter un nouvel enfant
                </button>
              )}

              <button
                disabled={!selectedChild}
                onClick={() => setStep('capture')}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200/50 disabled:shadow-none"
              >
                {selectedChild ? `Dépister ${selectedChild.name}` : 'Sélectionner un enfant d\'abord'}
              </button>
            </motion.div>
          )}

          {/* Étape 2 : Caméra */}
          {step === 'capture' && (
            <motion.div key="capture" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('select-child')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Prendre la photo</h1>
                  <p className="text-sm text-slate-500">Dépistage : <span className="text-emerald-600 font-semibold">{selectedChild?.name}</span></p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 text-sm text-blue-700">
                <p className="font-bold mb-1.5">📸 Conseils pour de meilleurs résultats :</p>
                <ul className="list-disc list-inside text-xs space-y-1 text-blue-600">
                  <li>Centrer le bras supérieur (entre l'épaule et le coude)</li>
                  <li>Bonne luminosité — pas d'ombres</li>
                  <li>Tenir le téléphone à 20–30 cm du bras</li>
                  <li className="font-arabic">ضع الذراع العلوية في مركز الصورة بوضوح</li>
                </ul>
              </div>

              <CameraCapture onCapture={handleCapture} />
            </motion.div>
          )}

          {/* Étape 3 : Analyse */}
          {step === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalyzingSpinner />
            </motion.div>
          )}

          {/* Étape REJETÉE : Image non valide */}
          {step === 'rejected' && (
            <motion.div
              key="rejected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Header card */}
              <div className="bg-white rounded-3xl border-2 border-orange-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  >
                    <XCircle className="w-9 h-9 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-bold">Image non valide</h2>
                  <p className="text-orange-100 text-sm mt-1 font-arabic">الصورة غير صالحة للتحليل</p>
                </div>
                <div className="p-5">
                  <p className="text-slate-600 text-sm text-center leading-relaxed">
                    {rejectionReason || "L'IA n'a pas pu détecter un bras humain dans cette image. Veuillez prendre une photo claire du bras supérieur de l'enfant."}
                  </p>
                </div>
              </div>

              {/* Why it was rejected */}
              <div className="bg-orange-50 rounded-2xl border border-orange-200 p-4">
                <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Raisons possibles du rejet
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: '🌊', fr: 'Image sans bras humain visible (paysage, objet, etc.)', ar: 'صورة بدون ذراع بشرية (منظر طبيعي، أشياء...)' },
                    { icon: '🔦', fr: 'Éclairage insuffisant ou image trop sombre', ar: 'إضاءة غير كافية أو صورة مظلمة' },
                    { icon: '📷', fr: 'Image floue ou trop loin du bras', ar: 'صورة ضبابية أو بعيدة جداً عن الذراع' },
                    { icon: '👕', fr: 'Bras couvert par un vêtement', ar: 'الذراع مغطى بالملابس' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 bg-white rounded-xl p-2.5 border border-orange-100">
                      <span className="text-base flex-shrink-0 mt-0.5">{r.icon}</span>
                      <div>
                        <p className="text-xs text-slate-700 font-medium">{r.fr}</p>
                        <p className="text-xs text-slate-400 font-arabic mt-0.5">{r.ar}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How to take a good photo */}
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
                <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Comment bien photographier
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: '💪', fr: 'Bras supérieur nu et visible', ar: 'ذراع علوية مكشوفة' },
                    { icon: '☀️', fr: 'Bonne lumière naturelle', ar: 'إضاءة طبيعية جيدة' },
                    { icon: '📐', fr: 'Tenir à 20–30 cm', ar: 'مسافة 20-30 سم' },
                    { icon: '🎯', fr: 'Bras centré dans l\'image', ar: 'الذراع في وسط الصورة' },
                  ].map((tip, i) => (
                    <div key={i} className="bg-white rounded-xl p-2.5 border border-emerald-100 text-center">
                      <div className="text-xl mb-1">{tip.icon}</div>
                      <p className="text-xs text-slate-700 font-medium">{tip.fr}</p>
                      <p className="text-xs text-slate-400 font-arabic">{tip.ar}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStep('select-child')}
                  className="py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                >
                  Changer d'enfant
                </button>
                <button
                  onClick={() => setStep('capture')}
                  className="py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:from-emerald-700 hover:to-emerald-800 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Réessayer
                </button>
              </div>
            </motion.div>
          )}

          {/* Étape 4 : Résultat */}
          {step === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>

              {result.riskLevel === 'SEVERE' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-lg"
                >
                  <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-lg">URGENT — Aller au centre de santé MAINTENANT</p>
                    <p className="text-red-100 text-sm mt-1 font-arabic">طارئ — اذهب إلى المركز الصحي فوراً</p>
                  </div>
                </motion.div>
              )}

              {/* Main result card */}
              <div className={`bg-white rounded-3xl border-2 ${riskColors[risk].border} overflow-hidden shadow-lg mb-4`}>
                <div className={`${riskColors[risk].header} p-4 text-white text-center`}>
                  <p className="text-sm font-medium opacity-90">Résultat pour {result.childName}</p>
                </div>
                <div className="p-6 flex flex-col items-center gap-4">
                  <RiskBadge risk={result.riskLevel as any} muac={result.muacValue} size="lg" />
                  <div className="text-center">
                    <p className="text-slate-500 text-sm font-medium">Périmètre brachial (PB)</p>
                    <p className="text-5xl font-bold text-slate-800 mt-1">{result.muacValue?.toFixed(1)} <span className="text-2xl text-slate-500 font-normal">cm</span></p>
                    <p className="text-xs text-slate-400 mt-1">Confiance : {Math.round((result.confidence || 0) * 100)}%</p>
                  </div>
                </div>
              </div>

              {/* Advice */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-2">Conseils</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{result.notes}</p>
                {result.arabicNotes && (
                  <p className="text-slate-500 text-sm font-arabic text-right mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                    {result.arabicNotes}
                  </p>
                )}
              </div>

              {/* Nearest health centers for severe cases */}
              {result.riskLevel === 'SEVERE' && nearestCenters.length > 0 && (
                <div className="bg-red-50 rounded-2xl border border-red-200 p-4 mb-4 shadow-sm">
                  <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Centres de santé les plus proches
                  </h3>
                  <div className="space-y-2">
                    {nearestCenters.map(center => (
                      <div key={center.id} className="bg-white rounded-xl p-3 flex items-center gap-3 border border-red-100">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">{center.name}</p>
                          <p className="text-xs text-slate-500">{center.address}</p>
                        </div>
                        {center.phone && (
                          <a href={`tel:${center.phone}`} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                            <Phone className="w-3 h-3" /> Appeler
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
                  className="py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                >
                  Nouveau dépistage
                </button>
                <Link href="/history" className="py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-bold text-sm text-center shadow-sm">
                  Voir l'historique
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
