'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, Heart, LogOut, User } from 'lucide-react'
import { clearAuth, getStoredUser } from '@/services/api'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setUser(getStoredUser())
  }, [pathname])

  const handleLogout = () => {
    clearAuth()
    router.push('/')
  }

  const navLinks = [
    { href: '/dashboard', label: 'Tableau de bord', labelAr: 'الرئيسية' },
    { href: '/screening/new', label: 'Nouveau dépistage', labelAr: 'فحص جديد' },
    { href: '/history', label: 'Historique', labelAr: 'السجل' },
    { href: '/chat', label: 'Assistant IA', labelAr: 'المساعد' },
    { href: '/health-centers', label: 'Centres de santé', labelAr: 'المراكز الصحية' },
  ]

  const isLandingPage = pathname === '/'

  if (isLandingPage) {
    return (
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">NurAI</span>
          </Link>
          <Link href="/dashboard" className="bg-white text-emerald-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-all shadow-lg hover:-translate-y-0.5">
            Ouvrir l'app
          </Link>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-emerald-700 font-bold text-lg tracking-tight">NurAI</span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user && (
              <span className="text-sm text-slate-400 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                <User className="w-3.5 h-3.5" />
                {user.fullName?.split(' ')[0]}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1 pb-4">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{link.label}</span>
                <span className="text-xs text-slate-400 font-arabic">{link.labelAr}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
