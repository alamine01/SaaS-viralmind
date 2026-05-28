"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { 
  Search, 
  Filter, 
  FolderPlus,
  Video,
  FileText,
  Clock,
  Zap,
  Loader2,
  Bookmark,
  ArrowRight,
  Trash2,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useSearchParams, useRouter } from "next/navigation"
import { useWorkspace } from "@/lib/workspace-context"

export default function LibraryPage() {
  const router = useRouter()
  const { activeCollection } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'video' | 'script'>('video')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ video: 0, script: 0 })
  const [resolvingScriptId, setResolvingScriptId] = useState<string | null>(null)

  const handleOpenScript = async (item: any) => {
    setResolvingScriptId(item.id)
    try {
      let explanation = ""
      let firstAudio = ""
      try {
        const parsed = JSON.parse(item.content)
        explanation = parsed.explanation || ""
        const scriptArray = Array.isArray(parsed) ? parsed : parsed.script
        if (Array.isArray(scriptArray) && scriptArray.length > 0) {
          firstAudio = scriptArray[0].audio || ""
        }
      } catch (e) {
        console.error("Parsing script content error:", e)
      }

      let discussionId = null
      let messageId = null

      if (explanation) {
        // Try 1: Exact match on content (which contains explanation)
        const { data: matches1 } = await supabase
          .from("script_messages")
          .select("discussion_id, id")
          .eq("content", explanation)
          .limit(1)

        if (matches1 && matches1.length > 0) {
          discussionId = matches1[0].discussion_id
          messageId = matches1[0].id
        } else {
          // Try 2: JSONB match on explanation
          const { data: matches2 } = await supabase
            .from("script_messages")
            .select("discussion_id, id")
            .eq("script_data->>explanation", explanation)
            .limit(1)

          if (matches2 && matches2.length > 0) {
            discussionId = matches2[0].discussion_id
            messageId = matches2[0].id
          }
        }
      }

      // Try 3: Fallback match on first audio line inside the text
      if (!discussionId && firstAudio) {
        const { data: matches3 } = await supabase
          .from("script_messages")
          .select("discussion_id, id")
          .like("script_data::text", `%${firstAudio.slice(0, 40)}%`)
          .limit(1)

        if (matches3 && matches3.length > 0) {
          discussionId = matches3[0].discussion_id
          messageId = matches3[0].id
        }
      }

      if (discussionId) {
        toast.success("Script trouvé, chargement du Studio...")
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
        // Optionnel : on peut décider que General montre tout ou juste ceux marqués General
        // Pour l'instant on montre ceux qui n'ont pas de collection ou General
        query = query.or(`collection_name.eq.General,collection_name.is.null`)
      }

      const { data: itemsData } = await query.order("created_at", { ascending: false })
        
      if (itemsData) setItems(itemsData)

      // Update counts with filter
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

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_items").delete().eq("id", id)
    if (!error) {
      toast.success("Supprimé")
      fetchData()
    }
  }

  const getPreviewText = (content: string) => {
    if (!content) return "Pas de contenu";
    if (content.startsWith('[') || content.startsWith('{')) {
      try {
        const parsed = JSON.parse(content);
        const scriptArray = Array.isArray(parsed) ? parsed : parsed.script;
        if (Array.isArray(scriptArray) && scriptArray.length > 0) {
          return scriptArray[0].audio || scriptArray[0].text || "Script structuré";
        }
      } catch (e) {}
      return "Script structuré";
    }
    return content;
  }

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-500">
      
      {/* Tab Header */}
      <div className="flex items-center gap-6 md:gap-10 border-b border-slate-100 mb-6 md:mb-10">
        <button 
          onClick={() => setActiveTab('video')}
          className={`pb-4 text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'video' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-300'}`}
        >
          Vidéos ({counts.video})
        </button>
        <button 
          onClick={() => setActiveTab('script')}
          className={`pb-4 text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'script' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-300'}`}
        >
          Scripts ({counts.script})
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <Loader2 className="size-8 text-indigo-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="w-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30 space-y-4">
           <div className="size-16 rounded-2xl bg-white flex items-center justify-center text-slate-200 shadow-sm">
              <Bookmark className="size-8" />
           </div>
           <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Cet espace est encore vide</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
           {items.map((item) => (
              <Card key={item.id} className={`${item.type === 'video' ? 'min-h-[160px] md:min-h-[180px]' : 'h-[260px] md:h-[320px]'} flex flex-col bg-white border border-slate-100 rounded-2xl md:rounded-[28px] overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500`}>
                 <div className="p-4 md:p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                       <div className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[7px] md:text-[8px] font-bold uppercase tracking-widest">
                          {item.type}
                       </div>
                       <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-200 hover:text-rose-500 transition-colors"
                       >
                          <Trash2 className="size-3 md:size-3.5" />
                       </button>
                    </div>

                    {/* Title */}
                    <h3 className="text-[11px] md:text-[13px] font-semibold text-slate-900 mb-3 line-clamp-3 leading-snug">
                       {item.video?.title || (item.type === 'script' ? "Script Généré" : "Sans Titre")}
                    </h3>

                    {/* Preview Box - ONLY FOR SCRIPTS */}
                    {item.type === 'script' && (
                       <div className="bg-slate-50/50 rounded-lg md:rounded-xl border border-slate-100/50 p-2 md:p-4 h-20 md:h-28 overflow-hidden relative mb-2">
                          <div className="text-[9px] md:text-[10px] text-slate-500 font-medium leading-relaxed italic line-clamp-3 md:line-clamp-4">
                             {getPreviewText(item.content)}
                          </div>
                          <div className="absolute inset-x-0 bottom-0 h-4 md:h-6 bg-gradient-to-t from-slate-50/80 to-transparent" />
                       </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-3 md:pt-4 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="size-2.5 md:size-3" />
                          <span className="text-[8px] md:text-[9px] font-semibold text-slate-400 uppercase tracking-tighter">
                             {new Date(item.created_at).toLocaleDateString()}
                          </span>
                       </div>
                       {item.type === 'video' ? (
                          <Link 
                            href={`/analyse?id=${item.video?.id}`}
                            className="text-indigo-600 text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1 decoration-2 underline-offset-4"
                          >
                             Ouvrir <ArrowRight className="size-2 md:size-2.5" />
                          </Link>
                       ) : (
                          <button 
                            disabled={resolvingScriptId !== null}
                            onClick={() => handleOpenScript(item)}
                            className="text-indigo-600 text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4 flex items-center gap-1.5 disabled:opacity-50"
                          >
                             {resolvingScriptId === item.id ? (
                               <Loader2 className="size-2.5 md:size-3 animate-spin" />
                             ) : null}
                             Ouvrir
                          </button>
                       )}
                    </div>
                 </div>
              </Card>
           ))}
        </div>
      )}
    </div>
  )
}
