import { NextResponse } from "next/server";
import { scrapeVideoData, getUniqueVideoId } from "@/lib/scraper";

const COBALT_INSTANCES = [
  "https://api.cobalt.blackcat.sweeux.org",
  "https://cobaltapi.kittycat.boo",
  "https://dog.kittycat.boo",
  "https://fox.kittycat.boo",
  "https://api.cobalt.liubquanti.click",
  "https://rue-cobalt.xenon.zone",
  "https://cobaltapi.cjs.nz"
];

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

    // 1. Essayer les instances Cobalt publiques fonctionnelles sans Turnstile
    for (const instance of COBALT_INSTANCES) {
      try {
        console.log(`[DOWNLOAD] Tentative de récupération sur : ${instance}`);
        const res = await fetch(instance, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          body: JSON.stringify({ url, filenamePattern: "basic" }),
          signal: AbortSignal.timeout(6000) // Timeout de 6s par instance pour éviter de bloquer
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            directUrl = data.url;
            console.log(`[DOWNLOAD] Succès avec l'instance : ${instance}`);
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[DOWNLOAD] Échec de l'instance Cobalt ${instance} :`, err.message);
      }
    }

    // 2. Si Cobalt échoue, utiliser le scraper interne pour TikTok et Instagram
    if (!directUrl && (detectedPlatform === "tiktok" || detectedPlatform === "instagram")) {
      try {
        console.log(`[DOWNLOAD] Fallback vers le scraper interne pour ${detectedPlatform}`);
        const scraped = await scrapeVideoData(url);
        if (scraped.audioUrl) {
          directUrl = scraped.audioUrl;
        }
      } catch (err: any) {
        console.error(`[DOWNLOAD] Échec du scraper interne :`, err.message);
      }
    }

    if (!directUrl) {
      return NextResponse.json({ error: "Impossible de récupérer le lien de téléchargement direct de la vidéo." }, { status: 500 });
    }

    const filename = `${detectedPlatform}_video_${Date.now()}.mp4`;
    // Proxy URL locale
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
