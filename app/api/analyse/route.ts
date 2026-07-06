import { NextResponse } from "next/server";
import { analyzeVideo } from "@/lib/ai-service";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { scrapeVideoData, getUniqueVideoId } from "@/lib/scraper";
import { checkAndIncrementAnalysisQuota } from "@/lib/quota-service";
import { getCleanVideoUrl } from "@/lib/url-utils";

export async function POST(req: Request) {
  try {
    const { url: rawUrl, followers, userId, collectionName, forceRefresh } = await req.json();
  const { cleanUrl, platform: detectedPlatform } = getCleanVideoUrl(rawUrl);
  const url = cleanUrl;

    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // 0. VÉRIFICATION DU CACHE : charger l'analyse si déjà existante pour économiser les quotas
    const trimmedUrl = url.trim();
    const { data: existingVideo } = await supabase
      .from("videos")
      .select("*")
      .eq("url", trimmedUrl)
      .maybeSingle();

    if (existingVideo && !forceRefresh && existingVideo.transcript && existingVideo.transcript.trim() !== "" && existingVideo.transcript !== "Analyse visuelle." && existingVideo.transcript !== "Transcription non disponible.") {
      // Associer automatiquement la vidéo existante à l'historique de l'utilisateur si nécessaire
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (targetUserId) {
        try {
          const { data: existingSave } = await supabase
            .from("saved_items")
            .select("id")
            .eq("user_id", targetUserId)
            .eq("video_id", existingVideo.id)
            .eq("type", "video")
            .maybeSingle();

          if (!existingSave) {
            await supabase
              .from("saved_items")
              .insert({
                user_id: targetUserId,
                video_id: existingVideo.id,
                type: "video",
                collection_name: collectionName || "General"
              });
          }
        } catch (saveError) {
          console.error("Failed to automatically associate cached video with user in saved_items:", saveError);
        }
      }

      return NextResponse.json({
        ...existingVideo,
        video_id: existingVideo.video_id || getUniqueVideoId(trimmedUrl),
        cached: true
      });
    }

    // OBTENIR L'UTILISATEUR SÉCURISÉ POUR COMPTABILISER LE QUOTA
    const { data: { user } } = await supabase.auth.getUser();
    const effectiveUserId = user?.id || userId;

    if (!effectiveUserId) {
      return NextResponse.json({ error: "Vous devez être connecté pour analyser une vidéo." }, { status: 401 });
    }

    // VÉRIFICATION ET DÉBIT DU QUOTA (Uniquement si nouvelle vidéo à analyser)
    const quotaCheck = await checkAndIncrementAnalysisQuota(supabase, effectiveUserId);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: `Quota d'analyse mensuel dépassé (${quotaCheck.limit}/${quotaCheck.limit} analyses). Veuillez mettre à niveau votre abonnement dans vos Paramètres pour continuer.` 
        },
        { status: 403 }
      );
    }

    // 1. SCRAPING : Récupérer les vraies données de la vidéo
    const scrapedData = await scrapeVideoData(url);
    const views = (scrapedData as any).views || 0;
    const scrapedFollowers = (scrapedData as any).followers || 0;
    
    // Calcul de l'Outlier Score (priorité aux abonnés scrapés, sinon ceux saisis manuellement)
    const effectiveFollowers = scrapedFollowers > 0 ? scrapedFollowers : (followers > 0 ? followers : 0);
    const outlierScore = effectiveFollowers > 0 ? (views / effectiveFollowers).toFixed(1) : "0";

    // 2. ANALYSE IA : Analyser la transcription réelle ou l'audio
    const transcriptQuotaExhausted = (scrapedData as any).transcriptQuotaExhausted === true;
    const cleanTranscript = (scrapedData.transcript || "").trim();

    // BLOCAGE : si le quota de l'API de transcription est explicitement épuisé,
    // on n'appelle PAS l'IA pour éviter qu'elle invente des données.
    if (transcriptQuotaExhausted) {
      return NextResponse.json(
        {
          error: "TRANSCRIPT_UNAVAILABLE",
          message: "La transcription de cette vidéo n'est pas disponible pour le moment (quota journalier de l'API atteint). Veuillez réessayer ultérieurement ou contacter le support si le problème persiste."
        },
        { status: 503 }
      );
    }

    const isYT = url.includes("youtube.com") || url.includes("youtu.be");
    const isIG = url.includes("instagram.com");
    const platform = detectedPlatform !== "unknown" ? detectedPlatform : (isYT ? "youtube" : (isIG ? "instagram" : "tiktok"));
    const analysis = await analyzeVideo(url, scrapedData.title || "Vidéo Virale", cleanTranscript, (scrapedData as any).audioUrl, (scrapedData as any).images);

    // Normalisation des patterns pour Supabase (doit être un tableau)
    let patterns = analysis.patterns;
    if (typeof patterns === 'string') {
      patterns = patterns.split(',').map((p: string) => p.trim());
    } else if (!Array.isArray(patterns)) {
      patterns = [];
    }

    // Normalisation de la structure (doit être un objet)
    let structure = analysis.structure;
    if (typeof structure === 'string') {
      structure = { Hook: structure }; // Fallback si l'IA renvoie une chaîne
    } else if (!structure || typeof structure !== 'object') {
      structure = {};
    }

    // Injection du résumé stratégique et du plan d'action de l'IA pour la persistance JSONB
    if (analysis.summary) {
      structure.summary = analysis.summary;
    }
    if (analysis.action_plan) {
      structure.action_plan = analysis.action_plan;
    }

    // 3. SAUVEGARDE : Upsert dans Supabase
    const { data, error } = await supabase
      .from("videos")
      .upsert(
        {
          platform,
          title: scrapedData.title || "Analyse Vidéo",
          url: (scrapedData as any).finalUrl || url, // Sauvegarder l'URL finale (longue)
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

    if (error) {
      console.error("Supabase Save Error:", error);
      return NextResponse.json({ error: "Erreur lors de la sauvegarde : " + error.message }, { status: 500 });
    }

    // Sauvegarder automatiquement dans saved_items pour l'utilisateur
    if (userId && data) {
      try {
        const { data: existingSave } = await supabase
          .from("saved_items")
          .select("id")
          .eq("user_id", userId)
          .eq("video_id", data.id)
          .eq("type", "video")
          .maybeSingle();

        if (!existingSave) {
          await supabase
            .from("saved_items")
            .insert({
              user_id: userId,
              video_id: data.id,
              type: "video",
              collection_name: collectionName || "General"
            });
        }
      } catch (saveError) {
        console.error("Failed to automatically associate video with user in saved_items:", saveError);
      }
    }

    // On ajoute l'ID réel et le score outlier à la réponse pour l'interface
    const responseData = {
      ...data,
      outlier_score: outlierScore,
      video_id: (scrapedData as any).videoId || getUniqueVideoId(url)
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
