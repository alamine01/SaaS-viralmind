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
            <div key={item.id} className="relative aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden group cursor-pointer shadow-xs hover:shadow-xl transition-all duration-500 border border-slate-100">
              <img 
                src={item.thumbnail || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=400"} 
                alt={item.title} 
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=400"
                }}
              />
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
