"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: "Gratuit",
      description: "Idéal pour tester la puissance de ViralMind.",
      price: "0 FCFA",
      period: "/toujours",
      features: [
        "5 analyses profondes / mois",
        "3 scripts IA / jour (Freemium)",
        "Historique des analyses en cache",
        "Profils de voix limités",
      ],
      cta: "Commencer gratuitement",
      highlight: false
    },
    {
      name: "Pro",
      description: "Le choix des créateurs qui veulent exploser.",
      price: isAnnual ? "3 900 FCFA" : "4 900 FCFA",
      period: "/mois",
      features: [
        "25 analyses profondes / mois",
        "10 scripts IA / jour",
        "Zéro-Quota Cache illimité",
        "Playbooks d'analyse IA concurrents",
        "Espaces par niche configurables",
      ],
      cta: "Passer Pro",
      highlight: true,
      badge: "Populaire"
    },
    {
      name: "Visionary",
      description: "Levier maximum pour dominer votre niche.",
      price: isAnnual ? "7 900 FCFA" : "9 900 FCFA",
      period: "/mois",
      features: [
        "80 analyses profondes / mois",
        "30 scripts IA / jour",
        "Support prioritaire 24/7",
        "Accès anticipé aux nouveaux modèles",
        "Audit de concurrents approfondi",
      ],
      cta: "Devenir Visionary",
      highlight: false
    },
    {
      name: "Titan",
      description: "Stratégies et volumes industriels.",
      price: isAnnual ? "24 900 FCFA" : "29 900 FCFA",
      period: "/mois",
      features: [
        "300 analyses profondes / mois",
        "Génération de scripts ILLIMITÉE",
        "Gestion d'équipe (5 invités)",
        "Accès à l'API de scraping brute",
        "Liaison Webhooks & Automations",
      ],
      cta: "Choisir Titan",
      highlight: false
    }
  ]

  return (
    <section className="bg-[#0b0f19] py-24 px-6 overflow-hidden relative" id="pricing">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-indigo-500/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Prêt à devenir viral ?</h2>
          <p className="text-slate-400 font-medium max-w-xl mx-auto">Choisissez le plan qui correspond à vos ambitions et commencez à dominer les réseaux.</p>
          
          <div className="flex items-center justify-center pt-8 gap-4 relative">
             <div className="bg-slate-900/50 p-1.5 rounded-2xl flex items-center border border-slate-800 backdrop-blur-sm">
                <button 
                  onClick={() => setIsAnnual(false)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${!isAnnual ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                  Mensuel
                </button>
                <button 
                  onClick={() => setIsAnnual(true)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isAnnual ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                  Annuel
                </button>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`
                relative p-6 md:p-8 rounded-[40px] border transition-all duration-500 flex flex-col h-full
                ${plan.highlight 
                  ? 'bg-[#0f111a] border-indigo-500 scale-[1.02] lg:scale-105 z-10 shadow-2xl shadow-indigo-500/10' 
                  : 'bg-[#0f111a] border-slate-800 hover:border-slate-700 shadow-xl'}
              `}
            >
              {plan.badge && (
                <div className="absolute top-6 right-6 bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                  {plan.badge}
                </div>
              )}
              
              <div className="space-y-8 flex-1">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-white">{plan.name}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed font-medium">{plan.description}</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">{plan.price}</span>
                  <span className="text-slate-500 font-bold text-xs">{plan.period}</span>
                </div>
                
                <div className="h-px bg-slate-800 w-full" />
                
                <ul className="space-y-5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <CheckCircle2 className="size-5 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300 font-medium leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className={`
                w-full mt-10 py-5 rounded-[20px] font-black text-sm uppercase tracking-widest transition-all
                ${plan.highlight 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700' 
                  : 'bg-white text-slate-950 hover:bg-slate-100'}
              `}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
