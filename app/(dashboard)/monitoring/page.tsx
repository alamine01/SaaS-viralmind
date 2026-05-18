"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
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
  ChevronDown
} from "lucide-react"

export default function MonitoringPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [outliers, setOutliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Add form
  const [handle, setHandle] = useState("")
  const [platform, setPlatform] = useState("instagram")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [accRes, outRes] = await Promise.all([
      supabase.from("monitored_accounts").select("*").order("created_at", { ascending: false }),
      supabase.from("detected_outliers").select("*, monitored_accounts(handle)").order("created_at", { ascending: false })
    ])

    setAccounts(accRes.data || [])
    setOutliers(outRes.data || [])
    setLoading(false)
  }

  const handleAddAccount = async () => {
    if (!handle) {
      toast.error("Veuillez entrer un lien ou un pseudo")
      return
    }

    // Extraction intelligente du pseudo depuis une URL ou un @pseudo
    let cleanHandle = handle.trim();
    
    // Si c'est une URL (Instagram, TikTok ou YouTube)
    if (cleanHandle.includes("/")) {
      const parts = cleanHandle.split("/").filter(p => p.length > 0);
      // Pour Instagram/TikTok, le pseudo est souvent le dernier segment
      // Pour YouTube, ça peut être /@pseudo ou /c/pseudo
      let lastPart = parts[parts.length - 1];
      if (lastPart.includes("?")) lastPart = lastPart.split("?")[0];
      cleanHandle = lastPart.replace("@", "");
    } else {
      cleanHandle = cleanHandle.replace("@", "");
    }

    setLoading(true)

    // 1. VÉRIFICATION DU COMPTE
    try {
      const valRes = await fetch("/api/monitor/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: cleanHandle, platform })
      });
      const valData = await valRes.json();

      if (valData.exists === false) {
        toast.error(`Le compte @${cleanHandle} semble ne pas exister sur ${platform}.`);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Validation bypass due to error");
    }

    // 2. AJOUT EN BASE DE DONNÉES
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from("monitored_accounts")
      .insert({
        user_id: user.id,
        handle: cleanHandle,
        platform
      })

    if (error) {
      toast.error("Erreur d'ajout")
    } else {
      toast.success(`@${cleanHandle} est sous surveillance !`)
      setHandle("")
      fetchData()
    }
    setLoading(false)
  }

  const handleDeleteAccount = async (id: string) => {
    const { error } = await supabase
      .from("monitored_accounts")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error("Erreur de suppression")
    } else {
      toast.success("Compte retiré de la surveillance")
      fetchData()
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "k"
    return num.toString()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/5">
            <Zap className="size-3" /> Surveillance 24/7
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Radar de <span className="text-indigo-600">Compétition</span></h1>
          <p className="text-slate-500 font-medium max-w-xl text-sm leading-relaxed">
            Ajoutez vos concurrents. ViralMind scanne leurs nouveaux posts et vous alerte dès qu'un "Outlier" est détecté.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <div className="relative flex items-center">
             <div className="absolute left-3 text-slate-400 pointer-events-none">
                {platform === 'instagram' && (
                  <svg className="size-3.5 fill-slate-500" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                )}
                {platform === 'tiktok' && (
                  <svg className="size-3.5 fill-slate-500" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.33 6.33 0 0 1-1.87-1.7c-.02 3.18-.03 6.35-.03 9.53 0 1.14-.24 2.26-.7 3.3-.8 1.82-2.62 3.19-4.6 3.4-2.1.23-4.3-.34-5.93-1.71-1.81-1.51-2.65-4.02-2.1-6.29.39-1.56 1.45-2.97 2.9-3.67 1.13-.54 2.45-.74 3.69-.53V10.9a3.71 3.71 0 0 0-1.39.28c-1.46.62-2.43 2.13-2.39 3.73.03 1.46.76 2.87 2 3.61 1.41.81 3.29.73 4.6-.22.86-.63 1.37-1.63 1.35-2.7-.01-4.49-.01-8.99-.01-13.48-.12-.02-.2-.04-.26-.05z"/>
                  </svg>
                )}
                {platform === 'youtube' && (
                  <svg className="size-3.5 fill-slate-500" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                )}
             </div>
             <select 
               value={platform}
               onChange={(e) => setPlatform(e.target.value)}
               className="bg-slate-50 border-0 rounded-xl pl-9 pr-8 py-3 text-xs font-bold text-slate-600 focus:ring-0 outline-hidden cursor-pointer appearance-none [-webkit-appearance:none] [-moz-appearance:none]"
             >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
             </select>
             <div className="absolute right-2.5 text-slate-400 pointer-events-none">
                <ChevronDown className="size-3.5" />
             </div>
           </div>
           <div className="h-8 w-px bg-slate-100 mx-1" />
           <input 
             value={handle}
             onChange={(e) => {
               const val = e.target.value;
               setHandle(val);
               
               // Détection automatique de la plateforme
               if (val.includes("tiktok.com")) setPlatform("tiktok");
               else if (val.includes("instagram.com")) setPlatform("instagram");
               else if (val.includes("youtube.com") || val.includes("youtu.be")) setPlatform("youtube");
             }}
             placeholder="Lien du compte ou @pseudo..." 
             className="bg-transparent border-0 px-2 py-3 text-sm font-medium focus:ring-0 outline-hidden w-32 md:w-48"
           />
           <button 
             onClick={handleAddAccount}
             disabled={loading}
             className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all active:scale-95"
           >
             <Plus className="size-5" />
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Left: Monitored Accounts List */}
        <div className="lg:col-span-1 space-y-6">
           <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">En cours de scan</p>
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
           </div>

           <div className="space-y-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="group bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center">
                         <Video className="size-4 text-slate-400" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">@{acc.handle}</p>
                         <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter capitalize">{acc.platform}</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleDeleteAccount(acc.id)}
                     className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                   >
                      <Trash2 className="size-4" />
                   </button>
                </div>
              ))}
              {accounts.length === 0 && (
                <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                   <p className="text-xs font-medium text-slate-400 italic">Aucun compte surveillé</p>
                </div>
              )}
           </div>
        </div>

        {/* Right: Detected Outliers Feed */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center gap-3 px-2">
              <TrendingUp className="size-5 text-indigo-600" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pépites Détectées (Outliers)</p>
           </div>

           {outliers.length === 0 ? (
             <div className="bg-white border border-slate-100 rounded-[32px] p-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="size-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                   <Eye className="size-10" />
                </div>
                <div className="max-w-xs space-y-1">
                   <p className="text-base font-bold text-slate-900">Le radar est en veille</p>
                   <p className="text-sm text-slate-500 font-medium">Dès qu'un compte surveillé publie une vidéo qui dépasse ses stats habituelles, elle apparaîtra ici.</p>
                </div>
             </div>
           ) : (
             <div className="grid md:grid-cols-2 gap-6">
                {outliers.map((out) => (
                  <div key={out.id} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                     <div className="aspect-video bg-slate-100 relative overflow-hidden">
                        {out.thumbnail ? (
                          <img src={out.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                             <PlayCircle className="size-12" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                           <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                              x{out.outlier_score} OUTLIER
                           </div>
                        </div>
                     </div>
                     <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="size-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white font-bold">
                                 {out.monitored_accounts?.handle?.[0].toUpperCase()}
                              </div>
                              <p className="text-sm font-bold text-slate-900">@{out.monitored_accounts?.handle}</p>
                           </div>
                           <a href={out.video_url} target="_blank" className="text-indigo-600 hover:text-indigo-700">
                              <ExternalLink className="size-4" />
                           </a>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                           <div className="bg-slate-50 rounded-2xl p-3 space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Vues</p>
                              <div className="flex items-center gap-1.5 text-slate-900">
                                 <TrendingUp className="size-3.5 text-emerald-500" />
                                 <p className="text-sm font-black">{formatNumber(out.views)}</p>
                              </div>
                           </div>
                           <div className="bg-slate-50 rounded-2xl p-3 space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Abonnés</p>
                              <div className="flex items-center gap-1.5 text-slate-900">
                                 <Users className="size-3.5 text-indigo-500" />
                                 <p className="text-sm font-black">{formatNumber(out.followers_at_time)}</p>
                              </div>
                           </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                           <div className="flex items-center gap-1.5">
                              <Clock className="size-3" />
                              Détécté il y a 2h
                           </div>
                           <button className="text-indigo-600 hover:underline">Analyser le script</button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
