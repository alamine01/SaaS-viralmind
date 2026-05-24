"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Video, 
  Search, 
  ExternalLink, 
  TrendingUp, 
  Calendar,
  Filter,
  PlayCircle,
  Loader2
} from "lucide-react"
import Link from "next/link"

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await supabase
        .from("saved_items")
        .select("*, video:video_id(*)")
        .eq("user_id", user.id)
        .eq("type", "video")
        .order("created_at", { ascending: false })

      if (!error && data) {
        const userVideos = data
          .map((item: any) => {
            if (item.video) {
              return {
                ...item.video,
                saved_item_id: item.id
              }
            }
            return null
          })
          .filter((vid: any) => vid !== null)
        setVideos(userVideos)
      }
    }
    setLoading(false)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "k"
    return num.toString()
  }

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.niche.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Historique des <span className="text-indigo-600">Analyses</span></h1>
          <p className="text-slate-500 font-medium max-w-xl text-sm leading-relaxed">
            Retrouvez toutes les pépites et analyses que vous avez générées.
          </p>
        </div>

        <div className="relative group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
           <input 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             placeholder="Rechercher une vidéo ou une niche..." 
             className="bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:ring-2 focus:ring-indigo-500 w-full md:w-80 shadow-sm transition-all"
           />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-40 bg-white rounded-[40px] border border-slate-50">
           <Loader2 className="size-10 text-indigo-500 animate-spin" />
           <p className="mt-4 text-slate-400 font-medium text-sm">Chargement de votre bibliothèque...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[40px] p-20 flex flex-col items-center justify-center text-center space-y-4">
           <div className="size-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
              <Video className="size-10" />
           </div>
           <div className="max-w-xs space-y-1">
              <p className="text-base font-bold text-slate-900">Aucune vidéo trouvée</p>
              <p className="text-sm text-slate-500 font-medium">Lancez votre première analyse Radar pour commencer à remplir votre bibliothèque.</p>
           </div>
           <Link href="/analyse" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all">
              Lancer un Scan
           </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredVideos.map((vid) => (
             <div key={vid.id} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                    {/* Premium Gradient Background Fallback */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-105 ${
                      vid.platform === 'instagram' 
                        ? 'bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400' 
                        : vid.platform === 'tiktok' 
                        ? 'bg-gradient-to-tr from-slate-950 via-cyan-900 to-slate-900' 
                        : 'bg-gradient-to-tr from-slate-950 via-red-950 to-slate-900'
                    }`}>
                      <div className="size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
                         {vid.platform === 'instagram' && (
                           <svg className="size-6 text-white fill-current" viewBox="0 0 24 24">
                             <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                           </svg>
                         )}
                         {vid.platform === 'tiktok' && (
                           <svg className="size-6 text-white fill-current" viewBox="0 0 24 24">
                             <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.33 6.33 0 0 1-1.87-1.7c-.02 3.18-.03 6.35-.03 9.53 0 1.14-.24 2.26-.7 3.3-.8 1.82-2.62 3.19-4.6 3.4-2.1.23-4.3-.34-5.93-1.71-1.81-1.51-2.65-4.02-2.1-6.29.39-1.56 1.45-2.97 2.9-3.67 1.13-.54 2.45-.74 3.69-.53V10.9a3.71 3.71 0 0 0-1.39.28c-1.46.62-2.43 2.13-2.39 3.73.03 1.46.76 2.87 2 3.61 1.41.81 3.29.73 4.6-.22.86-.63 1.37-1.63 1.35-2.7-.01-4.49-.01-8.99-.01-13.48-.12-.02-.2-.04-.26-.05z"/>
                           </svg>
                         )}
                         {vid.platform === 'youtube' && (
                           <svg className="size-6 text-white fill-current" viewBox="0 0 24 24">
                             <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                           </svg>
                         )}
                      </div>
                    </div>

                    {vid.thumbnail && (
                      <img 
                        src={vid.thumbnail} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-10" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="absolute top-4 left-4 z-20">
                       <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                          {vid.platform}
                       </div>
                    </div>
                 </div>
                 
                 <div className="p-6 space-y-4">
                   <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 line-clamp-1 text-sm">{vid.title}</h3>
                      <div className="flex items-center gap-2">
                         <div className="size-1.5 rounded-full bg-indigo-500" />
                         <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{vid.niche}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Vues</p>
                         <div className="flex items-center gap-1.5">
                            <TrendingUp className="size-3 text-emerald-500" />
                            <p className="text-xs font-black text-slate-900">{formatNumber(vid.views)}</p>
                         </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Score</p>
                         <p className="text-xs font-black text-indigo-600">{vid.viral_score}/100</p>
                      </div>
                   </div>

                   <div className="pt-2 flex items-center justify-between border-t border-slate-50 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                         <Calendar className="size-3" />
                         {new Date(vid.created_at).toLocaleDateString()}
                      </div>
                      <Link 
                        href={`/analyse?id=${vid.id}`}
                        className="text-indigo-600 hover:text-indigo-700 text-[11px] font-black uppercase tracking-widest flex items-center gap-1"
                      >
                         Détails <ExternalLink className="size-3" />
                      </Link>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  )
}
