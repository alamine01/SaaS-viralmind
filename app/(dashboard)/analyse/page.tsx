"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Sparkles, 
  Link as LinkIcon, 
  User, 
  Loader2, 
  Target, 
  Zap, 
  FileText, 
  Layout, 
  ArrowRight, 
  X, 
  Check, 
  Copy,
  Bookmark,
  RotateCw
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useWorkspace } from "@/lib/workspace-context"
import { MarkdownRenderer } from "@/components/markdown-renderer"

export default function AnalysePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeCollection, workspaces } = useWorkspace()
  const [targetCollection, setTargetCollection] = useState(activeCollection)
  const [url, setUrl] = useState("")
  const [followers, setFollowers] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null)
  const [analysisError, setAnalysisError] = useState<{ code: string; message: string } | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [modalLang, setModalLang] = useState<'original' | 'french'>('original')
  const [showPsychologyModal, setShowPsychologyModal] = useState(false)
  const [showRetentionModal, setShowRetentionModal] = useState(false)
  const [copied, setCopied] = useState(false)

  // ANALYSIS QUOTAS STATE
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
    fetchQuotas()
  }, [])

  const formatNumber = (num: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return num.toString();
  };

  const parseCompactNumber = (str: string) => {
    if (!str) return 0;
    const clean = str.toLowerCase().replace(/,/g, "").replace(/\s/g, "").trim();
    if (clean.endsWith("k")) return parseFloat(clean) * 1000;
    if (clean.endsWith("m")) return parseFloat(clean) * 1000000;
    return parseInt(clean) || 0;
  };

  const handleAnalyse = async (targetUrl?: string, forceRefresh = false) => {
    const activeUrl = targetUrl || url;
    if (!activeUrl) return
    setLoading(true)
    setAnalysisError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           url: activeUrl, 
           followers: parseCompactNumber(followers),
           title: activeUrl.includes("tiktok") ? "Radar TikTok Outlier" : activeUrl.includes("instagram") ? "Radar Instagram Outlier" : "Radar YouTube Outlier",
           niche: "Niche Détectée",
           userId: user?.id,
           collectionName: targetCollection || activeCollection || "General",
           forceRefresh
        })
      })
      const data = await res.json()
      
      // Erreur spéciale : transcription indisponible (quota épuisé)
      if (data.error === "TRANSCRIPT_UNAVAILABLE") {
        setAnalysisError({ code: data.error, message: data.message })
        return
      }
      
      if (data.error) throw new Error(data.error)
      
      setSelectedAnalysis(data)
      fetchQuotas()
      window.dispatchEvent(new Event("quota-updated"))
      // On met à jour le champ abonnés avec le format compact
      if (data.followers !== undefined && data.followers !== null) {
        setFollowers(formatNumber(data.followers))
      }
      toast.success("Analyse Outlier terminée !")
    } catch (error: any) {
      toast.error("Erreur : " + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setTargetCollection(activeCollection)
    
    // Charger une analyse par ID ou lancer automatiquement par URL
    const loadOrTriggerAnalysis = async () => {
      const id = searchParams.get("id")
      const paramUrl = searchParams.get("url")
      
      if (id) {
        setLoading(true)
        try {
          const { data, error } = await supabase
            .from("videos")
            .select("*")
            .eq("id", id)
            .single()
          
          if (data) setSelectedAnalysis(data)
          if (error) throw error
        } catch (err: any) {
          toast.error("Analyse non trouvée")
        } finally {
          setLoading(false)
        }
      } else if (paramUrl) {
        const decodedUrl = decodeURIComponent(paramUrl)
        setUrl(decodedUrl)
        // Lancer automatiquement l'analyse pour cette URL
        handleAnalyse(decodedUrl)
      }
    }
    loadOrTriggerAnalysis()
  }, [activeCollection, searchParams])

  const handleSaveVideo = async () => {
    if (!selectedAnalysis) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Veuillez vous connecter")
      return
    }

    const { error } = await supabase.from("saved_items").insert({
      user_id: user.id,
      video_id: selectedAnalysis.id,
      type: "video",
      collection_name: targetCollection
    })

    if (error) {
      toast.error("Erreur : " + error.message)
    } else {
      toast.success(`Enregistré dans ${targetCollection}`)
    }
  }

  const handleCopy = () => {
    const rawText = selectedAnalysis?.transcript || "";
    let textToCopy = rawText;
    if (rawText.startsWith("{") && rawText.endsWith("}")) {
      try {
        const parsed = JSON.parse(rawText);
        if (parsed.original && parsed.french) {
          textToCopy = modalLang === 'original' ? parsed.original : parsed.french;
        }
      } catch (e) {}
    }
    
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    toast.success("Transcription copiée !")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRemix = () => {
    if (!selectedAnalysis) return
    localStorage.setItem("remix_data", JSON.stringify({
      structure: selectedAnalysis.structure,
      hook: selectedAnalysis.hook,
      niche: selectedAnalysis.niche
    }))
    router.push("/scripts?remix=true")
  }

  const getVideoEmbed = (analysis: any) => {
    if (!analysis || !analysis.url) return null;
    const { url, video_id } = analysis;
    
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const id = video_id || (url.includes("v=") ? url.split("v=")[1]?.split("&")[0] : url.split("/").pop());
      // Ajout de playlist + loop + rel=0 pour YouTube
      return <iframe className="w-full aspect-video rounded-2xl shadow-2xl border-0" src={`https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&rel=0&modestbranding=1&controls=1`} allow="autoplay; encrypted-media" allowFullScreen />;
    }
    
    if (url.includes("tiktok.com")) {
      const id = video_id || url.split("/video/")[1]?.split("?")[0] || url.split("/").pop()?.split("?")[0];
      
      if (!id || id.length < 5) return <div className="text-center p-10 bg-slate-50 rounded-xl text-slate-400 text-sm font-medium">Aperçu TikTok indisponible (ID requis).</div>;

      return (
        <div className="w-full max-w-[320px] mx-auto overflow-hidden rounded-[2.5rem] border-[8px] border-gray-950 dark:border-gray-800 shadow-xl bg-black relative">
           <div className="absolute top-0 inset-x-0 h-8 bg-gray-950 dark:bg-gray-800 z-10 flex items-center justify-center">
              <div className="w-20 h-1.5 bg-white/10 rounded-full" />
           </div>
           <iframe 
             className="w-full h-[560px] border-0" 
             src={`https://www.tiktok.com/embed/${id}`} 
             allow="autoplay; encrypted-media"
             allowFullScreen 
           />
           <div className="absolute bottom-0 inset-x-0 h-4 bg-gray-950 dark:bg-gray-800 z-10" />
        </div>
      );
    }

    if (url.includes("instagram.com")) {
      const id = video_id || url.split("/reels/")[1]?.split("/")[0] || url.split("/reel/")[1]?.split("/")[0] || url.split("/p/")[1]?.split("/")[0] || url.split("/").pop()?.split("?")[0];
      return (
        <div className="w-full max-w-[320px] mx-auto overflow-hidden rounded-[2.5rem] border-[8px] border-gray-950 dark:border-gray-800 shadow-xl bg-black relative">
            <iframe 
              src={`https://www.instagram.com/reel/${id}/embed`}
              className="w-full h-[580px] border-0"
              scrolling="no"
              allowTransparency={true}
            />
        </div>
      );
    }
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 relative">
      
      {/* 1. RADAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
         <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Radar Outlier</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">
               Ne copiez pas les influenceurs. Trouvez les vidéos qui ont percé sans abonnés et récupérez leur formule.
            </p>
         </div>
         <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-full text-xs font-bold uppercase tracking-wider border border-violet-100 dark:border-violet-900/50 self-start md:self-center">
            <Sparkles className="size-3.5" /> Version 2.0
         </div>
      </div>

      {/* 2. DASHBOARD CONTROL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* LEFT: SCAN CARD */}
         <div className="lg:col-span-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
               <Target className="size-4 text-violet-500" />
               Lancer un Scan
            </h3>
            
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lien de la vidéo</label>
                  <div className="relative">
                     <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
                     <input 
                       value={url}
                       onChange={(e) => {
                          setUrl(e.target.value);
                          setFollowers("");
                       }}
                       placeholder="Collez l'adresse TikTok, Instagram Reels, YouTube Shorts..." 
                       className="w-full bg-gray-50 dark:bg-gray-950 hover:bg-gray-100/50 dark:hover:bg-gray-950/80 border border-gray-200 dark:border-gray-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-hidden transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                     />
                  </div>
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre d'abonnés du créateur (optionnel)</label>
                  <div className="relative">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
                     <input 
                       value={followers}
                       onChange={(e) => setFollowers(e.target.value)}
                       placeholder="Ex: 2.5k, 120k ou 50000..." 
                       className="w-full bg-gray-50 dark:bg-gray-950 hover:bg-gray-100/50 dark:hover:bg-gray-950/80 border border-gray-200 dark:border-gray-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-hidden transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                     />
                  </div>
               </div>
            </div>

            <button 
              onClick={() => handleAnalyse()}
              disabled={loading || !url}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
               {loading ? (
                  <>
                     <Loader2 className="size-4 animate-spin text-white" />
                     <span>Analyse en cours...</span>
                  </>
               ) : (
                  <>
                     <Target className="size-4 text-white" /> 
                     <span>Lancer le Scan Radar</span>
                  </>
               )}
            </button>
         </div>

         {/* RIGHT: QUOTAS CARD */}
         <div className="lg:col-span-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6">
            <div className="space-y-5">
               <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="size-4 text-amber-500" />
                  Quota d'Analyses
               </h3>
               {quotas ? (
                  <div className="space-y-4">
                     <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <span>Plan {quotas.plan}</span>
                        <span className="text-violet-600 dark:text-violet-400 font-bold">
                           {quotas.monthly_analysis_count} / {quotas.limits.monthlyAnalysis}
                        </span>
                     </div>
                     <div className="h-2 w-full bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-violet-600 dark:bg-violet-500 transition-all duration-500 rounded-full"
                           style={{ width: `${Math.min(100, (quotas.monthly_analysis_count / (quotas.limits.monthlyAnalysis || 1)) * 100)}%` }}
                        />
                     </div>
                     <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        {quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count > 0 
                          ? `Il vous reste ${quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count} scan(s) ce mois-ci.`
                          : "⚠️ Limite d'analyses atteinte !"}
                     </p>
                  </div>
               ) : (
                  <p className="text-xs text-gray-400 font-medium">Chargement des quotas...</p>
               )}
            </div>

            {quotas && quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count === 0 && (
               <a 
                  href="/settings?tab=Abonnement" 
                  className="w-full text-center py-2.5 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors block border border-gray-200 dark:border-gray-700"
               >
                  Mettre à niveau mon plan
               </a>
            )}
         </div>
      </div>

      {/* ERROR CARD : quota / transcription indisponible */}
      {analysisError && !selectedAnalysis && (
        <div className="animate-in slide-in-from-bottom-6 duration-500">
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-10 md:p-14 text-center space-y-6 shadow-sm">
            <div className="flex items-center justify-center">
              <div className="size-16 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="size-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3 max-w-lg mx-auto">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Analyse temporairement indisponible</h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                {analysisError.message}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => { setAnalysisError(null); handleAnalyse(); }}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm"
              >
                <RotateCw className="size-3.5" /> Réessayer
              </button>
              <a
                href="mailto:support@viralmind.fr"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm"
              >
                Contacter le support
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3. RESULTS / COMMENT ÇA MARCHE */}
      <main className="w-full">
         {selectedAnalysis ? (
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">

               
               <div className="grid lg:grid-cols-12 gap-8">
                  {/* Left Column: Visual & Stats */}
                  <div className="lg:col-span-4 space-y-6">
                  <div className="overflow-hidden">
                     {getVideoEmbed(selectedAnalysis)}
                  </div>

                     <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6 relative overflow-hidden">
                        
                        {/* Stats Panel */}
                        <div className="space-y-4 relative z-10">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Stats Performance</span>
                              <Target className="size-4 text-violet-500" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Vues</p>
                                 <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(selectedAnalysis.views || 0)}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Abonnés</p>
                                 <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(selectedAnalysis.followers || 0)}</p>
                              </div>
                           </div>
                        </div>

                        {/* Outlier Panel */}
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-4 relative z-10">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Score Outlier</span>
                              <Zap className="size-4 text-amber-500 fill-amber-500/20" />
                           </div>
                           <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-black italic text-gray-900 dark:text-gray-100">x{selectedAnalysis.outlier_score}</span>
                              <span className="text-xs font-bold text-violet-500 uppercase tracking-tighter">vs Moyenne</span>
                           </div>
                           <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                              Cette vidéo a généré {selectedAnalysis.outlier_score} fois plus de vues que le nombre d'abonnés du créateur.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: AI Analysis */}
                  <div className="lg:col-span-8 space-y-6">
                     <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 overflow-hidden border border-gray-200 dark:border-gray-800">
                        <CardContent className="p-8 md:p-12 space-y-12">
                           
                           <div className="flex items-center justify-between flex-wrap gap-4">
                              <div className="space-y-1">
                                 <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{selectedAnalysis.title}</h1>
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md">{selectedAnalysis.niche}</span>
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">• Analysé par ViralMind IA</span>
                                 </div>
                              </div>
                              <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-gray-50 dark:bg-gray-950 p-2 lg:p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 w-full lg:w-auto">
                                 <select 
                                   value={targetCollection}
                                   onChange={(e) => setTargetCollection(e.target.value)}
                                   className="bg-transparent border-0 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 focus:ring-0 cursor-pointer pl-4 pr-8 py-3 lg:py-0 w-full lg:w-auto text-center lg:text-left"
                                 >
                                    {workspaces.map(ws => (
                                       <option key={ws.slug} value={ws.slug}>{ws.name}</option>
                                    ))}
                                 </select>
                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
                                    <button 
                                      onClick={() => handleAnalyse(selectedAnalysis?.url || url, true)}
                                      disabled={loading}
                                      className="px-5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                       <RotateCw className="size-3.5" /> Réanalyser
                                    </button>
                                    <button 
                                      onClick={handleSaveVideo}
                                      className="px-5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-750 dark:text-gray-300 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                       <Bookmark className="size-3.5" /> Enregistrer
                                    </button>
                                    <button 
                                      onClick={handleRemix}
                                      className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                       <Sparkles className="size-3.5" /> Remixer
                                    </button>
                                 </div>
                              </div>
                           </div>

                           <section className="space-y-6">
                              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center gap-2">
                                 <Target className="size-4 text-violet-500" /> Formule du Hook
                              </h3>
                              <div className="p-8 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 font-bold text-xl md:text-2xl leading-tight">
                                 "{selectedAnalysis.hook}"
                              </div>
                           </section>

                           <section className="space-y-6">
                              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center gap-2">
                                 <Sparkles className="size-4 text-violet-500" /> Analyse Profonde & Plan d'Action
                              </h3>
                              
                              {selectedAnalysis.structure?.summary ? (
                                 <div className="p-8 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6 animate-in fade-in duration-300">
                                    <div className="space-y-3">
                                       <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Résumé Stratégique</h4>
                                       <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                          <MarkdownRenderer content={selectedAnalysis.structure.summary} />
                                       </div>
                                    </div>

                                    {selectedAnalysis.structure?.action_plan && selectedAnalysis.structure.action_plan.length > 0 && (
                                       <div className="space-y-4">
                                          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Comment s'en inspirer (Plan d'Action)</h4>
                                          <div className="space-y-3">
                                             {selectedAnalysis.structure.action_plan.map((step: string, idx: number) => (
                                                <div key={idx} className="flex gap-4 p-5 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:border-violet-200 dark:hover:border-violet-900">
                                                   <div className="size-7 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                      {idx + 1}
                                                   </div>
                                                   <div className="flex-1 text-gray-700 dark:text-gray-300">
                                                      <MarkdownRenderer content={step} />
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              ) : (
                                 <div className="p-8 bg-gray-50/50 dark:bg-gray-950/30 rounded-2xl border border-gray-200 dark:border-gray-800 border-dashed text-center space-y-4">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
                                       Cette analyse provient d'un scan précédent et ne possède pas encore l'Analyse Profonde ni le Plan d'Action stratégique de notre IA.
                                    </p>
                                    <button
                                       onClick={() => handleAnalyse(selectedAnalysis?.url || url, true)}
                                       disabled={loading}
                                       className="inline-flex h-10 px-6 bg-gray-900 dark:bg-gray-850 hover:bg-gray-800 dark:hover:bg-gray-750 disabled:opacity-50 text-white dark:text-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all items-center gap-2 shadow-sm"
                                    >
                                       {loading ? <Loader2 className="size-3.5 animate-spin" /> : <><RotateCw className="size-3.5" /> Générer l'Analyse Profonde</>}
                                    </button>
                                 </div>
                              )}
                           </section>

                           <div className="flex flex-col gap-4">
                              {/* Section Psychologie */}
                              <button 
                                onClick={() => setShowPsychologyModal(true)}
                                className="w-full flex items-center justify-between p-6 bg-gray-50/50 dark:bg-gray-950/30 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-900 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-sm transition-all group text-left"
                              >
                                 <div className="flex items-center gap-5">
                                    <div className="size-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                       <Sparkles className="size-6" />
                                    </div>
                                    <div>
                                       <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-1">Psychologie Virale</h3>
                                       <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Découvrez les déclencheurs cognitifs utilisés.</p>
                                    </div>
                                 </div>
                                 <div className="size-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-gray-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-gray-900 transition-all">
                                    <ArrowRight className="size-5" />
                                 </div>
                              </button>

                              {/* Section Pacing & Rétention */}
                              <button 
                                onClick={() => setShowRetentionModal(true)}
                                className="w-full flex items-center justify-between p-6 bg-gray-50/50 dark:bg-gray-950/30 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-905 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-sm transition-all group text-left"
                              >
                                 <div className="flex items-center gap-5">
                                    <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                       <Layout className="size-6" />
                                    </div>
                                    <div>
                                       <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-1">Pacing & Rétention</h3>
                                       <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Analyse du rythme et de la structure narrative.</p>
                                    </div>
                                 </div>
                                 <div className="size-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-gray-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-gray-900 transition-all">
                                    <ArrowRight className="size-5" />
                                 </div>
                              </button>

                              <div className="flex gap-4 pt-4">
                                 <button 
                                   onClick={() => setShowTranscript(true)}
                                   className="flex-1 h-16 bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-300 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-900 transition-all flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-800"
                                 >
                                    <FileText className="size-4" /> Voir la Transcription
                                 </button>
                                 <button 
                                   onClick={() => window.open(selectedAnalysis.url, '_blank')}
                                   className="h-16 w-16 bg-white dark:bg-gray-900 border border-gray-250/60 dark:border-gray-800 text-gray-400 dark:text-gray-550 rounded-xl hover:text-gray-900 dark:hover:text-gray-100 transition-all flex items-center justify-center shadow-sm"
                                 >
                                    <ArrowRight className="size-5" />
                                 </button>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  </div>
               </div>
            </div>
         ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm space-y-6">
               <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Comment utiliser le Radar Outlier</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                     <div className="size-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm border border-violet-100 dark:border-violet-900/40">1</div>
                     <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm tracking-tight">Copiez le lien de la vidéo</h4>
                     <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Trouvez un Short, Reel ou TikTok qui a percé (un nombre de vues anormalement élevé par rapport au nombre d'abonnés du créateur).</p>
                  </div>
                  <div className="space-y-3">
                     <div className="size-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm border border-violet-100 dark:border-violet-900/40">2</div>
                     <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm tracking-tight">Lancez le scan</h4>
                     <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Collez l'URL de la vidéo. Spécifiez le nombre d'abonnés de manière facultative pour calculer le score d'outlier exact.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="size-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm border border-violet-100 dark:border-violet-900/40">3</div>
                     <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm tracking-tight">Analysez la formule</h4>
                     <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Découvrez la formule du hook, les mécanismes psychologiques, le pacing de rétention et le plan d'action rédigé par l'IA.</p>
                  </div>
               </div>
            </div>
         )}
      </main>

      {/* MODALS */}
      {showPsychologyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-gray-950/80 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-200 dark:border-gray-700/60">
              <div className="p-8 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center">
                       <Sparkles className="size-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Psychologie Virale</h3>
                 </div>
                 <button onClick={() => setShowPsychologyModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <X className="size-6 text-gray-400 dark:text-gray-500" />
                 </button>
              </div>
              <div className="p-10 space-y-4">
                 <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">Voici les mécanismes psychologiques détectés dans cette vidéo :</p>
                 <div className="flex flex-wrap gap-3">
                    {(selectedAnalysis.patterns || []).map((p: string) => (
                       <div key={p} className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 shadow-sm">
                          {p}
                       </div>
                    ))}
                 </div>
              </div>
              <div className="p-8 bg-gray-50/50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                 <button onClick={() => setShowPsychologyModal(false)} className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[11px] font-bold uppercase tracking-widest">Fermer</button>
              </div>
           </Card>
        </div>
      )}

      {showRetentionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-gray-950/80 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-200 dark:border-gray-700/60">
              <div className="p-8 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">
                       <Layout className="size-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Pacing & Rétention</h3>
                 </div>
                 <button onClick={() => setShowRetentionModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <X className="size-6 text-gray-400 dark:text-gray-500" />
                 </button>
              </div>
              <div className="p-10 space-y-4 max-h-[60vh] overflow-y-auto">
                 {Object.entries(selectedAnalysis.structure || {})
                   .filter(([key]) => key !== "summary" && key !== "action_plan")
                   .map(([key, value]: [string, any]) => (
                      <div key={key} className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                         <div className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">{key}</div>
                         <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            <MarkdownRenderer content={typeof value === 'string' ? value : JSON.stringify(value)} />
                         </div>
                      </div>
                 ))}
              </div>
              <div className="p-8 bg-gray-50/50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                 <button onClick={() => setShowRetentionModal(false)} className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[11px] font-bold uppercase tracking-widest">Fermer</button>
              </div>
           </Card>
        </div>
      )}

      {showTranscript && (() => {
        const rawText = selectedAnalysis?.transcript || "";
        let isBilingual = false;
        let original = rawText;
        let french = rawText;
        
        if (rawText.startsWith("{") && rawText.endsWith("}")) {
          try {
            const parsed = JSON.parse(rawText);
            if (parsed.original && parsed.french) {
              original = parsed.original;
              french = parsed.french;
              isBilingual = true;
            }
          } catch (e) {}
        }
        
        const activeText = modalLang === 'original' ? original : french;
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-gray-950/80 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
             <Card className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700/60">
                <div className="p-8 border-b border-gray-100 dark:border-gray-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800">
                   <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-gray-900 dark:bg-gray-700 text-white flex items-center justify-center shadow-sm">
                         <FileText className="size-6" />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">Transcription Intégrale</h3>
                         {isBilingual ? (
                           <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mt-0.5">Vidéo multilingue détectée</p>
                         ) : (
                           <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Générée par ViralMind IA</p>
                         )}
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      {isBilingual && (
                        <div className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl flex items-center border border-gray-200 dark:border-gray-600/50">
                          <button 
                            onClick={() => setModalLang('original')}
                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${modalLang === 'original' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                          >
                             Original
                          </button>
                          <button 
                            onClick={() => setModalLang('french')}
                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${modalLang === 'french' ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                          >
                             Français
                          </button>
                        </div>
                      )}
                      
                      <button onClick={() => { setShowTranscript(false); setModalLang('original'); }} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                         <X className="size-6 text-gray-400 dark:text-gray-500" />
                      </button>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-10 md:p-16 text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                   {activeText || "Aucune transcription disponible pour cette vidéo."}
                </div>
                <div className="p-8 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex justify-end gap-4">
                   <button onClick={handleCopy} className={`px-10 py-5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${copied ? 'bg-emerald-500 text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-violet-600 dark:hover:bg-violet-500 shadow-sm'}`}>
                      {copied ? <><Check className="size-5" /> Copié !</> : <><Copy className="size-5" /> Copier le texte</>}
                   </button>
                </div>
             </Card>
          </div>
        )
      })()}
    </div>
  )
}
