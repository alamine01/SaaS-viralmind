"use client"

import { useState } from "react"
import { 
  Sparkles, 
  Search, 
  Copy, 
  Check, 
  TrendingUp, 
  Flame, 
  Target, 
  AlertCircle,
  Lightbulb,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

const HOOKS_DATA = [
  {
    category: "Contre-courant",
    hooks: [
      { text: "Tout le monde vous ment sur [Sujet]...", views: "2.1M", conversion: "Élevé" },
      { text: "Arrêtez de faire [Action Commune] si vous voulez [Résultat]...", views: "850k", conversion: "Moyen" },
      { text: "L'erreur fatale que 99% des gens font en [Niche]...", views: "1.5M", conversion: "Élevé" }
    ]
  },
  {
    category: "Résultats Immédiats",
    hooks: [
      { text: "Comment j'ai obtenu [Résultat] en seulement [Temps]...", views: "3.4M", conversion: "Élevé" },
      { text: "La méthode exacte pour passer de 0 à [Chiffre]...", views: "920k", conversion: "Élevé" },
      { text: "Voici comment j'ai automatisé [Processus] avec l'IA...", views: "1.2M", conversion: "Moyen" }
    ]
  },
  {
    category: "Curiosité / Secret",
    hooks: [
      { text: "J'ai découvert un site web que personne ne connaît...", views: "4.5M", conversion: "Élevé" },
      { text: "Le secret le mieux gardé des [Experts] enfin révélé...", views: "1.1M", conversion: "Élevé" },
      { text: "Ce que [Marque Connue] ne veut pas que vous sachiez...", views: "2.8M", conversion: "Moyen" }
    ]
  },
  {
    category: "Peur de Manquer (FOMO)",
    hooks: [
      { text: "Si vous n'utilisez pas ça avant 2026, vous allez échouer...", views: "1.9M", conversion: "Élevé" },
      { text: "Le marché est en train de changer, voici pourquoi...", views: "650k", conversion: "Moyen" },
      { text: "Dernière chance pour profiter de [Opportunité]...", views: "2.3M", conversion: "Élevé" }
    ]
  }
]

export default function HooksLibraryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // AI Generation state
  const [aiHooks, setAiHooks] = useState<any[]>([])
  const [topic, setTopic] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    toast.success("Accroche copiée !")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const generateAIHooks = async () => {
    if (!topic.trim()) {
      toast.warning("Veuillez saisir un sujet")
      return
    }
    setIsGenerating(true)
    try {
      const res = await fetch("/api/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setAiHooks(data)
      toast.success("3 Nouveaux Hooks générés !")
    } catch (e) {
      toast.error("Erreur de génération")
    }
    setIsGenerating(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-amber-500/20">
            <Flame className="size-3" /> Top Performance
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Bibliothèque de <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Hooks</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl text-sm leading-relaxed">
            Les 3 premières secondes décident du succès de votre vidéo. Utilisez ces accroches testées ou demandez à l'IA d'en créer de nouvelles.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un hook..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:border-violet-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* AI GENERATOR SECTION */}
      <div className="bg-gray-950 dark:bg-gray-900 rounded-2xl p-8 md:p-10 text-white shadow-xl overflow-hidden relative border border-gray-800">
         <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Sparkles className="size-32" />
         </div>
         <div className="relative z-10 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
               <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Générateur Magique par <span className="text-violet-400">IA</span></h2>
                  <p className="text-gray-400 text-sm font-medium">Laissez l'IA créer 3 hooks uniques pour votre prochain sujet.</p>
               </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 w-full lg:w-auto">
                   <input 
                     value={topic}
                     onChange={(e) => setTopic(e.target.value)}
                     placeholder="Sujet (ex: Fitness, Crypto...)" 
                     className="bg-transparent border-0 px-4 py-3 text-sm font-medium focus:ring-0 outline-hidden w-full sm:w-48 lg:w-64"
                   />
                   <button 
                     onClick={generateAIHooks}
                     disabled={isGenerating}
                     className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-4 sm:py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 shadow-sm"
                   >
                     {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <><Sparkles className="size-4" /> Générer 3 Hooks</>}
                   </button>
                </div>
            </div>

            {aiHooks.length > 0 && (
               <div className="grid md:grid-cols-3 gap-4 pt-4 animate-in slide-in-from-bottom-4 duration-500">
                  {aiHooks.map((hook, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 hover:border-violet-500/50 transition-all group relative">
                       <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400 px-2 py-1 bg-violet-500/10 rounded-lg">{hook.type}</span>
                          <button onClick={() => handleCopy(hook.text)} className="text-gray-400 hover:text-white transition-colors">
                             <Copy className="size-4" />
                          </button>
                       </div>
                       <p className="text-sm font-bold leading-relaxed">"{hook.text}"</p>
                    </div>
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* Main Content */}
      <div className="space-y-12">
        {HOOKS_DATA.map((section) => {
          const filtered = section.hooks.filter(h => h.text.toLowerCase().includes(searchTerm.toLowerCase()))
          if (filtered.length === 0) return null

          return (
            <section key={section.category} className="space-y-6">
               <div className="flex items-center gap-3 px-2">
                  <div className="size-8 rounded-lg bg-gray-900 dark:bg-gray-800 flex items-center justify-center text-white border border-gray-800 dark:border-gray-700/60 shadow-sm">
                     <Target className="size-4 text-violet-500" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">{section.category}</h2>
               </div>

               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((hook) => (
                    <div 
                      key={hook.text}
                      className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:border-violet-500/30 dark:hover:border-violet-500/30 transition-all group flex flex-col justify-between"
                    >
                       <div className="space-y-4">
                          <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                                <TrendingUp className="size-3" /> {hook.views} Vues
                             </div>
                             <div className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${hook.conversion === 'Élevé' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400'}`}>
                                Conversion {hook.conversion}
                             </div>
                          </div>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-snug">"{hook.text}"</p>
                       </div>

                       <div className="pt-6">
                          <button 
                            onClick={() => handleCopy(hook.text)}
                            className={`
                              w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 border shadow-sm
                              ${copiedId === hook.text 
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' 
                                : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 hover:border-gray-900 dark:hover:border-white'}
                            `}
                          >
                             {copiedId === hook.text ? <><Check className="size-3.5" /> Copié !</> : <><Copy className="size-3.5" /> Copier l'accroche</>}
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          )
        })}
      </div>

      {/* Advice Section */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-600 dark:from-violet-900/60 dark:to-purple-900/60 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden shadow-lg border border-violet-500/20">
         <div className="absolute right-[-5%] top-[-10%] size-64 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="size-16 bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 shadow-sm">
               <Lightbulb className="size-8 text-amber-300" />
            </div>
            <div className="space-y-1.5 text-center md:text-left">
               <h3 className="text-xl font-bold">Conseil d'Expert</h3>
               <p className="text-violet-100 dark:text-violet-200 text-xs md:text-sm font-medium leading-relaxed">
                  Ne vous contentez pas de copier le texte. L'intonation et l'expression de votre visage pendant les 3 premières secondes sont tout aussi importantes que les mots. Soyez dynamique et cassez le rythme dès le départ !
               </p>
            </div>
         </div>
      </div>
    </div>
  )
}
