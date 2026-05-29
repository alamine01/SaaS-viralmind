"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { AuthForm } from "@/components/auth-form"
import { Card, CardContent } from "@/components/ui/card"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { 
  Plus, 
  Copy, 
  Sparkles, 
  Wand2, 
  Layout, 
  ChevronRight, 
  Zap, 
  Video,
  ArrowRight,
  Loader2,
  Trash2,
  Edit3,
  X,
  History,
  MessageSquare,
  Check,
  Send,
  Play,
  Mic,
  Square,
  Paperclip,
  Link2,
  File,
  Download,
  FileAudio,
  FileVideo,
  ExternalLink,
  Globe,
  Image as ImageIcon
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useWorkspace } from "@/lib/workspace-context"

export default function ScriptsPage() {
  const { activeCollection } = useWorkspace()
  const searchParams = useSearchParams()
  const initialLoadRef = useRef(true)
  
  // App States
  const [discussions, setDiscussions] = useState<any[]>([])
  const [activeDiscussionId, setActiveDiscussionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputMessage, setInputMessage] = useState("")

  // File Upload & Link Attachment States
  const [uploadingFile, setUploadingFile] = useState(false)
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; type: string; size: number } | null>(null)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkInputVal, setLinkInputVal] = useState("")
  
  // Custom script controls for the active chat
  const [niche, setNiche] = useState("Dynamique & Viral (Style TikTok)")
  const [duration, setDuration] = useState("60")
  
  // Loading & UI States
  const [loadingDiscussions, setLoadingDiscussions] = useState(true)
  const [loadingChat, setLoadingChat] = useState(false)
  const [submittingMessage, setSubmittingMessage] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameTitle, setRenameTitle] = useState("")
  const [user, setUser] = useState<any>(null)
  const [quotas, setQuotas] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [openModal, setOpenModal] = useState<"full" | "tech" | null>(null)
  const [modalBlocks, setModalBlocks] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Voice recording states & refs
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      toast.error("Votre navigateur ou connexion HTTP non-sécurisée ne supporte pas l'enregistrement audio. Utilisez HTTPS ou localhost.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        handleTranscribeAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      toast.info("Enregistrement vocal démarré...")
    } catch (err) {
      console.error("Microphone access error:", err)
      toast.error("Impossible d'accéder au microphone. Veuillez autoriser l'accès.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`
  }

  const handleTranscribeAudio = async (blob: Blob) => {
    setTranscribing(true)
    const formData = new FormData()
    formData.append("audio", blob, "recording.webm")
    
    try {
      const res = await fetch("/api/scripts/transcribe", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      if (data.text && data.text.trim()) {
        setInputMessage(prev => prev ? `${prev} ${data.text}` : data.text)
        toast.success("Voix transcrite avec succès !")
      } else {
        toast.warning("Aucune voix détectée ou l'audio est trop court.")
      }
    } catch (err: any) {
      toast.error("Erreur de transcription : " + err.message)
    } finally {
      setTranscribing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileType = file.type || ""
    const fileSize = file.size

    // Client-side validation limits
    const maxImageSize = 5 * 1024 * 1024
    const maxOtherSize = 10 * 1024 * 1024
    const isImage = fileType.startsWith("image/")

    if (isImage && fileSize > maxImageSize) {
      toast.error("Les images sont limitées à 5 Mo.")
      return
    } else if (!isImage && fileSize > maxOtherSize) {
      toast.error("Les fichiers sont limités à 10 Mo.")
      return
    }

    setUploadingFile(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/scripts/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.status === 403) {
        toast.error(data.error)
        return
      }

      if (data.error) throw new Error(data.error)

      setAttachedFile({
        url: data.url,
        name: data.name,
        type: data.type,
        size: data.size,
      })

      if (data.isSimulation) {
        toast.success("Média attaché en mode simulation !")
      } else {
        toast.success("Média attaché avec succès !")
      }
      
      fetchQuotas()
    } catch (err: any) {
      toast.error("Erreur d'upload : " + err.message)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleAttachLink = () => {
    if (!linkInputVal.trim()) return
    let url = linkInputVal.trim()
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }

    setAttachedFile({
      url: url,
      name: linkInputVal.trim(),
      type: "link",
      size: 0
    })
    setLinkInputVal("")
    setShowLinkInput(false)
    toast.success("Lien attaché !")
  }

  const fetchQuotas = async () => {
    try {
      const res = await fetch("/api/user/quotas")
      const data = await res.json()
      if (!data.error) {
        setQuotas(data)
      }
    } catch (e) {
      console.error("Failed to fetch quotas:", e)
    }
  }

  // Load user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch discussions when workspace or user changes
  useEffect(() => {
    if (user) {
      fetchDiscussions()
      fetchQuotas()
    }
  }, [user, activeCollection])

  // Trigger remix automatic prompt sending
  useEffect(() => {
    const triggerRemix = async () => {
      const isRemix = searchParams.get("remix") === "true"
      if (!isRemix || !user) return

      const remixRaw = localStorage.getItem("remix_data")
      if (!remixRaw) return

      try {
        const remixData = JSON.parse(remixRaw)
        localStorage.removeItem("remix_data") // Eviter de reboucler

        // 1. Créer une nouvelle discussion pour le remix
        const title = `Remix - ${new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
        const res = await fetch("/api/scripts/discussions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, collection: activeCollection })
        })
        const discData = await res.json()
        if (discData.error) throw new Error(discData.error)

        // 2. Mettre à jour les discussions locales et sélectionner la nouvelle
        setDiscussions(prev => [discData, ...prev])
        setActiveDiscussionId(discData.id)

        // 3. Préparer le message de remix
        const structureText = typeof remixData.structure === 'object' 
          ? JSON.stringify(remixData.structure) 
          : remixData.structure;
        
        const prompt = `Je souhaite remixer une vidéo virale à succès. Peux-tu me proposer un script unique en reprenant sa psychologie de rétention ?

Voici les détails de la vidéo d'origine :
- Accroche : "${remixData.hook || 'N/A'}"
- Structure psychologique : "${structureText || 'N/A'}"
- Niche : "${remixData.niche || 'N/A'}"

Rédige-moi un script 100% original de A à Z en appliquant les règles d'or d'humanisation et anti-plagiat (sans copier-coller).`;

        // 4. Lancer l'IA sur cette nouvelle discussion
        setLoadingChat(true)
        setMessages([])
        
        setTimeout(() => {
          handleSendMessage(prompt, discData.id)
        }, 400)

      } catch (err: any) {
        console.error("Remix failed:", err)
        toast.error("Impossible de charger le remix.")
      }
    }

    triggerRemix()
  }, [searchParams, user, activeCollection])

  // Scroll to bottom of chat or target message when messages change
  useEffect(() => {
    const messageIdParam = searchParams.get("messageId")
    if (messageIdParam && messages.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`msg-${messageIdParam}`)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
          // Premium halo visual cue highlight
          el.classList.add("ring-4", "ring-indigo-500/20", "scale-[1.01]")
          setTimeout(() => {
            el.classList.remove("ring-4", "ring-indigo-500/20", "scale-[1.01]")
          }, 3000)
        } else {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      }, 400)
      return () => clearTimeout(timer)
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, searchParams])

  const fetchDiscussions = async () => {
    setLoadingDiscussions(true)
    try {
      const res = await fetch(`/api/scripts/discussions?collection=${activeCollection}`)
      const data = await res.json()
      if (!data.error) {
        setDiscussions(data)
        
        const idParam = searchParams.get("id")
        const targetId = (initialLoadRef.current && idParam) ? idParam : activeDiscussionId
        initialLoadRef.current = false // initial load completed
        
        if (targetId) {
          handleSelectDiscussion(targetId)
        } else if (data.length > 0) {
          handleSelectDiscussion(data[0].id)
        } else {
          setActiveDiscussionId(null)
          setMessages([])
        }
      }
    } catch (e) {
      console.error("Error fetching discussions:", e)
    } finally {
      setLoadingDiscussions(false)
    }
  }

  const handleSelectDiscussion = async (id: string) => {
    setActiveDiscussionId(id)
    setLoadingChat(true)
    setMessages([])
    try {
      const res = await fetch(`/api/scripts/discussions?id=${id}`)
      const data = await res.json()
      if (!data.error) {
        setMessages(data.messages || [])
      }
    } catch (e) {
      toast.error("Impossible de charger la discussion.")
    } finally {
      setLoadingChat(false)
    }
  }

  const handleCreateDiscussion = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    try {
      const res = await fetch("/api/scripts/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nouveau Script", collection: activeCollection })
      })
      const data = await res.json()
      if (!data.error) {
        toast.success("Discussion créée !")
        setDiscussions(prev => [data, ...prev])
        handleSelectDiscussion(data.id)
      }
    } catch (e) {
      toast.error("Erreur lors du lancement de la discussion.")
    }
  }

  const handleDeleteDiscussion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/scripts/discussions?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!data.error) {
        toast.success("Discussion supprimée.")
        setDiscussions(prev => prev.filter(d => d.id !== id))
        if (activeDiscussionId === id) {
          setActiveDiscussionId(null)
          setMessages([])
        }
      }
    } catch (e) {
      toast.error("Erreur de suppression.")
    }
  }

  const handleStartRename = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingId(id)
    setRenameTitle(title)
  }

  const handleSaveRename = async (id: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation()
    if (!renameTitle.trim()) return
    try {
      const res = await fetch("/api/scripts/discussions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title: renameTitle.trim() })
      })
      const data = await res.json()
      if (!data.error) {
        setDiscussions(prev => prev.map(d => d.id === id ? data : d))
        setRenamingId(null)
        toast.success("Discussion renommée !")
      }
    } catch (e) {
      toast.error("Erreur de renommage.")
    }
  }

  const handleSendMessage = async (conceptOverride?: string, discussionIdOverride?: string) => {
    const textToSend = conceptOverride || inputMessage;
    const targetDiscussionId = discussionIdOverride || activeDiscussionId;
    if ((!textToSend.trim() && !attachedFile) || !targetDiscussionId) return;

    if (!user) {
      setShowAuthModal(true)
      return
    }

    setSubmittingMessage(true)
    setInputMessage("")
    
    // Add user message locally for instant UI update
    const tempUserMsg = { 
      id: Date.now().toString(), 
      role: "user", 
      content: textToSend,
      attachment_url: attachedFile?.url || null,
      attachment_name: attachedFile?.name || null,
      attachment_type: attachedFile?.type || null,
      attachment_size: attachedFile?.size || null
    }
    setMessages(prev => [...prev, tempUserMsg])
    
    // Backup attachment and clear attached file state
    const savedAttachment = attachedFile
    setAttachedFile(null)

    try {
      const res = await fetch("/api/scripts/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discussionId: targetDiscussionId,
          message: textToSend,
          niche,
          tone: niche,
          duration,
          attachmentUrl: savedAttachment?.url || null,
          attachmentName: savedAttachment?.name || null,
          attachmentType: savedAttachment?.type || null,
          attachmentSize: savedAttachment?.size || null
        })
      })
      
      const data = await res.json()
      if (res.status === 403 && data.quotaExceeded) {
        toast.error(data.error)
        return
      }

      if (data.error) throw new Error(data.error)

      // Add assistant response
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, data])
      
      // Auto-rename discussion if it was default
      const activeDisc = discussions.find(d => d.id === targetDiscussionId)
      if (activeDisc && activeDisc.title === "Nouveau Script") {
        const shortenedTitle = textToSend ? (textToSend.slice(0, 24) + (textToSend.length > 24 ? "..." : "")) : (savedAttachment ? savedAttachment.name : "Nouveau Script")
        // Silent rename
        fetch("/api/scripts/discussions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: targetDiscussionId, title: shortenedTitle })
        }).then(r => r.json()).then(renamedData => {
          if (!renamedData.error) {
            setDiscussions(prev => prev.map(d => d.id === targetDiscussionId ? renamedData : d))
          }
        })
      }

      fetchQuotas()
      window.dispatchEvent(new Event("quota-updated"))
    } catch (e: any) {
      toast.error("Erreur : " + e.message)
      // Restore attachment in input on error so user doesn't lose it
      setAttachedFile(savedAttachment)
    } finally {
      setSubmittingMessage(false)
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* 1. Header Premium */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
            <Wand2 className="size-3" />
            Studio Conversationnel
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
            Script <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Studio</span>
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm">
            Discutez avec notre IA pour concevoir et affiner votre vidéo virale parfaite.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="lg:hidden px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
            title={showHistory ? "Masquer l'historique" : "Voir l'historique"}
          >
            <History className="size-4 text-slate-500" />
            <span>{showHistory ? "Masquer" : "Historique"}</span>
          </button>

          <div 
            onClick={() => !user && setShowAuthModal(true)}
            className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all hover:scale-105 ${user ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}
          >
            <div className={`size-1.5 rounded-full animate-pulse ${user ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {user ? 'Studio Connecté' : 'Se Connecter'}
          </div>
          
          {quotas && (
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/50 text-xs font-bold text-slate-600 shadow-xs">
              <span>Quota : {quotas.daily_script_count} / {quotas.limits.dailyScripts === 9999 ? "∞" : quotas.limits.dailyScripts}</span>
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  style={{ width: `${Math.min(100, (quotas.daily_script_count / (quotas.limits.dailyScripts || 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* Left Side: Discussions History Panel */}
        <aside className={`col-span-12 lg:col-span-3 bg-white border border-slate-100 rounded-3xl p-5 flex flex-col justify-between shadow-sm min-h-[300px] lg:min-h-auto ${showHistory ? 'block' : 'hidden lg:flex'}`}>
          <div className="space-y-4 flex-1 flex flex-col min-w-0">
             <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discussions récentes</p>
                <button 
                  onClick={handleCreateDiscussion}
                  className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                  title="Nouvelle discussion"
                >
                  <Plus className="size-4" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[350px] lg:max-h-[500px]">
                {loadingDiscussions ? (
                  <div className="flex justify-center py-10">
                     <Loader2 className="size-6 text-indigo-600 animate-spin" />
                  </div>
                ) : discussions.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                     <p className="text-xs font-bold text-slate-400 italic">Aucune discussion lancée</p>
                     <button onClick={handleCreateDiscussion} className="mt-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1 mx-auto">
                        <Plus className="size-3" /> Nouveau script
                     </button>
                  </div>
                ) : (
                  discussions.map((d) => {
                    const isActive = activeDiscussionId === d.id
                    return (
                      <div 
                        key={d.id}
                        onClick={() => handleSelectDiscussion(d.id)}
                        onDoubleClick={(e) => handleStartRename(d.id, d.title, e as any)}
                        className={`group p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${
                          isActive 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                            : 'bg-white border-slate-50 hover:bg-slate-50 hover:border-slate-100 text-slate-700'
                        }`}
                        title="Double-cliquez pour renommer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                           <MessageSquare className={`size-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                           
                           {renamingId === d.id ? (
                             <input 
                               value={renameTitle}
                               onChange={(e) => setRenameTitle(e.target.value)}
                               onClick={(e) => e.stopPropagation()}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') handleSaveRename(d.id, e as any)
                                 else if (e.key === 'Escape') setRenamingId(null)
                               }}
                               autoFocus
                               className="bg-white text-slate-900 text-xs font-bold border border-slate-300 rounded px-1.5 py-0.5 focus:outline-hidden w-full"
                             />
                           ) : (
                             <span className="text-xs font-bold truncate pr-1">{d.title}</span>
                           )}
                        </div>

                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                           {renamingId === d.id ? (
                             <button 
                               onClick={(e) => handleSaveRename(d.id, e)}
                               className="p-1 hover:bg-white/10 rounded-md text-emerald-500"
                             >
                               <Check className="size-3.5" />
                             </button>
                           ) : (
                             <button 
                               onClick={(e) => handleStartRename(d.id, d.title, e)}
                               className={`p-1 hover:bg-white/10 rounded-md transition-colors ${isActive ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
                               title="Renommer (Double-cliquer)"
                             >
                               <Edit3 className="size-3.5" />
                             </button>
                           )}
                           
                           <button 
                             onClick={(e) => handleDeleteDiscussion(d.id, e)}
                             className={`p-1 hover:bg-white/10 rounded-md transition-colors ${isActive ? 'text-white/40 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'}`}
                             title="Supprimer"
                           >
                             <Trash2 className="size-3.5" />
                           </button>
                        </div>
                      </div>
                    )
                  })
                )}
             </div>
          </div>
          
          {quotas && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-[10px] font-semibold text-slate-400 leading-normal">
               <div className="flex justify-between">
                  <span>Plan :</span>
                  <span className="font-extrabold uppercase text-indigo-600">{quotas.plan}</span>
               </div>
               <div className="flex justify-between">
                  <span>Générations du jour :</span>
                  <span>{quotas.daily_script_count} / {quotas.limits.dailyScripts === 9999 ? "∞" : quotas.limits.dailyScripts}</span>
               </div>
            </div>
          )}
        </aside>

        {/* Right Side: Chat Container Panel */}
        <main className="col-span-12 lg:col-span-9 bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col justify-between shadow-sm min-h-[500px]">
          
          {/* Header de la discussion active (Sélecteurs de contraintes) */}
          {activeDiscussionId && (
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
               <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-bold text-slate-800">Configuration en temps réel :</p>
               </div>
               
               <div className="flex flex-wrap items-center gap-3">
                  {/* Angle Selector */}
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Format</span>
                     <select 
                       value={niche}
                       onChange={(e) => {
                         setNiche(e.target.value)
                         toast.success(`Format défini sur : ${e.target.value}`)
                       }}
                       className="bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[11px] font-bold outline-hidden cursor-pointer text-slate-700 shadow-xs focus:border-indigo-500"
                     >
                        <option>Dynamique & Viral (Style TikTok)</option>
                        <option>Expert & Éducatif (Style LinkedIn)</option>
                        <option>Motivation & Inspiration</option>
                        <option>Storytelling Mystérieux</option>
                        <option>Humoristique & Décalé</option>
                        <option>UGC & Témoignage</option>
                        <option>Publicité Directe (Ventes)</option>
                     </select>
                  </div>

                  {/* Duration Selector */}
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Durée</span>
                     <select 
                       value={duration}
                       onChange={(e) => {
                         setDuration(e.target.value)
                         const durationMin = parseInt(e.target.value) >= 60 ? `${parseInt(e.target.value) / 60} min` : `${e.target.value}s`;
                         toast.success(`Durée ajustée sur : ${durationMin}`)
                       }}
                       className="bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[11px] font-bold outline-hidden cursor-pointer text-slate-700 shadow-xs focus:border-indigo-500"
                     >
                        <option value="30">30 Secondes</option>
                        <option value="60">60 Secondes</option>
                        <option value="90">90 Secondes</option>
                        <option value="120">2 Minutes</option>
                        <option value="180">3 Minutes</option>
                        <option value="300">5 Minutes (YouTube)</option>
                        <option value="600">10 Minutes (YouTube)</option>
                        <option value="900">15 Minutes (YouTube)</option>
                     </select>
                  </div>

               </div>
            </div>
          )}

          {/* Corps de la discussion (Messages) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[480px]">
             {loadingChat ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                   <Loader2 className="size-8 text-indigo-500 animate-spin" />
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Chargement de la discussion...</p>
                </div>
             ) : !activeDiscussionId ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6 py-20">
                   <div className="size-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                      <MessageSquare className="size-8" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-900">Studio de Discussion Actif</h3>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                         Sélectionnez un script ou cliquez sur le bouton "+" dans le volet de gauche pour démarrer un nouvel échange guidé.
                      </p>
                   </div>
                   <button 
                     onClick={handleCreateDiscussion}
                     className="px-6 py-3.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                   >
                      <Plus className="size-4" /> Nouvelle Discussion
                   </button>
                </div>
             ) : messages.length === 0 ? (
                // Welcome Assistant (Start Discussion Prompt)
                <div className="space-y-8 py-4 animate-in fade-in duration-500">
                   <div className="space-y-3 max-w-lg">
                      <h2 className="text-2xl font-black text-slate-900 leading-tight">Génération de script guidée</h2>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed">
                         Choisissez l'une des suggestions ci-dessous pour lancer l'IA, ou décrivez directement votre idée de vidéo.
                      </p>
                   </div>

                   <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { title: "Storytelling UGC", desc: "Créer une vidéo où j'explique comment j'ai résolu un problème quotidien...", concept: "Je veux faire un script type UGC expliquant comment mon produit a résolu un problème majeur d'un utilisateur." },
                        { title: "Hook Éducatif", desc: "Expliquer 3 secrets ou erreurs méconnues de ma niche d'activité...", concept: "Rédige un script expliquant les 3 plus grosses erreurs que les débutants commettent dans ma niche." },
                        { title: "Contre-courant Viral", desc: "Briser un mythe ou une idée reçue très populaire sur mon marché...", concept: "Je souhaite démonter un mythe ou une fausse croyance très répandue dans mon secteur d'activité." },
                        { title: "Story / Anecdote", desc: "Raconter une histoire personnelle ou client captivante...", concept: "Raconte l'histoire inspirante de la réussite de l'un de mes clients." }
                      ].map((item, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleSendMessage(item.concept)}
                          className="p-5 bg-slate-50/50 hover:bg-slate-900 border border-slate-100 hover:border-slate-900 hover:text-white rounded-2xl transition-all cursor-pointer group shadow-xs active:scale-[0.98] flex flex-col justify-between h-28"
                        >
                           <h4 className="text-xs font-black uppercase tracking-widest group-hover:text-indigo-400 text-indigo-600">{item.title}</h4>
                           <p className="text-xs font-medium opacity-60 line-clamp-2 mt-2 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                   </div>
                </div>
             ) : (
                // Chat bubbles
                <div className="space-y-6 pb-4">
                   {messages.map((m) => {
                     const isUser = m.role === "user"
                     return (
                       <div 
                         key={m.id}
                         id={`msg-${m.id}`}
                         className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300 rounded-3xl transition-all duration-1000`}
                       >
                          {!isUser && (
                            <div className="size-9 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-md shadow-indigo-100">
                               VM
                            </div>
                          )}
                          
                          <div className={`max-w-[80%] space-y-3 ${isUser ? 'items-end' : ''}`}>
                             <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                               isUser 
                                 ? 'bg-slate-900 text-white rounded-tr-xs shadow-md' 
                                 : 'bg-slate-100/60 border border-slate-100 text-slate-800 rounded-tl-xs'
                             }`}>
                                 {m.content && (
                                   isUser ? (
                                     <p className="whitespace-pre-wrap">{m.content}</p>
                                   ) : (
                                     <MarkdownRenderer content={m.content} />
                                   )
                                 )}

                                 {/* ATTACHMENT RENDERING */}
                                 {m.attachment_url && (
                                   <div className={`mt-3 p-3 rounded-xl border flex flex-col gap-2 ${isUser ? 'bg-slate-800/80 border-slate-700/60 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-xs'}`}>
                                     {m.attachment_type === "image" && (
                                       <div className="relative group max-w-sm rounded-lg overflow-hidden border border-slate-700/30">
                                         <img 
                                           src={m.attachment_url} 
                                           alt={m.attachment_name} 
                                           className="max-h-60 w-auto object-contain cursor-zoom-in hover:scale-102 transition-transform duration-300"
                                           onClick={() => window.open(m.attachment_url, "_blank")}
                                         />
                                         <div className="p-2 bg-black/40 text-[10px] text-white flex items-center justify-between">
                                           <span className="truncate max-w-[200px] font-bold">{m.attachment_name}</span>
                                           <a href={m.attachment_url} download target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-white/20 rounded-md transition-colors"><Download className="size-3.5" /></a>
                                         </div>
                                       </div>
                                     )}

                                     {m.attachment_type === "video" && (
                                       <div className="flex flex-col gap-2 max-w-sm rounded-lg overflow-hidden border border-slate-700/30">
                                         <video src={m.attachment_url} controls className="max-h-60 w-full" />
                                         <div className="p-2 bg-slate-900/5 text-[10px] flex items-center justify-between font-bold border-t">
                                           <span className="truncate max-w-[200px]">{m.attachment_name}</span>
                                           <a href={m.attachment_url} download target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-950/10 rounded-md transition-colors"><Download className="size-3.5" /></a>
                                         </div>
                                       </div>
                                     )}

                                     {m.attachment_type === "audio" && (
                                       <div className="flex flex-col gap-2 w-full max-w-xs">
                                         <audio src={m.attachment_url} controls className="w-full h-8" />
                                         <div className="text-[10px] flex items-center gap-1 opacity-75 font-bold">
                                           <FileAudio className="size-3.5" />
                                           <span className="truncate">{m.attachment_name}</span>
                                         </div>
                                       </div>
                                     )}

                                     {m.attachment_type === "doc" && (
                                       <div className="flex items-center justify-between gap-4 py-1.5 px-1">
                                         <div className="flex items-center gap-3 min-w-0">
                                           <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-slate-700 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                             <File className="size-5" />
                                           </div>
                                           <div className="min-w-0">
                                             <p className="text-xs font-black truncate max-w-[180px]">{m.attachment_name}</p>
                                             <p className="text-[10px] opacity-75 font-bold">
                                               {m.attachment_size ? `${(m.attachment_size / 1024).toFixed(1)} Ko` : 'Document'}
                                             </p>
                                           </div>
                                         </div>
                                         <a 
                                           href={m.attachment_url} 
                                           download 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           className={`p-2 rounded-lg border transition-colors shrink-0 ${isUser ? 'bg-slate-700/50 hover:bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
                                         >
                                           <Download className="size-4" />
                                         </a>
                                       </div>
                                     )}

                                     {m.attachment_type === "link" && (
                                       <a 
                                         href={m.attachment_url} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className={`flex items-center justify-between gap-4 py-1.5 px-2 rounded-lg border transition-all ${isUser ? 'bg-slate-700/50 hover:bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:shadow-xs'}`}
                                       >
                                         <div className="flex items-center gap-3 min-w-0">
                                           <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-slate-800 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
                                             <Globe className="size-4.5" />
                                           </div>
                                           <div className="min-w-0">
                                             <p className="text-xs font-black truncate max-w-[200px]">{m.attachment_name}</p>
                                             <p className="text-[9px] opacity-75 truncate max-w-[200px] font-bold">{m.attachment_url}</p>
                                           </div>
                                         </div>
                                         <ExternalLink className="size-3.5 shrink-0 opacity-70" />
                                       </a>
                                     )}
                                   </div>
                                 )}
                             </div>

                             {/* SCRIPT BLOCK EMBEDDED */}
                             {!isUser && m.script_data && (
                               <Card className="border-none shadow-xl shadow-indigo-100/40 rounded-3xl overflow-hidden border border-slate-100/50 bg-white">
                                  <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                     
                                     {/* Jauge du score viral */}
                                     <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-3">
                                           <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm border border-emerald-100 shadow-xs">
                                              {m.script_data.score || 90}
                                           </div>
                                           <div>
                                              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Score Viral IA</p>
                                              <p className="text-[10px] text-slate-400 font-medium">Estimé pour la niche</p>
                                           </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                           <button
                                             onClick={() => {
                                               const blocks = m.script_data.script || []
                                               const text = blocks.map((b: any) => b.audio).join('\n\n')
                                               navigator.clipboard.writeText(text)
                                               toast.success("Script complet copié !")
                                             }}
                                             className="p-2 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                             title="Copier le script"
                                           >
                                              <Copy className="size-3.5" />
                                           </button>
                                        </div>
                                     </div>

                                     {/* Aperçu du Hook */}
                                     {m.script_data.script && m.script_data.script[0] && (
                                       <div className="bg-slate-50/50 border border-slate-100/50 p-4 rounded-2xl">
                                          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">Accroche (Hook)</p>
                                          <p className="text-xs font-bold text-slate-800 italic leading-relaxed">
                                             "{m.script_data.script[0].audio}"
                                          </p>
                                       </div>
                                     )}

                                     {/* Commandes Storyboard, Visualiser, Prompteur */}
                                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                                        <button
                                          onClick={() => {
                                            setModalBlocks(m.script_data.script || [])
                                            setOpenModal("full")
                                          }}
                                          className="h-10 px-3 bg-slate-900 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                        >
                                           <Layout className="size-3" /> Visualiser
                                        </button>

                                        <button
                                          onClick={() => {
                                            setModalBlocks(m.script_data.script || [])
                                            setOpenModal("tech")
                                          }}
                                          className="h-10 px-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                        >
                                           <Video className="size-3 text-amber-500" /> Storyboard
                                        </button>

                                        <button
                                          onClick={() => {
                                             setModalBlocks(m.script_data.script || [])
                                             setOpenModal("full")
                                             toast.info("Cliquez sur 'Mode Prompteur' en haut à droite du modal pour démarrer !");
                                          }}
                                          className="h-10 px-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                        >
                                           <Zap className="size-3 text-indigo-500" /> Prompteur
                                        </button>
                                     </div>

                                  </CardContent>
                               </Card>
                             )}
                          </div>

                          {isUser && (
                            <div className="size-9 shrink-0 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center text-xs font-black shadow-md">
                               ME
                            </div>
                          )}
                       </div>
                     )
                   })}
                   
                   {submittingMessage && (
                     <div className="flex gap-4 justify-start animate-in fade-in duration-300">
                        <div className="size-9 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black animate-pulse">
                           VM
                        </div>
                        <div className="bg-slate-100/60 border border-slate-100 p-4 rounded-2xl rounded-tl-xs flex items-center gap-2 shadow-inner">
                           <Loader2 className="size-4 text-indigo-600 animate-spin" />
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">L'IA analyse et écrit...</span>
                        </div>
                     </div>
                   )}
                   
                   <div ref={chatEndRef} />
                </div>
             )}
          </div>

          {/* Saisie de message et envoi (Bas) */}
          {activeDiscussionId && (
            <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10 space-y-3">
               
               {/* 1. Attachment Preview Panel */}
               {attachedFile && (
                 <div className="flex items-center justify-between gap-3 p-3 bg-indigo-50/50 border border-indigo-100/40 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                   <div className="flex items-center gap-3 min-w-0">
                     <div className="size-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                       {attachedFile.type === "image" && <ImageIcon className="size-4" />}
                       {attachedFile.type === "video" && <FileVideo className="size-4" />}
                       {attachedFile.type === "audio" && <FileAudio className="size-4" />}
                       {attachedFile.type === "doc" && <File className="size-4" />}
                       {attachedFile.type === "link" && <Globe className="size-4" />}
                     </div>
                     <div className="min-w-0">
                       <p className="text-xs font-black truncate max-w-[300px] sm:max-w-[450px] text-slate-800">{attachedFile.name}</p>
                       <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                         {attachedFile.type === "link" ? "Lien internet rattaché" : `Fichier ${attachedFile.type} (${(attachedFile.size / (1024 * 1024)).toFixed(2)} Mo)`}
                       </p>
                     </div>
                   </div>
                   <button 
                     type="button"
                     onClick={() => setAttachedFile(null)}
                     className="p-1.5 hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors shrink-0"
                     title="Supprimer la pièce jointe"
                   >
                     <X className="size-4" />
                   </button>
                 </div>
               )}

               {/* 2. Link Paste Popover Input */}
               {showLinkInput && (
                 <div className="flex gap-2 p-2 bg-slate-50 border border-slate-100 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                   <input 
                     value={linkInputVal}
                     onChange={(e) => setLinkInputVal(e.target.value)}
                     placeholder="Collez ou tapez votre URL (ex: holaluxe.com)..."
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         handleAttachLink();
                       }
                     }}
                     className="flex-1 bg-transparent border-0 px-3 py-2 text-xs font-medium text-slate-800 outline-hidden"
                     autoFocus
                   />
                   <button
                     type="button"
                     onClick={handleAttachLink}
                     className="px-4 py-2 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100"
                   >
                     Attacher
                   </button>
                   <button
                     type="button"
                     onClick={() => { setShowLinkInput(false); setLinkInputVal(""); }}
                     className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                   >
                     <X className="size-4" />
                   </button>
                 </div>
               )}

               <form 
                 onSubmit={(e) => {
                   e.preventDefault()
                   handleSendMessage()
                 }}
                 className="flex gap-2.5 bg-slate-50/80 border border-slate-100 p-2 pr-2.5 rounded-2xl shadow-inner focus-within:bg-white focus-within:border-indigo-500/30 transition-all items-center"
               >
                  {isRecording ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-2 bg-rose-50 border border-rose-100 rounded-xl">
                      <div className="flex items-center gap-3 text-rose-600 font-bold text-xs">
                        <span className="size-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                        <span className="truncate">Enregistrement ({formatTime(recordingTime)})...</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={stopRecording}
                        className="h-9 sm:h-8 px-4 bg-rose-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Square className="size-3" /> Arrêter
                      </button>
                    </div>
                  ) : (
                    <input 
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={
                        uploadingFile 
                          ? "Chargement du fichier..." 
                          : submittingMessage 
                          ? "L'IA réfléchit..." 
                          : transcribing 
                          ? "Transcription..." 
                          : "Décrivez votre concept, ou attachez un fichier/lien..."
                      }
                      disabled={submittingMessage || transcribing || uploadingFile}
                      className="flex-1 min-w-0 bg-transparent border-0 px-3 py-3 text-xs md:text-sm font-medium text-slate-900 focus:ring-0 outline-hidden placeholder:text-slate-300"
                    />
                  )}
                  
                  {/* File Upload Hidden Input Trigger */}
                  {!isRecording && (
                    <div className="flex items-center gap-1 shrink-0">
                      <input 
                        type="file" 
                        id="chat-file-upload" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={submittingMessage || transcribing || uploadingFile}
                      />
                      <label 
                        htmlFor="chat-file-upload"
                        className={`h-10 w-10 shrink-0 border border-slate-200 hover:border-indigo-500/20 rounded-xl flex items-center justify-center transition-all cursor-pointer ${uploadingFile ? 'bg-indigo-50 text-indigo-600 animate-pulse' : 'bg-white text-slate-500 hover:text-slate-900'}`}
                        title="Importer un fichier (image < 5Mo, autre < 10Mo)"
                      >
                        {uploadingFile ? (
                          <Loader2 className="size-4 animate-spin text-indigo-600" />
                        ) : (
                          <Paperclip className="size-4" />
                        )}
                      </label>

                      {/* Paste Link Button Trigger */}
                      <button 
                        type="button"
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        disabled={submittingMessage || transcribing || uploadingFile}
                        className={`h-10 w-10 shrink-0 border border-slate-200 hover:border-indigo-500/20 rounded-xl flex items-center justify-center transition-all cursor-pointer ${showLinkInput ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-500 hover:text-slate-900'}`}
                        title="Attacher un lien internet"
                      >
                        <Link2 className="size-4" />
                      </button>
                      
                      {/* Microphone Button */}
                      <button 
                        type="button"
                        onClick={startRecording}
                        disabled={submittingMessage || transcribing || uploadingFile}
                        className={`h-10 w-10 shrink-0 border border-slate-200 hover:border-indigo-500/20 rounded-xl flex items-center justify-center transition-all cursor-pointer ${transcribing ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-500 hover:text-slate-900'}`}
                        title="Enregistrer un message vocal"
                      >
                        {transcribing ? (
                          <Loader2 className="size-4 animate-spin text-indigo-600" />
                        ) : (
                          <Mic className="size-4" />
                        )}
                      </button>
                    </div>
                  )}
                  
                  <button 
                    type="submit"
                    disabled={submittingMessage || transcribing || uploadingFile || (!inputMessage.trim() && !attachedFile)}
                    className="h-10 w-10 shrink-0 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md"
                  >
                     <Send className="size-4" />
                  </button>
               </form>
            </div>
          )}

        </main>
      </div>

      {/* MODALS */}
      <ScriptModals 
        isOpen={openModal} 
        onClose={() => setOpenModal(null)} 
        blocks={modalBlocks} 
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAuthModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-slate-400"><X /></button>
            <AuthForm />
          </div>
        </div>
      )}
    </div>
  )
}

function ScriptModals({ isOpen, onClose, blocks }: any) {
  const [isTeleprompter, setIsTeleprompter] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(2)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval: any
    if (isTeleprompter && isScrolling && scrollRef.current) {
      interval = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollBy({ top: scrollSpeed, behavior: 'auto' })
        }
      }, 50)
    }
    return () => clearInterval(interval)
  }, [isTeleprompter, isScrolling, scrollSpeed])

  if (!isOpen) return null

  if (isTeleprompter) {
    return (
      <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col animate-in fade-in duration-300">
        <div className="p-6 flex items-center justify-between border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => {setIsTeleprompter(false); setIsScrolling(false)}} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <ArrowRight className="size-6 rotate-180" />
            </button>
            <h3 className="font-black uppercase tracking-widest text-sm">Mode Prompteur</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/5 p-1 rounded-lg">
               <button onClick={() => setScrollSpeed(Math.max(1, scrollSpeed - 1))} className="size-8 flex items-center justify-center hover:bg-white/10 rounded-md">-</button>
               <span className="text-[10px] font-bold w-12 text-center uppercase tracking-tighter">Vitesse {scrollSpeed}</span>
               <button onClick={() => setScrollSpeed(Math.min(10, scrollSpeed + 1))} className="size-8 flex items-center justify-center hover:bg-white/10 rounded-md">+</button>
            </div>
            <button 
              onClick={() => setIsScrolling(!isScrolling)}
              className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${isScrolling ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}
            >
              {isScrolling ? 'Stop' : 'Démarrer'}
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-20 max-w-4xl mx-auto w-full scroll-smooth">
           <div className="space-y-20 pb-[80vh]">
              {blocks.map((block: any, i: number) => (
                <div key={i} className="space-y-6">
                   <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">
                      {(block.type || '').replace(/_/g, ' ')}
                   </div>
                   <p className="text-4xl md:text-6xl font-bold leading-tight">
                      {block.audio}
                   </p>
                </div>
              ))}
           </div>
        </div>
        
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none opacity-40">
           Lecture Directe
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
         <div className="p-6 md:p-8 border-b flex items-center justify-between bg-white sticky top-0 z-10">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
               {isOpen === 'full' ? 'Script Complet' : 'Découpage Technique'}
            </h3>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsTeleprompter(true)}
                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
               >
                  <Video className="size-3.5" /> Mode Prompteur
               </button>
               <button 
                 onClick={() => {
                    const text = blocks.map((b: any) => isOpen === 'full' ? b.audio : `${b.type}\nAudio: ${b.audio}\nVisuel: ${b.visual}`).join('\n\n')
                    navigator.clipboard.writeText(text)
                    toast.success("Copié !")
                 }}
                 className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all shadow-sm"
               >
                  <Copy className="size-3.5" /> Copier
               </button>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="size-6 text-slate-400" />
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-6 md:p-10">
            {isOpen === 'full' ? (
               <div className="space-y-8 max-w-2xl mx-auto">
                  {blocks.map((block: any, i: number) => (
                     <div key={i} className="space-y-3">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                           {(block.type || '').replace(/_/g, ' ')}
                        </span>
                        <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed">
                           {block.audio}
                        </p>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="space-y-6">
                  {blocks.map((block: any, i: number) => (
                     <Card key={i} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                           <div className="w-full md:w-36 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3">
                              <div className={`size-12 rounded-xl ${block.type === 'HOOK' ? 'bg-indigo-600' : 'bg-slate-900'} flex items-center justify-center text-white shrink-0`}>
                                 {block.type === 'HOOK' ? <Zap className="size-5" /> : <Play className="size-5" />}
                              </div>
                              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest break-words max-w-full leading-normal">
                                 {(block.type || '').replace(/_/g, ' ')}
                              </span>
                           </div>
                           <div className="flex-1 grid md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                 <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Audio</div>
                                 <p className="text-slate-700 font-medium leading-relaxed">{block.audio}</p>
                              </div>
                              <div className="space-y-3">
                                 <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Visuel suggéré</div>
                                 <p className="text-slate-500 text-sm leading-relaxed">{block.visual}</p>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            )}
         </div>
      </div>
    </div>
  )
}
