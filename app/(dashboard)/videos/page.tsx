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
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error) {
      setVideos(data || [])
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
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                   {vid.thumbnail ? (
                     <img src={vid.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <PlayCircle className="size-12" />
                     </div>
                   )}
                   <div className="absolute top-4 left-4">
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
                        href={`/analyse?url=${encodeURIComponent(vid.url)}`}
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
