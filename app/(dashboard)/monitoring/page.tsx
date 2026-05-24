"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { 
  Eye, 
  Plus, 
  Trash2, 
  Loader2, 
  ExternalLink, 
  TrendingUp, 
  Users, 
  Video,
  PlayCircle,
  Clock,
  Zap,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Lightbulb,
  Flame,
  Award,
  ArrowRight,
  Target
} from "lucide-react"

export default function MonitoringPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null)
  const [outliers, setOutliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditStatus, setAuditStatus] = useState("")
  const [auditStep, setAuditStep] = useState(0)
  const [activeTab, setActiveTab] = useState<"outliers" | "audit">("outliers")
  
  // Form states
  const [handle, setHandle] = useState("")
  const [platform, setPlatform] = useState("instagram")
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false)

  const getStepIcon = (step: number) => {
    switch (step) {
      case 0:
        return <Eye className="size-4 text-indigo-600 shrink-0" />
      case 1:
        return <Video className="size-4 text-indigo-600 shrink-0" />
      case 2:
        return <TrendingUp className="size-4 text-indigo-600 shrink-0" />
      case 3:
        return <Target className="size-4 text-indigo-600 shrink-0" />
      case 4:
        return <Sparkles className="size-4 text-indigo-600 shrink-0 animate-pulse" />
      default:
        return <Loader2 className="size-4 text-indigo-600 shrink-0 animate-spin" />
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("monitored_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setAccounts(data)
      // Sélectionner automatiquement le premier compte par défaut s'il y en a un
      if (data.length > 0 && !selectedAccount) {
        handleSelectAccount(data[0])
      }
    }
    setLoading(false)
  }

  const handleSelectAccount = async (account: any) => {
    setSelectedAccount(account)
    setLoading(true)

    // Charger les outliers de ce compte spécifique
    const { data: outRes } = await supabase
      .from("detected_outliers")
      .select("*")
      .eq("account_id", account.id)
      .order("views", { ascending: false })

    setOutliers(outRes || [])
    setLoading(false)
  }

  const handleAuditCompetitor = async (force = false) => {
    if (!handle) {
      toast.error("Veuillez entrer un lien ou un pseudo")
      return
    }

    // Extraction intelligente du pseudo depuis une URL ou un @pseudo
    let cleanHandle = handle.trim();
    if (cleanHandle.includes("/")) {
      const parts = cleanHandle.split("/").filter(p => p.length > 0);
      let lastPart = parts[parts.length - 1];
      if (lastPart.includes("?")) lastPart = lastPart.split("?")[0];
      cleanHandle = lastPart.replace("@", "");
    } else {
      cleanHandle = cleanHandle.replace("@", "");
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Veuillez vous connecter pour réaliser un audit.")
      return
    }

    setAuditLoading(true)
    setAuditStep(0)
    
    // Simulation d'états de progression pour un effet visuel premium (sans emojis)
    const steps = [
      "Analyse de l'existence du profil...",
      "Scraping des 10 dernières publications...",
      "Calcul de la médiane des vues...",
      "Identification des vidéos Outliers...",
      "Génération du rapport stratégique par Gemini IA..."
    ];
    
    let currentStep = 0;
    setAuditStatus(steps[0]);
    const statusInterval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setAuditStep(currentStep);
        setAuditStatus(steps[currentStep]);
      }
    }, 2800);

    try {
      const res = await fetch("/api/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          handle: cleanHandle, 
          platform, 
          userId: user.id,
          forceRefresh: force
        })
      });
      
      const data = await res.json();
      clearInterval(statusInterval);

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(data.cached ? "Audit chargé depuis le cache !" : "Audit complet réalisé avec succès !");
      setHandle("");
      
      // Mettre à jour la liste des concurrents
      await fetchAccounts();
      
      // Sélectionner le concurrent audité
      if (data.account) {
        setSelectedAccount(data.account);
        setOutliers(data.outliers || []);
      }
    } catch (error: any) {
      clearInterval(statusInterval);
      toast.error("Erreur lors de l'audit : " + error.message);
    } finally {
      setAuditLoading(false);
      setAuditStatus("");
    }
  }

  const handleDeleteAccount = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { error } = await supabase
      .from("monitored_accounts")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error("Erreur de suppression")
    } else {
      toast.success("Concurrent retiré de la liste")
      if (selectedAccount?.id === id) {
        setSelectedAccount(null)
        setOutliers([])
      }
      fetchAccounts()
    }
  }

  const formatNumber = (num: number) => {
    if (!num) return "0"
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "k"
    return num.toString()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 relative">
      
      {/* 1. HEADER & FORMULAIRE */}
      <section className="bg-slate-900 rounded-[32px] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute right-[-10%] top-[-20%] size-[500px] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
         <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="space-y-4 text-center lg:text-left max-w-lg">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/5">
                  <Zap className="size-3" /> Audit Instantané
               </div>
               <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Radar de <span className="text-indigo-400">Compétition</span></h2>
               <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
                  Saisissez le profil d'un concurrent pour obtenir instantanément ses outliers de croissance et son rapport d'audit IA.
               </p>
            </div>

            <div className="w-full lg:w-[500px] space-y-4">
               <div className="flex flex-col sm:flex-row gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
                  {/* Custom Platform Selector Dropdown */}
                  <div className="relative shrink-0 select-none">
                     <button
                       type="button"
                       onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                       className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-xs font-bold text-white min-w-[130px] cursor-pointer hover:bg-white/10 transition-all active:scale-[0.98]"
                     >
                       <span className="capitalize">{platform}</span>
                       <ChevronDown className={`size-3.5 text-slate-400 transition-transform duration-200 ${isPlatformDropdownOpen ? 'rotate-180' : ''}`} />
                     </button>

                     {isPlatformDropdownOpen && (
                       <>
                         {/* Backdrop to close dropdown on click outside */}
                         <div 
                           className="fixed inset-0 z-40" 
                           onClick={() => setIsPlatformDropdownOpen(false)}
                         />
                         {/* Dropdown Options List */}
                         <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl py-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                           {[
                             { id: "instagram", name: "Instagram" },
                             { id: "tiktok", name: "TikTok" },
                             { id: "youtube", name: "YouTube" }
                           ].map((opt) => (
                             <button
                               key={opt.id}
                               type="button"
                               onClick={() => {
                                 setPlatform(opt.id)
                                 setIsPlatformDropdownOpen(false)
                               }}
                               className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between ${
                                 platform === opt.id 
                                   ? 'bg-indigo-600 text-white' 
                                   : 'text-slate-300 hover:bg-white/5 hover:text-white'
                               }`}
                             >
                               {opt.name}
                             </button>
                           ))}
                         </div>
                       </>
                     )}
                  </div>

                  <div className="flex-1 flex items-center gap-2 px-2">
                     <input 
                       value={handle}
                       onChange={(e) => {
                         const val = e.target.value;
                         setHandle(val);
                         if (val.includes("tiktok.com")) setPlatform("tiktok");
                         else if (val.includes("instagram.com")) setPlatform("instagram");
                         else if (val.includes("youtube.com") || val.includes("youtu.be")) setPlatform("youtube");
                       }}
                       placeholder="Pseudo ou lien du concurrent..." 
                       className="w-full bg-transparent text-white border-0 py-3 text-sm focus:ring-0 outline-hidden font-medium placeholder:text-slate-600"
                     />
                  </div>
               </div>
               <button 
                 onClick={() => handleAuditCompetitor(false)}
                 disabled={auditLoading || !handle}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl py-5 font-black text-[12px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
               >
                  {auditLoading ? <Loader2 className="size-5 animate-spin" /> : <><Sparkles className="size-5" /> Lancer l'Audit</>}
               </button>
            </div>
         </div>
      </section>

      {/* 2. LOADING STATE POUR L'AUDIT TEMPS RÉEL */}
      {auditLoading && (
        <section className="bg-white border border-slate-100 rounded-[32px] p-16 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-500 shadow-xl shadow-slate-100/50">
           <div className="relative">
              <div className="size-28 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin flex items-center justify-center">
                 <Sparkles className="size-8 text-indigo-600 animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full" />
           </div>
           <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Audit en cours...</h3>
              <div className="inline-flex items-center gap-2.5 text-slate-500 font-bold text-sm uppercase tracking-widest bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100/50 animate-pulse text-indigo-600">
                 {getStepIcon(auditStep)}
                 <span>{auditStatus || "Connexion au profil du concurrent..."}</span>
              </div>
           </div>
           <p className="text-slate-400 font-medium text-xs max-w-sm">
              Cela prend généralement 10 à 15 secondes selon les quotas d'API et la taille du profil. Merci de patienter.
           </p>
        </section>
      )}

      {/* 3. CORE CORE WORKSPACE (Sidebar & Details Panels) */}
      {!auditLoading && (
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Left: History Sidebar */}
          <div className="lg:col-span-1 space-y-6">
             <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Concurrents audités</p>
                <span className="size-2.5 rounded-full bg-indigo-600 shadow-lg shadow-indigo-600/50" />
             </div>

             <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {accounts.map((acc) => {
                  const isSelected = selectedAccount?.id === acc.id;
                  return (
                    <div 
                      key={acc.id} 
                      onClick={() => handleSelectAccount(acc)}
                      className={`group p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10' 
                          : 'bg-white border-slate-100 text-slate-900 hover:bg-slate-50 hover:shadow-md'
                      }`}
                    >
                       <div className="flex items-center gap-3 min-w-0">
                          <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/10' : 'bg-slate-50'}`}>
                             <Video className={`size-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                          </div>
                          <div className="min-w-0">
                             <p className="text-sm font-bold truncate leading-tight">@{acc.handle}</p>
                             <p className={`text-[9px] font-black uppercase tracking-tighter capitalize ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`}>{acc.platform}</p>
                          </div>
                       </div>
                       <button 
                         onClick={(e) => handleDeleteAccount(acc.id, e)}
                         className={`p-1.5 rounded-lg transition-colors ${
                           isSelected 
                             ? 'text-white/40 hover:text-rose-400 hover:bg-white/5' 
                             : 'text-slate-200 hover:text-rose-500 hover:bg-slate-50 opacity-0 group-hover:opacity-100'
                         }`}
                         title="Supprimer l'audit"
                       >
                          <Trash2 className="size-4" />
                       </button>
                    </div>
                  )
                })}
                {accounts.length === 0 && (
                  <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                     <p className="text-xs font-bold text-slate-400 italic">Aucun concurrent audité</p>
                  </div>
                )}
             </div>
          </div>

          {/* Right: Selected Competitor Audit Board */}
          <div className="lg:col-span-3">
             {loading ? (
                <div className="h-96 flex flex-col items-center justify-center bg-white border border-slate-50 rounded-[32px]">
                   <Loader2 className="size-8 text-indigo-500 animate-spin" />
                   <p className="mt-3 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement de l'audit...</p>
                </div>
             ) : !selectedAccount ? (
                <div className="bg-white border border-slate-100 rounded-[32px] p-24 flex flex-col items-center justify-center text-center space-y-6">
                   <div className="size-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
                      <Target className="size-10" />
                   </div>
                   <div className="max-w-sm space-y-2">
                      <h3 className="text-xl font-bold text-slate-900">Aucun concurrent sélectionné</h3>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">
                         Entrez un pseudo ci-dessus pour lancer un audit instantané ou sélectionnez-en un dans la liste historique.
                      </p>
                   </div>
                </div>
             ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                   
                   {/* COMPETITOR METRICS OVERVIEW */}
                   <div className="bg-slate-900 text-white rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
                      <div className="absolute right-[-10%] bottom-[-20%] size-60 bg-indigo-600/20 blur-3xl rounded-full" />
                      
                      <div className="space-y-3 relative z-10">
                         <div className="flex items-center gap-3">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight">@{selectedAccount.handle}</h2>
                            <span className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-400/20">
                               {selectedAccount.platform}
                            </span>
                         </div>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            Dernier audit réalisé le {new Date(selectedAccount.last_scanned_at).toLocaleDateString()}
                         </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 relative z-10 w-full md:w-auto">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Abonnés</p>
                            <div className="flex items-center gap-1.5 text-white">
                               <Users className="size-4 text-indigo-400" />
                               <span className="text-xl font-black">{formatNumber(selectedAccount.followers_count)}</span>
                            </div>
                         </div>
                         
                         <div className="w-px h-8 bg-white/10 hidden sm:block" />

                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vues Médianes</p>
                            <div className="flex items-center gap-1.5 text-white">
                               <TrendingUp className="size-4 text-emerald-400" />
                               <span className="text-xl font-black">{formatNumber(selectedAccount.median_views)}</span>
                            </div>
                         </div>

                         <div className="w-px h-8 bg-white/10 hidden sm:block" />

                         <button 
                           onClick={() => {
                             setHandle(`@${selectedAccount.handle}`);
                             setPlatform(selectedAccount.platform);
                             handleAuditCompetitor(true);
                           }}
                           className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer group active:scale-95 ml-auto md:ml-0"
                           title="Rafraîchir l'audit en direct"
                         >
                            <RefreshCw className="size-5 group-hover:rotate-180 transition-transform duration-700" />
                         </button>
                      </div>
                   </div>

                   {/* NAVIGATION TABS */}
                   <div className="flex items-center border-b border-slate-100 gap-8">
                      <button 
                        onClick={() => setActiveTab("outliers")}
                        className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 ${
                          activeTab === 'outliers' 
                            ? 'border-slate-900 text-slate-900' 
                            : 'border-transparent text-slate-300 hover:text-slate-400'
                        }`}
                      >
                         <Flame className="size-4" /> Vidéos Outliers ({outliers.length})
                      </button>
                      <button 
                        onClick={() => setActiveTab("audit")}
                        className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 ${
                          activeTab === 'audit' 
                            ? 'border-slate-900 text-slate-900' 
                            : 'border-transparent text-slate-300 hover:text-slate-400'
                        }`}
                      >
                         <Sparkles className="size-4" /> Rapport d'Audit IA (Gemini)
                      </button>
                   </div>

                   {/* TAB CONTENTS */}
                   <main className="w-full">
                      {activeTab === "outliers" ? (
                         <div className="space-y-6">
                            {outliers.length === 0 ? (
                               <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-20 flex flex-col items-center justify-center text-center space-y-4">
                                  <div className="size-16 rounded-2xl bg-white flex items-center justify-center text-slate-300 border border-slate-100">
                                     <PlayCircle className="size-8" />
                                  </div>
                                  <div className="max-w-xs space-y-1">
                                     <p className="text-base font-bold text-slate-900">Aucun outlier extrême détecté</p>
                                     <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                        Les publications récentes de ce créateur respectent ses moyennes de vues habituelles. Aucun pic organique exceptionnel détecté pour le moment.
                                     </p>
                                  </div>
                               </div>
                            ) : (
                               <div className="grid md:grid-cols-2 gap-6">
                                  {outliers.map((out) => (
                                    <div key={out.id} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                                       <div className="aspect-video bg-slate-100 relative overflow-hidden shrink-0">
                                          {out.thumbnail ? (
                                            <img src={out.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                               <PlayCircle className="size-12" />
                                            </div>
                                          )}
                                          <div className="absolute top-4 left-4 flex items-center gap-2">
                                             <div className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1.5 shadow-lg">
                                                <Zap className="size-3 fill-current" />
                                                x{out.outlier_score || out.outlierScore || 0} OUTLIER
                                             </div>
                                          </div>
                                       </div>
                                       <div className="p-6 space-y-4 flex flex-col flex-1">
                                          <div className="space-y-1">
                                             <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">{out.title || "Vidéo Outlier"}</h3>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-3 pt-2">
                                             <div className="bg-slate-50 rounded-xl p-3">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Vues Réelles</p>
                                                <p className="text-sm font-black text-slate-900">{formatNumber(out.views)}</p>
                                             </div>
                                             <div className="bg-slate-50 rounded-xl p-3">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">VS Moyenne</p>
                                                <p className="text-sm font-black text-indigo-600">+{Math.round(((out.outlier_score || out.outlierScore || 1) - 1) * 100)}%</p>
                                             </div>
                                          </div>

                                          <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                                             <a href={out.video_url || out.url} target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 hover:text-slate-600 transition-colors">
                                                <Clock className="size-3" />
                                                Voir la vidéo <ExternalLink className="size-3" />
                                             </a>
                                             
                                             <button 
                                               onClick={() => router.push(`/analyse?url=${encodeURIComponent(out.video_url || out.url)}`)}
                                               className="text-indigo-600 hover:text-indigo-700 text-[11px] font-black uppercase tracking-widest flex items-center gap-1 transition-all hover:gap-1.5"
                                             >
                                                Disséquer le script <ArrowRight className="size-3.5" />
                                             </button>
                                          </div>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            )}
                         </div>
                      ) : (
                         <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
                            {/* STRATEGY SUMMARY */}
                            <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-[32px] p-8 md:p-10 space-y-4">
                               <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                                     <Award className="size-4" />
                                  </div>
                                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Résumé Stratégique</h4>
                               </div>
                               <p className="text-slate-700 font-bold text-base md:text-lg leading-relaxed italic">
                                  "{selectedAccount.audit_report?.strategy_summary || "Pas de synthèse disponible."}"
                                </p>
                            </div>

                            <div className="grid md:grid-cols-12 gap-8">
                               
                               {/* LEFT COLUMN: PATTERNS AND SECRETS */}
                               <div className="md:col-span-7 space-y-8">
                                  {/* HOOK PATTERNS */}
                                  <div className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 space-y-6">
                                     <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                           <Zap className="size-4" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Accroches Favorites (Hooks)</h4>
                                     </div>
                                     
                                     <div className="space-y-3">
                                        {(selectedAccount.audit_report?.hook_patterns || []).map((pattern: string, i: number) => (
                                          <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                                             <div className="size-6 rounded-lg bg-white border border-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                                                {i+1}
                                             </div>
                                             <span className="text-xs font-bold text-slate-600 leading-relaxed">{pattern}</span>
                                          </div>
                                        ))}
                                        {(selectedAccount.audit_report?.hook_patterns || []).length === 0 && (
                                          <p className="text-xs text-slate-400 italic">Aucun pattern d'accroche identifié.</p>
                                        )}
                                     </div>
                                  </div>

                                  {/* RETENTION SECRETS */}
                                  <div className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 space-y-4">
                                     <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                                           <Lightbulb className="size-4" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Secrets de Rétention</h4>
                                     </div>
                                     <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedAccount.audit_report?.retention_secrets || "Aucun secret de rétention documenté."}
                                     </p>
                                  </div>
                               </div>

                               {/* RIGHT COLUMN: ACTION PLAN */}
                               <div className="md:col-span-5">
                                  <div className="bg-slate-900 text-white rounded-[32px] p-8 md:p-10 space-y-6 relative overflow-hidden shadow-2xl h-full">
                                     <div className="absolute top-0 right-0 size-40 bg-indigo-600/10 blur-3xl rounded-full" />
                                     
                                     <div className="flex items-center gap-3 relative z-10">
                                        <div className="size-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                                           <Sparkles className="size-4" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Plan pour le dépasser</h4>
                                     </div>

                                     <div className="space-y-6 relative z-10">
                                        {(selectedAccount.audit_report?.action_plan || []).map((step: string, i: number) => (
                                          <div key={i} className="flex gap-4 items-start">
                                             <div className="size-7 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-[11px] flex items-center justify-center shrink-0 shadow-inner">
                                                {i+1}
                                             </div>
                                             <div className="space-y-1">
                                                <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                                                   {step}
                                                </p>
                                             </div>
                                          </div>
                                        ))}
                                        {(selectedAccount.audit_report?.action_plan || []).length === 0 && (
                                           <p className="text-xs text-slate-400 italic">Aucune recommandation disponible.</p>
                                        )}
                                     </div>
                                  </div>
                               </div>

                            </div>
                         </div>
                      )}
                   </main>

                </div>
             )}
          </div>

        </div>
      )}

    </div>
  )
}
