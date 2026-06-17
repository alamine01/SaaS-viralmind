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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-violet-100 dark:border-violet-500/20">
          <BookOpen className="size-3" />
          Playbooks d'Élite
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
          Bibliothèque de <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">Formules</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl text-base md:text-lg">
          Ne réinventez pas la roue. Utilisez les structures psychologiques qui ont déjà fait leurs preuves des millions de fois.
        </p>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {playbooks.map((pb) => (
          <Card key={pb.id} className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className={`size-14 rounded-xl ${pb.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                  {pb.id === 'controversial' ? <MessageSquare className="size-6" /> : <Flame className="size-6" />}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest">Impact</span>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-100/30">{pb.impact}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{pb.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed text-sm">{pb.description}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest flex items-center gap-2">
                   <Target className="size-3.5 text-violet-500" /> Structure de la formule
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {pb.structure.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 group-hover:bg-white dark:group-hover:bg-gray-800 group-hover:border-violet-150 dark:group-hover:border-violet-500/20 transition-colors">
                      <div className="size-6 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-400 dark:text-gray-500">{i+1}</div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleUsePlaybook(pb)}
                className="w-full h-12 bg-gray-900 dark:bg-white hover:bg-violet-600 dark:hover:bg-violet-500 text-white dark:text-gray-900 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                Appliquer cette Formule <ArrowRight className="size-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pro Note */}
      <div className="bg-gray-900 dark:bg-gray-800/40 border border-gray-850 dark:border-gray-700/60 rounded-2xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative shadow-md">
         <div className="absolute top-0 right-0 size-64 bg-violet-600/20 blur-[100px] rounded-full" />
         <div className="relative z-10 space-y-4">
            <h3 className="text-3xl font-bold tracking-tight leading-tight">Vous voulez une formule <br />sur-mesure ?</h3>
            <p className="text-gray-400 font-medium">Scannez un Outlier et notre IA extraira sa structure pour vous.</p>
         </div>
         <button 
           onClick={() => router.push("/analyse")}
           className="relative z-10 px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-violet-600 hover:text-white dark:hover:bg-violet-500 transition-all shadow-sm"
         >
            Ouvrir le Radar
         </button>
      </div>

    </div>
  )
}
