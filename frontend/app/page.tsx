'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Camera, Brain, MapPin, Heart, Shield, Zap, Users, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' }
  })
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="gradient-hero min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: `${100 + i * 80}px`,
                height: `${100 + i * 80}px`,
                left: `${10 + i * 15}%`,
                top: `${5 + i * 12}%`,
              }}
              animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20"
              >
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                Hackathon UNICEF 2026 — Mauritanie
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl md:text-6xl font-bold text-white leading-tight mb-4"
              >
                Détecter la
                <span className="text-emerald-300"> malnutrition</span>
                <br />en <span className="text-yellow-300">3 secondes</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-emerald-100 text-lg mb-3 leading-relaxed"
              >
                Le dépistage du PB par IA aide les mères à détecter la malnutrition
                infantile à domicile — avec seulement l'appareil photo du téléphone.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-emerald-200/80 text-sm font-arabic mb-8 text-right"
              >
                كشف سوء التغذية لدى الأطفال في ثوانٍ — مجاناً وبدون معدات
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-1"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>

            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:flex justify-center"
            >
              <div className="relative">
                <div className="w-64 bg-white rounded-[2.5rem] shadow-2xl border-4 border-white/20 overflow-hidden p-1">
                  <div className="bg-slate-900 rounded-[2rem] overflow-hidden">
                    <div className="bg-gradient-to-b from-emerald-900 to-emerald-800 p-4 text-white text-center pt-8 pb-6">
                      <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Heart className="w-6 h-6 text-white fill-white" />
                      </div>
                      <p className="text-xs text-emerald-300">Analyse PB</p>
                    </div>
                    <div className="bg-white p-4">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center mb-3 shadow-lg">
                          <div className="text-center text-white">
                            <div className="text-2xl font-bold">13.2</div>
                            <div className="text-xs">cm</div>
                          </div>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold mb-3 border border-emerald-200">
                          ✓ Normale — طبيعي
                        </div>
                        <div className="text-xs text-slate-500 text-center">Votre enfant est en bonne santé !</div>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute -left-20 top-12 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-bold text-emerald-700 border border-emerald-100"
                >
                  ⚡ Analyse en 3 sec
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute -right-16 bottom-20 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-bold text-blue-700 border border-blue-100"
                >
                  🛡️ Vérifié OMS
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-16 grid grid-cols-3 gap-6 border-t border-white/20 pt-8"
          >
            {[
              { value: '500K+', label: 'Enfants à risque en Mauritanie', icon: '👶' },
              { value: '3 sec', label: 'Vitesse de détection du PB', icon: '⚡' },
              { value: '0 MRU', label: 'Coût pour les familles', icon: '💚' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-emerald-200 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            variants={fadeIn} custom={0}
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-emerald-600 font-bold text-sm uppercase tracking-wider">Processus simple</span>
            <h2 className="text-4xl font-bold text-slate-800 mt-2">Comment fonctionne NurAI</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Trois étapes simples pour détecter le risque de malnutrition
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200" />
            {[
              {
                step: 1, icon: <Camera className="w-7 h-7 text-emerald-600" />,
                title: 'Prendre une photo', color: 'bg-emerald-50',
                desc: 'Photographiez le bras supérieur de votre enfant avec votre téléphone',
                arabic: 'التقط صورة للذراع العلوية',
              },
              {
                step: 2, icon: <Brain className="w-7 h-7 text-blue-600" />,
                title: "L'IA analyse", color: 'bg-blue-50',
                desc: "Notre IA mesure le PB et évalue le risque de malnutrition en 3 secondes",
                arabic: 'يقيس الذكاء الاصطناعي محيط الذراع',
              },
              {
                step: 3, icon: <Shield className="w-7 h-7 text-violet-600" />,
                title: 'Obtenir les résultats', color: 'bg-violet-50',
                desc: 'Recevez une classification claire du risque avec des conseils nutritionnels',
                arabic: 'احصل على النتائج والنصائح الغذائية',
              }
            ].map((item, i) => (
              <motion.div
                key={i} variants={fadeIn} custom={i + 1}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="text-center"
              >
                <div className={`w-20 h-20 ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 relative shadow-sm`}>
                  {item.icon}
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm mb-2">{item.desc}</p>
                <p className="text-xs text-slate-400 font-arabic">{item.arabic}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            variants={fadeIn} custom={0}
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-800">Conçu pour les mères mauritaniennes</h2>
            <p className="text-slate-500 mt-3">Fonctionne hors ligne, en arabe, sur tout téléphone</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Zap className="w-5 h-5 text-yellow-500" />, title: 'Résultats instantanés', desc: 'PB mesuré en 3 secondes — plus rapide que toute méthode traditionnelle' },
              { icon: <Users className="w-5 h-5 text-blue-500" />, title: 'Support arabe', desc: 'Support complet en arabe et hassaniya pour toutes les fonctionnalités' },
              { icon: <MapPin className="w-5 h-5 text-red-500" />, title: 'Centre de santé proche', desc: 'Trouve automatiquement le centre de santé le plus proche en urgence' },
              { icon: <Brain className="w-5 h-5 text-violet-500" />, title: 'Chat nutrition IA', desc: "Posez n'importe quelle question — réponse basée sur les directives OMS/UNICEF" },
              { icon: <Heart className="w-5 h-5 text-pink-500" />, title: 'Suivi des enfants', desc: "Surveillez la santé de plusieurs enfants dans le temps avec l'historique" },
              { icon: <Shield className="w-5 h-5 text-emerald-500" />, title: 'Vérifié OMS/UNICEF', desc: 'Toutes les recommandations sont basées sur des directives internationales vérifiées' },
            ].map((feature, i) => (
              <motion.div
                key={i} variants={fadeIn} custom={i * 0.5}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 gradient-hero text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto px-6"
        >
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Chaque enfant mérite un bon départ
          </h2>
          <p className="text-emerald-100 mb-3">
            Rejoignez des milliers de familles mauritaniennes qui utilisent NurAI pour protéger la santé de leurs enfants
          </p>
          <p className="text-emerald-200/70 font-arabic text-sm mb-8">
            انضم إلى الآلاف من الأسر الموريتانية التي تستخدم NurAI لحماية صحة أطفالهم
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-2xl hover:-translate-y-1"
          >
            Commencer gratuitement
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="text-white font-bold">NurAI</span>
        </div>
        <p>Construit pour le Hackathon Nouakchott AI 2026 — Piste UNICEF</p>
        <p className="mt-1 text-slate-500">Sauver des vies grâce à la technologie · بنيت لإنقاذ حياة الأطفال</p>
      </footer>
    </div>
  )
}
