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
    setIsGenerating(true)
    try {
      const res = await fetch("/api/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      // On ajoute les nouveaux au début de la liste
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-amber-500/10">
            <Flame className="size-3" /> Top Performance
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Bibliothèque de <span className="text-amber-500">Hooks</span></h1>
          <p className="text-slate-500 font-medium max-w-xl text-sm leading-relaxed">
            Les 3 premières secondes décident du succès de votre vidéo. Utilisez ces accroches testées ou demandez à l'IA d'en créer de nouvelles.
          </p>
        </div>
      </div>

      {/* AI GENERATOR SECTION */}
      <div className="bg-slate-900 rounded-[40px] p-8 md:p-10 text-white shadow-2xl shadow-slate-200 overflow-hidden relative">
         <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
            <Sparkles className="size-32" />
         </div>
         <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="space-y-2">
                  <h2 className="text-2xl font-black">Générateur Magique par <span className="text-indigo-400">IA</span></h2>
                  <p className="text-slate-400 text-sm font-medium">Laissez l'IA créer 3 hooks uniques pour votre prochain sujet.</p>
               </div>
               <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
                  <input 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Sujet (ex: Fitness, Crypto...)" 
                    className="bg-transparent border-0 px-4 py-2 text-sm font-medium focus:ring-0 outline-hidden w-40 md:w-64"
                  />
                  <button 
                    onClick={generateAIHooks}
                    disabled={isGenerating}
                    className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <><Sparkles className="size-4" /> Générer 3 Hooks</>}
                  </button>
               </div>
            </div>

            {aiHooks.length > 0 && (
               <div className="grid md:grid-cols-3 gap-4 pt-4 animate-in slide-in-from-bottom-4 duration-500">
                  {aiHooks.map((hook, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 hover:border-indigo-500/50 transition-all group">
                       <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 px-2 py-1 bg-indigo-500/10 rounded-lg">{hook.type}</span>
                          <button onClick={() => handleCopy(hook.text)} className="text-slate-400 hover:text-white transition-colors">
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
        {HOOKS_DATA.map((section) => (
          <section key={section.category} className="space-y-6">
             <div className="flex items-center gap-3 px-2">
                <div className="size-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                   <Target className="size-4" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{section.category}</h2>
             </div>

             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.hooks.filter(h => h.text.toLowerCase().includes(searchTerm.toLowerCase())).map((hook) => (
                  <div 
                    key={hook.text}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group flex flex-col justify-between"
                  >
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              <TrendingUp className="size-3" /> {hook.views} Vues
                           </div>
                           <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${hook.conversion === 'Élevé' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                              Conversion {hook.conversion}
                           </div>
                        </div>
                        <p className="text-base font-bold text-slate-800 leading-snug">"{hook.text}"</p>
                     </div>

                     <div className="pt-6">
                        <button 
                          onClick={() => handleCopy(hook.text)}
                          className={`
                            w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2
                            ${copiedId === hook.text 
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white'}
                          `}
                        >
                           {copiedId === hook.text ? <><Check className="size-4" /> Copié !</> : <><Copy className="size-4" /> Copier l'accroche</>}
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        ))}
      </div>

      {/* Advice Section */}
      <div className="bg-indigo-600 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
         <div className="absolute right-[-5%] top-[-10%] size-64 bg-white/10 blur-[80px] rounded-full" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="size-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shrink-0">
               <Lightbulb className="size-10 text-white" />
            </div>
            <div className="space-y-2 text-center md:text-left">
               <h3 className="text-2xl font-black">Conseil d'Expert</h3>
               <p className="text-indigo-100 font-medium leading-relaxed">
                  Ne vous contentez pas de copier le texte. L'intonation et l'expression de votre visage pendant les 3 premières secondes sont tout aussi importantes que les mots. Soyez dynamique et cassez le rythme dès le départ !
               </p>
            </div>
         </div>
      </div>
    </div>
  )
}
