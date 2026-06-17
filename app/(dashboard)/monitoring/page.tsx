"use client"

import { useState, useEffect } from "react"
import { useWorkspace } from "@/lib/workspace-context"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
  Target,
  CheckCircle2
} from "lucide-react"

const getPlatformBadge = (platform: string) => {
  switch (platform?.toLowerCase()) {
    case "instagram":
      return (
        <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
          Instagram
        </span>
      )
    case "tiktok":
      return (
        <span className="bg-slate-950 text-white border border-cyan-500/30 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm inline-flex items-center gap-1.5 leading-none">
          <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          TikTok
        </span>
      )
    case "youtube":
      return (
        <span className="bg-red-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
          YouTube
        </span>
      )
    default:
      return (
        <span className="bg-violet-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
          {platform}
        </span>
      )
  }
}

export default function MonitoringPage() {
  const { activeCollection } = useWorkspace()
  const router = useRouter()
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null)
  const [outliers, setOutliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditStatus, setAuditStatus] = useState("")
  const [auditStep, setAuditStep] = useState(0)
  const [activeTab, setActiveTab] = useState<"outliers" | "audit">("outliers")
  const [checkingPlan, setCheckingPlan] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})
  
  // Form states
  const [handle, setHandle] = useState("")
  const [platform, setPlatform] = useState("instagram")
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false)

  const getStepIcon = (step: number) => {
    switch (step) {
      case 0:
        return <Eye className="size-4 text-violet-500 shrink-0" />
      case 1:
        return <Video className="size-4 text-violet-500 shrink-0" />
      case 2:
        return <TrendingUp className="size-4 text-violet-500 shrink-0" />
      case 3:
        return <Target className="size-4 text-violet-500 shrink-0" />
      case 4:
        return <Sparkles className="size-4 text-violet-500 shrink-0 animate-pulse" />
      default:
        return <Loader2 className="size-4 text-violet-500 shrink-0 animate-spin" />
    }
  }

  useEffect(() => {
    const verifyPlan = async () => {
      try {
        const res = await fetch("/api/user/quotas")
        const data = await res.json()
        if (!data.error) {
          const plan = data.plan?.toLowerCase() || "free"
          if (plan === "free" || plan === "pro") {
            setIsLocked(true)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setCheckingPlan(false)
      }
    }
    verifyPlan()
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [activeCollection])

  const fetchAccounts = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from("monitored_accounts")
      .select("*")
      .eq("user_id", user.id)

    if (activeCollection && activeCollection !== "General") {
      query = query.eq("collection_name", activeCollection)
    } else {
      query = query.or("collection_name.eq.General,collection_name.is.null")
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (!error && data) {
      setAccounts(data)
      if (data.length > 0) {
        handleSelectAccount(data[0])
      } else {
        setSelectedAccount(null)
        setOutliers([])
      }
    } else {
      setAccounts([])
      setSelectedAccount(null)
      setOutliers([])
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
          forceRefresh: force,
          collectionName: activeCollection
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

  if (checkingPlan) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 text-violet-500 animate-spin" />
        <p className="text-gray-400 dark:text-gray-500 font-medium">Chargement de la page...</p>
      </div>
    )
  }

  if (isLocked) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-xl text-center space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="size-16 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-sm border border-violet-100 dark:border-violet-500/20">
          <Sparkles className="size-8 animate-pulse text-violet-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fonctionnalité Premium</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-xs leading-relaxed">
            Cette fonctionnalité exclusive nécessite un plan <strong>Visionary</strong> ou <strong>Titan</strong> pour être débloquée.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-600 dark:text-gray-300 leading-normal text-left space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-violet-500 shrink-0" />
            <span>Surveillance radar automatique 24h/24</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-violet-500 shrink-0" />
            <span>Audit instantané des comptes concurrents</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-violet-500 shrink-0" />
            <span>Extraction automatique des vidéos outliers</span>
          </div>
        </div>

        <Link 
          href="/settings?tab=Abonnement"
          className="block w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md"
        >
          Débloquer maintenant
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 relative">
      
      {/* 1. HEADER & FORMULAIRE */}
      <section className="bg-gray-900 dark:bg-gray-800/40 border border-gray-800 dark:border-gray-700/60 rounded-2xl p-8 md:p-14 text-white relative overflow-hidden shadow-xl">
         <div className="absolute right-[-10%] top-[-20%] size-[500px] bg-violet-600/20 blur-[120px] rounded-full animate-pulse" />
         <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="space-y-4 text-center lg:text-left max-w-lg">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 text-violet-400 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/5">
                  <Zap className="size-3" /> Audit Instantané
               </div>
               <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">Radar de <span className="text-violet-400">Compétition</span></h2>
               <p className="text-gray-400 text-sm md:text-base font-medium leading-relaxed">
                  Saisissez le profil d'un concurrent pour obtenir instantanément ses outliers de croissance et son rapport d'audit IA.
               </p>
            </div>

            <div className="w-full lg:w-[500px] space-y-4">
               <div className="flex flex-col sm:flex-row gap-3 bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-md">
                  {/* Custom Platform Selector Dropdown */}
                  <div className="relative shrink-0 select-none">
                     <button
                       type="button"
                       onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                       className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg px-4 py-3.5 text-xs font-bold text-white min-w-[130px] cursor-pointer hover:bg-white/10 transition-all active:scale-[0.98]"
                     >
                       <span className="capitalize">{platform}</span>
                       <ChevronDown className={`size-3.5 text-gray-400 transition-transform duration-200 ${isPlatformDropdownOpen ? 'rotate-180' : ''}`} />
                     </button>

                     {isPlatformDropdownOpen && (
                       <>
                         {/* Backdrop to close dropdown on click outside */}
                         <div 
                           className="fixed inset-0 z-40" 
                           onClick={() => setIsPlatformDropdownOpen(false)}
                         />
                         {/* Dropdown Options List */}
                         <div className="absolute left-0 right-0 mt-2 bg-gray-900 dark:bg-gray-800 border border-gray-700/60 rounded-xl py-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
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
                                   ? 'bg-violet-600 text-white' 
                                   : 'text-gray-300 hover:bg-white/5 hover:text-white'
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
                       className="w-full bg-transparent text-white border-0 py-3 text-sm focus:ring-0 outline-hidden font-medium placeholder:text-gray-500"
                     />
                  </div>
               </div>
               <button 
                 onClick={() => handleAuditCompetitor(false)}
                 disabled={auditLoading || !handle}
                 className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl py-5 font-bold text-[12px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-md active:scale-[0.98]"
               >
                  {auditLoading ? <Loader2 className="size-5 animate-spin" /> : <><Sparkles className="size-5" /> Lancer l'Audit</>}
               </button>
            </div>
         </div>
      </section>

      {/* 2. LOADING STATE POUR L'AUDIT TEMPS RÉEL */}
      {auditLoading && (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-500 shadow-sm">
           <div className="relative">
              <div className="size-28 rounded-full border-4 border-violet-100 dark:border-violet-950 border-t-violet-600 dark:border-t-violet-450 animate-spin flex items-center justify-center shadow-lg shadow-violet-500/10">
                 <Sparkles className="size-8 text-violet-600 dark:text-violet-400 animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-violet-500/5 blur-3xl rounded-full" />
           </div>
           <div className="space-y-3">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Audit en cours...</h3>
              <div className="inline-flex items-center gap-2.5 text-violet-600 dark:text-violet-400 font-bold text-sm uppercase tracking-widest bg-gray-50 dark:bg-gray-900 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700/60 animate-pulse">
                 {getStepIcon(auditStep)}
                 <span>{auditStatus || "Connexion au profil du concurrent..."}</span>
              </div>
           </div>
           <p className="text-gray-400 dark:text-gray-500 font-medium text-xs max-w-sm">
              Cela prend généralement 10 à 15 secondes selon les quotas d'API et la taille du profil. Merci de patienter.
           </p>
        </section>
      )}

      {/* 3. CORE WORKSPACE (Sidebar & Details Panels) */}
      {!auditLoading && (
        <div className="space-y-4">
          
          {/* Mobile toggle button for audited competitors list */}
          <div className="flex justify-end lg:hidden">
             <button
               onClick={() => setShowHistory(!showHistory)}
               className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-sm"
             >
                <Users className="size-4 text-gray-500 dark:text-gray-400" />
                <span>{showHistory ? "Masquer Liste" : "Liste Concurrents"}</span>
             </button>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            
            {/* Left: History Sidebar */}
            <div className={`lg:col-span-1 space-y-6 ${showHistory ? 'block' : 'hidden lg:block'}`}>
             <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Concurrents audités</p>
                <span className="size-2.5 rounded-full bg-violet-600 shadow-sm" />
             </div>

             <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {accounts.map((acc) => {
                  const isSelected = selectedAccount?.id === acc.id;
                  const isTikTok = acc.platform?.toLowerCase() === "tiktok";
                  const isInstagram = acc.platform?.toLowerCase() === "instagram";
                  const isYouTube = acc.platform?.toLowerCase() === "youtube";
                  
                  return (
                    <div 
                      key={acc.id} 
                      onClick={() => handleSelectAccount(acc)}
                      className={`group p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-violet-500/10 border-violet-500/40 text-violet-900 dark:text-violet-100 shadow-md ring-1 ring-violet-500/20' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-750 hover:shadow-sm'
                      }`}
                    >
                       <div className="flex items-center gap-3 min-w-0">
                          <div className={`size-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 ${
                             isSelected 
                               ? 'bg-violet-500/20 text-violet-500' 
                               : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors'
                           }`}>
                              {acc.avatar_url ? (
                                <img 
                                  src={acc.avatar_url} 
                                  alt={`@${acc.handle}`} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                      const svg = parent.querySelector("svg");
                                      if (svg) svg.style.display = "block";
                                    }
                                  }}
                                />
                              ) : null}
                              <Video className="size-4" style={{ display: acc.avatar_url ? "none" : "block" }} />
                           </div>
                          <div className="min-w-0">
                             <p className={`text-sm font-bold truncate leading-tight ${
                               isSelected ? 'text-violet-900 dark:text-violet-100' : 'text-gray-900 dark:text-gray-150'
                             }`}>@{acc.handle}</p>
                             <p className={`text-[9px] font-extrabold uppercase tracking-widest ${
                               isSelected 
                                 ? 'text-violet-600 dark:text-violet-400' 
                                 : isTikTok 
                                   ? 'text-cyan-600 dark:text-cyan-400' 
                                   : isInstagram 
                                     ? 'text-pink-600 dark:text-pink-400' 
                                     : isYouTube 
                                       ? 'text-red-600 dark:text-red-400' 
                                       : 'text-gray-400 dark:text-gray-500'
                             }`}>{acc.platform}</p>
                          </div>
                       </div>
                       <button 
                         onClick={(e) => handleDeleteAccount(acc.id, e)}
                         className={`p-1.5 rounded-lg transition-colors ${
                           isSelected 
                             ? 'text-violet-400 dark:text-violet-400 hover:text-rose-500 dark:hover:text-rose-450 hover:bg-violet-500/10' 
                             : 'text-gray-300 dark:text-gray-500 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100'
                         }`}
                         title="Supprimer l'audit"
                       >
                          <Trash2 className="size-4" />
                       </button>
                    </div>
                  )
                })}
                {accounts.length === 0 && (
                  <div className="p-12 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700/60">
                     <p className="text-xs font-bold text-gray-400 dark:text-gray-500 italic">Aucun concurrent audité</p>
                  </div>
                )}
             </div>
          </div>

          {/* Right: Selected Competitor Audit Board */}
          <div className="lg:col-span-3">
             {loading ? (
                <div className="h-96 flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl">
                   <Loader2 className="size-8 text-violet-500 animate-spin" />
                   <p className="mt-3 text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Chargement de l'audit...</p>
                </div>
             ) : !selectedAccount ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-24 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
                   <div className="size-20 rounded-2xl bg-gray-55/50 dark:bg-gray-700/50 flex items-center justify-center text-gray-300 dark:text-gray-600">
                      <Target className="size-10" />
                   </div>
                   <div className="max-w-sm space-y-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Aucun concurrent sélectionné</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                         Entrez un pseudo ci-dessus pour lancer un audit instantané ou sélectionnez-en un dans la liste historique.
                      </p>
                   </div>
                </div>
             ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                   
                   {/* COMPETITOR METRICS OVERVIEW */}
                   <div className="bg-slate-900 dark:bg-gray-800/80 border border-slate-800 dark:border-gray-700/60 text-white rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden shadow-lg backdrop-blur-md">
                      <div className="absolute right-[-10%] bottom-[-20%] size-60 bg-violet-600/20 blur-3xl rounded-full" />
                      
                      <div className="flex items-center gap-4 relative z-10">
                          {selectedAccount.avatar_url && (
                             <img 
                               src={selectedAccount.avatar_url} 
                               alt={selectedAccount.handle} 
                               className="size-16 rounded-full object-cover border-2 border-violet-500/50 shadow-md shrink-0"
                             />
                          )}
                          <div className="space-y-3">
                             <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">@{selectedAccount.handle}</h2>
                                {getPlatformBadge(selectedAccount.platform)}
                             </div>
                             <p className="text-xs text-gray-400 dark:text-gray-400 font-bold uppercase tracking-widest">
                                Dernier audit réalisé le {new Date(selectedAccount.last_scanned_at).toLocaleDateString()}
                             </p>
                          </div>
                       </div>

                      <div className="flex flex-wrap items-center gap-6 relative z-10 w-full md:w-auto">
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Abonnés</p>
                            <div className="flex items-center gap-1.5 text-white">
                               <Users className="size-4 text-violet-400" />
                               <span className="text-xl font-bold">{formatNumber(selectedAccount.followers_count)}</span>
                            </div>
                         </div>
                         
                         <div className="w-px h-8 bg-white/10 hidden sm:block" />

                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Vues Médianes</p>
                            <div className="flex items-center gap-1.5 text-white">
                               <TrendingUp className="size-4 text-emerald-400" />
                               <span className="text-xl font-bold">{formatNumber(selectedAccount.median_views)}</span>
                            </div>
                         </div>

                         <div className="w-px h-8 bg-white/10 hidden sm:block" />

                         <button 
                           onClick={() => {
                             setHandle(`@${selectedAccount.handle}`);
                             setPlatform(selectedAccount.platform);
                             handleAuditCompetitor(true);
                           }}
                           className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 dark:bg-gray-700/50 dark:border-gray-650 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer group active:scale-95 ml-auto md:ml-0"
                           title="Rafraîchir l'audit en direct"
                         >
                            <RefreshCw className="size-5 group-hover:rotate-180 transition-transform duration-700" />
                         </button>
                      </div>
                   </div>

                   {/* NAVIGATION TABS */}
                   <div className="flex items-center border-b border-gray-200 dark:border-gray-700/60 gap-8">
                      <button 
                        onClick={() => setActiveTab("outliers")}
                        className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 ${
                          activeTab === 'outliers' 
                            ? 'border-violet-500 text-violet-500 dark:border-violet-400 dark:text-violet-400' 
                            : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                      >
                         <Flame className="size-4" /> Vidéos Outliers ({outliers.length})
                      </button>
                      <button 
                        onClick={() => setActiveTab("audit")}
                        className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 ${
                          activeTab === 'audit' 
                            ? 'border-violet-500 text-violet-500 dark:border-violet-400 dark:text-violet-400' 
                            : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
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
                               <div className="bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-20 flex flex-col items-center justify-center text-center space-y-4">
                                  <div className="size-16 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-500 border border-gray-200 dark:border-gray-700/60">
                                     <PlayCircle className="size-8" />
                                  </div>
                                  <div className="max-w-xs space-y-1">
                                     <p className="text-base font-bold text-gray-900 dark:text-gray-100">Aucun outlier extrême détecté</p>
                                     <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-relaxed">
                                        Les publications récentes de ce créateur respectent ses moyennes de vues habituelles. Aucun pic organique exceptionnel détecté pour le moment.
                                     </p>
                                  </div>
                               </div>
                            ) : (
                               <div className="grid md:grid-cols-2 gap-6">
                                  {outliers.map((out) => (
                                    <div key={out.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full hover:-translate-y-0.5 duration-300">
                                       <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative overflow-hidden shrink-0">
                                          {out.thumbnail && !failedImages[out.id] ? (
                                            <img 
                                              src={out.thumbnail} 
                                              onError={() => {
                                                setFailedImages(prev => ({ ...prev, [out.id]: true }))
                                              }}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                              alt={out.title || "Vidéo Outlier"} 
                                            />
                                          ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-white p-4 relative overflow-hidden select-none border-b border-white/5">
                                               <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
                                               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-36 bg-violet-600/10 rounded-full blur-2xl animate-pulse" />
                                               
                                               <PlayCircle className="size-10 text-violet-400 relative z-10 animate-bounce duration-1000 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]" />
                                               <span className="text-[9px] font-extrabold uppercase tracking-widest text-violet-400 mt-3 relative z-10 bg-violet-500/15 px-2.5 py-1 rounded-md border border-violet-500/20 backdrop-blur-xs">
                                                 Aperçu Indisponible
                                               </span>
                                            </div>
                                          )}
                                          <div className="absolute top-4 left-4 flex items-center gap-2">
                                             <div className="bg-violet-600 text-white px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 flex items-center gap-1.5 shadow-md">
                                                <Zap className="size-3 fill-current" />
                                                x{out.outlier_score || out.outlierScore || 0} OUTLIER
                                             </div>
                                          </div>
                                       </div>
                                       <div className="p-6 space-y-4 flex flex-col flex-1">
                                          <div className="space-y-1">
                                             <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-snug">{out.title || "Vidéo Outlier"}</h3>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-3 pt-2">
                                             <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mb-0.5">Vues Réelles</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatNumber(out.views)}</p>
                                             </div>
                                             <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mb-0.5">VS Moyenne</p>
                                                <p className="text-sm font-bold text-violet-500 dark:text-violet-400">+{Math.round(((out.outlier_score || out.outlierScore || 1) - 1) * 100)}%</p>
                                             </div>
                                          </div>

                                          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between mt-auto">
                                             <a href={out.video_url || out.url} target="_blank" rel="noreferrer" className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                                <Clock className="size-3" />
                                                Voir la vidéo <ExternalLink className="size-3" />
                                             </a>
                                             
                                             <button 
                                               onClick={() => router.push(`/analyse?url=${encodeURIComponent(out.video_url || out.url)}`)}
                                               className="text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 transition-all hover:gap-1.5"
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
                            <div className="bg-gradient-to-r from-violet-50 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl p-8 md:p-10 space-y-4 relative overflow-hidden">
                               <div className="absolute right-0 top-0 size-40 bg-violet-500/5 blur-2xl rounded-full" />
                               <div className="flex items-center gap-3 relative z-10">
                                  <div className="size-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shadow-md">
                                     <Award className="size-4" />
                                  </div>
                                  <h4 className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Résumé Stratégique</h4>
                               </div>
                               <p className="text-gray-700 dark:text-gray-300 font-bold text-base md:text-lg leading-relaxed italic relative z-10">
                                  "{selectedAccount.audit_report?.strategy_summary || "Pas de synthèse disponible."}"
                                </p>
                            </div>

                            <div className="grid md:grid-cols-12 gap-8">
                               
                               {/* LEFT COLUMN: PATTERNS AND SECRETS */}
                               <div className="md:col-span-7 space-y-8">
                                  {/* HOOK PATTERNS */}
                                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-8 md:p-10 space-y-6">
                                     <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-gray-900 dark:bg-gray-750 text-white flex items-center justify-center">
                                           <Zap className="size-4" />
                                        </div>
                                        <h4 className="text-[10px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Accroches Favorites (Hooks)</h4>
                                     </div>
                                     
                                     <div className="space-y-3">
                                        {(selectedAccount.audit_report?.hook_patterns || []).map((pattern: string, i: number) => (
                                          <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-500/30 transition-colors group">
                                             <div className="size-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm group-hover:bg-violet-500 group-hover:text-white group-hover:border-violet-600 dark:group-hover:border-violet-500 transition-all">
                                                {i+1}
                                             </div>
                                             <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-relaxed">{pattern}</span>
                                          </div>
                                        ))}
                                        {(selectedAccount.audit_report?.hook_patterns || []).length === 0 && (
                                          <p className="text-xs text-gray-400 dark:text-gray-500 italic">Aucun pattern d'accroche identifié.</p>
                                        )}
                                     </div>
                                  </div>

                                  {/* RETENTION SECRETS */}
                                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-8 md:p-10 space-y-4">
                                     <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                           <Lightbulb className="size-4" />
                                        </div>
                                        <h4 className="text-[10px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Secrets de Rétention</h4>
                                     </div>
                                     <p className="text-gray-600 dark:text-gray-300 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedAccount.audit_report?.retention_secrets || "Aucun secret de rétention documenté."}
                                     </p>
                                  </div>
                               </div>

                               {/* RIGHT COLUMN: ACTION PLAN */}
                               <div className="md:col-span-5">
                                  <div className="bg-slate-900 dark:bg-gray-800/80 border border-slate-800 dark:border-gray-700/60 text-white rounded-2xl p-8 md:p-10 space-y-6 relative overflow-hidden shadow-xl h-full backdrop-blur-md">
                                     <div className="absolute top-0 right-0 size-40 bg-violet-600/10 blur-3xl rounded-full" />
                                     
                                     <div className="flex items-center gap-3 relative z-10">
                                        <div className="size-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shadow-md">
                                           <Sparkles className="size-4" />
                                        </div>
                                        <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Plan pour le dépasser</h4>
                                     </div>

                                     <div className="space-y-6 relative z-10">
                                        {(selectedAccount.audit_report?.action_plan || []).map((step: string, i: number) => (
                                          <div key={i} className="flex gap-4 items-start">
                                             <div className="size-7 rounded-full bg-violet-500/20 text-violet-300 font-bold text-[11px] flex items-center justify-center shrink-0 shadow-inner">
                                                {i+1}
                                             </div>
                                             <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-300 leading-relaxed">
                                                   {step}
                                                </p>
                                             </div>
                                          </div>
                                        ))}
                                        {(selectedAccount.audit_report?.action_plan || []).length === 0 && (
                                           <p className="text-xs text-gray-400 dark:text-gray-500 italic">Aucune recommandation disponible.</p>
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
      </div>
      )}

    </div>
  )
}
