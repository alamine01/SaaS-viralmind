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
  const { activeCollection, setCreateModalOpen } = useWorkspace()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    totalScripts: 0,
    avgScore: 0,
    recentActivity: [] as any[]
  })
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
          const { count: analysesCount } = await supabase.from("videos").select("*", { count: "exact", head: true })
          const { count: scriptsCount } = await supabase.from("saved_items").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "script")
          const { data: scores } = await supabase.from("videos").select("viral_score")
          const avg = scores && scores.length > 0 ? Math.round(scores.reduce((acc, curr) => acc + (curr.viral_score || 0), 0) / scores.length) : 0
          const { data: recentVideos } = await supabase.from("videos").select("*").order("created_at", { ascending: false }).limit(3)

          setStats({
            totalAnalyses: analysesCount || 0,
            totalScripts: scriptsCount || 0,
            avgScore: avg,
            recentActivity: recentVideos || []
          })

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
  }, [])

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

      {/* 2. CORE ENGINES (Quick Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { title: "Radar Outlier", desc: "Détectez les opportunités virales", url: "/analyse", icon: Target, color: "from-indigo-600 to-indigo-800", shadow: "shadow-indigo-500/20" },
           { title: "Script Studio", desc: "Générez avec votre Tone of Voice", url: "/scripts", icon: FileText, color: "from-indigo-600 to-indigo-800", shadow: "shadow-indigo-500/20" },
           { title: "Viral Playbooks", desc: "Formules de rétention prêtes", url: "/playbooks", icon: Sparkles, color: "from-indigo-600 to-indigo-800", shadow: "shadow-indigo-500/20" }
         ].map((action, i) => (
           <Link key={i} href={action.url}>
              <div className="group relative h-48 rounded-[32px] overflow-hidden p-8 flex flex-col justify-between transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 shadow-xl shadow-indigo-900/10">
                 <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
                 <div className="relative z-10 size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                    <action.icon className="size-6" />
                 </div>
                 <div className="relative z-10 text-white space-y-1">
                    <h3 className="text-xl font-black tracking-tight">{action.title}</h3>
                    <p className="text-white/70 text-xs font-medium">{action.desc}</p>
                 </div>
                 <div className="absolute -bottom-4 -right-4 size-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              </div>
           </Link>
         ))}
      </div>

      {/* 3. PERFORMANCE & ACTIVITY */}
      <div className="grid lg:grid-cols-12 gap-10">
         
         {/* Left Column: Recent Scans */}
         <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Derniers Scans Radar</h3>
               <Link href="/feed" className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                  Voir tout le flux <ArrowRight className="size-3" />
               </Link>
            </div>
            
            <div className="space-y-4">
               {stats.recentActivity.map((item, i) => (
                  <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px] bg-white group hover:bg-slate-50 transition-all border border-slate-50 overflow-hidden">
                     <CardContent className="p-6 flex items-center gap-6">
                        <div className="size-16 rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-white shrink-0 shadow-lg">
                           <span className="text-xl font-black italic">{Math.round(item.viral_score)}</span>
                           <span className="text-[7px] font-black uppercase opacity-50">Score</span>
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="text-[15px] font-bold text-slate-900 truncate mb-1">{item.title}</h4>
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{item.platform}</span>
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">•</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.niche}</span>
                           </div>
                        </div>
                        <Link href={`/analyse?id=${item.id}`} className="size-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                           <ArrowRight className="size-5" />
                        </Link>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>

         {/* Right Column: Workspaces & Tips */}
         <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-8 relative overflow-hidden">
               <div className="absolute top-[-20%] right-[-20%] size-40 bg-indigo-600/30 blur-3xl rounded-full" />
               <div className="space-y-2 relative z-10">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Active Workspaces</h4>
                  <div className="space-y-4 pt-4">
                     {[
                       { name: "Général", count: stats.totalScripts, color: "bg-emerald-400", slug: "General" },
                       { name: "Projet Alpha", count: 0, color: "bg-indigo-400", slug: "Projet Alpha" }
                     ].map((ws) => {
                       const isActive = activeCollection === ws.slug;
                       return (
                         <Link key={ws.name} href={`/saved?collection=${ws.slug}`}>
                           <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${isActive ? 'bg-white text-slate-900 border-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-white border-white/5 hover:bg-white/10'}`}>
                              <div className="flex items-center gap-3">
                                 <div className={`size-2 rounded-full ${ws.color}`} />
                                 <span className="text-sm font-bold">{ws.name}</span>
                                 {isActive && <span className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-indigo-600 text-white rounded ml-2">Actif</span>}
                              </div>
                              <span className={`text-[10px] font-black ${isActive ? 'text-slate-400' : 'opacity-40'}`}>{ws.count} items</span>
                           </div>
                         </Link>
                       )
                     })}
                  </div>
               </div>
                <button 
                  onClick={() => setCreateModalOpen(true)}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                   Gérer les projets
                </button>
            </div>

            {quotas && (
               <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-md shadow-slate-100/50 space-y-4">
                  <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="size-4" /> Suivi de vos Quotas
                     </h4>
                     <Link href="/settings" className="text-[9px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors underline">
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
