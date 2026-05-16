'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Phone, Lock, Eye, EyeOff, Heart, User, MapPin, Globe, ArrowRight, AlertCircle } from 'lucide-react'
import { authApi, setAuthToken } from '@/services/api'

const WILAYAS = [
  'Nouakchott', 'Adrar', 'Assaba', 'Brakna', 'Dakhlet Nouadhibou',
  'Gorgol', 'Guidimakha', 'Hodh Ech Chargui', 'Hodh El Gharbi',
  'Inchiri', 'Nouadhibou', 'Tagant', 'Tiris Zemmour', 'Trarza'
]

const LANGUAGES = [
  { value: 'ar', label: 'Arabic', labelNative: 'العربية' },
  { value: 'hsn', label: 'Hassaniya', labelNative: 'الحسانية' },
  { value: 'fr', label: 'Français', labelNative: 'French' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '', phone: '', password: '', wilaya: '', languagePref: 'ar'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim()) { setError('Please enter your full name'); return }
    if (!form.phone.trim()) { setError('Please enter your phone number'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const res = await authApi.register(form)
      setAuthToken(res.data.token)
      localStorage.setItem('user', JSON.stringify({
        id: res.data.userId,
        fullName: res.data.fullName,
        phone: res.data.phone,
        wilaya: res.data.wilaya,
        languagePref: res.data.languagePref
      }))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-emerald-600 fill-emerald-600" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-3">Create Account</h1>
          <p className="text-emerald-200 text-sm mt-1">إنشاء حساب جديد</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Fatima Mint Ahmed"
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+222 XX XX XX XX"
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-9 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Wilaya (Region)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.wilaya}
                  onChange={e => setForm(p => ({ ...p, wilaya: e.target.value }))}
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white appearance-none"
                >
                  <option value="">Select your wilaya</option>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Language</label>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, languagePref: lang.value }))}
                    className={`py-2.5 rounded-xl text-xs font-medium transition-all border ${
                      form.languagePref === lang.value
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div>{lang.label}</div>
                    <div className="font-arabic opacity-70">{lang.labelNative}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
