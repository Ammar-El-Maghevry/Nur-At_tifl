'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, RefreshCw, CheckCircle } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (file: File) => void
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'preview'>('select')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      setStream(mediaStream)
      setMode('camera')
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {})
        }
      }
    } catch (err: any) {
      const msgs: Record<string, string> = {
        NotAllowedError: 'Accès caméra refusé. Utilisez le bouton d\'upload ci-dessous.',
        NotFoundError: 'Aucune caméra trouvée. Utilisez le bouton d\'upload.',
        NotSecureError: 'HTTPS requis pour la caméra. Utilisez l\'upload.',
        OverconstrainedError: 'Contraintes caméra non supportées. Utilisez l\'upload.',
      }
      setCameraError(msgs[err.name] || 'Caméra inaccessible. Utilisez le bouton d\'upload.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
  }, [stream])

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'muac_photo.jpg', { type: 'image/jpeg' })
        setCapturedFile(file)
        setPreview(canvas.toDataURL('image/jpeg'))
        stopCamera()
        setMode('preview')
      }
    }, 'image/jpeg', 0.95)
  }, [stopCamera])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string)
      setCapturedFile(file)
      setMode('preview')
    }
    reader.readAsDataURL(file)
  }, [])

  const confirmCapture = useCallback(() => {
    if (capturedFile) onCapture(capturedFile)
  }, [capturedFile, onCapture])

  const reset = useCallback(() => {
    stopCamera()
    setPreview(null)
    setCapturedFile(null)
    setCameraError(null)
    setMode('select')
  }, [stopCamera])

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence mode="wait">
        {mode === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {cameraError && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-700">
                ⚠️ {cameraError}
              </div>
            )}

            <div className="border-2 border-dashed border-emerald-200 rounded-3xl p-8 text-center bg-gradient-to-b from-emerald-50/50 to-transparent">
              <div className="w-18 h-18 w-[72px] h-[72px] bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-9 h-9 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">Photographier le bras supérieur</h3>
              <p className="text-sm text-slate-500 mb-1">Tenez le téléphone à 20–30 cm du bras</p>
              <p className="text-xs text-slate-400 font-arabic">التقط صورة للذراع العلوية بوضوح</p>
            </div>

            <button
              onClick={startCamera}
              disabled={!!cameraError}
              className="w-full flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-2xl transition-all font-medium shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:-translate-y-0.5"
            >
              <Camera className="w-6 h-6" />
              <span>Utiliser la caméra</span>
              <span className="text-xs opacity-75 font-arabic">استخدام الكاميرا</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl transition-all font-medium shadow-lg shadow-blue-200/50 hover:shadow-xl hover:-translate-y-0.5"
            >
              <Upload className="w-6 h-6" />
              <span>Télécharger une photo</span>
              <span className="text-xs opacity-75 font-arabic">رفع صورة من الهاتف</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
          </motion.div>
        )}

        {mode === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-video shadow-xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                disablePictureInPicture
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/70 rounded-full w-36 h-36 flex items-center justify-center shadow-inner">
                  <div className="text-white text-xs text-center bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl">
                    <div className="font-medium">Centrer le bras</div>
                    <div className="font-arabic text-xs opacity-80">ضع الذراع هنا</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button onClick={reset} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4" /> Annuler
              </button>
              <button
                onClick={takePhoto}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg"
              >
                <Camera className="w-4 h-4" /> Capturer
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'preview' && preview && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-xl">
              <img src={preview} alt="Aperçu" className="w-full rounded-3xl" />
              <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                <CheckCircle className="w-3 h-3" /> Prête
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={reset} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                <RefreshCw className="w-4 h-4" /> Reprendre
              </button>
              <button
                onClick={confirmCapture}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg"
              >
                <CheckCircle className="w-4 h-4" /> Analyser maintenant
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
