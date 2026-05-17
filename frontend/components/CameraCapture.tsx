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
      const constraints: any = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      setMode('camera')

      // Use async to ensure video element is ready
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => {
            console.warn('Autoplay failed:', e)
          })
        }
      }
    } catch (err: any) {
      let message = 'Camera access denied. Please use the upload option instead.'
      if (err.name === 'NotAllowedError') {
        message = 'Camera permission denied. Use upload instead.'
      } else if (err.name === 'NotFoundError') {
        message = 'No camera found on this device. Use upload instead.'
      } else if (err.name === 'NotSecureError') {
        message = 'HTTPS required for camera. Use upload instead.'
      } else if (err.name === 'OverconstrainedError') {
        message = 'Camera constraints not supported. Use upload instead.'
      }
      setCameraError(message)
      console.error('Camera error:', err)
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

    // Mirror the image to match the displayed preview
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
    if (capturedFile) {
      onCapture(capturedFile)
    }
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                {cameraError}
              </div>
            )}

            <div className="border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center bg-emerald-50/30">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">Take a Photo of the Arm</h3>
              <p className="text-sm text-slate-500 mb-1">Hold the phone camera close to the upper arm</p>
              <p className="text-xs text-slate-400 font-arabic">التقط صورة للذراع العلوية</p>
            </div>

            <button
              onClick={startCamera}
              disabled={!!cameraError}
              className="w-full flex flex-col items-center gap-2 p-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl transition-colors font-medium"
            >
              <Camera className="w-6 h-6" />
              <span>Use Camera</span>
              <span className="text-xs opacity-80 font-arabic">كاميرا</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
            >
              <Upload className="w-6 h-6" />
              <span>Upload Photo (Always Works)</span>
              <span className="text-xs opacity-80 font-arabic">رفع صورة</span>
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
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                disablePictureInPicture
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {/* Arm guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/60 rounded-full w-32 h-32 flex items-center justify-center">
                  <div className="text-white text-xs text-center bg-black/30 px-2 py-1 rounded">
                    <div>Center arm</div>
                    <div className="font-arabic text-xs">ضع الذراع هنا</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button onClick={reset} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={takePhoto}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
              >
                <Camera className="w-4 h-4" /> Capture
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
            <div className="relative rounded-2xl overflow-hidden">
              <img src={preview} alt="Captured" className="w-full rounded-2xl" />
              <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Ready
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={reset} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                onClick={confirmCapture}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Analyze Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
