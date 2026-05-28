import { NextResponse } from "next/server";
import { analyzeVideo } from "@/lib/ai-service";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { scrapeVideoData, getUniqueVideoId } from "@/lib/scraper";
import { checkAndIncrementAnalysisQuota } from "@/lib/quota-service";

export async function POST(req: Request) {
  try {
    const { url, followers, userId, collectionName, forceRefresh } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // 0. VÉRIFICATION DU CACHE : charger l'analyse si déjà existante pour économiser les quotas
    const cleanUrl = url.trim();
    const { data: existingVideo } = await supabase
      .from("videos")
      .select("*")
      .eq("url", cleanUrl)
      .maybeSingle();

    if (existingVideo && !forceRefresh) {
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
        video_id: existingVideo.video_id || getUniqueVideoId(cleanUrl),
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
    const isYT = url.includes("youtube.com") || url.includes("youtu.be");
    const isIG = url.includes("instagram.com");
    const platform = isYT ? "youtube" : (isIG ? "instagram" : "tiktok");
    const analysis = await analyzeVideo(url, scrapedData.transcript, (scrapedData as any).audioUrl);

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
