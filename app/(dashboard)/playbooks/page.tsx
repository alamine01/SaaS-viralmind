"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { 
  BookOpen, 
  Sparkles, 
  Zap, 
  Target, 
  ArrowRight, 
  Flame, 
  MessageSquare, 
  Clock,
  Check
} from "lucide-react"
import { toast } from "sonner"

const playbooks = [
  {
    id: "neg-hook",
    title: "Le Hook Négatif",
    description: "Arrêtez de faire [Erreur Commune]. Voici pourquoi ça ruine votre [Résultat].",
    category: "Rétention",
    impact: "Très Élevé",
    structure: [
      "HOOK : Choquer avec une erreur",
      "PREUVE : Pourquoi c'est mal",
      "SOLUTION : La nouvelle méthode",
      "CTA : Abonne-toi"
    ],
    color: "bg-rose-500"
  },
  {
    id: "listicle",
    title: "Le Top 3 Secret",
    description: "3 outils gratuits que personne ne connaît pour [Résultat].",
    category: "Partage",
    impact: "Élevé",
    structure: [
      "HOOK : Promesse de valeur rare",
      "LISTE : Outil 1, Outil 2",
      "PEAK : L'outil 3 est le meilleur",
      "CTA : Partage à un ami"
    ],
    color: "bg-amber-500"
  },
  {
    id: "controversial",
    title: "L'Opinion Impopulaire",
    description: "Tout le monde se trompe sur [Sujet]. Voici la vérité.",
    category: "Engagement",
    impact: "Viral",
    structure: [
      "HOOK : Contredire une norme",
      "EXPLICATION : La logique inverse",
      "RESULTAT : Pourquoi ça marche",
      "CTA : Débat en commentaires"
    ],
    color: "bg-indigo-500"
  },
  {
    id: "day-in-life",
    title: "Une journée type",
    description: "Ma routine pour atteindre [Objectif] en moins de [Temps].",
    category: "Branding",
    impact: "Moyen",
    structure: [
      "HOOK : Résultat final",
      "ETAPES : Chronologie rapide",
      "SECRET : Un conseil caché",
      "CTA : Enregistre pour plus tard"
    ],
    color: "bg-emerald-500"
  }
]

export default function PlaybooksPage() {
  const router = useRouter()

  const handleUsePlaybook = (playbook: any) => {
    localStorage.setItem("remix_data", JSON.stringify({
      structure: playbook.structure.join('\n'),
      hook: playbook.description,
      niche: playbook.category
    }))
    router.push("/scripts?remix=true")
    toast.success(`Formule "${playbook.title}" chargée !`)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
          <BookOpen className="size-3" />
          Playbooks d'Élite
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Bibliothèque de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Formules</span>
        </h1>
        <p className="text-slate-500 font-medium max-w-2xl text-lg">
          Ne réinventez pas la roue. Utilisez les structures psychologiques qui ont déjà fait leurs preuves des millions de fois.
        </p>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
        {playbooks.map((pb) => (
          <Card key={pb.id} className="group relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[32px] bg-white overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 border border-slate-50">
            <CardContent className="p-8 md:p-10 space-y-8">
              <div className="flex items-start justify-between">
                <div className={`size-16 rounded-2xl ${pb.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  {pb.id === 'controversial' ? <MessageSquare className="size-8" /> : <Flame className="size-8" />}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact</span>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{pb.impact}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{pb.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{pb.description}</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Target className="size-3.5" /> Structure de la formule
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {pb.structure.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-colors">
                      <div className="size-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">{i+1}</div>
                      <span className="text-xs font-bold text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleUsePlaybook(pb)}
                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                Appliquer cette Formule <ArrowRight className="size-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pro Note */}
      <div className="bg-slate-900 rounded-[32px] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative">
         <div className="absolute top-0 right-0 size-64 bg-indigo-600/20 blur-[100px] rounded-full" />
         <div className="relative z-10 space-y-4">
            <h3 className="text-3xl font-black tracking-tight leading-tight">Vous voulez une formule <br />sur-mesure ?</h3>
            <p className="text-slate-400 font-medium">Scannez un Outlier et notre IA extraira sa structure pour vous.</p>
         </div>
         <button 
           onClick={() => router.push("/analyse")}
           className="relative z-10 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all shadow-xl"
         >
            Ouvrir le Radar
         </button>
      </div>

    </div>
  )
}
