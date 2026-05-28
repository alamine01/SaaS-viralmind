import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { generateChatResponse } from "@/lib/ai-service";
import { checkAndIncrementScriptQuota } from "@/lib/quota-service";

export async function POST(req: Request) {
  try {
    const { discussionId, message, niche, tone, duration } = await req.json();

    if (!discussionId || !message) {
      return NextResponse.json(
        { error: "Paramètres 'discussionId' et 'message' requis." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour continuer la discussion." },
        { status: 401 }
      );
    }

    // 1. Charger l'historique des messages précédents de cette discussion
    const { data: priorMessages, error: msgError } = await supabase
      .from("script_messages")
      .select("*")
      .eq("discussion_id", discussionId)
      .order("created_at", { ascending: true });

    if (msgError) {
      return NextResponse.json({ error: "Erreur de chargement de l'historique." }, { status: 500 });
    }

    // 2. Récupérer le profil de voix spécifique au workspace (collection) associé à la discussion
    let toneProfile = "";
    
    // Récupérer d'abord le nom de collection de la discussion
    const { data: discussion } = await supabase
      .from("script_discussions")
      .select("collection_name")
      .eq("id", discussionId)
      .eq("user_id", user.id)
      .maybeSingle();

    const collection = discussion?.collection_name || "General";
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
        .maybeSingle();

      if (activeVoice?.content) {
        toneProfile = activeVoice.content;
      }
    }

    // 3. Insérer le message de l'utilisateur en base de données
    const { error: userMsgError } = await supabase
      .from("script_messages")
      .insert({
        discussion_id: discussionId,
        role: "user",
        content: message
      });

    if (userMsgError) {
      throw new Error("Impossible d'enregistrer votre message.");
    }

    // Préparer l'historique complet incluant le nouveau message pour l'envoyer à Gemini
    const fullHistory = [
      ...(priorMessages || []),
      { role: "user", content: message }
    ];

    // 4. Générer la réponse via l'IA
    const aiResponseText = await generateChatResponse(
      fullHistory,
      niche || "Général",
      tone || "Viral",
      duration || "60",
      toneProfile
    );

    // 5. Analyser si la réponse de l'IA est un Script JSON
    let isScript = false;
    let parsedScript = null;
    let cleanContent = aiResponseText;

    try {
      const jsonStr = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
      // On teste si c'est du JSON valide
      if (jsonStr.startsWith("{") && jsonStr.endsWith("}")) {
        parsedScript = JSON.parse(jsonStr);
        if (parsedScript.script && Array.isArray(parsedScript.script)) {
          isScript = true;
          cleanContent = parsedScript.explanation || "Script généré avec succès !";
        }
      }
    } catch (e) {
      // Ce n'est pas un JSON ou format invalide, on le traite comme une conversation standard
      isScript = false;
    }

    // 6. Si c'est un script, vérifier le quota et débiter un crédit
    if (isScript) {
      const quotaCheck = await checkAndIncrementScriptQuota(supabase, user.id);
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          {
            error: `Votre quota journalier est atteint (${quotaCheck.limit}/${quotaCheck.limit} scripts). Votre message a été envoyé, mais l'IA n'a pas pu générer le script. Veuillez mettre à niveau votre plan dans les Réglages pour continuer.`,
            quotaExceeded: true
          },
          { status: 403 }
        );
      }
    }

    // 7. Enregistrer le message de l'assistant dans la base de données
    const { data: savedAssistantMsg, error: assistantMsgError } = await supabase
      .from("script_messages")
      .insert({
        discussion_id: discussionId,
        role: "assistant",
        content: cleanContent,
        script_data: parsedScript // Stocker le JSON structure si présent
      })
      .select()
      .single();

    if (assistantMsgError) {
      throw new Error("Impossible d'enregistrer la réponse de l'IA.");
    }

    // Sauvegarder automatiquement le script généré dans la Bibliothèque (saved_items)
    if (isScript && parsedScript) {
      try {
        await supabase
          .from("saved_items")
          .insert({
            user_id: user.id,
            content: JSON.stringify(parsedScript),
            type: "script",
            collection_name: collection
          });
      } catch (saveScriptError) {
        console.error("Failed to automatically associate generated script with library in saved_items:", saveScriptError);
      }
    }

    // Mettre à jour l'horodatage de la discussion pour le tri de l'historique
    await supabase
      .from("script_discussions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", discussionId);

    return NextResponse.json(savedAssistantMsg);
  } catch (error: any) {
    console.error("Scripts Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
