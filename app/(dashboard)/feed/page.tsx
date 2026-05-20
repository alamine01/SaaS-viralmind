"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Search, Play, Plus, Eye, Zap, Loader2, VideoOff, Heart, ArrowRight } from "lucide-react"

export default function ViralFeedPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("community") // "community" or "favorites"
  const [activeFilter, setActiveFilter] = useState("Récents")
  const filters = ["Récents", "Populaire", "La plus ancienne"]
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const [favorites, setFavorites] = useState<string[]>([])

  const toggleFavorite = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Veuillez vous connecter pour sauvegarder des favoris.")

    if (favorites.includes(videoId)) {
      // Remove
      const { error } = await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", user.id)
        .eq("video_id", videoId)
      
      if (!error) setFavorites(prev => prev.filter(id => id !== videoId))
    } else {
      // Add
      const { error } = await supabase
        .from("saved_items")
        .insert([{ user_id: user.id, video_id: videoId, type: "video" }])
      
      if (!error) setFavorites(prev => [...prev, videoId])
    }
  }

  const getSortedVideos = () => {
    let filtered = [...videos]
    if (activeTab === "favorites") {
      filtered = filtered.filter(v => favorites.includes(v.id))
    }
    
    if (activeFilter === "Populaire") {
      return filtered.sort((a, b) => (b.viral_score || 0) - (a.viral_score || 0))
    }
    if (activeFilter === "La plus ancienne") {
      return filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        // Fetch community videos
        const res = await fetch("/api/videos")
        const data = await res.json()
        if (!data.error) setVideos(data)

        // Fetch user favorites if logged in
        if (user) {
          const { data: favs } = await supabase
            .from("saved_items")
            .select("video_id")
            .eq("user_id", user.id)
            .eq("type", "video")
          
          if (favs) setFavorites(favs.map(f => f.video_id))
        }
      } catch (err) {
        console.error("Failed to fetch data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 mb-2">
         <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab("community")}
              className={`px-0 py-3 border-b-2 text-[15px] font-semibold transition-all ${activeTab === "community" ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-500'}`}
            >
              Vidéos de la communauté
            </button>
            <button 
              onClick={() => setActiveTab("favorites")}
              className={`px-0 py-3 border-b-2 text-[15px] font-semibold transition-all ${activeTab === "favorites" ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-500'}`}
            >
              Mes favoris
            </button>
         </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <Loader2 className="size-10 text-indigo-500 animate-spin" />
           <p className="text-slate-400 font-medium">Chargement du flux viral...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
           <div className="size-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
              <VideoOff className="size-10" />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Aucune vidéo analysée pour le moment</h3>
              <p className="text-slate-400 max-w-sm font-medium">Soyez le premier à analyser une vidéo pour alimenter le flux de la communauté.</p>
           </div>
           <button onClick={() => window.location.href = '/analyse'} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 flex items-center gap-2">
              Lancer ma première analyse <Zap className="size-4" />
           </button>
        </div>
      ) : getSortedVideos().length === 0 && activeTab === "favorites" ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
           <div className="size-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-300">
              <Heart className="size-10" />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Aucun favori pour le moment</h3>
              <p className="text-slate-400 max-w-sm font-medium">Cliquez sur le cœur d'une vidéo de la communauté pour la retrouver ici.</p>
           </div>
           <button onClick={() => setActiveTab("community")} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2 transition-transform hover:scale-105">
              Explorer la communauté <ArrowRight className="size-4" />
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {getSortedVideos().map((item) => (
            <div 
              key={item.id} 
              onClick={() => window.open(item.url, '_blank')}
              className="relative aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden group cursor-pointer shadow-xs hover:shadow-xl transition-all duration-500 border border-slate-100"
            >
              {/* Premium Gradient Background Fallback */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center transition-transform duration-500 group-hover:scale-105 ${
                item.platform === 'instagram' 
                  ? 'bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400' 
                  : item.platform === 'tiktok' 
                  ? 'bg-gradient-to-tr from-slate-950 via-cyan-900 to-slate-900' 
                  : 'bg-gradient-to-tr from-slate-950 via-red-950 to-slate-900'
              }`}>
                <div className="size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl mb-2">
                   {item.platform === 'instagram' && (
                     <svg className="size-6 text-white fill-current" viewBox="0 0 24 24">
                       <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                     </svg>
                   )}
                   {item.platform === 'tiktok' && (
                     <svg className="size-6 text-white fill-current" viewBox="0 0 24 24">
                       <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.33 6.33 0 0 1-1.87-1.7c-.02 3.18-.03 6.35-.03 9.53 0 1.14-.24 2.26-.7 3.3-.8 1.82-2.62 3.19-4.6 3.4-2.1.23-4.3-.34-5.93-1.71-1.81-1.51-2.65-4.02-2.1-6.29.39-1.56 1.45-2.97 2.9-3.67 1.13-.54 2.45-.74 3.69-.53V10.9a3.71 3.71 0 0 0-1.39.28c-1.46.62-2.43 2.13-2.39 3.73.03 1.46.76 2.87 2 3.61 1.41.81 3.29.73 4.6-.22.86-.63 1.37-1.63 1.35-2.7-.01-4.49-.01-8.99-.01-13.48-.12-.02-.2-.04-.26-.05z"/>
                     </svg>
                   )}
                   {item.platform === 'youtube' && (
                     <svg className="size-6 text-white fill-current" viewBox="0 0 24 24">
                       <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                     </svg>
                   )}
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">{item.platform}</span>
              </div>

              {item.thumbnail && (
                <img 
                  src={item.thumbnail} 
                  alt={item.title} 
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105 z-10" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 <button 
                   onClick={(e) => toggleFavorite(item.id, e)}
                   className={`p-2 rounded-lg backdrop-blur-md shadow-lg transition-all transform hover:scale-110 ${favorites.includes(item.id) ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                 >
                    <Heart className={`size-3.5 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                 </button>
              </div>

              <div className="absolute top-2 right-2 bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                 {item.viral_score}%
              </div>

              <div className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end gap-1">
                 <p className="text-[11px] text-white font-bold truncate">{item.title}</p>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/80">
                       <Play className="size-3 fill-current" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">{formatNumber(item.views || 0)} v.</span>
                    </div>
                    <Zap className="size-3.5 text-indigo-400 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
