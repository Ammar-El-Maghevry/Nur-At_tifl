import axios from 'axios'
import Cookies from 'js-cookie'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  register: (data: { phone: string; password: string; fullName: string; wilaya: string; languagePref: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { phone: string; password: string }) =>
    api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
}

// Children
export const childApi = {
  list: () => api.get('/api/children'),
  add: (data: { name: string; birthDate?: string; gender?: string }) =>
    api.post('/api/children', data),
  get: (id: number) => api.get(`/api/children/${id}`),
}

// Screening
export const screeningApi = {
  analyze: (formData: FormData) =>
    api.post('/api/screening/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
  history: (childId: number) => api.get(`/api/screening/history/${childId}`),
  userHistory: () => api.get('/api/screening/history'),
  get: (id: number) => api.get(`/api/screening/${id}`),
}

// Chat
export const chatApi = {
  ask: (question: string, language: string = 'ar') =>
    api.post('/api/chat/ask', { question, language }),
}

// Health Centers
export const healthApi = {
  list: (wilaya?: string) => api.get('/api/health-centers', { params: wilaya ? { wilaya } : {} }),
  nearest: (lat: number, lng: number) => api.get('/api/health-centers/nearest', { params: { lat, lng } }),
}

export type RiskLevel = 'NORMAL' | 'MODERATE' | 'SEVERE'

export interface ScreeningResult {
  id: number
  childId: number
  childName: string
  muacValue: number
  riskLevel: RiskLevel
  confidence: number
  notes: string
  arabicNotes?: string
  createdAt: string
}

export interface Child {
  id: number
  name: string
  gender: string
  birthDate: string
  createdAt: string
}

export interface HealthCenter {
  id: number
  name: string
  wilaya: string
  address: string
  phone: string
  latitude: number
  longitude: number
}

export function setAuthToken(token: string) {
  Cookies.set('token', token, { expires: 1 })
  localStorage.setItem('token', token)
}

export function clearAuth() {
  Cookies.remove('token')
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default api
