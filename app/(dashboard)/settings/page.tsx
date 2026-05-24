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

  // QUOTA & SUBSCRIPTION STATE
  const [quotas, setQuotas] = useState<any>(null)
  const [loadingQuotas, setLoadingQuotas] = useState(true)

  useEffect(() => {
    fetchProfile()
    fetchQuotas()
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

  const fetchQuotas = async () => {
    try {
      setLoadingQuotas(true)
      const res = await fetch("/api/user/quotas")
      const data = await res.json()
      if (!data.error) {
        setQuotas(data)
      }
    } catch (e) {
      console.error("Error fetching quotas:", e)
    } finally {
      setLoadingQuotas(false)
    }
  }

  const handleUpgrade = async (planName: string) => {
    try {
      setSaving(true)
      const res = await fetch("/api/user/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      toast.success(data.message || `Félicitations ! Vous êtes passé au plan ${planName.toUpperCase()} !`, {
        icon: "🎉",
        duration: 4000
      })
      
      // Re-fetch quotas and profile to update dashboard and state
      await fetchQuotas()
      await fetchProfile()
      
      // Notify other components (like sidebar) to update real-time quotas
      window.dispatchEvent(new Event("quota-updated"))
    } catch (error: any) {
      toast.error("Erreur de transaction : " + error.message)
    } finally {
      setSaving(false)
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
                
                {/* 1. Suivi des Quotas Réels */}
                {quotas && (
                   <div className="bg-white border border-slate-100 rounded-[32px] p-6 md:p-8 shadow-xl shadow-slate-100/50 space-y-6 md:space-y-8 animate-in fade-in duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-6">
                         <div className="space-y-1">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Statut du compte</span>
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                               Forfait Actuel : <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 capitalize font-black">{quotas.plan}</span>
                            </h3>
                         </div>
                         <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-bold border border-indigo-100 shadow-sm self-start sm:self-center">
                            <Sparkles className="size-4 animate-pulse text-indigo-500" />
                            Simulation de Paiement Active
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                         {/* Quota Scripts */}
                         <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50 shadow-inner">
                            <div className="flex items-center justify-between">
                               <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-800">Scripts du jour (Freemium)</h4>
                                  <p className="text-xs text-slate-400 font-medium">Réinitialisation automatique chaque jour</p>
                               </div>
                               <span className="text-sm font-bold text-slate-900 bg-white border border-slate-100 px-3 py-1 rounded-xl shadow-xs">
                                  {quotas.daily_script_count} / {quotas.limits.dailyScripts === 9999 ? "∞" : quotas.limits.dailyScripts}
                               </span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out rounded-full"
                                  style={{ width: `${Math.min(100, (quotas.daily_script_count / (quotas.limits.dailyScripts || 1)) * 100)}%` }}
                               />
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold italic">
                               {quotas.limits.dailyScripts === 9999
                                 ? "Générations illimitées actives !"
                                 : quotas.limits.dailyScripts - quotas.daily_script_count > 0 
                                   ? `Il vous reste ${quotas.limits.dailyScripts - quotas.daily_script_count} génération(s) aujourd'hui.`
                                   : "Limite journalière atteinte. Passez à l'abonnement supérieur !"}
                            </p>
                         </div>

                         {/* Quota Analyses */}
                         <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50 shadow-inner">
                            <div className="flex items-center justify-between">
                               <div className="space-y-1">
                                  <h4 className="text-sm font-black text-slate-800">Analyses de concurrents mensuelles</h4>
                                  <p className="text-xs text-slate-400 font-medium">Zero-Quota Cache : l'analyse du cache n'impacte pas votre quota !</p>
                               </div>
                               <span className="text-sm font-bold text-slate-900 bg-white border border-slate-100 px-3 py-1 rounded-xl shadow-xs">
                                  {quotas.monthly_analysis_count} / {quotas.limits.monthlyAnalysis}
                               </span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out rounded-full"
                                  style={{ width: `${Math.min(100, (quotas.monthly_analysis_count / (quotas.limits.monthlyAnalysis || 1)) * 100)}%` }}
                               />
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold italic">
                               {quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count > 0 
                                 ? `Il vous reste ${quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count} analyse(s) profonde(s) ce mois-ci.`
                                 : "Quota mensuel dépassé. Passez à l'abonnement supérieur !"}
                            </p>
                         </div>
                      </div>
                   </div>
                )}

                <div className="text-center space-y-3">
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">Choisissez le plan adapté à vos ambitions</h2>
                   <p className="text-slate-500 font-medium max-w-lg mx-auto">Débloquez la puissance des analyses virales en temps réel et libérez votre créativité.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                   
                   {/* Plan Card Component — render each plan */}
                   {([
                      {
                        id: "free",
                        name: "Gratuit",
                        desc: "Pour tester l'outil de base.",
                        price: "$0",
                        period: "/toujours",
                        popular: false,
                        upgradeLabel: "Rétrograder",
                        features: [
                          "5 analyses profondes / mois",
                          "3 scripts IA / jour (Freemium)",
                          "Historique des analyses en cache",
                          "Profils de voix limités",
                        ],
                        prefix: null,
                      },
                      {
                        id: "pro",
                        name: "Pro",
                        desc: "Croissance rapide des réseaux.",
                        price: "$49",
                        period: "/mois",
                        popular: false,
                        upgradeLabel: "Choisir Pro",
                        features: [
                          "50 analyses profondes / mois",
                          "20 scripts IA / jour",
                          "Zéro-Quota Cache illimité",
                          "Playbooks d'analyse IA concurrents",
                          "Espaces par niche configurables",
                        ],
                        prefix: null,
                      },
                      {
                        id: "visionary",
                        name: "Visionary",
                        desc: "Levier maximal pour experts.",
                        price: "$99",
                        period: "/mois",
                        popular: true,
                        upgradeLabel: "Devenir Visionary",
                        features: [
                          "250 analyses profondes / mois",
                          "100 scripts IA / jour",
                          "Support prioritaire ultra-rapide 24/7",
                          "Accès anticipé aux nouveaux modèles",
                          "Audit de concurrents approfondi illimité",
                        ],
                        prefix: "Tout de Pro, plus :",
                      },
                      {
                        id: "titan",
                        name: "Titan",
                        desc: "Stratégies industrielles.",
                        price: "$499",
                        period: "/mois",
                        popular: false,
                        upgradeLabel: "Choisir Titan",
                        features: [
                          "1500 analyses profondes / mois",
                          "Génération de scripts ILLIMITÉE",
                          "Gestion d'équipe complète (5 invités)",
                          "Accès à l'API de scraping brute",
                          "Liaison Webhooks & Automations",
                        ],
                        prefix: "Tout de Visionary, plus :",
                      },
                   ] as const).map((plan) => {
                      const isActive = quotas?.plan === plan.id
                      const isDark = isActive
                      const isPopular = plan.popular

                      return (
                        <div
                          key={plan.id}
                          className={`relative rounded-[32px] p-6 space-y-5 flex flex-col transition-all duration-300 hover:scale-[1.02] ${
                            isActive
                              ? "bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 ring-1 ring-indigo-400/30"
                              : isPopular
                                ? "bg-white text-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/10"
                                : "bg-white text-slate-900 border border-slate-100 shadow-xl"
                          }`}
                        >
                          {/* Badge: Abonnement Actuel */}
                          {isActive && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur-md opacity-60" />
                                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                                  <CheckCircle2 className="size-3" />
                                  Abonnement actuel
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Badge: Populaire (only if NOT active) */}
                          {isPopular && !isActive && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/40 whitespace-nowrap text-white z-20">
                              Populaire
                            </div>
                          )}

                          <div className={`space-y-3 ${isActive || isPopular ? "pt-3" : ""}`}>
                            <div className="flex items-center justify-between">
                              <h3 className="text-xl font-bold">{plan.name}</h3>
                            </div>
                            <p className={`text-[11px] leading-relaxed font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{plan.desc}</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black">{plan.price}</span>
                              <span className={`font-bold text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{plan.period}</span>
                            </div>
                          </div>

                          <div className={`h-px w-full ${isDark ? "bg-slate-700" : "bg-slate-100"}`} />

                          {/* Quota usage bars — only on active plan card */}
                          {isActive && quotas && (
                            <div className="space-y-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Consommation en cours</p>
                              {/* Scripts */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-slate-300">Scripts IA / jour</span>
                                  <span className="text-[11px] font-bold text-white">
                                    {quotas.daily_script_count} / {quotas.limits.dailyScripts === 9999 ? "∞" : quotas.limits.dailyScripts}
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-slate-700/60 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out rounded-full"
                                    style={{ width: `${quotas.limits.dailyScripts === 9999 ? 5 : Math.min(100, (quotas.daily_script_count / (quotas.limits.dailyScripts || 1)) * 100)}%` }}
                                  />
                                </div>
                              </div>
                              {/* Analyses */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-slate-300">Analyses / mois</span>
                                  <span className="text-[11px] font-bold text-white">
                                    {quotas.monthly_analysis_count} / {quotas.limits.monthlyAnalysis}
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-slate-700/60 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out rounded-full"
                                    style={{ width: `${Math.min(100, (quotas.monthly_analysis_count / (quotas.limits.monthlyAnalysis || 1)) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          <ul className="space-y-3 flex-1">
                            {plan.prefix && (
                              <li className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{plan.prefix}</li>
                            )}
                            {plan.features.map((item, i) => (
                              <li key={i} className={`flex items-start gap-2.5 text-[11px] font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                <CheckCircle2 className="size-3.5 text-indigo-500 shrink-0 mt-0.5" /> {item}
                              </li>
                            ))}
                          </ul>

                          <button
                            onClick={() => handleUpgrade(plan.id)}
                            disabled={saving || isActive}
                            className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              isActive
                                ? "bg-white/10 text-slate-400 cursor-not-allowed border border-white/10 backdrop-blur-sm"
                                : isPopular
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30"
                                  : "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                            }`}
                          >
                            {isActive ? "✓ Abonnement actuel" : plan.upgradeLabel}
                          </button>
                        </div>
                      )
                   })}

                </div>
             </div>
          )}
      </main>

    </div>
  )
}
