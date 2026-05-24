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
  Bookmark
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useWorkspace } from "@/lib/workspace-context"

export default function AnalysePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeCollection, workspaces } = useWorkspace()
  const [targetCollection, setTargetCollection] = useState(activeCollection)
  const [url, setUrl] = useState("")
  const [followers, setFollowers] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
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

  const handleAnalyse = async (targetUrl?: string | React.MouseEvent) => {
    const activeUrl = typeof targetUrl === 'string' ? targetUrl : url;
    if (!activeUrl) return
    setLoading(true)
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
           userId: user?.id
        })
      })
      const data = await res.json()
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
    if (!selectedAnalysis?.transcript) return
    navigator.clipboard.writeText(selectedAnalysis.transcript)
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
        <div className="w-full max-w-[320px] mx-auto overflow-hidden rounded-[2.5rem] border-[8px] border-slate-900 shadow-2xl bg-black relative">
           <div className="absolute top-0 inset-x-0 h-8 bg-slate-900 z-10 flex items-center justify-center">
              <div className="w-20 h-1.5 bg-white/10 rounded-full" />
           </div>
           <iframe 
             className="w-full h-[560px] border-0" 
             src={`https://www.tiktok.com/embed/${id}`} 
             allow="autoplay; encrypted-media"
             allowFullScreen 
           />
           <div className="absolute bottom-0 inset-x-0 h-4 bg-slate-900 z-10" />
        </div>
      );
    }

    if (url.includes("instagram.com")) {
      const id = video_id || url.split("/reels/")[1]?.split("/")[0] || url.split("/reel/")[1]?.split("/")[0] || url.split("/p/")[1]?.split("/")[0] || url.split("/").pop()?.split("?")[0];
      return (
        <div className="w-full max-w-[320px] mx-auto overflow-hidden rounded-[2.5rem] border-[8px] border-slate-900 shadow-2xl bg-black relative">
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
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 relative">
      
      {/* 1. RADAR HEADER */}
      <section className="bg-slate-900 rounded-[32px] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute right-[-10%] top-[-20%] size-[500px] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
         <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="space-y-4 text-center lg:text-left max-w-lg">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/5">
                  <Sparkles className="size-3" /> Radar de Viralité v2
               </div>
               <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Radar <span className="text-indigo-400">Outlier</span></h2>
               <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
                  Ne copiez pas les influenceurs. Trouvez les vidéos qui ont percé sans abonnés et récupérez leur formule.
               </p>
            </div>

            <div className="w-full lg:w-[500px] space-y-4">
               <div className="flex flex-col sm:flex-row gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div className="flex-1 flex items-center gap-2 px-2">
                     <LinkIcon className="size-4 text-slate-500" />
                     <input 
                       value={url}
                       onChange={(e) => {
                          setUrl(e.target.value);
                          setFollowers("");
                       }}
                       placeholder="Lien de la vidéo..." 
                       className="w-full bg-transparent text-white border-0 py-3 text-sm focus:ring-0 outline-hidden font-medium placeholder:text-slate-600"
                     />
                  </div>
                  <div className="w-full sm:w-[140px] flex items-center gap-2 px-4 bg-white/5 rounded-xl border border-white/5">
                     <User className="size-3.5 text-slate-500" />
                     <input 
                       value={followers}
                       onChange={(e) => setFollowers(e.target.value)}
                       placeholder="Abonnés..." 
                       className="w-full bg-transparent text-white border-0 py-3 text-xs focus:ring-0 outline-hidden font-bold placeholder:text-slate-600"
                     />
                  </div>
               </div>

               {quotas && (
                  <div className="space-y-2.5 p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner text-white">
                     <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Quota d'Analyses ({quotas.plan})</span>
                        <span className="text-white font-bold">
                           {quotas.monthly_analysis_count} / {quotas.limits.monthlyAnalysis}
                        </span>
                     </div>
                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500 rounded-full"
                           style={{ width: `${Math.min(100, (quotas.monthly_analysis_count / (quotas.limits.monthlyAnalysis || 1)) * 100)}%` }}
                        />
                     </div>
                     <p className="text-[9px] text-slate-400 font-semibold italic flex items-center justify-between">
                        {quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count > 0 
                          ? `Il vous reste ${quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count} scan(s) ce mois-ci.`
                          : "⚠️ Limite d'analyses atteinte !"}
                        {quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count === 0 && (
                          <a href="/settings" className="underline text-indigo-400 hover:text-indigo-300 font-bold ml-1">
                            Mettre à niveau mon plan
                          </a>
                        )}
                     </p>
                  </div>
               )}

               <button 
                 onClick={handleAnalyse}
                 disabled={loading || !url}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl py-5 font-black text-[12px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
               >
                  {loading ? <Loader2 className="size-5 animate-spin" /> : <><Target className="size-5" /> Lancer le Scan Radar</>}
               </button>
            </div>
         </div>
      </section>

      {/* 2. RESULTS */}
      <main className="w-full">
         {selectedAnalysis ? (
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
               
               <div className="grid lg:grid-cols-12 gap-8">
                  {/* Left Column: Visual & Stats */}
                  <div className="lg:col-span-4 space-y-6">
                  <div className="overflow-hidden">
                     {getVideoEmbed(selectedAnalysis)}
                  </div>

                     <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-8 relative overflow-hidden">
                        <div className="absolute -bottom-10 -right-10 size-40 bg-indigo-600/20 blur-3xl" />
                        
                        {/* Stats Panel */}
                        <div className="space-y-6 relative z-10">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stats Performance</span>
                              <Target className="size-4 text-indigo-400" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Vues</p>
                                 <p className="text-xl font-black">{formatNumber(selectedAnalysis.views || 0)}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Abonnés</p>
                                 <p className="text-xl font-black">{formatNumber(selectedAnalysis.followers || 0)}</p>
                              </div>
                           </div>
                        </div>

                        {/* Outlier Panel */}
                        <div className="pt-6 border-t border-white/5 space-y-4 relative z-10">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Outlier</span>
                              <Zap className="size-4 text-amber-400 fill-amber-400" />
                           </div>
                           <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-black italic text-white">x{selectedAnalysis.outlier_score}</span>
                              <span className="text-xs font-bold text-indigo-400 uppercase tracking-tighter">vs Moyenne</span>
                           </div>
                           <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                              Cette vidéo a généré {selectedAnalysis.outlier_score} fois plus de vues que le nombre d'abonnés du créateur.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: AI Analysis */}
                  <div className="lg:col-span-8 space-y-6">
                     <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] bg-white overflow-hidden border border-slate-50">
                        <CardContent className="p-8 md:p-12 space-y-12">
                           
                           <div className="flex items-center justify-between flex-wrap gap-4">
                              <div className="space-y-1">
                                 <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedAnalysis.title}</h1>
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{selectedAnalysis.niche}</span>
                                    <span className="text-xs font-bold text-slate-400">• Analysé par ViralMind IA</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-[22px] border border-slate-100">
                                 <select 
                                   value={targetCollection}
                                   onChange={(e) => setTargetCollection(e.target.value)}
                                   className="bg-transparent border-0 text-[11px] font-black uppercase tracking-widest text-slate-500 focus:ring-0 cursor-pointer pl-4 pr-8"
                                 >
                                    {workspaces.map(ws => (
                                      <option key={ws.slug} value={ws.slug}>{ws.name}</option>
                                    ))}
                                 </select>
                                 <button 
                                   onClick={handleSaveVideo}
                                   className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm"
                                 >
                                    <Bookmark className="size-4" /> Enregistrer
                                 </button>
                                 <button 
                                   onClick={handleRemix}
                                   className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-xl"
                                 >
                                    <Sparkles className="size-4" /> Remixer
                                 </button>
                              </div>
                           </div>

                           <section className="space-y-6">
                              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                 <Target className="size-4 text-indigo-500" /> Formule du Hook
                              </h3>
                              <div className="p-8 bg-slate-50 rounded-[24px] border border-slate-100 text-slate-800 font-bold text-xl md:text-2xl leading-tight">
                                 "{selectedAnalysis.hook}"
                              </div>
                           </section>

                           <div className="flex flex-col gap-4">
                              {/* Section Psychologie */}
                              <button 
                                onClick={() => setShowPsychologyModal(true)}
                                className="w-full flex items-center justify-between p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group text-left"
                              >
                                 <div className="flex items-center gap-5">
                                    <div className="size-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                       <Sparkles className="size-6" />
                                    </div>
                                    <div>
                                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Psychologie Virale</h3>
                                       <p className="text-[11px] text-slate-400 font-medium">Découvrez les déclencheurs cognitifs utilisés.</p>
                                    </div>
                                 </div>
                                 <div className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                    <ArrowRight className="size-5" />
                                 </div>
                              </button>

                              {/* Section Pacing & Rétention */}
                              <button 
                                onClick={() => setShowRetentionModal(true)}
                                className="w-full flex items-center justify-between p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group text-left"
                              >
                                 <div className="flex items-center gap-5">
                                    <div className="size-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                       <Layout className="size-6" />
                                    </div>
                                    <div>
                                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Pacing & Rétention</h3>
                                       <p className="text-[11px] text-slate-400 font-medium">Analyse du rythme et de la structure narrative.</p>
                                    </div>
                                 </div>
                                 <div className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                    <ArrowRight className="size-5" />
                                 </div>
                              </button>

                              <div className="flex gap-4 pt-4">
                                 <button 
                                   onClick={() => setShowTranscript(true)}
                                   className="flex-1 h-16 bg-slate-50 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
                                 >
                                    <FileText className="size-4" /> Voir la Transcription
                                 </button>
                                 <button 
                                   onClick={() => window.open(selectedAnalysis.url, '_blank')}
                                   className="h-16 w-16 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
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
            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[40px] bg-white text-center space-y-8">
               <div className="relative">
                  <div className="size-24 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                     <Target className="size-12" />
                  </div>
                  <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-full animate-pulse" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">Scan Radar Prêt</h3>
                  <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto">
                     Collez l'URL d'une vidéo virale pour décomposer ses mécanismes de rétention.
                  </p>
               </div>
            </div>
         )}
      </main>

      {/* MODALS (Identical to previous version) */}
      {showPsychologyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <Card className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                       <Sparkles className="size-6" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Psychologie Virale</h3>
                 </div>
                 <button onClick={() => setShowPsychologyModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="size-6 text-slate-400" />
                 </button>
              </div>
              <div className="p-10 space-y-4">
                 <p className="text-slate-500 font-medium mb-6">Voici les mécanismes psychologiques détectés dans cette vidéo :</p>
                 <div className="flex flex-wrap gap-3">
                    {(selectedAnalysis.patterns || []).map((p: string) => (
                       <div key={p} className="px-6 py-4 bg-slate-50 text-slate-700 rounded-2xl text-sm font-semibold border border-slate-100 shadow-xs">
                          {p}
                       </div>
                    ))}
                 </div>
              </div>
              <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex justify-end">
                 <button onClick={() => setShowPsychologyModal(false)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest">Fermer</button>
              </div>
           </Card>
        </div>
      )}

      {showRetentionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <Card className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                       <Layout className="size-6" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Pacing & Rétention</h3>
                 </div>
                 <button onClick={() => setShowRetentionModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="size-6 text-slate-400" />
                 </button>
              </div>
              <div className="p-10 space-y-4 max-h-[60vh] overflow-y-auto">
                 <div className="space-y-4">
                    {Object.entries(selectedAnalysis.structure || {}).map(([key, value]: [string, any]) => (
                       <div key={key} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                          <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{key}</div>
                          <p className="text-slate-700 font-bold leading-relaxed">{value}</p>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex justify-end">
                 <button onClick={() => setShowRetentionModal(false)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest">Fermer</button>
              </div>
           </Card>
        </div>
      )}

      {showTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <Card className="w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                       <FileText className="size-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight">Transcription Intégrale</h3>
                       <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Générée par ViralMind IA</p>
                    </div>
                 </div>
                 <button onClick={() => setShowTranscript(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="size-6 text-slate-400" />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 md:p-16 text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                 {selectedAnalysis?.transcript || "Aucune transcription disponible pour cette vidéo."}
              </div>
              <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-4">
                 <button onClick={handleCopy} className={`px-10 py-5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-xl'}`}>
                    {copied ? <><Check className="size-5" /> Copié !</> : <><Copy className="size-5" /> Copier le texte</>}
                 </button>
              </div>
           </Card>
        </div>
      )}
    </div>
  )
}
