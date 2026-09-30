"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { 
  Search, 
  Video, 
  FileText, 
  Clock, 
  Zap, 
  Loader2, 
  Bookmark, 
  ArrowRight, 
  Trash2, 
  ExternalLink,
  Copy,
  Check,
  Eye,
  TrendingUp,
  Flame,
  LayoutGrid,
  List,
  Mic,
  PenTool,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/lib/workspace-context"

function formatNumber(num?: number) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function getPlatformBadge(platform?: string) {
  const p = platform?.toLowerCase();
  if (p === "instagram") {
    return <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full text-[8px] font-extrabold uppercase tracking-widest shadow-xs">Instagram</span>;
  }
  if (p === "tiktok") {
    return <span className="px-2 py-0.5 bg-slate-950 text-cyan-400 border border-cyan-500/30 rounded-full text-[8px] font-extrabold uppercase tracking-widest shadow-xs">TikTok</span>;
  }
  if (p === "youtube") {
    return <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[8px] font-extrabold uppercase tracking-widest shadow-xs">YouTube</span>;
  }
  return <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-[8px] font-extrabold uppercase tracking-widest">{platform || "Vidéo"}</span>;
}

function parseScriptData(content: string) {
  if (!content) return { explanation: "Script sans titre", firstAudio: "", score: null, scenesCount: 0, scriptArray: [] };
  try {
    const parsed = JSON.parse(content);
    const scriptArray = Array.isArray(parsed) ? parsed : (parsed.script || []);
    const explanation = parsed.explanation || (scriptArray[0]?.audio ? scriptArray[0].audio : "Script vidéo généré");
    const firstAudio = scriptArray[0]?.audio || "";
    const score = parsed.score || null;
    return {
      explanation,
      firstAudio,
      score,
      scenesCount: scriptArray.length,
      scriptArray
    };
  } catch (e) {
    return {
      explanation: content.slice(0, 80),
      firstAudio: content.slice(0, 100),
      score: null,
      scenesCount: 1,
      scriptArray: []
    };
  }
}

export default function LibraryPage() {
  const router = useRouter()
  const { activeCollection } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'video' | 'script'>('video')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ video: 0, script: 0 })
  const [resolvingScriptId, setResolvingScriptId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleOpenScript = async (item: any) => {
    setResolvingScriptId(item.id)
    try {
      const scriptData = parseScriptData(item.content);
      let discussionId = null
      let messageId = null

      if (scriptData.explanation) {
        const { data: matches1 } = await supabase
          .from("script_messages")
          .select("discussion_id, id")
          .eq("content", scriptData.explanation)
          .limit(1)

        if (matches1 && matches1.length > 0) {
          discussionId = matches1[0].discussion_id
          messageId = matches1[0].id
        } else {
          const { data: matches2 } = await supabase
            .from("script_messages")
            .select("discussion_id, id")
            .eq("script_data->>explanation", scriptData.explanation)
            .limit(1)

          if (matches2 && matches2.length > 0) {
            discussionId = matches2[0].discussion_id
            messageId = matches2[0].id
          }
        }
      }

      if (!discussionId && scriptData.firstAudio) {
        const { data: matches3 } = await supabase
          .from("script_messages")
          .select("discussion_id, id")
          .like("script_data::text", `%${scriptData.firstAudio.slice(0, 40)}%`)
          .limit(1)

        if (matches3 && matches3.length > 0) {
          discussionId = matches3[0].discussion_id
          messageId = matches3[0].id
        }
      }

      if (discussionId) {
        toast.success("Ouverture du Studio de Rédaction...")
        router.push(`/scripts?id=${discussionId}${messageId ? `&messageId=${messageId}` : ""}`)
      } else {
        toast.error("Impossible de retrouver la discussion d'origine. Ouverture du studio...")
        router.push("/scripts")
      }
    } catch (err) {
      console.error("Failed to resolve script discussion:", err)
      toast.error("Une erreur est survenue lors de l'ouverture du script.")
      router.push("/scripts")
    } finally {
      setResolvingScriptId(null)
    }
  }

  const handleCopyScript = (item: any) => {
    const parsed = parseScriptData(item.content);
    let copyText = parsed.explanation ? `=== ${parsed.explanation} ===\n\n` : "";
    if (parsed.scriptArray && parsed.scriptArray.length > 0) {
      copyText += parsed.scriptArray.map((s: any, i: number) => 
        `[Scène ${i + 1} - ${s.type || "Audio"} (${s.time || ""})]\n🗣️ Audio: ${s.audio || ""}\n👁️ Visuel: ${s.visual || ""}`
      ).join("\n\n");
    } else {
      copyText += item.content;
    }

    navigator.clipboard.writeText(copyText);
    setCopiedId(item.id);
    toast.success("Script copié dans le presse-papier !");
    setTimeout(() => setCopiedId(null), 2000);
  }

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      let query = supabase
        .from("saved_items")
        .select("*, video:video_id(*)")
        .eq("user_id", user.id)
        .eq("type", activeTab)
        
      if (activeCollection && activeCollection !== "General") {
        query = query.eq("collection_name", activeCollection)
      } else if (activeCollection === "General") {
        query = query.or(`collection_name.eq.General,collection_name.is.null`)
      }

      const { data: itemsData } = await query.order("created_at", { ascending: false })
        
      if (itemsData) setItems(itemsData)

      let vCountQuery = supabase.from("saved_items").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "video")
      let sCountQuery = supabase.from("saved_items").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "script")
      
      if (activeCollection && activeCollection !== "General") {
        vCountQuery = vCountQuery.eq("collection_name", activeCollection)
        sCountQuery = sCountQuery.eq("collection_name", activeCollection)
      } else if (activeCollection === "General") {
        vCountQuery = vCountQuery.or(`collection_name.eq.General,collection_name.is.null`)
        sCountQuery = sCountQuery.or(`collection_name.eq.General,collection_name.is.null`)
      }

      const { count: vCount } = await vCountQuery
      const { count: sCount } = await sCountQuery
      setCounts({ video: vCount || 0, script: sCount || 0 })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, activeCollection])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { error } = await supabase.from("saved_items").delete().eq("id", id)
    if (!error) {
      toast.success("Élément supprimé de la bibliothèque")
      fetchData()
    }
  }

  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (item.type === 'video') {
      const v = item.video || {};
      return (
        v.title?.toLowerCase().includes(q) ||
        v.niche?.toLowerCase().includes(q) ||
        v.hook?.toLowerCase().includes(q) ||
        v.platform?.toLowerCase().includes(q)
      );
    } else {
      const scriptData = parseScriptData(item.content);
      return (
        scriptData.explanation.toLowerCase().includes(q) ||
        scriptData.firstAudio.toLowerCase().includes(q)
      );
    }
  });

  return (
    <div className="pb-20 animate-in fade-in duration-500 space-y-6 md:space-y-8">
      
      {/* Top Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700/60">
        
        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700/60 self-start">
          <button 
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'video' 
                ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Video className="size-3.5" />
            <span>Vidéos Sauvegardées</span>
            <span className="px-1.5 py-0.2 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-full text-[9px]">
              {counts.video}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'script' 
                ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="size-3.5" />
            <span>Scripts IA</span>
            <span className="px-1.5 py-0.2 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-full text-[9px]">
              {counts.script}
            </span>
          </button>
        </div>

        {/* Search Bar & View Mode Switcher */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'video' ? "Rechercher une vidéo..." : "Rechercher un script..."}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-gray-100 outline-hidden focus:border-violet-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          <div className="bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200 dark:border-gray-700/60 flex items-center gap-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Vue Grille"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Vue Liste"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
           <Loader2 className="size-8 text-violet-500 animate-spin" />
           <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Chargement de votre bibliothèque...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="w-full py-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700/60 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 space-y-4 text-center px-4">
           <div className="size-16 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600 border border-gray-200 dark:border-gray-700/60 shadow-sm">
              <Bookmark className="size-8 text-violet-400" />
           </div>
           <div className="max-w-sm space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {searchQuery ? "Aucun résultat trouvé" : "Aucun élément sauvegardé"}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                {searchQuery 
                  ? `Aucun élément ne correspond à "${searchQuery}". Essayez un autre mot-clé.`
                  : activeTab === 'video' 
                    ? "Analysez des vidéos virales dans l'onglet Analyse pour les retrouver ici."
                    : "Générez des scripts dans le Studio pour les retrouver sauvegardés ici."
                }
              </p>
           </div>
        </div>
      ) : viewMode === 'grid' ? (

        /* ==================== GRID VIEW ==================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
           {filteredItems.map((item) => {
              if (item.type === 'video') {
                const video = item.video || {};
                const hasOutlier = video.outlier_score && parseFloat(video.outlier_score) >= 2.0;

                return (
                  <Card 
                    key={item.id} 
                    className="flex flex-col bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:border-violet-500/40"
                  >
                     {/* Video Thumbnail Header */}
                     <div className="relative h-44 w-full bg-slate-900 overflow-hidden shrink-0">
                        {video.thumbnail ? (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title || "Miniature"} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : null}
                        
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                           {getPlatformBadge(video.platform)}

                           <div className="flex items-center gap-1.5">
                              {hasOutlier && (
                                <span className="px-2 py-0.5 bg-amber-500/90 backdrop-blur-md text-slate-950 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md">
                                  <Flame className="size-3 fill-slate-950" />
                                  x{video.outlier_score}
                                </span>
                              )}
                              {video.viral_score ? (
                                <span className="px-2 py-0.5 bg-violet-600/90 backdrop-blur-md text-white rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-md">
                                  <Zap className="size-3 text-amber-300 fill-amber-300" />
                                  {video.viral_score}
                                </span>
                              ) : null}
                           </div>
                        </div>

                        {/* Bottom Metric Overlay */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
                           <div className="flex items-center gap-1.5 font-extrabold text-[11px] drop-shadow-sm">
                              <Eye className="size-3.5 text-violet-400" />
                              <span>{formatNumber(video.views)} vues</span>
                           </div>
                           <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-md border border-white/10">
                              {video.niche || "Général"}
                           </span>
                        </div>
                     </div>

                     {/* Content Section */}
                     <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                        <div className="space-y-2">
                           <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              {video.title || "Vidéo Virale"}
                           </h3>
                           
                           {video.hook && (
                             <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium line-clamp-2 leading-relaxed italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700/40">
                               "{video.hook}"
                             </p>
                           )}
                        </div>

                        {/* Card Footer */}
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                           <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-tighter">
                              <Clock className="size-3" />
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                           </div>

                           <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => handleDelete(item.id, e)}
                                className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                title="Supprimer"
                              >
                                 <Trash2 className="size-3.5" />
                              </button>

                              <Link 
                                href={`/analyse?id=${video.id || item.video_id}`}
                                className="px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center gap-1 shadow-2xs"
                              >
                                 Ouvrir <ArrowRight className="size-3" />
                              </Link>
                           </div>
                        </div>
                     </div>
                  </Card>
                );
              } else {
                /* SCRIPT CARD ITEM */
                const scriptData = parseScriptData(item.content);

                return (
                  <Card 
                    key={item.id} 
                    className="flex flex-col bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:border-violet-500/40"
                  >
                     {/* Script Top Header Badge */}
                     <div className="p-5 pb-3 flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-700/60 bg-gradient-to-r from-violet-50/50 via-transparent to-purple-50/30 dark:from-violet-500/5 dark:to-transparent">
                        <div className="flex items-center gap-2">
                           <div className="size-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs shrink-0">
                              <FileText className="size-4" />
                           </div>
                           <div>
                              <span className="text-[9px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-widest block">
                                {scriptData.scenesCount > 0 ? `${scriptData.scenesCount} Scènes Structurées` : "Script IA"}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">
                                {item.collection_name || "Général"}
                              </span>
                           </div>
                        </div>

                        {scriptData.score && (
                          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-full text-[10px] font-black flex items-center gap-1 shadow-2xs">
                            <Zap className="size-3 text-amber-500 fill-amber-500" />
                            {scriptData.score}/100
                          </span>
                        )}
                     </div>

                     {/* Body Content */}
                     <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                           <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              {scriptData.explanation}
                           </h3>

                           {scriptData.firstAudio && (
                             <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200/80 dark:border-gray-700/60 space-y-1 relative">
                                <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-violet-500 uppercase tracking-widest">
                                   <Mic className="size-3" />
                                   <span>Accroche Audio (Extrait)</span>
                                </div>
                                <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic line-clamp-2">
                                   "{scriptData.firstAudio}"
                                </p>
                             </div>
                           )}
                        </div>

                        {/* Card Footer */}
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                           <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-tighter">
                              <Clock className="size-3" />
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                           </div>

                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleCopyScript(item)}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                title="Copier le script"
                              >
                                 {copiedId === item.id ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                              </button>

                              <button 
                                onClick={(e) => handleDelete(item.id, e)}
                                className="p-2 text-gray-300 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                title="Supprimer"
                              >
                                 <Trash2 className="size-3.5" />
                              </button>

                              <button 
                                disabled={resolvingScriptId !== null}
                                onClick={() => handleOpenScript(item)}
                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                              >
                                 {resolvingScriptId === item.id ? (
                                   <Loader2 className="size-3 animate-spin" />
                                 ) : null}
                                 Studio <ArrowRight className="size-3" />
                              </button>
                           </div>
                        </div>
                     </div>
                  </Card>
                );
              }
           })}
        </div>
      ) : (

        /* ==================== LIST / TABLE VIEW ==================== */
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden shadow-sm">
           <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {filteredItems.map((item) => {
                 if (item.type === 'video') {
                   const video = item.video || {};
                   return (
                     <div 
                       key={item.id} 
                       className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/80 dark:hover:bg-gray-750/50 transition-colors"
                     >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                           <div className="size-14 rounded-xl bg-slate-900 overflow-hidden shrink-0 relative border border-gray-200 dark:border-gray-700">
                              {video.thumbnail ? (
                                <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Video className="size-6 text-gray-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                              )}
                           </div>

                           <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                 {getPlatformBadge(video.platform)}
                                 <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                    {video.title || "Vidéo Virale"}
                                 </h4>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                                 {video.hook || video.niche || "Analyse vidéo disponible"}
                              </p>
                           </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-gray-100 dark:border-gray-700/40">
                           <div className="flex items-center gap-4 text-xs font-bold text-gray-700 dark:text-gray-300">
                              <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                                 <Eye className="size-3.5" />
                                 {formatNumber(video.views)}
                              </span>
                              {video.outlier_score && (
                                <span className="text-amber-500 flex items-center gap-0.5">
                                   <Flame className="size-3.5" />
                                   x{video.outlier_score}
                                </span>
                              )}
                           </div>

                           <span className="text-[10px] text-gray-400 font-semibold uppercase">
                              {new Date(item.created_at).toLocaleDateString()}
                           </span>

                           <div className="flex items-center gap-2">
                              <Link 
                                href={`/analyse?id=${video.id || item.video_id}`}
                                className="px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                              >
                                 Ouvrir
                              </Link>

                              <button 
                                onClick={(e) => handleDelete(item.id, e)}
                                className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-rose-500 transition-colors"
                              >
                                 <Trash2 className="size-4" />
                              </button>
                           </div>
                        </div>
                     </div>
                   );
                 } else {
                   const scriptData = parseScriptData(item.content);
                   return (
                     <div 
                       key={item.id} 
                       className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/80 dark:hover:bg-gray-750/50 transition-colors"
                     >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                           <div className="size-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <FileText className="size-5" />
                           </div>

                           <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                 <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-full text-[8px] font-extrabold uppercase tracking-widest">
                                   {scriptData.scenesCount > 0 ? `${scriptData.scenesCount} Scènes` : "Script"}
                                 </span>
                                 <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                    {scriptData.explanation}
                                 </h4>
                              </div>
                              {scriptData.firstAudio && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium italic truncate">
                                   "{scriptData.firstAudio}"
                                </p>
                              )}
                           </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-gray-100 dark:border-gray-700/40">
                           {scriptData.score && (
                             <span className="text-amber-500 font-black text-xs flex items-center gap-1">
                               <Zap className="size-3.5 fill-amber-500" />
                               {scriptData.score}/100
                             </span>
                           )}

                           <span className="text-[10px] text-gray-400 font-semibold uppercase">
                              {new Date(item.created_at).toLocaleDateString()}
                           </span>

                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleCopyScript(item)}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-violet-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Copier le script"
                              >
                                 {copiedId === item.id ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                              </button>

                              <button 
                                disabled={resolvingScriptId !== null}
                                onClick={() => handleOpenScript(item)}
                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                              >
                                 Studio
                              </button>

                              <button 
                                onClick={(e) => handleDelete(item.id, e)}
                                className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-rose-500 transition-colors"
                              >
                                 <Trash2 className="size-4" />
                              </button>
                           </div>
                        </div>
                     </div>
                   );
                 }
              })}
           </div>
        </div>
      )}
    </div>
  )
}
