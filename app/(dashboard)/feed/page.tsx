"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Search, 
  Play, 
  Zap, 
  TrendingUp, 
  Loader2, 
  ExternalLink, 
  X, 
  Users, 
  Eye, 
  ThumbsUp,
  ArrowUpDown,
  Sparkles,
  ChevronDown,
  Flame,
  Globe,
  MonitorPlay
} from "lucide-react"

// YouTube icon (lucide doesn't have one)
const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
)

// TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.52-4.06-1.39v7.76c-.05 2.42-1.34 4.78-3.58 5.76-2.24.98-5-.02-6.11-2.18-1.12-2.16-.5-5.07 1.48-6.52 1.5-1.11 3.56-1.2 5.05-.37V8.96c-1.89-.66-3.83-.81-5.83-.4-.96.2-1.92.59-2.73 1.2-.81.61-1.47 1.43-1.84 2.39-.37.96-.46 2.03-.31 3.07.15 1.04.59 2.04 1.25 2.87.66.83 1.54 1.49 2.53 1.89s2.08.52 3.16.41c1.08-.11 2.12-.51 3.01-1.13.89-.62 1.59-1.48 2.03-2.48V8.96c-1.5-.04-3-.55-4.14-1.57-1.14-1.02-1.78-2.5-1.93-4.04H12.53z"/>
  </svg>
)

// Instagram icon
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

import Link from "next/link"

const NICHES = [
  { id: "all", label: "Tout", icon: Globe },
  { id: "motivation", label: "Motivation", icon: Flame },
  { id: "business", label: "Business", icon: TrendingUp },
  { id: "tech", label: "Tech", icon: Zap },
  { id: "lifestyle", label: "Lifestyle", icon: Sparkles },
  { id: "fitness", label: "Fitness", icon: Users },
  { id: "finance", label: "Finance", icon: TrendingUp },
  { id: "comedy", label: "Com\u00e9die", icon: Sparkles },
  { id: "education", label: "\u00c9ducation", icon: Sparkles },
  { id: "food", label: "Food", icon: Sparkles },
  { id: "gaming", label: "Gaming", icon: Sparkles },
]

const SORTS = [
  { id: "score", label: "Score Viral" },
  { id: "views", label: "Vues" },
  { id: "recent", label: "R\u00e9cent" },
]

export default function ViralFeedPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNiche, setActiveNiche] = useState("all")
  const [activeSort, setActiveSort] = useState("score")
  const [searchQuery, setSearchQuery] = useState("")
  const [previewVideo, setPreviewVideo] = useState<any | null>(null)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [visibleCount, setVisibleCount] = useState(24)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const fetchFeed = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        niche: activeNiche,
        source: "all",
        sort: activeSort,
        limit: "100", // Request a larger pool of 100 cached videos
      })
      const res = await fetch(`/api/feed?${params}`)
      const data = await res.json()
      if (!data.error) {
        // Shuffle the pool of 100 videos and display 24 of them randomly
        // to create a feeling of dynamic freshness on every refresh/action
        const shuffled = (data.items || []).sort(() => Math.random() - 0.5)
        setItems(shuffled)
        setVisibleCount(24) // Reset visible count on fresh load
      }
    } catch (e) {
      console.error("Feed fetch error:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed()
  }, [activeNiche, activeSort])

  const filteredItems = searchQuery.trim()
    ? items.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.niche?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items

  const visibleItems = filteredItems.slice(0, visibleCount)

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500 text-white"
    if (score >= 70) return "bg-amber-500 text-white"
    if (score >= 50) return "bg-orange-500 text-white"
    return "bg-slate-400 text-white"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Explosif"
    if (score >= 70) return "Viral"
    if (score >= 50) return "Tendance"
    return "Normal"
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">
            <Flame className="size-3" /> Flux en direct
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
            Flux <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">Viral</span>
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm max-w-lg">
            D&eacute;couvrez les vid&eacute;os qui explosent en ce moment. Filtrez par niche, analysez les patterns gagnants.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm font-medium focus:border-indigo-500/50 outline-hidden shadow-sm transition-all"
            />
          </div>

          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:border-slate-300 transition-all shadow-sm whitespace-nowrap"
            >
              <ArrowUpDown className="size-3.5" />
              <span className="hidden sm:inline">{SORTS.find(s => s.id === activeSort)?.label}</span>
              <ChevronDown className="size-3" />
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 top-12 z-50 bg-white border border-slate-100 rounded-xl shadow-xl p-1.5 min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
                {SORTS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveSort(s.id); setShowSortDropdown(false) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeSort === s.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Niche Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {NICHES.map(niche => (
          <button
            key={niche.id}
            onClick={() => setActiveNiche(niche.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap border ${
              activeNiche === niche.id
                ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-lg shadow-rose-100'
                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:text-slate-900 shadow-sm'
            }`}
          >
            <niche.icon className={`size-3.5 ${activeNiche === niche.id ? 'text-white' : 'text-slate-400'}`} />
            {niche.label}
          </button>
        ))}
      </div>

      {/* Feed Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative">
            <Loader2 className="size-10 text-rose-500 animate-spin" />
            <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-full" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Chargement du flux viral...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="size-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
            <Search className="size-8" />
          </div>
          <p className="text-sm font-bold text-slate-500">Aucune vid&eacute;o trouv&eacute;e pour ce filtre</p>
          <button onClick={() => { setActiveNiche("all"); setSearchQuery("") }} className="text-xs font-bold text-indigo-600 hover:underline">
            R&eacute;initialiser les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleItems.map((item) => (
            <Card
              key={item.id}
              className="group border border-slate-100 shadow-sm rounded-[20px] overflow-hidden bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300 cursor-pointer flex flex-col"
              onClick={() => setPreviewVideo(item)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="size-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                    <Play className="size-10 text-slate-300" />
                  </div>
                )}

                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="size-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl">
                    <Play className="size-6 text-slate-900 ml-0.5" />
                  </div>
                </div>

                <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 ${getScoreColor(item.viral_score)}`}>
                  <Zap className="size-3" />
                  {item.viral_score}%
                </div>


                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white uppercase tracking-wider">
                  {getScoreLabel(item.viral_score)}
                </div>
              </div>

              <CardContent className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">{item.author}</span>
                    <span className="text-slate-200">&bull;</span>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{item.time_ago}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Eye className="size-3 text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-600">{item.views_formatted}</span>
                    </div>
                    {item.likes > 0 && (
                      <div className="flex items-center gap-1.5">
                        <ThumbsUp className="size-3 text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-600">
                          {item.likes >= 1000 ? `${(item.likes / 1000).toFixed(1)}K` : item.likes}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    item.niche === "trending" ? "bg-rose-50 text-rose-500" : "bg-indigo-50 text-indigo-500"
                  }`}>
                    {item.niche}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>

          {/* Voir plus button */}
          {filteredItems.length > visibleCount && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount(prev => Math.min(prev + 12, filteredItems.length))}
                className="h-11 px-6 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                Voir plus de vid&eacute;os
              </button>
            </div>
          )}
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setPreviewVideo(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <button 
              onClick={() => setPreviewVideo(null)} 
              className="absolute top-4 right-4 z-10 size-9 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shadow-md"
            >
              <X className="size-5" />
            </button>

            <div className="aspect-video bg-black">
              {previewVideo.embed_url ? (
                <iframe
                  src={`${previewVideo.embed_url}?autoplay=1`}
                  className="size-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div className="size-full flex items-center justify-center text-slate-400">
                  <Play className="size-16" />
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">{previewVideo.title}</h2>
                  <p className="text-xs font-bold text-slate-400 mt-1">{previewVideo.author} &bull; {previewVideo.time_ago}</p>
                </div>
                <div className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-black ${getScoreColor(previewVideo.viral_score)}`}>
                  {previewVideo.viral_score}%
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 py-3 border-y border-slate-100 overflow-x-auto">
                <div className="flex items-center gap-2 shrink-0">
                  <Eye className="size-4 text-slate-400" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vues</p>
                    <p className="text-sm font-bold text-slate-900">{previewVideo.views_formatted}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Zap className="size-4 text-amber-500" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                    <p className="text-sm font-bold text-slate-900">{previewVideo.viral_score}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TrendingUp className="size-4 text-emerald-500" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tendance</p>
                    <p className="text-sm font-bold text-slate-900">{getScoreLabel(previewVideo.viral_score)}</p>
                  </div>
                </div>
              </div>

              {previewVideo.hook && (
                <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Accroche d&eacute;tect&eacute;e</p>
                  <p className="text-xs font-bold text-slate-800 italic leading-relaxed">&ldquo;{previewVideo.hook}&rdquo;</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href={`/analyse?url=${encodeURIComponent(previewVideo.url)}`}
                  className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="size-4" /> Analyser avec le Radar
                </Link>
                <a
                  href={previewVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-11 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="size-4" /> Voir sur {previewVideo.platform}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
