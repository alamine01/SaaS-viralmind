"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  UserRound, 
  Smile, 
  CheckCircle2, 
  Loader2, 
  Tv, 
  Compass, 
  BookOpen 
} from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checkingUser, setCheckingUser] = useState(true)

  // Form states
  const [formData, setFormData] = useState({
    brandName: "",
    niche: "",
    targetAudience: "",
    toneStyle: "Dynamique & Percutant (TikTok Style)",
    textSample: ""
  })

  useEffect(() => {
    const checkUser = async () => {
      setCheckingUser(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/signin")
        return
      }
      
      // Si l'utilisateur a déjà des profils de voix créés, on le redirige vers le dashboard
      const { data: existingProfiles } = await supabase
        .from("voice_profiles")
        .select("id")
        .limit(1);

      if (existingProfiles && existingProfiles.length > 0) {
        router.push("/dashboard")
        return
      }

      setCheckingUser(false)
    }
    checkUser()
  }, [router])

  const handleNext = () => {
    if (step === 1 && !formData.brandName) {
      toast.error("Veuillez saisir le nom de votre marque ou profil.")
      return
    }
    if (step === 1 && !formData.niche) {
      toast.error("Veuillez renseigner votre niche.")
      return
    }
    if (step === 2 && !formData.targetAudience) {
      toast.error("Veuillez préciser votre public cible.")
      return
    }
    setStep(prev => prev + 1)
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Utilisateur non connecté.")

      // Consolider les données du profil de voix
      const consolidatedContent = `
=== PROFIL DE MARQUE ===
Nom de la Marque : ${formData.brandName}
Niche / Expertise : ${formData.niche}
Public Cible / Audience : ${formData.targetAudience}
Style de Ton Souhaité : ${formData.toneStyle}

=== TEXTE D'EXEMPLE / STYLE DE VOIX ===
${formData.textSample || "Aucun échantillon de texte fourni. Générer sur la base de la niche et du style de ton souhaité."}
`.trim();

      // Enregistrer le profil de voix par défaut dans voice_profiles
      const { error: insertError } = await supabase
        .from("voice_profiles")
        .insert({
          user_id: user.id,
          name: `${formData.brandName} - Par défaut`,
          content: consolidatedContent,
          is_active: true // Devient le profil de voix actif immédiat
        });

      if (insertError) throw insertError;

      // Mettre à jour le profil utilisateur pour marquer le nom de marque
      await supabase
        .from("profiles")
        .update({ full_name: formData.brandName })
        .eq("id", user.id);

      toast.success("Onboarding terminé ! Bienvenue à bord !");
      
      // Dispatcher un event de mise à jour des quotas pour forcer la sidebar à se rafraîchir
      window.dispatchEvent(new Event("quota-updated"));
      
      router.push("/dashboard");
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur lors de la configuration : " + e.message);
    } finally {
      setLoading(false)
    }
  }

  if (checkingUser) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-gray-950 gap-4">
        <Loader2 className="size-12 text-violet-650 animate-spin" />
        <p className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest animate-pulse">Initialisation du cockpit...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 md:p-8 font-sans antialiased text-gray-900 dark:text-gray-100 relative overflow-hidden">
      
      {/* Background Decorative Blur Circles */}
      <div className="absolute top-[-10%] left-[-10%] size-[400px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] size-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-xl p-6 md:p-12 relative z-10 flex flex-col justify-between min-h-[500px] md:min-h-[580px] transition-all duration-300">
        
        {/* En-tête / Barre de progression */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-violet-100 dark:border-violet-500/20">
                <Sparkles className="size-3.5" /> Onboarding
             </div>
             <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Étape {step} / 4</span>
          </div>

          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
             <div 
               className="h-full bg-gradient-to-r from-violet-600 to-purple-650 transition-all duration-500 rounded-full"
               style={{ width: `${(step / 4) * 100}%` }}
             />
          </div>
        </div>

        {/* CONTENU DE CHAQUE ÉTAPE */}
        <div className="my-8 md:my-10 flex-1 flex flex-col justify-center">
          
          {/* STEP 1: Identité de la Marque */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Qui êtes-vous ?</h2>
                 <p className="text-xs font-medium text-gray-400 dark:text-gray-500 leading-normal">
                    Commençons par faire connaissance avec votre marque ou profil de créateur.
                 </p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Nom de votre marque / Pseudo</label>
                    <div className="relative">
                       <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
                       <input 
                         type="text" 
                         value={formData.brandName}
                         onChange={(e) => setFormData({...formData, brandName: e.target.value})}
                         placeholder="Ex: @LeoDev, TechSphere, Alex_Fit"
                         className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl focus:bg-white dark:focus:bg-gray-850 focus:border-violet-500 outline-none transition-all text-sm font-semibold text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm focus:ring-0"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Votre Niche d'Activité</label>
                    <div className="relative">
                       <Compass className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
                       <input 
                         type="text" 
                         value={formData.niche}
                         onChange={(e) => setFormData({...formData, niche: e.target.value})}
                         placeholder="Ex: Fitness, IA & Productivité, Crypto-monnaies..."
                         className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl focus:bg-white dark:focus:bg-gray-850 focus:border-violet-500 outline-none transition-all text-sm font-semibold text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm focus:ring-0"
                       />
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* STEP 2: Cible et Mission */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">À qui vous adressez-vous ?</h2>
                 <p className="text-xs font-medium text-gray-400 dark:text-gray-500 leading-normal">
                    Définir votre public cible permettra à l'IA d'orienter vos scripts avec le bon niveau d'explications et d'impact.
                 </p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Votre Public Cible</label>
                    <div className="relative">
                       <Target className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
                       <input 
                         type="text" 
                         value={formData.targetAudience}
                         onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                         placeholder="Ex: Entrepreneurs pressés, Étudiants, Débutants en code..."
                         className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl focus:bg-white dark:focus:bg-gray-850 focus:border-violet-500 outline-none transition-all text-sm font-semibold text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm focus:ring-0"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Ton & Attitude visée</label>
                    <div className="relative">
                       <select 
                         value={formData.toneStyle}
                         onChange={(e) => setFormData({...formData, toneStyle: e.target.value})}
                         className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl px-4 py-3 text-sm font-semibold focus:bg-white dark:focus:bg-gray-850 focus:border-violet-500 outline-none cursor-pointer text-gray-700 dark:text-gray-300 shadow-sm min-h-[50px] focus:ring-0"
                       >
                          <option>Dynamique & Percutant (TikTok Style)</option>
                          <option>Pédagogique, Expert & Calme (LinkedIn/YouTube)</option>
                          <option>Narratif, Mystérieux & Captivant</option>
                          <option>Motivant, Énergique & Inspirant</option>
                          <option>Amusant, Décalé & Humoristique</option>
                       </select>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* STEP 3: Entraînement de la Voix */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Capturez votre voix</h2>
                 <p className="text-xs font-medium text-gray-400 dark:text-gray-500 leading-normal">
                    (Optionnel) Collez un texte court ou un ancien script écrit par vos soins. L'IA décodera vos tournures de phrases, vos expressions favorites et votre rythme.
                 </p>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Votre échantillon de texte</label>
                 <div className="relative">
                    <BookOpen className="absolute left-4 top-5 size-4 text-gray-400 dark:text-gray-500" />
                    <textarea 
                      value={formData.textSample}
                      onChange={(e) => setFormData({...formData, textSample: e.target.value})}
                      placeholder="Collez ici un post de blog, un script vidéo ou un texte personnel pour entraîner l'IA..."
                      rows={6}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl focus:bg-white dark:focus:bg-gray-850 focus:border-violet-500 outline-none transition-all text-sm font-medium text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm focus:ring-0 resize-none leading-relaxed"
                    />
                 </div>
              </div>
            </div>
          )}

          {/* STEP 4: Récapitulatif & Finalisation */}
          {step === 4 && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300 py-4">
              <div className="size-16 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-650 dark:text-violet-400 flex items-center justify-center mx-auto shadow-sm border border-violet-100 dark:border-violet-500/20">
                 <CheckCircle2 className="size-8 animate-bounce text-violet-500" />
              </div>
              
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Cockpit configuré !</h2>
                 <p className="text-xs font-medium text-gray-400 dark:text-gray-500 leading-normal max-w-sm mx-auto">
                    Nous avons tout ce qu'il faut pour dresser votre profil de marque. L'IA va créer votre style de voix par défaut immédiatement.
                 </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/60 p-4 text-left space-y-2.5 max-w-sm mx-auto text-xs font-bold text-gray-650 dark:text-gray-300 leading-relaxed shadow-sm">
                 <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-500">Marque :</span>
                    <span className="text-gray-900 dark:text-gray-100">{formData.brandName}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-500">Niche :</span>
                    <span className="text-violet-500 dark:text-violet-400">{formData.niche}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-500">Audience :</span>
                    <span className="text-gray-900 dark:text-gray-100">{formData.targetAudience}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-500">Style :</span>
                    <span className="text-purple-650 dark:text-purple-400 truncate max-w-[200px]">{formData.toneStyle}</span>
                 </div>
              </div>
            </div>
          )}

        </div>

        {/* BARRE DE NAVIGATION (BOUTONS BAS) */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-150 dark:border-gray-800">
          {step > 1 && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="h-12 px-6 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <ArrowLeft className="size-4" /> Retour
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex-1 h-12 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ml-auto shadow-sm"
            >
              Suivant <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 shadow-md shadow-violet-100 dark:shadow-none"
            >
              {loading ? (
                <><Loader2 className="size-5 animate-spin" /> Configuration...</>
              ) : (
                <><Sparkles className="size-4" /> Activer mon Cockpit</>
              )}
            </button>
          )}
        </div>

      </main>
    </div>
  )
}
