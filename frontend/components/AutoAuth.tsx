'use client'

import { useEffect } from 'react'
import { authApi, setAuthToken, getStoredUser } from '@/services/api'

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('deviceId')
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    localStorage.setItem('deviceId', id)
  }
  return id
}

export default function AutoAuth({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && getStoredUser()) return

    const deviceId = getOrCreateDeviceId()
    const phone = deviceId.slice(0, 20)
    const password = deviceId

    authApi.login({ phone, password })
      .then(res => {
        setAuthToken(res.data.token)
        localStorage.setItem('user', JSON.stringify({
          id: res.data.userId,
          fullName: res.data.fullName,
          phone: res.data.phone,
          wilaya: res.data.wilaya,
          languagePref: res.data.languagePref,
        }))
      })
      .catch(() => {
        authApi.register({ phone, password, fullName: 'Guest', wilaya: '', languagePref: 'ar' })
          .then(res => {
            setAuthToken(res.data.token)
            localStorage.setItem('user', JSON.stringify({
              id: res.data.userId,
              fullName: res.data.fullName,
              phone: res.data.phone,
              wilaya: res.data.wilaya,
              languagePref: res.data.languagePref,
            }))
          })
          .catch(console.error)
      })
  }, [])

  return <>{children}</>
}
