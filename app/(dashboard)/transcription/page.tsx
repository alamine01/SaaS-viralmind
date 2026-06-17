"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Mic2, 
  Loader2, 
  FileText, 
  Copy, 
  Check, 
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  RotateCw,
  Download
} from "lucide-react"
import { toast } from "sonner"
export default function TranscriptionPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [copied, setCopied] = useState(false)
  const [bilingual, setBilingual] = useState<{ original: string, french: string, isBilingual: boolean }>({
    original: "",
    french: "",
    isBilingual: false
  })
  const [activeLang, setActiveLang] = useState<'original' | 'french'>('original')

  const handleTranscribe = async (forceRefresh = false) => {
    if (!url) return
    setLoading(true)
    setTranscript("")
    setBilingual({ original: "", french: "", isBilingual: false })
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, forceRefresh })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      const rawText = data.transcript || data.full_transcript || "Aucune transcription trouvée."
      setTranscript(rawText)
      
      // Parse bilingual transcript
      if (rawText.startsWith("{") && rawText.endsWith("}")) {
        try {
          const parsed = JSON.parse(rawText)
          if (parsed.original && parsed.french) {
            setBilingual({
              original: parsed.original,
              french: parsed.french,
              isBilingual: true
            })
            setActiveLang('original')
            setTranscript(parsed.original)
            toast.success("Transcription terminée (Multilingue) !")
            return
          }
        } catch (e) {}
      }
      
      setBilingual({ original: rawText, french: rawText, isBilingual: false })
      toast.success("Transcription terminée !")
    } catch (error: any) {
      toast.error("Erreur : " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!url) return
    setDownloadLoading(true)
    try {
      const res = await fetch("/api/download-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      if (data.downloadUrl) {
        const link = document.createElement("a")
        link.href = data.downloadUrl
        link.setAttribute("download", data.filename || "video.mp4")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Téléchargement lancé !")
      } else {
        throw new Error("Lien de téléchargement indisponible.")
      }
    } catch (error: any) {
      toast.error("Erreur lors du téléchargement : " + error.message)
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleCopy = () => {
    if (!transcript) return
    navigator.clipboard.writeText(transcript)
    setCopied(true)
    toast.success("Copié !")
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleLanguage = (lang: 'original' | 'french') => {
    setActiveLang(lang)
    setTranscript(lang === 'original' ? bilingual.original : bilingual.french)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-violet-200 dark:border-violet-500/30">
          <Mic2 className="size-3" />
          Intelligence Vocale
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          Transcription <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500">Instantanée</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-lg mx-auto text-sm md:text-base">
          Récupérez le texte de n'importe quelle vidéo TikTok ou YouTube en un clic.
        </p>
      </div>

      {/* Input */}
      <Card className="border-none shadow-md rounded-2xl bg-white dark:bg-gray-800 overflow-hidden p-2 border border-gray-200 dark:border-gray-700/60">
        <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center gap-4 px-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:border-violet-500 transition-colors">
            <LinkIcon className="size-5 text-gray-400 dark:text-gray-500" />
            <input 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Collez le lien de la vidéo ici..." 
              className="w-full bg-transparent py-5 text-sm font-bold text-gray-800 dark:text-gray-100 outline-hidden placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <button 
            onClick={() => handleTranscribe()}
            disabled={loading || !url}
            className="px-10 h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-violet-600 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <><Sparkles className="size-4" /> Extraire le texte</>}
          </button>
        </CardContent>
      </Card>

      {/* Result */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center py-20 space-y-6">
            <div className="size-20 rounded-2xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 animate-pulse border border-violet-200 dark:border-violet-500/30">
              <Mic2 className="size-10" />
            </div>
            <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px] animate-bounce">IA en cours d'écoute...</p>
          </div>
        ) : transcript ? (
          <Card className="border-none shadow-md rounded-2xl bg-white dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700/60 animate-in slide-in-from-bottom-8 duration-500">
            <CardContent className="p-8 md:p-12 space-y-10">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
                    <FileText className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight">Résultat de l'analyse</h3>
                    {bilingual.isBilingual && (
                      <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mt-0.5">Vidéo multilingue détectée</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  {bilingual.isBilingual && (
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex items-center border border-gray-200 dark:border-gray-700/60 w-full sm:w-auto">
                      <button 
                        onClick={() => toggleLanguage('original')}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all text-center ${activeLang === 'original' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      >
                         Original
                      </button>
                      <button 
                        onClick={() => toggleLanguage('french')}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all text-center ${activeLang === 'french' ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      >
                         Français
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleTranscribe(true)}
                      disabled={loading}
                      className="flex-1 sm:flex-initial px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <RotateCw className="size-3.5" />
                      Réanalyser
                    </button>

                    <button 
                      onClick={handleCopy}
                      className={`flex-1 sm:flex-initial px-5 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-violet-600 shadow-sm'}`}
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? 'Copié' : 'Copier'}
                    </button>

                    <button 
                      onClick={handleDownload}
                      disabled={downloadLoading}
                      className="flex-1 sm:flex-initial px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {downloadLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                      {downloadLoading ? 'Téléchargement...' : 'Télécharger'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap font-medium border border-gray-200 dark:border-gray-700/60">
                {transcript}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20 space-y-6 opacity-40">
            <div className="size-24 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-300 dark:text-gray-600">
              <Mic2 className="size-12" />
            </div>
            <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">En attente d'un lien</p>
          </div>
        )}
      </div>

    </div>
  )
}
