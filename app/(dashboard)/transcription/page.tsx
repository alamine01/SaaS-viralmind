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
  RotateCw
} from "lucide-react"
import { toast } from "sonner"
export default function TranscriptionPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
          <Mic2 className="size-3" />
          Intelligence Vocale
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
          Transcription <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Instantanée</span>
        </h1>
        <p className="text-slate-500 font-medium max-w-lg mx-auto text-sm md:text-base">
          Récupérez le texte de n'importe quelle vidéo TikTok ou YouTube en un clic.
        </p>
      </div>

      {/* Input */}
      <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[32px] bg-white overflow-hidden p-2">
        <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center gap-4 px-6 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-indigo-200 transition-colors">
            <LinkIcon className="size-5 text-slate-400" />
            <input 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Collez le lien de la vidéo ici..." 
              className="w-full bg-transparent py-5 text-sm font-bold text-slate-900 outline-hidden placeholder:text-slate-300"
            />
          </div>
          <button 
            onClick={() => handleTranscribe()}
            disabled={loading || !url}
            className="px-10 h-16 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <><Sparkles className="size-4" /> Extraire le texte</>}
          </button>
        </CardContent>
      </Card>

      {/* Result */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center py-20 space-y-6">
            <div className="size-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-pulse">
              <Mic2 className="size-10" />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-bounce">IA en cours d'écoute...</p>
          </div>
        ) : transcript ? (
          <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[40px] bg-white overflow-hidden border border-slate-50 animate-in slide-in-from-bottom-8 duration-500">
            <CardContent className="p-8 md:p-14 space-y-10">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/10">
                    <FileText className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">Résultat de l'analyse</h3>
                    {bilingual.isBilingual && (
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Vidéo multilingue détectée</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  {bilingual.isBilingual && (
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/50 w-full sm:w-auto">
                      <button 
                        onClick={() => toggleLanguage('original')}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all text-center ${activeLang === 'original' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         Original
                      </button>
                      <button 
                        onClick={() => toggleLanguage('french')}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all text-center ${activeLang === 'french' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         Français
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleTranscribe(true)}
                      disabled={loading}
                      className="px-5 py-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                    >
                      <RotateCw className="size-3.5" />
                      Réanalyser
                    </button>

                    <button 
                      onClick={handleCopy}
                      className={`px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-xl'}`}
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-10 bg-slate-50 rounded-[32px] text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-medium border border-slate-100">
                {transcript}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20 space-y-6 opacity-40">
            <div className="size-24 rounded-[40px] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-200">
              <Mic2 className="size-12" />
            </div>
            <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">En attente d'un lien</p>
          </div>
        )}
      </div>

    </div>
  )
}
