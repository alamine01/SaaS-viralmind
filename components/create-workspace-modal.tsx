"use client"

import { useState, useEffect } from "react"
import { X, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useWorkspace } from "@/lib/workspace-context"

export function CreateWorkspaceModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [voiceProfiles, setVoiceProfiles] = useState<any[]>([])
  const [selectedVoiceProfileId, setSelectedVoiceProfileId] = useState<string>("auto")
  const { refreshWorkspaces } = useWorkspace()

  useEffect(() => {
    if (isOpen) {
      supabase.from("voice_profiles").select("id, name").order("name").then(({ data }) => {
        if (data) setVoiceProfiles(data)
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCreate = async () => {
    if (!name) return
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Vous devez être connecté")

      let finalVoiceProfileId = null;

      if (selectedVoiceProfileId === "auto") {
        // Créer automatiquement un profil de voix par défaut pour ce projet
        const { data: voiceData, error: voiceError } = await supabase
          .from("voice_profiles")
          .insert({
            user_id: user.id,
            name: `${name} - Style de Voix`,
            content: `Profil de voix par défaut pour le projet ${name}. Entraînez-moi en collant vos propres textes d'entraînement sur la page profil de voix.`
          })
          .select()
          .single();

        if (voiceError) {
          console.error("Auto Voice creation failed:", voiceError);
        } else if (voiceData) {
          finalVoiceProfileId = voiceData.id;
        }
      } else if (selectedVoiceProfileId !== "none") {
        finalVoiceProfileId = selectedVoiceProfileId;
      }

      // Tentative de sauvegarde dans Supabase
      const { error } = await supabase
        .from("workspaces")
        .insert({
          user_id: user.id,
          name: name,
          slug: name, // On garde le nom comme slug pour l'instant
          color: 'bg-indigo-400',
          voice_profile_id: finalVoiceProfileId
        })

      if (error) {
        // Si la table n'existe pas encore, on se replie sur le localStorage (pour ne pas bloquer l'utilisateur)
        console.warn("Table workspaces indisponible, repli local")
        const existing = JSON.parse(localStorage.getItem("custom_workspaces") || "[]")
        if (!existing.includes(name)) {
          localStorage.setItem("custom_workspaces", JSON.stringify([...existing, name]))
          toast.success(`Workspace "${name}" créé (Mode Local)`)
        } else {
          throw new Error("Ce workspace existe déjà")
        }
      } else {
        toast.success(`Workspace "${name}" créé et synchronisé !`)
      }

      await refreshWorkspaces()
      onClose()
      setName("")
      setSelectedVoiceProfileId("auto")
      
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Plus className="size-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Nouveau Projet</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="size-6 text-slate-400" />
          </button>
        </div>

        <div className="p-10 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom du workspace</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Client Mode, Projet Gamma..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-hidden transition-all"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profil de voix associé</label>
            <select 
              value={selectedVoiceProfileId}
              onChange={(e) => setSelectedVoiceProfileId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-hidden transition-all cursor-pointer text-slate-700"
            >
              <option value="auto">Créer un profil de voix par défaut</option>
              {voiceProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="none">Aucun profil de voix (Neutre)</option>
            </select>
          </div>
          
          <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
            <div className="flex gap-3">
              <Sparkles className="size-4 text-indigo-600 shrink-0 mt-1" />
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                Ce projet sera synchronisé sur votre compte et restera privé.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Annuler
          </button>
          <button 
            onClick={handleCreate}
            disabled={loading || !name}
            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-xl shadow-slate-200"
          >
            {loading ? "Création..." : "Créer le Projet"}
          </button>
        </div>
      </div>
    </div>
  )
}
