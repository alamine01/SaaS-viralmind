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
  CheckCircle2,
  X,
  FileText,
  Target,
  BarChart3
} from "lucide-react"

import { useSearchParams } from "next/navigation"

export default function SettingsPage() {
  const searchParams = useSearchParams()
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
  const [showQuotaModal, setShowQuotaModal] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchQuotas()
  }, [])

  // Synchroniser l'onglet actif avec les query params (ex: ?tab=Abonnement)
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && (tabParam === "Mon compte" || tabParam === "Notifications" || tabParam === "Abonnement")) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Écouteur de statut de paiement PayTech (success / cancel)
  useEffect(() => {
    const paymentStatus = searchParams.get("payment")
    if (paymentStatus === "success") {
      toast.success("Félicitations ! Votre paiement a été validé avec succès !", {
        description: "Votre forfait et vos quotas ont été mis à jour instantanément. Profitez des outils pro !",
        icon: <Sparkles className="size-5 text-emerald-500 shrink-0 animate-pulse" />,
        duration: 8000
      })
      // Nettoyer les paramètres d'URL de manière transparente
      window.history.replaceState({}, document.title, window.location.pathname + "?tab=Abonnement")
      // Re-fetch quotas & profil
      fetchQuotas()
      fetchProfile()
      window.dispatchEvent(new Event("quota-updated"))
    } else if (paymentStatus === "cancel") {
      toast.error("Paiement annulé", {
        description: "La transaction a été annulée. Aucun montant n'a été débité de votre compte.",
        duration: 5000
      })
      window.history.replaceState({}, document.title, window.location.pathname + "?tab=Abonnement")
    }
  }, [searchParams])

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
      const targetPlan = planName.toLowerCase()

      // TEMPORAIRE : On procède directement à la modification gratuite pour tous les plans !
      const res = await fetch("/api/user/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      toast.success(`Votre forfait a été mis à jour vers le plan ${planName} avec succès !`)
      await fetchQuotas()
      await fetchProfile()
      window.dispatchEvent(new Event("quota-updated"))
      return

      /* // Désactivé temporairement pour le test gratuit
      // Si c'est le plan gratuit, on procède directement à la modification gratuite
      if (targetPlan === "free") {
        const res = await fetch("/api/user/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: targetPlan })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        
        toast.success("Vous êtes repassé au plan Gratuit avec succès.")
        await fetchQuotas()
        await fetchProfile()
        window.dispatchEvent(new Event("quota-updated"))
        return
      }

      // Pour les plans payants, on initie la passerelle de paiement PayTech !
      toast.info("Génération du lien de paiement mobile sécurisé...", {
        icon: <Loader2 className="size-4 animate-spin text-violet-500" />,
        duration: 3000
      })

      const res = await fetch("/api/user/paytech/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan, isAnnual: false }) // En settings, on prend le mensuel par défaut
      })
      
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (data.redirectUrl) {
        toast.success("Redirection vers PayTech (Orange Money, Wave, Cartes)...")
        // Redirection vers le checkout PayTech
        window.location.href = data.redirectUrl
      } else {
        throw new Error("Lien de redirection PayTech manquant")
      }
      */
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
    { name: "Abonnement", icon: CreditCard },
  ]

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 text-violet-600 animate-spin" />
        <p className="text-gray-400 dark:text-gray-500 font-medium">Chargement de vos réglages...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-10 animate-in fade-in duration-500 pb-20">
      
      {/* Left Settings Navigation */}
      <aside className="col-span-12 lg:col-span-3 space-y-8">
         <div>
            <h4 className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Réglages Compte</h4>
            <ul className="space-y-1">
               {sections.map((item) => (
                 <li key={item.name}>
                    <button 
                      onClick={() => setActiveTab(item.name)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                        ${activeTab === item.name ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}
                      `}
                    >
                       <item.icon className={`size-4 ${activeTab === item.name ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'}`} />
                       {item.name}
                    </button>
                 </li>
               ))}
            </ul>
         </div>

         <div>
            <h4 className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Aide</h4>
            <a 
              href="https://wa.me/221770000000" // Remplace par ton numéro WhatsApp réel
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
               <MessageSquare className="size-4 text-gray-400 dark:text-gray-500" />
               Support technique
            </a>
         </div>
      </aside>

      {/* Main Settings Content Area */}
      <main className="col-span-12 lg:col-span-9 space-y-12">
         <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{activeTab}</h1>
            {activeTab === "Mon compte" && (
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer les modifications"}
              </button>
            )}
         </div>

         {activeTab === "Mon compte" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Account Info Form */}
               <section className="p-6 md:p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-3xl shadow-sm space-y-6">
                  <div className="space-y-1.5">
                     <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Adresse email</p>
                     <p className="text-sm font-bold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl max-w-xs cursor-not-allowed">
                       {user?.email}
                     </p>
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Nom complet</label>
                     <input 
                       value={profile.username}
                       onChange={(e) => setProfile({...profile, username: e.target.value})}
                       placeholder="Votre nom ou pseudo..." 
                       className="w-full max-w-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-gray-100 focus:border-violet-500 dark:focus:border-violet-400 outline-hidden transition-all shadow-sm"
                     />
                  </div>
               </section>
            </div>
         )}

         {activeTab === "Abonnement" && (
             <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
                
                {/* 1. Suivi des Quotas Réels */}
                {quotas && (
                   <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 md:space-y-8 animate-in fade-in duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-6">
                         <div className="space-y-1">
                            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Statut du compte</span>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                               Forfait Actuel : <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500 capitalize font-black">{quotas.plan}</span>
                            </h3>
                         </div>
                         <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl text-xs font-bold border border-violet-200 dark:border-violet-500/30 shadow-sm self-start sm:self-center">
                            <Sparkles className="size-4 animate-pulse text-violet-500" />
                            Simulation de Paiement Active
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                         {/* Quota Scripts */}
                         <div className="space-y-4 p-5 bg-gray-50/50 dark:bg-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm">
                            <div className="flex justify-between items-start gap-4">
                               <div className="space-y-1 min-w-0">
                                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Scripts du jour (Freemium)</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Réinitialisation automatique chaque jour</p>
                               </div>
                               <span className="text-sm font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-xl shadow-sm shrink-0 whitespace-nowrap">
                                  {quotas.daily_script_count} / {quotas.limits.dailyScripts === 9999 ? "∞" : quotas.limits.dailyScripts}
                               </span>
                            </div>
                            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                               <div 
                                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-700 ease-out rounded-full"
                                  style={{ width: `${Math.min(100, (quotas.daily_script_count / (quotas.limits.dailyScripts || 1)) * 100)}%` }}
                               />
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold italic">
                               {quotas.limits.dailyScripts === 9999
                                 ? "Générations illimitées actives !"
                                 : quotas.limits.dailyScripts - quotas.daily_script_count > 0 
                                   ? `Il vous reste ${quotas.limits.dailyScripts - quotas.daily_script_count} génération(s) aujourd'hui.`
                                   : "Limite journalière atteinte. Passez à l'abonnement supérieur !"}
                            </p>
                         </div>

                         {/* Quota Analyses */}
                         <div className="space-y-4 p-5 bg-gray-50/50 dark:bg-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm">
                            <div className="flex justify-between items-start gap-4">
                               <div className="space-y-1 min-w-0">
                                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Analyses de concurrents mensuelles</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Zero-Quota Cache : l'analyse du cache n'impacte pas votre quota !</p>
                               </div>
                               <span className="text-sm font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-xl shadow-sm shrink-0 whitespace-nowrap">
                                  {quotas.monthly_analysis_count} / {quotas.limits.monthlyAnalysis}
                               </span>
                            </div>
                            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                               <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out rounded-full"
                                  style={{ width: `${Math.min(100, (quotas.monthly_analysis_count / (quotas.limits.monthlyAnalysis || 1)) * 100)}%` }}
                               />
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold italic">
                               {quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count > 0 
                                 ? `Il vous reste ${quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count} analyse(s) profonde(s) ce mois-ci.`
                                 : "Quota mensuel dépassé. Passez à l'abonnement supérieur !"}
                            </p>
                         </div>
                      </div>
                   </div>
                )}

                <div className="text-center space-y-3">
                   <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Choisissez le plan adapté à vos ambitions</h2>
                   <p className="text-gray-500 dark:text-gray-400 font-medium max-w-lg mx-auto">Débloquez la puissance des analyses virales en temps réel et libérez votre créativité.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                   
                   {/* Plan Card Component — render each plan */}
                   {([
                      {
                        id: "free",
                        name: "Gratuit",
                        desc: "Pour tester l'outil de base.",
                        price: "0 FCFA",
                        period: "/toujours",
                        popular: false,
                        upgradeLabel: "Rétrograder",
                        features: [
                          "5 analyses de concurrents / mois",
                          "3 scripts IA / jour (Basique)",
                          "2 transcriptions de vidéos / mois",
                          "Générateur de Hooks (Basique)",
                          "❌ Prompteur intelligent",
                          "❌ Storyboard de scénario",
                          "❌ Voix IA & Surveillance Radar",
                        ],
                        prefix: null,
                      },
                      {
                        id: "pro",
                        name: "Pro",
                        desc: "Croissance rapide des réseaux.",
                        price: "4 900 FCFA",
                        period: "/mois",
                        popular: false,
                        upgradeLabel: "Choisir Pro",
                        features: [
                          "25 analyses profondes / mois",
                          "10 scripts IA / jour (Pro)",
                          "15 transcriptions de vidéos / mois",
                          "Générateur de Hooks (Complet)",
                          "Prompteur intelligent inclus",
                          "Storyboard de scénario inclus",
                          "❌ Voix IA & Surveillance Radar",
                        ],
                        prefix: null,
                      },
                      {
                        id: "visionary",
                        name: "Visionary",
                        desc: "Levier maximal pour experts.",
                        price: "9 900 FCFA",
                        period: "/mois",
                        popular: true,
                        upgradeLabel: "Devenir Visionary",
                        features: [
                          "80 analyses profondes / mois",
                          "30 scripts IA / jour (Visionary)",
                          "50 transcriptions de vidéos / mois",
                          "Générateur de Hooks (Illimité)",
                          "Prompteur intelligent illimité",
                          "Storyboard de scénario illimité",
                          "Voix IA & Surveillance Radar",
                        ],
                        prefix: "Tout de Pro, plus :",
                      },
                      {
                        id: "titan",
                        name: "Titan",
                        desc: "Stratégies industrielles.",
                        price: "29 900 FCFA",
                        period: "/mois",
                        popular: false,
                        upgradeLabel: "Choisir Titan",
                        features: [
                          "300 analyses profondes / mois",
                          "Génération de scripts ILLIMITÉE",
                          "Transcription vidéo ILLIMITÉE",
                          "Générateur de Hooks (Illimité)",
                          "Prompteur intelligent illimité",
                          "Storyboard de scénario illimité",
                          "Voix IA & Radar illimités",
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
                          className={`relative rounded-2xl p-6 space-y-5 flex flex-col transition-all duration-300 hover:scale-[1.02] ${
                            isActive
                              ? "bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950 text-white border-2 border-violet-500 shadow-xl ring-1 ring-violet-400/30"
                              : isPopular
                                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-violet-500 shadow-xl"
                                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm"
                          }`}
                        >
                          {/* Badge: Abonnement Actuel */}
                          {isActive && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full blur-md opacity-60" />
                                <div className="relative bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[9px] font-bold uppercase tracking-[0.2em] px-5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                                  <CheckCircle2 className="size-3" />
                                  Abonnement actuel
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Badge: Populaire (only if NOT active) */}
                          {isPopular && !isActive && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-md whitespace-nowrap text-white z-20">
                              Populaire
                            </div>
                          )}

                          <div className={`space-y-3 ${isActive || isPopular ? "pt-3" : ""}`}>
                            <div className="flex items-center justify-between">
                              <h3 className="text-xl font-bold">{plan.name}</h3>
                            </div>
                            <p className={`text-[11px] leading-relaxed font-medium ${isDark ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>{plan.desc}</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold">{plan.price}</span>
                              <span className={`font-bold text-xs ${isDark ? "text-gray-500" : "text-gray-400 dark:text-gray-500"}`}>{plan.period}</span>
                            </div>
                          </div>

                          <div className={`h-px w-full ${isDark ? "bg-gray-700" : "bg-gray-200 dark:bg-gray-700"}`} />

                          <ul className="space-y-3 flex-1">
                            {plan.prefix && (
                              <li className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">{plan.prefix}</li>
                            )}
                            {plan.features.map((item, i) => {
                              const isDisabled = item.startsWith("❌")
                              const cleanItem = isDisabled ? item.replace("❌", "").trim() : item
                              return (
                                <li key={i} className={`flex items-start gap-2.5 text-[11px] font-medium ${isDisabled ? 'opacity-40' : ''} ${isDark ? "text-gray-300" : "text-gray-600 dark:text-gray-300"}`}>
                                  {isDisabled ? (
                                    <X className="size-3.5 text-gray-500 shrink-0 mt-0.5" />
                                  ) : (
                                    <CheckCircle2 className="size-3.5 text-violet-500 shrink-0 mt-0.5" />
                                  )}
                                  <span className={isDisabled ? 'text-gray-500 dark:text-gray-400 line-through decoration-gray-300 dark:decoration-gray-600' : ''}>
                                    {cleanItem}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>

                          {isActive ? (
                            <div className="flex flex-col gap-2 w-full mt-auto">
                              <button
                                disabled
                                className="w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/10 text-gray-400 border border-white/10 backdrop-blur-sm cursor-not-allowed"
                              >
                                ✓ Abonnement actuel
                              </button>
                              <button
                                onClick={() => setShowQuotaModal(true)}
                                className="w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-violet-600 hover:bg-violet-700 text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                              >
                                <BarChart3 className="size-4 shrink-0" />
                                <span>Utilisation des crédits</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleUpgrade(plan.id)}
                              disabled={saving}
                              className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                isPopular
                                  ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                                  : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm"
                              }`}
                            >
                              {plan.upgradeLabel}
                            </button>
                          )}
                        </div>
                      )
                   })}

                </div>
             </div>
          )}
      </main>

      {/* Credit details modal */}
      {showQuotaModal && quotas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with overlay blur */}
          <div 
            className="absolute inset-0 bg-gray-950/80 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowQuotaModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 md:p-8 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-300 max-h-[90vh] flex flex-col z-10">
            {/* Top ambient glowing background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl -z-10" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700/60 mb-6 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Consommation en direct</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mt-0.5">
                  Détails de vos crédits
                </h3>
              </div>
              <button 
                onClick={() => setShowQuotaModal(false)}
                className="size-8 rounded-full bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-600/50"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="space-y-6 overflow-y-auto pr-1 py-1 flex-1">
              {/* Active Plan Card Header */}
              <div className="p-4 bg-gradient-to-r from-gray-900 via-gray-900 to-black dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl border border-gray-800 dark:border-gray-700 text-white relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 size-24 bg-violet-500/15 rounded-full blur-xl" />
                <p className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Forfait Actuel</p>
                <h4 className="text-lg font-bold capitalize mt-0.5">Plan {quotas.plan}</h4>
                <p className="text-[11px] text-gray-300 dark:text-gray-400 mt-1 font-medium leading-relaxed">
                  Vos quotas d'utilisation se réinitialisent automatiquement à la fin de chaque période d'abonnement.
                </p>
              </div>

              {/* Quota 1: Scripts */}
              <div className="space-y-3 p-4 bg-gray-50/50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                      <FileText className="size-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">Scripts IA (Journalier)</h5>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Réinitialisation toutes les 24h</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-lg text-gray-800 dark:text-gray-200 shadow-sm">
                    {quotas.daily_script_count} / {quotas.limits.dailyScripts === 9999 ? "∞" : quotas.limits.dailyScripts}
                  </span>
                </div>

                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${quotas.limits.dailyScripts === 9999 ? 5 : Math.min(100, (quotas.daily_script_count / (quotas.limits.dailyScripts || 1)) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[9px] text-gray-400 dark:text-gray-500 font-semibold italic">
                  <span>
                    {quotas.limits.dailyScripts === 9999 
                      ? "Utilisation illimitée" 
                      : `${quotas.limits.dailyScripts - quotas.daily_script_count} génération(s) restante(s)`}
                  </span>
                  <span>Reset automatique quotidien</span>
                </div>
              </div>

              {/* Quota 2: Analyses */}
              <div className="space-y-3 p-4 bg-gray-50/50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Target className="size-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">Analyses de Concurrents</h5>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Recharge mensuelle (30j)</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-lg text-gray-800 dark:text-gray-200 shadow-sm">
                    {quotas.monthly_analysis_count} / {quotas.limits.monthlyAnalysis}
                  </span>
                </div>

                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${Math.min(100, (quotas.monthly_analysis_count / (quotas.limits.monthlyAnalysis || 1)) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[9px] text-gray-400 dark:text-gray-500 font-semibold italic">
                  <span>{quotas.limits.monthlyAnalysis - quotas.monthly_analysis_count} analyse(s) restante(s) ce mois-ci</span>
                  <span>Date de reset : {quotas.last_analysis_reset ? new Date(new Date(quotas.last_analysis_reset).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : "Dans 30 jours"}</span>
                </div>
              </div>

              {/* Premium Hint */}
              <div className="p-3.5 bg-violet-50/40 dark:bg-violet-500/10 rounded-2xl border border-violet-100/50 dark:border-violet-500/20 text-[11px] font-semibold text-violet-900 dark:text-violet-300 flex items-start gap-2.5">
                <Sparkles className="size-4 text-violet-500 dark:text-violet-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-800 dark:text-gray-200">Astuce : Cache Zéro-Quota actif</p>
                  <p className="text-gray-500 dark:text-gray-400 leading-normal font-medium">
                    Consulter ou charger une analyse de vidéo déjà présente dans le cache de la communauté n'impacte pas vos crédits mensuels !
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-6 flex gap-3 shrink-0">
              <button 
                onClick={() => setShowQuotaModal(false)}
                className="flex-1 py-3 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-xl text-xs font-bold transition-all shadow-sm text-center"
              >
                Fermer la vue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
