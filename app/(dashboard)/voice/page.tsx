"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import { useWorkspace } from "@/lib/workspace-context"
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
  const { activeWorkspace, refreshWorkspaces } = useWorkspace()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [checkingPlan, setCheckingPlan] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [newProfile, setNewProfile] = useState({
    name: "",
    content: "",
    niche: ""
  })

  useEffect(() => {
    const verifyPlan = async () => {
      try {
        const res = await fetch("/api/user/quotas")
        const data = await res.json()
        if (!data.error) {
          const plan = data.plan?.toLowerCase() || "free"
          if (plan === "free" || plan === "pro") {
            setIsLocked(true)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setCheckingPlan(false)
      }
    }
    verifyPlan()
    fetchProfiles()
  }, [])

  // Sync editor with active workspace voice profile (or active global profile for General)
  useEffect(() => {
    const loadActiveWorkspaceVoice = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      if (activeWorkspace?.id && activeWorkspace.voice_profile_id) {
        // Workspace en base avec profil de voix lié
        const { data, error } = await supabase
          .from("voice_profiles")
          .select("*")
          .eq("id", activeWorkspace.voice_profile_id)
          .maybeSingle();

        if (data && !error) {
          setNewProfile({
            name: data.name || "",
            content: data.content || "",
            niche: data.niche || ""
          });
          setProfiles([data]);
        } else {
          setProfiles([]);
        }
      } else if (!activeWorkspace?.id) {
        // Workspace virtuel (Général) -> charger le profil global actif
        const { data, error } = await supabase
          .from("voice_profiles")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (data && !error) {
          setNewProfile({
            name: data.name || "",
            content: data.content || "",
            niche: data.niche || ""
          });
          setProfiles([data]);
        } else {
          setNewProfile({ name: "", content: "", niche: "" });
          setProfiles([]);
        }
      } else {
        setNewProfile({ name: "", content: "", niche: "" });
        setProfiles([]);
      }
      setLoading(false)
    };
    loadActiveWorkspaceVoice();
  }, [activeWorkspace?.id, activeWorkspace?.voice_profile_id]);

  const fetchProfiles = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (activeWorkspace?.id && activeWorkspace.voice_profile_id) {
      const { data, error } = await supabase
        .from("voice_profiles")
        .select("*")
        .eq("id", activeWorkspace.voice_profile_id)
        .maybeSingle();

      if (!error && data) {
        setProfiles([data]);
      } else {
        setProfiles([]);
      }
    } else if (!activeWorkspace?.id) {
      const { data, error } = await supabase
        .from("voice_profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        setProfiles([data]);
      } else {
        setProfiles([]);
      }
    } else {
      setProfiles([]);
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

    if (activeWorkspace?.id && activeWorkspace.voice_profile_id) {
      // 1. UPDATE pour workspace DB existant
      const { error } = await supabase
        .from("voice_profiles")
        .update({
          name: newProfile.name,
          content: newProfile.content,
          niche: newProfile.niche
        })
        .eq("id", activeWorkspace.voice_profile_id);

      if (error) {
        toast.error("Erreur de mise à jour du style de voix.")
      } else {
        toast.success("Style de voix mis à jour avec succès !")
        fetchProfiles()
      }
    } else if (!activeWorkspace?.id) {
      // 2. Gestion pour Général (sans ID de workspace)
      // Chercher si un profil actif existe déjà
      const { data: activeProfile } = await supabase
        .from("voice_profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (activeProfile) {
        // UPDATE du profil actif de Général
        const { error } = await supabase
          .from("voice_profiles")
          .update({
            name: newProfile.name,
            content: newProfile.content,
            niche: newProfile.niche
          })
          .eq("id", activeProfile.id);

        if (error) {
          toast.error("Erreur de mise à jour du style de voix.")
        } else {
          toast.success("Style de voix Général mis à jour !")
          fetchProfiles()
        }
      } else {
        // INSERT d'un nouveau profil pour Général
        const { data: insertedData, error } = await supabase
          .from("voice_profiles")
          .insert({
            user_id: user.id,
            name: newProfile.name,
            content: newProfile.content,
            niche: newProfile.niche,
            is_active: true // Devient l'actif par défaut de Général
          })
          .select()
          .single();

        if (error) {
          toast.error("Erreur de création")
        } else {
          toast.success("Profil créé pour Général !")
          fetchProfiles()
        }
      }
    } else {
      // 3. INSERT pour un workspace DB qui n'a pas encore de profil lié
      const { data: insertedData, error } = await supabase
        .from("voice_profiles")
        .insert({
          user_id: user.id,
          name: newProfile.name,
          content: newProfile.content,
          niche: newProfile.niche,
          is_active: false
        })
        .select()
        .single();

      if (error) {
        toast.error("Erreur de création")
      } else {
        toast.success("Profil créé !")
        
        if (insertedData) {
          await supabase
            .from("workspaces")
            .update({ voice_profile_id: insertedData.id })
            .eq("id", activeWorkspace.id);
          
          refreshWorkspaces()
        }
        
        fetchProfiles()
      }
    }
    setSaving(false)
  }

  const handleActivate = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (activeWorkspace && activeWorkspace.id) {
      // Activer pour le workspace actuel
      const { error } = await supabase
        .from("workspaces")
        .update({ voice_profile_id: id })
        .eq("id", activeWorkspace.id)

      if (error) {
        toast.error("Erreur d'activation pour ce projet.")
      } else {
        toast.success("Style de voix activé pour ce projet !")
        refreshWorkspaces()
      }
    } else {
      // Comportement par défaut (global ou General)
      await supabase
        .from("voice_profiles")
        .update({ is_active: false })
        .eq("user_id", user.id)

      const { error } = await supabase
        .from("voice_profiles")
        .update({ is_active: true })
        .eq("id", id)

      if (error) {
        toast.error("Erreur d'activation")
      } else {
        toast.success("Style de voix activé de manière globale.")
        fetchProfiles()
      }
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
      
      if (activeWorkspace?.id && activeWorkspace.voice_profile_id === id) {
        await supabase
          .from("workspaces")
          .update({ voice_profile_id: null })
          .eq("id", activeWorkspace.id);
        refreshWorkspaces();
      }
      
      fetchProfiles()
    }
  }

  if (checkingPlan) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-in fade-in">
        <Loader2 className="size-8 text-violet-650 animate-spin" />
        <p className="text-gray-400 dark:text-gray-500 font-medium animate-pulse">Chargement de la page...</p>
      </div>
    )
  }

  if (isLocked) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-xl text-center space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
        
        <div className="size-16 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-650 dark:text-violet-400 flex items-center justify-center mx-auto shadow-sm border border-violet-100 dark:border-violet-500/20">
          <Sparkles className="size-8 animate-pulse text-violet-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fonctionnalité Premium</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-xs leading-relaxed">
            Cette fonctionnalité exclusive nécessite un plan <strong>Visionary</strong> ou <strong>Titan</strong> pour être débloquée.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-600 dark:text-gray-300 leading-normal text-left space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-violet-550 shrink-0" />
            <span>Profil de voix IA ultra-réaliste</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-violet-550 shrink-0" />
            <span>Copie automatique du ton et de l'énergie</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-violet-550 shrink-0" />
            <span>Générations de scripts de marque</span>
          </div>
        </div>

        <Link 
          href="/settings?tab=Abonnement"
          className="block w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
        >
          Débloquer maintenant
        </Link>
      </div>
    )
  }

  const hasLinkedVoice = activeWorkspace?.id 
    ? !!activeWorkspace.voice_profile_id 
    : profiles.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 1. RADAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
         <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Profil de Voix</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">
               Apprenez à ViralMind comment vous écrivez. Donnez-lui vos meilleurs scripts, emails ou textes, et l'IA imitera votre ton, votre vocabulaire et votre énergie.
            </p>
         </div>
         <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-full text-xs font-bold uppercase tracking-wider border border-violet-100 dark:border-violet-900/50 self-start md:self-center">
            <Sparkles className="size-3.5" /> Entraînement IA
         </div>
      </div>

      {/* 2. GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         
         {/* LEFT: CREATE / EDIT FORM (2/3 width for comfortable typing) */}
         <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
               <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold border border-violet-100 dark:border-violet-900/30">
                     <Plus className="size-5" />
                  </div>
                  <div>
                     <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {hasLinkedVoice ? "Édition du Style" : "Nouveau Style"}
                     </h2>
                     <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                        {hasLinkedVoice ? "Ajuster la voix du projet" : "Entraîner l'IA"}
                     </p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nom du profil</label>
                      <input 
                       value={newProfile.name}
                       onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                       placeholder="Ex: Mon style YouTube, Pro, Fun..." 
                       className="w-full bg-gray-50 dark:bg-gray-950 hover:bg-gray-100/50 dark:hover:bg-gray-950/80 border border-gray-200 dark:border-gray-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-sm focus:outline-hidden transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Niche / Domaine (Expertise)</label>
                      <input 
                       value={newProfile.niche}
                       onChange={(e) => setNewProfile({...newProfile, niche: e.target.value})}
                       placeholder="Ex: Fitness, Crypto, E-commerce..." 
                       className="w-full bg-gray-50 dark:bg-gray-950 hover:bg-gray-100/50 dark:hover:bg-gray-950/80 border border-gray-200 dark:border-gray-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-sm focus:outline-hidden transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                     />
                  </div>
                  
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vos textes (Min 500 mots)</label>
                      <textarea 
                       value={newProfile.content}
                       onChange={(e) => setNewProfile({...newProfile, content: e.target.value})}
                       placeholder="Collez ici des scripts ou des textes que vous avez écrits..." 
                       rows={12}
                       className="w-full bg-gray-50 dark:bg-gray-950 hover:bg-gray-100/50 dark:hover:bg-gray-950/80 border border-gray-200 dark:border-gray-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl py-3 px-4 text-sm focus:outline-hidden transition-all text-gray-900 dark:text-gray-300 resize-none leading-relaxed"
                     />
                  </div>
                  
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3.5 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <><Save className="size-4" /> {hasLinkedVoice ? "Mettre à jour le Style" : "Sauvegarder & Analyser"}</>}
                  </button>
               </div>
            </div>
         </div>

         {/* RIGHT: LIST PROFILES / SIDEBAR (1/3 width) */}
         <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
               <p className="text-xs font-bold text-gray-405 dark:text-gray-500 uppercase tracking-widest">Style de Voix du Workspace</p>
               <p className="text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase">
                  {profiles.length ? "1 Voix Liée" : "Aucune Voix"}
               </p>
            </div>

            {loading && profiles.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <Loader2 className="size-6 text-violet-500 animate-spin" />
               </div>
            ) : profiles.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-center space-y-4 shadow-sm">
                  <div className="size-16 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow-xs text-gray-300 dark:text-gray-600">
                     <UserRound className="size-8" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Aucun profil lié</p>
                     <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Configurez ou entraînez une voix sur la gauche pour l'associer à ce projet.</p>
                  </div>
               </div>
            ) : (
               <div className="flex flex-col gap-4">
                  {profiles.map((profile) => {
                    const isProfileActive = activeWorkspace && activeWorkspace.id
                      ? activeWorkspace.voice_profile_id === profile.id
                      : profile.is_active;

                    return (
                     <div 
                       key={profile.id}
                       className={`
                         p-5 rounded-2xl border transition-all duration-300 relative group shadow-xs
                         ${isProfileActive 
                           ? 'bg-white dark:bg-gray-900 border-violet-500 dark:border-violet-400' 
                           : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}
                       `}
                     >
                        {isProfileActive && (
                          <div className="absolute top-4 right-4 text-violet-600 dark:text-violet-400">
                            <CheckCircle2 className="size-5" />
                          </div>
                        )}
                        
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{profile.name}</h4>
                              {profile.niche && (
                                <p className="text-[10px] text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider">{profile.niche}</p>
                              )}
                              <div className="flex items-center gap-1.5">
                                 <FileText className="size-3.5 text-gray-400 dark:text-gray-500" />
                                 <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                                   {profile.content.length} Caractères d'entraînement
                                 </p>
                              </div>
                           </div>

                           <div className="pt-2 flex items-center gap-2">
                              {!isProfileActive && (
                                <button 
                                  onClick={() => handleActivate(profile.id)}
                                  className="flex-1 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 py-2 rounded-xl text-xs font-bold transition-all border border-gray-200 dark:border-gray-800 cursor-pointer"
                                >
                                  Activer
                                </button>
                              )}
                              <button 
                                onClick={() => handleDelete(profile.id)}
                                className="size-9 flex items-center justify-center bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                 <Trash2 className="size-4" />
                              </button>
                           </div>
                        </div>
                     </div>
                    )
                  })}
               </div>
            )}
         </div>
      </div>
    </div>
  )
}
