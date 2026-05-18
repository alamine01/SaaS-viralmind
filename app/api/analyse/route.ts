import { NextResponse } from "next/server";
import { analyzeVideo } from "@/lib/ai-service";
import { supabase } from "@/lib/supabase";
import { scrapeVideoData, getUniqueVideoId } from "@/lib/scraper";

export async function POST(req: Request) {
  try {
    const { url, followers } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
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
          transcript: analysis.full_transcript || scrapedData.transcript,
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
