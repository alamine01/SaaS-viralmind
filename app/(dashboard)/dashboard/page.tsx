"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { 
  Plus, 
  Eye, 
  Zap, 
  TrendingUp,
  BarChart3,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Video,
  Target
} from "lucide-react"
import Link from "next/link"
import { useWorkspace } from "@/lib/workspace-context"

export default function DashboardPage() {
  const { activeCollection, workspaces, setCreateModalOpen } = useWorkspace()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    totalScripts: 0,
    avgScore: 0,
    recentActivity: [] as any[]
  })
  const [workspaceCounts, setWorkspaceCounts] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(true)

  // QUOTAS STATE
  const [quotas, setQuotas] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // 1. Vidéos scannées pour la collection active
          let vQuery = supabase
            .from("saved_items")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("type", "video")

          if (activeCollection && activeCollection !== "General") {
            vQuery = vQuery.eq("collection_name", activeCollection)
          } else if (activeCollection === "General") {
            vQuery = vQuery.or("collection_name.eq.General,collection_name.is.null")
          }
          const { count: vCount } = await vQuery

          // 2. Scripts rédigés pour la collection active
          let sQuery = supabase
            .from("saved_items")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("type", "script")

          if (activeCollection && activeCollection !== "General") {
            sQuery = sQuery.eq("collection_name", activeCollection)
          } else if (activeCollection === "General") {
            sQuery = sQuery.or("collection_name.eq.General,collection_name.is.null")
          }
          const { count: sCount } = await sQuery

          // 3. Score moyen des vidéos de la collection active
          let scoreQuery = supabase
            .from("saved_items")
            .select("video:video_id(viral_score)")
            .eq("user_id", user.id)
            .eq("type", "video")

          if (activeCollection && activeCollection !== "General") {
            scoreQuery = scoreQuery.eq("collection_name", activeCollection)
          } else if (activeCollection === "General") {
            scoreQuery = scoreQuery.or("collection_name.eq.General,collection_name.is.null")
          }
          const { data: savedVids } = await scoreQuery
          
          let avg = 0
          if (savedVids && savedVids.length > 0) {
            const scores = savedVids
              .map((item: any) => item.video?.viral_score)
              .filter((score: any) => score !== undefined && score !== null)
            avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
          }

          // 4. Activité récente (vidéos de la collection active)
          let recentQuery = supabase
            .from("saved_items")
            .select("*, video:video_id(*)")
            .eq("user_id", user.id)
            .eq("type", "video")
            .order("created_at", { ascending: false })
            .limit(3)

          if (activeCollection && activeCollection !== "General") {
            recentQuery = recentQuery.eq("collection_name", activeCollection)
          } else if (activeCollection === "General") {
            recentQuery = recentQuery.or("collection_name.eq.General,collection_name.is.null")
          }
          const { data: recentSaves } = await recentQuery
          const recentVideos = recentSaves ? recentSaves.map((item: any) => item.video).filter(Boolean) : []

          setStats({
            totalAnalyses: vCount || 0,
            totalScripts: sCount || 0,
            avgScore: avg,
            recentActivity: recentVideos
          })

          // 5. Agrégation des compteurs globaux par collection pour la liste à droite
          const { data: allItems } = await supabase
            .from("saved_items")
            .select("collection_name")
            .eq("user_id", user.id)

          const countsMap: { [key: string]: number } = {}
          if (allItems) {
            allItems.forEach((item: any) => {
              const col = item.collection_name || "General"
              countsMap[col] = (countsMap[col] || 0) + 1
            })
          }
          setWorkspaceCounts(countsMap)

          // Charger les quotas en temps réel
          try {
            const res = await fetch("/api/user/quotas")
            const quotaData = await res.json()
            if (!quotaData.error) {
              setQuotas(quotaData)
            }
          } catch (e) {
            console.error("Failed to load quotas on dashboard:", e)
          }
        }
      } catch (error) {
        console.error("Dashboard error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [activeCollection])

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
           <Loader2 className="size-12 text-violet-500 animate-spin" />
           <div className="absolute inset-0 bg-violet-500/10 blur-xl rounded-full" />
        </div>
        <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Cockpit en cours d'allumage...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-20 w-full">
      
      {/* 1. AGENCY HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative mb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-violet-200 dark:border-violet-500/30">
            <Sparkles className="size-3" /> Dashboard Agency v2
          </div>
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold tracking-tight">
            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500">Center</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-lg text-sm">
            Gérez vos hooks, vos scripts et vos analyses outliers depuis un seul endroit.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 p-2 pr-5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer group">
           <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
              <img src={`https://ui-avatars.com/api/?name=${user?.email}&background=f3f4f6&color=8b5cf6&bold=true`} alt="" className="size-full object-cover dark:hidden" />
              <img src={`https://ui-avatars.com/api/?name=${user?.email}&background=374151&color=a78bfa&bold=true`} alt="" className="size-full object-cover hidden dark:block" />
           </div>
           <div className="flex flex-col">
              <p className="text-[9px] font-bold text-violet-500 uppercase tracking-[0.15em] leading-none mb-1">Plan {quotas?.plan || "Free"}</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-none">{user?.email?.split('@')[0]}</p>
           </div>
        </div>
      </div>
      
      {/* 2. STATS & KEY METRICS (Top Dashboard Information) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         {[
           { 
             title: "Vidéos Analysées", 
             value: stats.totalAnalyses, 
             desc: "Scans Outliers dans ce profil", 
             icon: Video, 
             color: "text-violet-500 bg-violet-100 dark:bg-violet-500/20 border-violet-200 dark:border-violet-500/30",
           },
           { 
             title: "Scripts Rédigés", 
             value: stats.totalScripts, 
             desc: "Scripts générés par l'IA", 
             icon: FileText, 
             color: "text-blue-500 bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30", 
           },
           { 
             title: "Score Viral Moyen", 
             value: `${stats.avgScore}%`, 
             desc: "Performance estimée", 
             icon: Zap, 
             color: "text-amber-500 bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30", 
           },
           { 
             title: "Scans Radar Restants", 
             value: quotas ? (quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count) : 0, 
             desc: `Sur un quota de ${quotas?.limits.monthlyAnalysis || 0}`, 
             icon: Target, 
             color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30", 
           }
         ].map((kpi, i) => (
           <div key={i} className="flex flex-col col-span-1 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700/60 p-5 md:p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                 <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none">{kpi.title}</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">{kpi.value}</h3>
                    <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{kpi.desc}</p>
                 </div>
                 <div className={`size-10 md:size-12 rounded-full border flex items-center justify-center shrink-0 shadow-sm ${kpi.color}`}>
                    <kpi.icon className="size-5 md:size-6" />
                 </div>
              </div>
           </div>
         ))}
      </div>



      {/* 4. PERFORMANCE & ACTIVITY */}
      <div className="grid lg:grid-cols-12 gap-6">
         
         {/* Left Column: Recent Scans */}
         <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-2">
               <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wide">Derniers Scans Radar</h3>
               <Link href="/feed" className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-1 transition-colors">
                  Voir tout le flux <ArrowRight className="size-3" />
               </Link>
            </div>
            
            <div className="space-y-3">
               {stats.recentActivity.map((item, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                     <div className="flex items-center gap-4 sm:gap-0 w-full sm:w-auto">
                        <div className="size-14 sm:size-16 rounded-xl bg-gray-100 dark:bg-gray-700/50 flex flex-col items-center justify-center text-gray-800 dark:text-gray-100 shrink-0 border border-gray-200 dark:border-gray-700/60">
                           <span className="text-lg sm:text-xl font-bold">{Math.round(item.viral_score)}</span>
                           <span className="text-[9px] font-medium uppercase text-gray-500 dark:text-gray-400">Score</span>
                        </div>
                        <div className="flex-1 min-w-0 sm:hidden">
                           <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate mb-1">{item.title}</h4>
                           <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">{item.platform}</span>
                              <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.niche}</span>
                           </div>
                        </div>
                        <Link href={`/analyse?id=${item.id}`} className="size-10 sm:hidden rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700/60 shrink-0">
                           <ArrowRight className="size-4" />
                        </Link>
                     </div>
                     <div className="flex-1 min-w-0 hidden sm:block">
                        <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate mb-1">{item.title}</h4>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">{item.platform}</span>
                           <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                           <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.niche}</span>
                        </div>
                     </div>
                     <Link href={`/analyse?id=${item.id}`} className="hidden sm:flex size-10 rounded-lg bg-gray-50 dark:bg-gray-700/50 items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700/60 shrink-0 transition-colors">
                        <ArrowRight className="size-5" />
                     </Link>
                  </div>
               ))}
            </div>
         </div>

         {/* Right Column: Workspaces & Tips */}
         <div className="lg:col-span-4 space-y-6">

            {quotas && (
               <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl p-5 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                     <h4 className="text-[11px] font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="size-4 text-violet-500" /> Suivi de vos Quotas
                     </h4>
                     <Link href="/settings?tab=Abonnement" className="text-[10px] font-medium text-gray-500 hover:text-violet-500 dark:text-gray-400 dark:hover:text-violet-400 transition-colors">
                        Détails
                     </Link>
                  </div>
                  <div className="space-y-4">
                     {/* Daily Scripts */}
                     <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
                           <span>Scripts du jour</span>
                           <span className="font-bold">{quotas.daily_script_count} / {quotas.limits.dailyScripts === 9999 ? "∞" : quotas.limits.dailyScripts}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-violet-500 transition-all duration-500"
                              style={{ width: `${Math.min(100, (quotas.daily_script_count / (quotas.limits.dailyScripts || 1)) * 100)}%` }}
                           />
                        </div>
                     </div>

                     {/* Monthly Analysis */}
                     <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
                           <span>Analyses de concurrents</span>
                           <span className="font-bold">{quotas.monthly_analysis_count} / {quotas.limits.monthlyAnalysis}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-sky-500 transition-all duration-500"
                              style={{ width: `${Math.min(100, (quotas.monthly_analysis_count / (quotas.limits.monthlyAnalysis || 1)) * 100)}%` }}
                           />
                        </div>
                     </div>
                  </div>
               </div>
            )}

            <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 shadow-sm rounded-xl p-5">
               <div className="flex items-center gap-3 mb-4">
                  <div className="size-8 rounded-lg bg-violet-500 text-white flex items-center justify-center shadow-sm">
                     <Zap className="size-4" />
                  </div>
                  <h4 className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Viral Tip</h4>
               </div>
               <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic text-sm">
                  "Utilisez le Radar Outlier sur des vidéos de moins de 100k vues pour trouver des pépites de rétention inexploitées."
               </p>
            </div>
          </div>
       </div>
    </div>
  )
}
