'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, Heart, LogOut, User, Globe } from 'lucide-react'
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
    { href: '/dashboard', label: 'Dashboard', labelAr: 'الرئيسية' },
    { href: '/screening/new', label: 'New Screening', labelAr: 'فحص جديد' },
    { href: '/history', label: 'History', labelAr: 'السجل' },
    { href: '/chat', label: 'AI Chat', labelAr: 'المساعد' },
    { href: '/health-centers', label: 'Health Centers', labelAr: 'المراكز الصحية' },
  ]

  const isLandingPage = pathname === '/'

  if (isLandingPage) {
    return (
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            </div>
            <span className="text-white font-bold text-xl">NurAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Login
            </Link>
            <Link href="/register" className="bg-white text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-50 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-emerald-700 font-bold text-lg">NurAI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user && (
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {user.fullName?.split(' ')[0]}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
                <span className="text-xs text-slate-400 font-arabic mr-auto">{link.labelAr}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
