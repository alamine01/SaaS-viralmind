import { NextResponse } from "next/server";
import { scrapeVideoData, getUniqueVideoId } from "@/lib/scraper";

export async function POST(req: Request) {
  try {
    const { url, platform } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    const isYT = url.includes("youtube.com") || url.includes("youtu.be");
    const isIG = url.includes("instagram.com");
    const isTT = url.includes("tiktok.com");

    const detectedPlatform = isYT ? "youtube" : (isIG ? "instagram" : (isTT ? "tiktok" : platform));
    let directUrl = "";

    // 1. Essayer d'abord cobalt.tools car il fonctionne extrêmement bien et résout la plupart des plateformes
    try {
      const res = await fetch("https://api.cobalt.tools/api/json", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url, filenamePattern: "basic" })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          directUrl = data.url;
        }
      }
    } catch (err: any) {
      console.error("Cobalt downloader failed:", err.message);
    }

    // 2. Si cobalt échoue, utiliser le scraper interne pour TikTok et Instagram
    if (!directUrl && (detectedPlatform === "tiktok" || detectedPlatform === "instagram")) {
      try {
        const scraped = await scrapeVideoData(url);
        if (scraped.audioUrl) {
          directUrl = scraped.audioUrl;
        }
      } catch (err: any) {
        console.error(`Scraper fallback failed for ${detectedPlatform}:`, err.message);
      }
    }

    // 3. Si YouTube et tout le reste a échoué, essayer RapidAPI YouTube Downloader
    if (!directUrl && detectedPlatform === "youtube") {
      const apiKey = process.env.RAPIDAPI_KEY;
      if (apiKey) {
        try {
          const videoId = getUniqueVideoId(url);
          if (videoId) {
            const ytDownhost = "youtube-media-downloader.p.rapidapi.com";
            const res = await fetch(`https://${ytDownhost}/v2/video/details?videoId=${videoId}`, {
              headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': ytDownhost
              }
            });
            if (res.ok) {
              const data = await res.json();
              const items = data.videos?.items || data.videos || [];
              const format = items.find((item: any) => item.quality === "720p" || item.quality === "1080p") || items[0];
              if (format?.url) {
                directUrl = format.url;
              }
            }
          }
        } catch (err: any) {
          console.error("RapidAPI YouTube Downloader failed:", err.message);
        }
      }
    }

    if (!directUrl) {
      return NextResponse.json({ error: "Impossible de récupérer le lien de téléchargement direct de la vidéo." }, { status: 500 });
    }

    const filename = `${detectedPlatform}_video_${Date.now()}.mp4`;
    // Retourner un lien proxy vers notre propre API pour forcer le téléchargement
    const proxyUrl = `/api/download-video?proxyUrl=${encodeURIComponent(directUrl)}&filename=${encodeURIComponent(filename)}`;

    return NextResponse.json({ downloadUrl: proxyUrl, filename });
  } catch (error: any) {
    console.error("Download POST Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const proxyUrl = searchParams.get("proxyUrl");
    const filename = searchParams.get("filename") || "video.mp4";

    if (!proxyUrl) {
      return new Response("Missing proxyUrl parameter", { status: 400 });
    }

    // Récupérer la vidéo depuis l'URL externe
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      return new Response(`Failed to fetch video: ${response.statusText}`, { status: response.status });
    }

    // Renvoyer les données sous forme de flux avec les bons en-têtes de téléchargement
    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Content-Type", response.headers.get("Content-Type") || "video/mp4");
    
    const contentLength = response.headers.get("Content-Length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(response.body, {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error("Download GET Route Error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
