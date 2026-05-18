"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { 
  User, 
  Bell, 
  AppWindow, 
  CreditCard, 
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Globe,
  Settings as SettingsIcon,
  Video,
  Sparkles,
  Loader2,
  CheckCircle2
} from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("Mon compte")
  const [profile, setProfile] = useState({
    username: "",
    niche: "",
    platform: "TikTok"
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (data) {
          setProfile({
            username: data.full_name || "",
            niche: data.plan === 'free' ? "Général" : "Business", // Placeholder logic
            platform: "TikTok"
          })
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.username
        })
        .eq("id", user.id)

      if (error) throw error
      toast.success("Profil mis à jour avec succès !")
    } catch (error: any) {
      toast.error("Erreur lors de la sauvegarde : " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    { name: "Mon compte", icon: User },
    { name: "Notifications", icon: Bell },
    { name: "Abonnement", icon: CreditCard },
  ]

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-medium">Chargement de vos réglages...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-10 animate-in fade-in duration-500 pb-20">
      
      {/* Left Settings Navigation */}
      <aside className="col-span-12 lg:col-span-3 space-y-8">
         <div>
            <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Réglages Compte</h4>
            <ul className="space-y-1">
               {sections.map((item) => (
                 <li key={item.name}>
                    <button 
                      onClick={() => setActiveTab(item.name)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                        ${activeTab === item.name ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}
                      `}
                    >
                       <item.icon className={`size-4 ${activeTab === item.name ? 'text-indigo-600' : 'text-slate-400'}`} />
                       {item.name}
                    </button>
                 </li>
               ))}
            </ul>
         </div>

         <div>
            <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Aide</h4>
            <a 
              href="https://wa.me/221770000000" // Remplace par ton numéro WhatsApp réel
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
            >
               <MessageSquare className="size-4 text-slate-400" />
               Support technique
            </a>
         </div>
      </aside>

      {/* Main Settings Content Area */}
      <main className="col-span-12 lg:col-span-9 space-y-12">
         <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeTab}</h1>
            {activeTab === "Mon compte" && (
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer les modifications"}
              </button>
            )}
         </div>

         {activeTab === "Mon compte" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Account Avatar Section */}
               <section className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                  <div className="size-20 rounded-full bg-slate-900 flex items-center justify-center border-4 border-white shadow-xl">
                     <Video className="size-8 text-indigo-400" />
                  </div>
                   <div className="space-y-4 flex-1">
                      <div className="space-y-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adresse email</p>
                         <p className="text-sm font-bold text-slate-900">{user?.email}</p>
                      </div>
                      <div className="flex flex-col gap-2.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nom complet</label>
                         <input 
                           value={profile.username}
                           onChange={(e) => setProfile({...profile, username: e.target.value})}
                           placeholder="Votre nom ou pseudo..." 
                           className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-hidden transition-all shadow-xs"
                         />
                      </div>
                      <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                         Changer l'image
                      </button>
                   </div>
               </section>

               {/* Smart Sync Section (Toggle) */}
               <section className="pt-8 border-t border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                     <h3 className="text-lg font-bold text-slate-900">Analyse automatique des tendances</h3>
                     <p className="text-[13px] text-slate-400 font-medium leading-relaxed">Recevez des notifications dès qu'un pattern viral est détecté dans votre niche.</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[11px] font-bold text-slate-400 uppercase">Actif</span>
                     <div className="w-11 h-6 bg-indigo-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 size-4 bg-white rounded-full shadow-sm"></div>
                     </div>
                  </div>
               </section>
            </div>
         )}

         {activeTab === "Notifications" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden">
                  <div className="p-8 space-y-6">
                     {[
                        { title: "Alertes Radar", desc: "Soyez prévenu par email dès qu'une opportunité virale est détectée.", active: true },
                        { title: "Rapport Hebdomadaire", desc: "Un résumé de vos performances et des tendances de la semaine.", active: false },
                        { title: "Conseils Stratégiques", desc: "Recevez des hooks et des idées de scripts personnalisés.", active: true },
                     ].map((notif, i) => (
                        <div key={i} className={`flex items-center justify-between ${i !== 0 ? 'pt-6 border-t border-slate-50' : ''}`}>
                           <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                              <p className="text-xs text-slate-400 font-medium">{notif.desc}</p>
                           </div>
                           <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${notif.active ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                              <div className={`absolute top-1 size-3 bg-white rounded-full transition-all ${notif.active ? 'right-1' : 'left-1'}`}></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {activeTab === "Abonnement" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
               <div className="text-center space-y-3">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Choisissez le plan adapté à vos ambitions</h2>
                  <p className="text-slate-500 font-medium max-w-lg mx-auto">Passez à la vitesse supérieure avec les outils de détection virale et d'analyse prédictive.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  {/* PRO PLAN */}
                  <div className="bg-[#0f111a] border border-slate-800 rounded-[32px] p-6 lg:p-8 space-y-6 flex flex-col shadow-2xl text-white transition-transform hover:scale-[1.02]">
                     <div className="space-y-3">
                        <h3 className="text-xl lg:text-2xl font-bold">Pro</h3>
                        <p className="text-[11px] lg:text-xs text-slate-400 leading-relaxed font-medium">Croissance rapide sur les réseaux.</p>
                        <div className="flex items-baseline gap-1">
                           <span className="text-3xl lg:text-4xl font-black">$49</span>
                           <span className="text-slate-500 font-bold">/mois</span>
                        </div>
                     </div>
                     <div className="h-px bg-slate-800 w-full" />
                     <ul className="space-y-3 flex-1">
                        {[
                           "Flux de vidéos performantes",
                           "Playbooks personnalisés",
                           "Générateur d'idées et scripts",
                           "Suivi multi-plateformes",
                           "Espaces par niche",
                        ].map((item, i) => (
                           <li key={i} className="flex items-start gap-3 text-[11px] lg:text-xs font-medium text-slate-300">
                              <CheckCircle2 className="size-4 text-indigo-500 shrink-0" /> {item}
                           </li>
                        ))}
                     </ul>
                     <button className="w-full py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl lg:rounded-2xl text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all shadow-xl">
                        Commencer avec Pro
                     </button>
                  </div>

                  {/* VISIONARY PLAN */}
                  <div className="bg-[#0f111a] border-2 border-indigo-500 rounded-[32px] p-6 lg:p-8 space-y-6 flex flex-col shadow-2xl shadow-indigo-500/20 text-white relative lg:scale-105 z-10 transition-transform hover:scale-[1.07]">
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/40 whitespace-nowrap">Populaire</div>
                     <div className="space-y-3">
                        <h3 className="text-xl lg:text-2xl font-bold">Visionary</h3>
                        <p className="text-[11px] lg:text-xs text-slate-400 leading-relaxed font-medium">Maximum de levier pour experts.</p>
                        <div className="flex items-baseline gap-1">
                           <span className="text-3xl lg:text-4xl font-black">$99</span>
                           <span className="text-slate-500 font-bold">/mois</span>
                        </div>
                     </div>
                     <div className="h-px bg-slate-800 w-full" />
                     <ul className="space-y-3 flex-1">
                        <li className="text-[10px] lg:text-[11px] font-black text-indigo-400 uppercase tracking-widest">Tout de Pro, plus :</li>
                        {[
                           "250 crédits d'analyse profonde",
                           "Support prioritaire 24/7",
                           "Accès anticipé patterns",
                           "Analyses avancées",
                        ].map((item, i) => (
                           <li key={i} className="flex items-start gap-3 text-[11px] lg:text-xs font-medium text-slate-300">
                              <CheckCircle2 className="size-4 text-indigo-500 shrink-0" /> {item}
                           </li>
                        ))}
                     </ul>
                     <button className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl lg:rounded-2xl text-[11px] lg:text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 transition-all">
                        Devenir Visionary
                     </button>
                  </div>

                  {/* TITAN PLAN */}
                  <div className="bg-[#0f111a] border border-slate-800 rounded-[32px] p-6 lg:p-8 space-y-6 flex flex-col shadow-2xl text-white transition-transform hover:scale-[1.02] md:col-span-2 lg:col-span-1">
                     <div className="space-y-3">
                        <h3 className="text-xl lg:text-2xl font-bold">Titan</h3>
                        <p className="text-[11px] lg:text-xs text-slate-400 leading-relaxed font-medium">Stratégies à grande échelle.</p>
                        <div className="flex items-baseline gap-1">
                           <span className="text-3xl lg:text-4xl font-black">$499</span>
                           <span className="text-slate-500 font-bold">/mois</span>
                        </div>
                     </div>
                     <div className="h-px bg-slate-800 w-full" />
                     <ul className="space-y-3 flex-1">
                        <li className="text-[10px] lg:text-[11px] font-black text-indigo-400 uppercase tracking-widest">Tout de Visionary, plus :</li>
                        {[
                           "Accès à l'API complète",
                           "Gestion d'équipe (5 invités)",
                           "1500 crédits d'analyse",
                           "Consultation stratégique",
                        ].map((item, i) => (
                           <li key={i} className="flex items-start gap-3 text-[11px] lg:text-xs font-medium text-slate-300">
                              <CheckCircle2 className="size-4 text-indigo-500 shrink-0" /> {item}
                           </li>
                        ))}
                     </ul>
                     <button className="w-full py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl lg:rounded-2xl text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all shadow-xl">
                        Passer à Titan
                     </button>
                  </div>
               </div>
            </div>
         )}
      </main>

    </div>
  )
}
