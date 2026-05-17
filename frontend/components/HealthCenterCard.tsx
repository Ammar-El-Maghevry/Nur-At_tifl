'use client'

import { MapPin, Phone, Building2 } from 'lucide-react'
import type { HealthCenter } from '@/services/api'

interface HealthCenterCardProps {
  center: HealthCenter
  distance?: number
}

export default function HealthCenterCard({ center, distance }: HealthCenterCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 card-hover shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-800 text-sm leading-tight">{center.name}</h3>
            {distance != null && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0 border border-emerald-100">
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">{center.wilaya}</span>
          </div>
          {center.address && (
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <p className="text-xs text-slate-500 truncate">{center.address}</p>
            </div>
          )}
          {center.phone && (
            <a href={`tel:${center.phone}`} className="flex items-center gap-1.5 mt-1.5 group">
              <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-emerald-600 font-medium group-hover:underline">{center.phone}</span>
            </a>
          )}
        </div>
      </div>
      {center.phone && (
        <a
          href={`tel:${center.phone}`}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-700 py-2.5 rounded-xl text-sm font-semibold transition-all border border-emerald-200"
        >
          <Phone className="w-4 h-4" />
          Appeler maintenant
        </a>
      )}
    </div>
  )
}
