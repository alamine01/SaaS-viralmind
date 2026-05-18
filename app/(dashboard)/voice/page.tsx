"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { 
  UserRound, 
  Plus, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  FileText,
  Save
} from "lucide-react"

export default function VoiceProfilePage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [newProfile, setNewProfile] = useState({
    name: "",
    content: "",
    niche: ""
  })

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("voice_profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Erreur de chargement")
    } else {
      setProfiles(data || [])
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!newProfile.name || !newProfile.content) {
      toast.error("Veuillez remplir le nom et le contenu")
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from("voice_profiles")
      .insert({
        user_id: user.id,
        name: newProfile.name,
        content: newProfile.content,
        niche: newProfile.niche,
        is_active: profiles.length === 0 // Le premier devient actif par défaut
      })

    if (error) {
      toast.error("Erreur de création")
    } else {
      toast.success("Profil créé !")
      setNewProfile({ name: "", content: "", niche: "" })
      setIsCreating(false)
      fetchProfiles()
    }
    setSaving(false)
  }

  const handleActivate = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // On désactive tout
    await supabase
      .from("voice_profiles")
      .update({ is_active: false })
      .eq("user_id", user.id)

    // On active celui-là
    const { error } = await supabase
      .from("voice_profiles")
      .update({ is_active: true })
      .eq("id", id)

    if (error) {
      toast.error("Erreur d'activation")
    } else {
      toast.success("Style de voix activé")
      fetchProfiles()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("voice_profiles")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error("Erreur de suppression")
    } else {
      toast.success("Profil supprimé")
      fetchProfiles()
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/5">
          <Sparkles className="size-3" /> Entraînement IA
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Profil de <span className="text-indigo-600">Voix</span></h1>
        <p className="text-slate-500 font-medium max-w-2xl text-sm leading-relaxed">
          Apprenez à ViralMind comment vous écrivez. Donnez-lui vos meilleurs scripts, emails ou textes, et l'IA imitera votre ton, votre vocabulaire et votre énergie.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left: Create Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
               <div className="size-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Plus className="size-5" />
               </div>
               <div>
                  <p className="text-sm font-bold text-slate-900">Nouveau Style</p>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tighter">Entraîner l'IA</p>
               </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom du profil</label>
               <input 
                 value={newProfile.name}
                 onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                 placeholder="Ex: Mon style YouTube, Pro, Fun..." 
                 className="w-full bg-white border-2 border-indigo-500/20 rounded-2xl px-5 py-3 text-sm font-bold focus:border-indigo-500 outline-hidden transition-all shadow-sm"
               />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Niche / Domaine (Expertise)</label>
               <input 
                 value={newProfile.niche}
                 onChange={(e) => setNewProfile({...newProfile, niche: e.target.value})}
                 placeholder="Ex: Fitness, Crypto, E-commerce..." 
                 className="w-full bg-white border-2 border-indigo-500/20 rounded-2xl px-5 py-3 text-sm font-bold focus:border-indigo-500 outline-hidden transition-all shadow-sm"
               />
            </div>
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Vos textes (Min 500 mots)</label>
                  <textarea 
                    value={newProfile.content}
                    onChange={(e) => setNewProfile({...newProfile, content: e.target.value})}
                    placeholder="Collez ici des scripts ou des textes que vous avez écrits..." 
                    rows={8}
                    className="w-full bg-slate-50 border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
               </div>
               <button 
                 onClick={handleSave}
                 disabled={saving}
                 className="w-full bg-slate-900 hover:bg-black text-white rounded-xl py-4 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {saving ? <Loader2 className="size-4 animate-spin" /> : <><Save className="size-4" /> Sauvegarder & Analyser</>}
               </button>
            </div>
          </div>
        </div>

        {/* Right: List Profiles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vos Styles Enregistrés</p>
             <p className="text-[11px] font-semibold text-slate-300 uppercase">{profiles.length} Profils</p>
          </div>

          {loading && profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
               <Loader2 className="size-8 text-slate-300 animate-spin" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 text-center space-y-4">
               <div className="size-16 rounded-3xl bg-white flex items-center justify-center shadow-sm text-slate-300">
                  <UserRound className="size-8" />
               </div>
               <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-600">Aucun profil de voix</p>
                  <p className="text-xs text-slate-400 font-medium">Commencez par en créer un à gauche pour personnaliser vos scripts.</p>
               </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
               {profiles.map((profile) => (
                 <div 
                   key={profile.id}
                   className={`
                     p-6 rounded-[28px] border transition-all duration-300 relative group
                     ${profile.is_active 
                       ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-100/50' 
                       : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}
                   `}
                 >
                    {profile.is_active && (
                      <div className="absolute top-4 right-4 text-indigo-600">
                        <CheckCircle2 className="size-5 fill-indigo-50" />
                      </div>
                    )}
                    
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <h4 className="font-bold text-slate-900">{profile.name}</h4>
                          </div>
                          {profile.niche && (
                            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-0.5">{profile.niche}</p>
                          )}
                          <div className="flex items-center gap-2">
                             <FileText className="size-3 text-slate-400" />
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                               {profile.content.length} Caractères d'entraînement
                             </p>
                          </div>
                       </div>

                       <div className="pt-2 flex items-center gap-2">
                          {!profile.is_active && (
                            <button 
                              onClick={() => handleActivate(profile.id)}
                              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                            >
                              Activer
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(profile.id)}
                            className="size-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100"
                          >
                             <Trash2 className="size-4" />
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
