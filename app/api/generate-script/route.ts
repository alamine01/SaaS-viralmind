import { NextResponse } from "next/server";
import { generateScripts } from "@/lib/ai-service";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkAndIncrementScriptQuota } from "@/lib/quota-service";

export async function POST(req: Request) {
  try {
    const { concept, niche, tone, duration, collection } = await req.json();

    if (!concept) {
      return NextResponse.json({ error: "Concept manquant" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    
    // Récupérer l'utilisateur connecté via la session cookies sécurisée
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour générer un script." },
        { status: 401 }
      );
    }

    // VÉRIFICATION ET DÉBIT DU QUOTA
    const quotaCheck = await checkAndIncrementScriptQuota(supabase, user.id);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: `Quota journalier dépassé (${quotaCheck.limit}/${quotaCheck.limit} scripts). Veuillez mettre à niveau votre abonnement dans les Réglages pour continuer.` 
        },
        { status: 403 }
      );
    }

    // Récupérer le profil de voix spécifique au workspace (collection) associé
    let toneProfile = "";
    let activeVoiceId = null;

    if (collection && collection !== "General") {
      // Trouver le workspace associé
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("voice_profile_id")
        .eq("user_id", user.id)
        .eq("slug", collection)
        .maybeSingle();

      if (workspace?.voice_profile_id) {
        activeVoiceId = workspace.voice_profile_id;
      }
    }

    if (activeVoiceId) {
      // Charger la voix spécifique du workspace
      const { data: workspaceVoice } = await supabase
        .from("voice_profiles")
        .select("content")
        .eq("id", activeVoiceId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (workspaceVoice?.content) {
        toneProfile = workspaceVoice.content;
      }
    }

    // Repli (Fallback) : si pas de voix spécifique au projet, utiliser la voix globale active
    if (!toneProfile) {
      const { data: activeVoice } = await supabase
        .from("voice_profiles")
        .select("content")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle(); // Utiliser maybeSingle pour éviter les exceptions si aucun profil n'est actif
      
      if (activeVoice?.content) {
        toneProfile = activeVoice.content;
      }
    }

    // 1. Générer via l'IA
    const script = await generateScripts(concept, niche || "Général", tone || "Viral", duration, toneProfile);

    return NextResponse.json(script);
  } catch (error: any) {
    console.error("Script Generation API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
