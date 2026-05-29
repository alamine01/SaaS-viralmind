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
           <Loader2 className="size-12 text-indigo-600 animate-spin" />
           <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cockpit en cours d'allumage...</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20 max-w-7xl mx-auto">
      
      {/* 1. AGENCY HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            <Sparkles className="size-3" /> Dashboard Agency v2
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Center</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-lg text-sm md:text-base">
            Gérez vos hooks, vos scripts et vos analyses outliers depuis un seul endroit.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-xl p-2 pr-5 rounded-full border border-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
           <div className="size-10 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-lg overflow-hidden group-hover:scale-105 transition-transform">
              <img src={`https://ui-avatars.com/api/?name=${user?.email}&background=0f172a&color=818cf8&bold=true`} alt="" className="size-full object-cover" />
           </div>
           <div className="flex flex-col">
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.15em] leading-none mb-1">Plan {quotas?.plan || "Free"}</p>
              <p className="text-sm font-medium text-slate-900 leading-none">{user?.email?.split('@')[0]}</p>
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
             color: "text-indigo-600 bg-white border-indigo-200/50",
             cardBg: "bg-gradient-to-br from-indigo-50/80 to-indigo-100/20 border-indigo-100/80 shadow-indigo-100/10" 
           },
           { 
             title: "Scripts Rédigés", 
             value: stats.totalScripts, 
             desc: "Scripts générés par l'IA", 
             icon: FileText, 
             color: "text-purple-600 bg-white border-purple-200/50", 
             cardBg: "bg-gradient-to-br from-purple-50/80 to-purple-100/20 border-purple-100/80 shadow-purple-100/10" 
           },
           { 
             title: "Score Viral Moyen", 
             value: `${stats.avgScore}%`, 
             desc: "Performance estimée", 
             icon: Zap, 
             color: "text-amber-500 bg-white border-amber-200/50", 
             cardBg: "bg-gradient-to-br from-amber-50/80 to-amber-100/20 border-amber-100/80 shadow-amber-100/10" 
           },
           { 
             title: "Scans Radar Restants", 
             value: quotas ? (quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count) : 0, 
             desc: `Sur un quota de ${quotas?.limits.monthlyAnalysis || 0}`, 
             icon: Target, 
             color: "text-emerald-600 bg-white border-emerald-200/50", 
             cardBg: "bg-gradient-to-br from-emerald-50/80 to-emerald-100/20 border-emerald-100/80 shadow-emerald-100/10" 
           }
         ].map((kpi, i) => (
           <Card key={i} className={`border shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 ${kpi.cardBg}`}>
              <CardContent className="p-5 md:p-6 flex items-center justify-between">
                 <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{kpi.title}</p>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">{kpi.value}</h3>
                    <p className="text-[9px] md:text-[10px] font-semibold text-slate-400 leading-none">{kpi.desc}</p>
                 </div>
                 <div className={`size-10 md:size-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${kpi.color}`}>
                    <kpi.icon className="size-5 md:size-6" />
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>



      {/* 4. PERFORMANCE & ACTIVITY */}
      <div className="grid lg:grid-cols-12 gap-10">
         
         {/* Left Column: Recent Scans */}
         <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 px-2">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Derniers Scans Radar</h3>
               <Link href="/feed" className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                  Voir tout le flux <ArrowRight className="size-3" />
               </Link>
            </div>
            
            <div className="space-y-4">
               {stats.recentActivity.map((item, i) => (
                  <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px] bg-white group hover:bg-slate-50 transition-all border border-slate-50 overflow-hidden">
                     <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-4 sm:gap-0 w-full sm:w-auto">
                           <div className="size-14 sm:size-16 rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-white shrink-0 shadow-lg">
                              <span className="text-lg sm:text-xl font-black italic">{Math.round(item.viral_score)}</span>
                              <span className="text-[7px] font-black uppercase opacity-50">Score</span>
                           </div>
                           <div className="flex-1 min-w-0 sm:hidden">
                              <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{item.title}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{item.platform}</span>
                                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">•</span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.niche}</span>
                              </div>
                           </div>
                           <Link href={`/analyse?id=${item.id}`} className="size-10 sm:hidden rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                              <ArrowRight className="size-4" />
                           </Link>
                        </div>
                        <div className="flex-1 min-w-0 hidden sm:block">
                           <h4 className="text-[15px] font-bold text-slate-900 truncate mb-1">{item.title}</h4>
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{item.platform}</span>
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">•</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.niche}</span>
                           </div>
                        </div>
                        <Link href={`/analyse?id=${item.id}`} className="hidden sm:flex size-12 rounded-xl bg-slate-50 items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                           <ArrowRight className="size-5" />
                        </Link>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>

         {/* Right Column: Workspaces & Tips */}
         <div className="lg:col-span-4 space-y-8">

            {quotas && (
               <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-md shadow-slate-100/50 space-y-4">
                  <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="size-4" /> Suivi de vos Quotas
                     </h4>
                     <Link href="/settings?tab=Abonnement" className="text-[9px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors underline">
                        Détails
                     </Link>
                  </div>
                  <div className="space-y-3.5">
                     {/* Daily Scripts */}
                     <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                           <span>Scripts du jour</span>
                           <span className="font-bold">{quotas.daily_script_count} / {quotas.limits.dailyScripts === 9999 ? "∞" : quotas.limits.dailyScripts}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${Math.min(100, (quotas.daily_script_count / (quotas.limits.dailyScripts || 1)) * 100)}%` }}
                           />
                        </div>
                     </div>

                     {/* Monthly Analysis */}
                     <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                           <span>Analyses de concurrents</span>
                           <span className="font-bold">{quotas.monthly_analysis_count} / {quotas.limits.monthlyAnalysis}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                              style={{ width: `${Math.min(100, (quotas.monthly_analysis_count / (quotas.limits.monthlyAnalysis || 1)) * 100)}%` }}
                           />
                        </div>
                     </div>
                  </div>
               </div>
            )}

            <Card className="border-none shadow-sm rounded-[32px] bg-indigo-50/50 p-8 border border-indigo-100/50">
               <div className="flex items-center gap-3 mb-6">
                  <div className="size-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                     <Zap className="size-4" />
                  </div>
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Viral Tip</h4>
               </div>
               <p className="text-slate-700 font-bold leading-relaxed italic text-sm">
                  "Utilisez le Radar Outlier sur des vidéos de moins de 100k vues pour trouver des pépites de rétention inexploitées."
               </p>
            </Card>
          </div>
       </div>
    </div>
  )
}
