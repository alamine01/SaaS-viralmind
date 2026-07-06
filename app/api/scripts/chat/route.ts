import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { generateChatResponse, analyzeVideo } from "@/lib/ai-service";
import { checkAndIncrementScriptQuota } from "@/lib/quota-service";
import { scrapeVideoData } from "@/lib/scraper";
import { getCleanVideoUrl } from "@/lib/url-utils";

export async function POST(req: Request) {
  try {
    const { 
      discussionId, 
      message, 
      niche, 
      tone, 
      duration,
      attachmentUrl,
      attachmentName,
      attachmentType,
      attachmentSize 
    } = await req.json();

    if (!discussionId || (!message && !attachmentUrl)) {
      return NextResponse.json(
        { error: "Paramètres 'discussionId' et ('message' ou 'attachmentUrl') requis." },
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

    // 3. Détecter et transcrire automatiquement les vidéos partagées (liens)
    let videoTranscriptContext = "";
    let videoUrlToAnalyze = "";

    if (attachmentType === "link" && attachmentUrl) {
      const { platform } = getCleanVideoUrl(attachmentUrl);
      if (platform !== "unknown") {
        videoUrlToAnalyze = attachmentUrl;
      }
    } else if (message) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = message.match(urlRegex);
      if (urls) {
        for (const u of urls) {
          const { platform } = getCleanVideoUrl(u);
          if (platform !== "unknown") {
            videoUrlToAnalyze = u;
            break;
          }
        }
      }
    }

    if (videoUrlToAnalyze) {
      try {
        console.log(`[CHAT-SCRAPE] Détection d'un lien vidéo à analyser: ${videoUrlToAnalyze}`);
        const { cleanUrl, platform: detectedPlatform } = getCleanVideoUrl(videoUrlToAnalyze);
        const trimmedUrl = cleanUrl.trim();

        // Vérifier le cache en base de données
        const { data: existingVideo } = await supabase
          .from("videos")
          .select("*")
          .eq("url", trimmedUrl)
          .maybeSingle();

        let videoData = existingVideo;

        if (!videoData) {
          console.log(`[CHAT-SCRAPE] Non trouvé en cache. Démarrage du scraping pour: ${cleanUrl}`);
          const scrapedData = await scrapeVideoData(cleanUrl);
          const views = (scrapedData as any).views || 0;
          const scrapedFollowers = (scrapedData as any).followers || 0;
          const effectiveFollowers = scrapedFollowers > 0 ? scrapedFollowers : 0;
          const outlierScore = effectiveFollowers > 0 ? (views / effectiveFollowers).toFixed(1) : "0";

          const transcriptQuotaExhausted = (scrapedData as any).transcriptQuotaExhausted === true;
          const cleanTranscript = (scrapedData.transcript || "").trim();

          if (!transcriptQuotaExhausted) {
            const isYT = cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be");
            const isIG = cleanUrl.includes("instagram.com");
            const platform = detectedPlatform !== "unknown" ? detectedPlatform : (isYT ? "youtube" : (isIG ? "instagram" : "tiktok"));
            const analysis = await analyzeVideo(cleanUrl, scrapedData.title || "Vidéo Virale", cleanTranscript, (scrapedData as any).audioUrl, (scrapedData as any).images);

            // Normalisation des patterns
            let patterns = analysis.patterns;
            if (typeof patterns === 'string') {
              patterns = patterns.split(',').map((p: string) => p.trim());
            } else if (!Array.isArray(patterns)) {
              patterns = [];
            }

            // Normalisation de la structure
            let structure = analysis.structure;
            if (typeof structure === 'string') {
              structure = { Hook: structure };
            } else if (!structure || typeof structure !== 'object') {
              structure = {};
            }

            if (analysis.summary) structure.summary = analysis.summary;
            if (analysis.action_plan) structure.action_plan = analysis.action_plan;

            // Upsert dans Supabase pour le cache
            const { data: savedVideo } = await supabase
              .from("videos")
              .upsert(
                {
                  platform,
                  title: scrapedData.title || "Analyse Vidéo",
                  url: (scrapedData as any).finalUrl || cleanUrl,
                  thumbnail: scrapedData.thumbnail || "",
                  niche: scrapedData.niche || "Général",
                  transcript: (() => {
                    const original = analysis.original_transcript || scrapedData.transcript;
                    const french = analysis.full_transcript;
                    if (original && french && original.trim().toLowerCase() !== french.trim().toLowerCase() && original.trim().toLowerCase() !== "analyse visuelle." && original.trim().toLowerCase() !== "transcription non disponible.") {
                      return JSON.stringify({ original: original.trim(), french: french.trim() });
                    }
                    return french || original || "";
                  })(),
                  hook: analysis.hook,
                  structure: structure,
                  viral_score: analysis.viral_score,
                  patterns: patterns,
                  views: views,
                  likes: (scrapedData as any).likes || 0,
                  comments: (scrapedData as any).comments || 0,
                  followers: effectiveFollowers,
                  outlier_score: parseFloat(outlierScore)
                },
                { onConflict: 'url' }
              )
              .select()
              .single();

            if (savedVideo) {
              videoData = savedVideo;
            }
          }
        }

        if (videoData && videoData.transcript) {
          let transcriptText = videoData.transcript;
          try {
            const parsed = JSON.parse(videoData.transcript);
            if (parsed.french || parsed.original) {
              transcriptText = parsed.french || parsed.original;
            }
          } catch (e) {}
          
          videoTranscriptContext = `\n\n[CONTEXTE DE LA VIDÉO ANALYSÉE - Titre: "${videoData.title}", Transcription: "${transcriptText}"]`;
          console.log(`[CHAT-SCRAPE] Transcription de la vidéo injectée avec succès dans le contexte.`);
        }
      } catch (scrapeErr: any) {
        console.error("[CHAT-SCRAPE] Échec du scraping/analyse de la vidéo:", scrapeErr.message);
      }
    }

    // 4. Insérer le message de l'utilisateur en base de données avec pièce jointe éventuelle
    const { error: userMsgError } = await supabase
      .from("script_messages")
      .insert({
        discussion_id: discussionId,
        role: "user",
        content: message || "",
        attachment_url: attachmentUrl || null,
        attachment_name: attachmentName || null,
        attachment_type: attachmentType || null,
        attachment_size: attachmentSize || null
      });

    if (userMsgError) {
      throw new Error("Impossible d'enregistrer votre message.");
    }

    // Préparer l'historique complet pour Gemini en y injectant les détails de la pièce jointe
    let userMsgWithAttachmentContext = message || "";
    if (attachmentUrl) {
      userMsgWithAttachmentContext += `\n\n[Pièce jointe (${attachmentType}): "${attachmentName}" accessible à l'adresse: ${attachmentUrl}]`;
    }
    if (videoTranscriptContext) {
      userMsgWithAttachmentContext += videoTranscriptContext;
    }

    const formattedPriorMessages = (priorMessages || []).map((msg: any) => {
      let content = msg.content || "";
      if (msg.attachment_url) {
        content += `\n\n[Pièce jointe (${msg.attachment_type}): "${msg.attachment_name}" accessible à l'adresse: ${msg.attachment_url}]`;
      }
      return { role: msg.role, content };
    });

    const fullHistory = [
      ...formattedPriorMessages,
      { role: "user", content: userMsgWithAttachmentContext }
    ];

    // 5. Générer la réponse via l'IA
    const aiResponseText = await generateChatResponse(
      fullHistory,
      niche || "Général",
      tone || "Viral",
      duration || "60",
      toneProfile
    );

    // 6. Analyser si la réponse de l'IA est un Script JSON
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

    // 7. Si c'est un script, vérifier le quota et débiter un crédit
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

    // 8. Enregistrer le message de l'assistant dans la base de données
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
