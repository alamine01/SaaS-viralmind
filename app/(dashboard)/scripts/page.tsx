"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { AuthForm } from "@/components/auth-form"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Plus, 
  Copy, 
  Share2, 
  Sparkles, 
  Wand2, 
  Layout, 
  Clock, 
  History,
  ChevronDown,
  Zap,
  Mic2,
  Video,
  ArrowRight,
  Download,
  Play,
  Loader2,
  TrendingUp,
  Target,
  X,
  Calendar
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useWorkspace } from "@/lib/workspace-context"

export default function ScriptsPage() {
  const { activeCollection, workspaces } = useWorkspace()
  const [targetCollection, setTargetCollection] = useState(activeCollection)
  const [concept, setConcept] = useState("")

  useEffect(() => {
    setTargetCollection(activeCollection)
  }, [activeCollection])
  const [niche, setNiche] = useState("Dynamique & Viral (TikTok style)")
  const [duration, setDuration] = useState("60")
  const [loading, setLoading] = useState(false)
  const [scriptData, setScriptData] = useState<{score: number, explanation: string, script: any[]} | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [openModal, setOpenModal] = useState<"full" | "tech" | null>(null)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  // SCRIPT GENERATION QUOTA STATE
  const [quotas, setQuotas] = useState<any>(null)

  const fetchQuotas = async () => {
    try {
      const res = await fetch("/api/user/quotas")
      const data = await res.json()
      if (!data.error) {
        setQuotas(data)
      }
    } catch (e) {
      console.error("Failed to fetch quotas:", e)
    }
  }

  useEffect(() => {
    if (user) {
      fetchQuotas()
    }
  }, [user])

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Check for Remix data
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const scriptId = urlParams.get("id");
      if (scriptId) {
        supabase.from("saved_items").select("*").eq("id", scriptId).single()
          .then(({ data }) => {
            if (data) {
              try {
                const content = JSON.parse(data.content);
                setScriptData(Array.isArray(content) ? { score: 90, explanation: "", script: content } : content);
                toast.success("Script chargé depuis la bibliothèque !");
              } catch(e) {}
            }
          })
      }
      
      if (urlParams.get("remix") === "true") {
        const remixData = localStorage.getItem("remix_data");
        if (remixData) {
          try {
            const { structure, hook, niche: remixNiche } = JSON.parse(remixData);
            setConcept(`Remixer cette structure virale :\nHook: ${hook}\nStructure: ${JSON.stringify(structure)}`);
            if (remixNiche) setNiche(remixNiche);
            toast.success("Structure Outlier chargée !");
            localStorage.removeItem("remix_data");
          } catch (e) {}
        }
      }
    }

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [])

  useEffect(() => {
    if (showHistory) {
      fetchHistory()
    }
  }, [showHistory, user])

  const fetchHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("saved_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "script")
      .order("created_at", { ascending: false })
    
    if (data) {
      setHistoryItems(data);
    }
  }

  const handleGenerate = async () => {
    if (!concept) return
    setLoading(true)
    setScriptData(null)
    
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          concept, 
          niche, 
          tone: niche, 
          duration,
          userId: user?.id 
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setScriptData(data)
      fetchQuotas()
      
      // Save to history on client side (using user session)
      if (user) {
        const { error: saveError } = await supabase
          .from("saved_items")
          .insert([
            {
              user_id: user.id,
              content: JSON.stringify(data),
              type: "script",
              collection_name: targetCollection // Utilisation du workspace cible choisi
            }
          ])
        
        if (!saveError) {
          fetchHistory();
        }
      }
    } catch (error: any) {
      toast.error("Erreur : " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const displayBlocks = scriptData?.script || []
  const viralScore = scriptData?.score || 0
  const explanation = scriptData?.explanation || ""

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-7xl mx-auto">
      
      {/* 1. Header Premium */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative px-4 md:px-0">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
            <Wand2 className="size-3" />
            Studio Créatif
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Script <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Studio</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-lg text-sm md:text-base">
            Créez des scripts optimisés pour la rétention et la viralité en quelques secondes.
          </p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
            <div 
              onClick={() => !user && setShowAuthModal(true)}
              className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all hover:scale-105 ${user ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}
            >
              <div className={`size-1.5 rounded-full animate-pulse ${user ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {user ? 'Connecté' : 'Se Connecter'}
            </div>
           <button 
             onClick={() => setShowHistory(true)}
             className="flex-1 md:flex-none h-11 md:h-12 px-4 md:px-6 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
           >
              <History className="size-4" /> Historique
           </button>
           <button 
             onClick={() => {setScriptData(null); setConcept("")}} 
             className="flex-1 md:flex-none h-11 md:h-12 px-4 md:px-6 bg-slate-900 text-white rounded-xl font-bold text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
           >
              <Plus className="size-4" /> Nouveau
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 md:gap-10 px-4 md:px-0">
        {/* 2. Configuration Panel (Left) */}
        <aside className="col-span-12 lg:col-span-5 space-y-6 md:space-y-8">
          <div className="lg:sticky lg:top-8 space-y-6 md:space-y-8">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl bg-white/80 backdrop-blur-xl overflow-hidden border border-white/20">
              <CardContent className="p-6 md:p-8 space-y-6 md:space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Target className="size-3.5 text-indigo-500" /> Sujet de la vidéo
                  </label>
                  <textarea 
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="De quoi parle votre vidéo ?" 
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 md:px-6 py-4 md:py-5 text-[14px] md:text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-hidden transition-all min-h-[140px] md:min-h-[180px] resize-none leading-relaxed shadow-inner"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Format & Angle</label>
                  <div className="relative">
                    <select 
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 md:px-6 py-4 md:py-5 text-xs md:text-sm font-bold focus:bg-white focus:border-indigo-500/30 outline-hidden cursor-pointer text-slate-700 shadow-inner min-h-[60px]"
                    >
                      <option>Dynamique & Viral (Style TikTok)</option>
                      <option>Expert & Éducatif (Style LinkedIn)</option>
                      <option>Motivation & Inspiration</option>
                      <option>Storytelling Mystérieux</option>
                      <option>Humoristique & Décalé</option>
                      <option>UGC & Témoignage</option>
                      <option>Publicité Directe (Ventes)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Durée de la vidéo</label>
                  <div className="relative">
                    <select 
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 md:px-6 py-4 md:py-5 text-xs md:text-sm font-bold focus:bg-white focus:border-indigo-500/30 outline-hidden cursor-pointer text-slate-700 shadow-inner min-h-[60px]"
                    >
                      <option value="30">30 Secondes (~75 mots)</option>
                      <option value="60">60 Secondes (~150 mots)</option>
                      <option value="90">90 Secondes (~225 mots)</option>
                      <option value="120">2 Minutes (~300 mots)</option>
                      <option value="180">3 Minutes (~450 mots)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Enregistrer dans le projet</label>
                  <div className="relative">
                    <select 
                      value={targetCollection}
                      onChange={(e) => setTargetCollection(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 md:px-6 py-4 md:py-5 text-xs md:text-sm font-bold focus:bg-white focus:border-indigo-500/30 outline-hidden cursor-pointer text-slate-900 shadow-inner min-h-[60px]"
                    >
                      {workspaces.map(ws => (
                        <option key={ws.slug} value={ws.slug}>{ws.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {quotas && (
                  <div className="space-y-2.5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 shadow-inner">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                      <span>Quota de Scripts ({quotas.plan})</span>
                      <span>
                        {quotas.daily_script_count} / {quotas.limits.dailyScripts === 9999 ? "∞" : quotas.limits.dailyScripts}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(100, (quotas.daily_script_count / (quotas.limits.dailyScripts || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold italic flex items-center justify-between">
                      {quotas.limits.dailyScripts === 9999
                        ? "🎉 Générations illimitées actives !"
                        : quotas.limits.dailyScripts - quotas.daily_script_count > 0 
                          ? `Il vous reste ${quotas.limits.dailyScripts - quotas.daily_script_count} génération(s) aujourd'hui.`
                          : "⚠️ Limite journalière atteinte !"}
                      {quotas.limits.dailyScripts !== 9999 && quotas.limits.dailyScripts - quotas.daily_script_count === 0 && (
                        <a href="/settings" className="underline text-indigo-600 hover:text-indigo-700 font-bold ml-1">
                          Mettre à niveau mon plan
                        </a>
                      )}
                    </p>
                  </div>
                )}

                <button 
                  onClick={handleGenerate}
                  disabled={loading || !concept}
                  className="w-full h-14 md:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:from-slate-200 disabled:to-slate-300 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  {loading ? (
                    <><Loader2 className="size-5 animate-spin" /> IA en action...</>
                  ) : (
                    <>
                      <Sparkles className="size-5 group-hover:rotate-12 transition-transform" />
                      Générer le Script
                    </>
                  )}
                </button>
              </CardContent>
            </Card>

            {/* Viral Score Widget */}
            <div className="relative group overflow-hidden rounded-2xl bg-slate-900 p-6 md:p-8 shadow-2xl transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="size-16 md:size-24 text-white" />
              </div>
              <div className="relative z-10 space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Score Viral Estimé</span>
                   <div className="px-2 py-0.5 bg-white/10 rounded-full text-[9px] font-bold text-white uppercase tracking-tighter">
                     TOP 1%
                   </div>
                </div>
                <div className="flex items-baseline gap-2">
                   <span className="text-4xl md:text-6xl font-black text-white">{viralScore > 0 ? viralScore : "--"}</span>
                   <span className="text-lg md:text-xl font-bold text-indigo-400">/100</span>
                </div>
                <div className="space-y-2">
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-1000 ease-out"
                       style={{ width: `${viralScore}%` }}
                     />
                   </div>
                   <p className="text-[10px] md:text-[11px] font-medium text-slate-400 leading-relaxed italic">
                     {viralScore > 0 
                       ? explanation 
                       : "Générez un script pour voir l'estimation."}
                   </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* 3. Results Section (Right) */}
        <main className="col-span-12 lg:col-span-7 space-y-8">
          {loading ? (
             <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[32px] border border-slate-100 space-y-8 animate-pulse">
                <div className="relative">
                  <div className="size-24 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-bounce">
                    <Sparkles className="size-12" />
                  </div>
                  <div className="absolute -top-2 -right-2 size-6 bg-purple-500 rounded-full border-4 border-white animate-ping" />
                </div>
                <div className="space-y-3">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analyse & Génération...</h3>
                   <p className="text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
                     L'IA configure les hooks et optimise la rétention pour votre niche {niche}.
                   </p>
                </div>
                <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden mx-auto">
                   <div className="h-full bg-indigo-600 w-1/2 animate-[shimmer_2s_infinite] origin-left" />
                </div>
             </div>
          ) : !scriptData ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 rounded-[32px] space-y-6">
               <div className="size-24 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                  <Sparkles className="size-12" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Prêt à créer du viral ?</h3>
                  <p className="text-slate-400 max-w-sm mx-auto font-medium">
                    Remplissez le formulaire à gauche pour générer votre premier script optimisé par l'IA.
                  </p>
               </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
               <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-3xl bg-white overflow-hidden border border-white/50">
                  <CardContent className="p-8 md:p-12 space-y-10">
                     <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                           <Zap className="size-6" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 tracking-tight">Script Généré avec Succès</h2>
                           <p className="text-slate-400 font-medium text-sm">Votre contenu est prêt à être utilisé.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <button 
                          id="btn-visualize-v6"
                          onClick={() => setOpenModal("full")}
                          className="group relative h-20 md:h-24 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-4 gap-3 md:gap-5 hover:scale-[1.02] transition-all shadow-xl"
                        >
                           <div className="size-10 md:size-12 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:bg-indigo-500 transition-colors">
                              <Layout className="size-5 md:size-6" />
                           </div>
                           <div className="text-center">
                              <span className="block text-white font-bold text-xs md:text-sm uppercase tracking-tight">Visualiser</span>
                           </div>
                        </button>

                        <button 
                          id="btn-storyboard-v6"
                          onClick={() => setOpenModal("tech")}
                          className="group relative h-20 md:h-24 bg-white border border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center p-4 gap-3 md:gap-5 hover:scale-[1.02] transition-all shadow-lg"
                        >
                           <div className="size-10 md:size-12 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                              <Video className="size-5 md:size-6" />
                           </div>
                           <div className="text-center">
                              <span className="block text-slate-900 font-bold text-xs md:text-sm uppercase tracking-tight">Storyboard</span>
                           </div>
                        </button>
                     </div>

                     <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Aperçu du Hook</h4>
                        <p className="text-lg font-bold text-slate-800 leading-relaxed italic">
                           "{displayBlocks[0]?.audio}"
                        </p>
                     </div>
                  </CardContent>
               </Card>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      <ScriptModals 
        isOpen={openModal} 
        onClose={() => setOpenModal(null)} 
        blocks={displayBlocks} 
      />

      {/* History Slide-over */}
      {showHistory && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-20">
               <div className="flex items-center gap-3">
                 <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                   <History className="size-5" />
                 </div>
                 <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm">Historique</h2>
               </div>
               <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                 <X className="size-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {historyItems.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                  <p className="text-slate-400 font-medium">Aucun script enregistré.</p>
                </div>
              ) : (
                historyItems.map((item, i) => (
                  <Card key={i} className="border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer group" onClick={() => {
                    try {
                      const content = JSON.parse(item.content);
                      setScriptData(Array.isArray(content) ? { score: 90, explanation: "", script: content } : content);
                      setShowHistory(false);
                    } catch(e) {}
                  }}>
                    <CardContent className="p-5">
                      <p className="text-sm font-bold text-slate-900">{item.collection_name || "Script sans titre"}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAuthModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-slate-400"><X /></button>
            <AuthForm />
          </div>
        </div>
      )}
    </div>
  )
}

function ScriptModals({ isOpen, onClose, blocks }: any) {
  const [isTeleprompter, setIsTeleprompter] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(2)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval: any
    if (isTeleprompter && isScrolling && scrollRef.current) {
      interval = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollBy({ top: scrollSpeed, behavior: 'auto' })
        }
      }, 50)
    }
    return () => clearInterval(interval)
  }, [isTeleprompter, isScrolling, scrollSpeed])

  if (!isOpen) return null

  if (isTeleprompter) {
    return (
      <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col animate-in fade-in duration-300">
        <div className="p-6 flex items-center justify-between border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => {setIsTeleprompter(false); setIsScrolling(false)}} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <ArrowRight className="size-6 rotate-180" />
            </button>
            <h3 className="font-black uppercase tracking-widest text-sm">Mode Prompteur</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/5 p-1 rounded-lg">
               <button onClick={() => setScrollSpeed(Math.max(1, scrollSpeed - 1))} className="size-8 flex items-center justify-center hover:bg-white/10 rounded-md">-</button>
               <span className="text-[10px] font-bold w-12 text-center uppercase tracking-tighter">Vitesse {scrollSpeed}</span>
               <button onClick={() => setScrollSpeed(Math.min(10, scrollSpeed + 1))} className="size-8 flex items-center justify-center hover:bg-white/10 rounded-md">+</button>
            </div>
            <button 
              onClick={() => setIsScrolling(!isScrolling)}
              className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${isScrolling ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}
            >
              {isScrolling ? 'Stop' : 'Démarrer'}
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-20 max-w-4xl mx-auto w-full scroll-smooth">
           <div className="space-y-20 pb-[80vh]">
              {blocks.map((block: any, i: number) => (
                <div key={i} className="space-y-6">
                   <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{block.type}</div>
                   <p className="text-4xl md:text-6xl font-bold leading-tight">
                      {block.audio}
                   </p>
                </div>
              ))}
           </div>
        </div>
        
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none opacity-40">
           Lecture Directe
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
         <div className="p-6 md:p-8 border-b flex items-center justify-between bg-white sticky top-0 z-10">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
               {isOpen === 'full' ? 'Script Complet' : 'Découpage Technique'}
            </h3>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsTeleprompter(true)}
                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
               >
                  <Video className="size-3.5" /> Mode Prompteur
               </button>
               <button 
                 onClick={() => {
                    const text = blocks.map((b: any) => isOpen === 'full' ? b.audio : `${b.type}\nAudio: ${b.audio}\nVisuel: ${b.visual}`).join('\n\n');
                    navigator.clipboard.writeText(text);
                    toast.success("Copié !");
                 }}
                 className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all shadow-sm"
               >
                  <Copy className="size-3.5" /> Copier
               </button>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="size-6 text-slate-400" />
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-6 md:p-10">
            {isOpen === 'full' ? (
               <div className="space-y-8 max-w-2xl mx-auto">
                  {blocks.map((block: any, i: number) => (
                     <div key={i} className="space-y-3">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{block.type}</span>
                        <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed">
                           {block.audio}
                        </p>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="space-y-6">
                  {blocks.map((block: any, i: number) => (
                     <Card key={i} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                           <div className="w-full md:w-24 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3">
                              <div className={`size-12 rounded-xl ${block.type === 'HOOK' ? 'bg-indigo-600' : 'bg-slate-900'} flex items-center justify-center text-white`}>
                                 {block.type === 'HOOK' ? <Zap className="size-5" /> : <Play className="size-5" />}
                              </div>
                              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{block.type}</span>
                           </div>
                           <div className="flex-1 grid md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                 <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Audio</div>
                                 <p className="text-slate-700 font-medium leading-relaxed">{block.audio}</p>
                              </div>
                              <div className="space-y-3">
                                 <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Visuel suggéré</div>
                                 <p className="text-slate-500 text-sm leading-relaxed">{block.visual}</p>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            )}
         </div>
      </div>
    </div>
  )
}
