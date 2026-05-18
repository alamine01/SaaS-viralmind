"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Search, Heart, Plus, Video, Globe, Zap, ArrowUpRight, Play } from "lucide-react"

export default function ViralFeedPage() {
  const filters = ["Tout", "Business", "Tech", "Lifestyle", "Motivation", "Abonnements"]
  
  const trends = [
    {
      id: 1,
      title: "Comment j'ai gagné 10k abonnés en 30 jours (Le secret du Hook)",
      date: "Posté il y a 2h",
      author: "@alex_creator",
      views: "1.2M",
      score: 98,
      type: "Analyse IA",
      image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800",
      trend: "Explosif"
    },
    {
      id: 2,
      title: "Pourquoi 99% des créateurs échouent sur TikTok en 2024",
      date: "Posté il y a 5h",
      author: "@media_expert",
      views: "850K",
      score: 95,
      type: "Analyse IA",
      image: "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?auto=format&fit=crop&q=80&w=800",
      trend: "Viral"
    },
    {
      id: 3,
      title: "3 Outils IA indispensables pour monter ses Shorts en 10 minutes",
      date: "Posté il y a 1j",
      author: "@tech_guru",
      views: "2.4M",
      score: 92,
      type: "Tutoriel",
      image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=800",
      trend: "Stable"
    },
    {
      id: 4,
      title: "Le nouveau format qui casse l'algorithme de YouTube Shorts",
      date: "Posté il y a 2j",
      author: "@viral_mind",
      views: "5.1M",
      score: 99,
      type: "Analyse IA",
      image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800",
      trend: "Viral"
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Page Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Flux Viral</h1>
           <p className="text-sm font-medium text-slate-400 mt-1 italic">Découvrez les patterns qui fonctionnent maintenant</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative group sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
             <input 
              placeholder="Chercher une niche..." 
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:border-indigo-500/50 outline-hidden shadow-sm"
            />
           </div>
           <button className="bg-slate-900 text-white rounded-lg px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
              <Plus className="size-4" /> Ajouter Tendance
           </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
         {filters.map((filter, i) => (
           <button 
            key={filter} 
            className={`
              px-4 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap
              ${i === 0 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'}
            `}
           >
             {filter}
           </button>
         ))}
      </div>

      {/* Trends Grid - Horizontal Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {trends.map((item) => (
          <Card key={item.id} className="border border-slate-200 shadow-xs rounded-xl overflow-hidden bg-white flex flex-col md:flex-row group transition-all hover:shadow-md h-auto md:h-[200px]">
            {/* Image Section */}
            <div className="relative w-full md:w-[200px] shrink-0 overflow-hidden bg-slate-100 border-r border-slate-50">
               <img src={item.image} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
               <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="size-10 text-white fill-current" />
               </div>
               <div className="absolute top-2 left-2 bg-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-black text-white shadow-sm">
                  Viral: {item.score}%
               </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-5 flex flex-col justify-between">
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{item.date}</span>
                     <span className="text-[10px] font-bold text-slate-400">{item.author}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2">
                    {item.title}
                  </h3>
               </div>

               <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Vues</span>
                        <span className="text-xs font-bold text-slate-900">{item.views}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Type</span>
                        <span className="text-[10px] font-bold text-slate-500">
                           {item.type}
                        </span>
                     </div>
                  </div>
                  <button className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:underline">
                     Analyser <Zap className="size-3" />
                  </button>
               </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
