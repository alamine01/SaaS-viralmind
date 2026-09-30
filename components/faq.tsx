"use client"

import { useState } from "react"
import { Plus, Minus, Mail } from "lucide-react"

export default function Faq() {
  const [activeTab, setActiveTab] = useState("Général")
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const categories = ["Général", "Facturation", "Compte"]

  const faqs = [
    {
      category: "Général",
      questions: [
        { q: "Comment ViralMind détecte les tendances ?", a: "Notre algorithme analyse en temps réel les patterns de rétention et les taux de croissance des vidéos sur TikTok, YouTube et Instagram." },
        { q: "Dois-je connecter mes comptes sociaux ?", a: "Non, ViralMind fonctionne par analyse externe. Vous n'avez pas besoin de lier vos comptes personnels pour profiter des analyses." },
        { q: "Quelles plateformes sont supportées ?", a: "Actuellement, nous supportons TikTok, YouTube Shorts et Instagram Reels." },
      ]
    },
    {
      category: "Facturation",
      questions: [
        { q: "Puis-je annuler mon abonnement ?", a: "Oui, vous pouvez annuler votre abonnement à tout moment depuis vos paramètres. Vous garderez l'accès jusqu'à la fin de la période payée." },
        { q: "Proposez-vous des remboursements ?", a: "Nous offrons une garantie satisfait ou remboursé de 7 jours si vous n'êtes pas convaincu par la qualité des analyses." },
      ]
    },
    {
      category: "Compte",
      questions: [
        { q: "Puis-je partager mon compte ?", a: "Les plans Pro et Visionary sont individuels. Le plan Titan permet d'ajouter des collaborateurs." },
      ]
    }
  ]

  const currentFaqs = faqs.find(f => f.category === activeTab)?.questions || []

  return (
    <section className="bg-[#0b0f19] py-24 px-6 border-t border-slate-900" id="faq">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Left Side */}
        <div className="lg:col-span-5 space-y-8">
           <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">Vous avez encore des questions ?</h2>
           <button className="bg-slate-800/50 hover:bg-slate-800 text-white border border-slate-700 px-8 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-3">
              <Mail className="size-5" /> Contactez-nous
           </button>
        </div>

        {/* Right Side */}
        <div className="lg:col-span-7 space-y-12">
           {/* Tabs */}
           <div className="inline-flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-sm">
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => {
                    setActiveTab(cat)
                    setOpenIndex(0)
                  }}
                  className={`px-8 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === cat ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
                >
                  {cat}
                </button>
              ))}
           </div>

           {/* Questions List */}
           <div className="space-y-4">
              {currentFaqs.map((item, i) => {
                const isOpen = openIndex === i
                return (
                  <div key={i} className="border-b border-slate-800/60 pb-4">
                    <button 
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className="w-full flex items-center justify-between py-4 text-left group"
                    >
                      <span className={`text-[17px] font-semibold transition-colors ${isOpen ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                        {item.q}
                      </span>
                      <div className={`size-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-900 text-slate-500'}`}>
                        {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                      </div>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                       <p className="text-slate-400 text-sm leading-relaxed max-w-2xl font-medium">
                          {item.a}
                       </p>
                    </div>
                  </div>
                )
              })}
           </div>
        </div>

      </div>
    </section>
  )
}
