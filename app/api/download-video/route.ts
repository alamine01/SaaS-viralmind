import { NextResponse } from "next/server";
import { scrapeVideoData, getUniqueVideoId } from "@/lib/scraper";

const COBALT_INSTANCES = [
  "https://nuko-c.meowing.de",
  "https://cobalt.alpha.wolfy.love",
  "https://cobalt.omega.wolfy.love",
  "https://grapefruit.clxxped.lol",
  "https://apicobalt.mgytr.top",
  "https://cobaltapi.squair.xyz",
  "https://api.cobalt.blackcat.sweeux.org",
  "https://cobaltapi.kittycat.boo",
  "https://dog.kittycat.boo",
  "https://lime.clxxped.lol",
  "https://melon.clxxped.lol",
  "https://fox.kittycat.boo",
  "https://api.qwkuns.me"
];

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://iv.melmac.space",
  "https://invidious.projectsegfau.lt",
  "https://yewtu.be",
  "https://invidious.privacydev.net",
  "https://invidious.lunar.icu",
  "https://invidious.no-logs.com"
];

function getCleanVideoUrl(url: string): { cleanUrl: string; platform: string } {
  const isYT = url.includes("youtube.com") || url.includes("youtu.be");
  const isIG = url.includes("instagram.com");
  const isTT = url.includes("tiktok.com");

  if (isYT) {
    let videoId = "";
    if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
    else if (url.includes("youtube.com/shorts/")) videoId = url.split("shorts/")[1].split("?")[0];
    return {
      cleanUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : url,
      platform: "youtube"
    };
  }

  if (isIG) {
    const parts = url.split("?")[0].split("/");
    const index = parts.findIndex(p => p === "reels" || p === "p" || p === "reel");
    const shortcode = index !== -1 ? parts[index + 1] : parts.filter(Boolean).pop();
    return {
      cleanUrl: shortcode ? `https://www.instagram.com/reel/${shortcode}/` : url,
      platform: "instagram"
    };
  }

  if (isTT) {
    const cleanUrl = url.split("?")[0];
    return {
      cleanUrl,
      platform: "tiktok"
    };
  }

  return { cleanUrl: url, platform: "unknown" };
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    const { cleanUrl, platform: detectedPlatform } = getCleanVideoUrl(url);
    console.log(`[DOWNLOAD] URL nettoyée : ${cleanUrl} (${detectedPlatform})`);

    let directUrl = "";
    const isVercel = process.env.VERCEL === "1";

    // 1. Pour YouTube : local youtube-dl-exec (en local) ou Invidious (en prod)
    if (detectedPlatform === "youtube") {
      if (!isVercel) {
        // En local uniquement : extraction ultra-fiable via youtube-dl-exec (yt-dlp)
        try {
          console.log(`[DOWNLOAD] Extraction locale youtube-dl-exec pour : ${cleanUrl}`);
          const { create: createYoutubeDl } = require("youtube-dl-exec");
          const path = require("path");
          const os = require("os");
          
          const isWindows = os.platform() === "win32";
          const binaryFilename = isWindows ? "yt-dlp.exe" : "yt-dlp";
          const ytDlpPath = path.join(process.cwd(), "node_modules", "youtube-dl-exec", "bin", binaryFilename);
          const youtubedl = createYoutubeDl(ytDlpPath);

          const output = await youtubedl(cleanUrl, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificates: true,
            preferFreeFormats: true,
          }) as any;

          const formats = output.formats || [];
          const directFormats = formats.filter((f: any) => f.vcodec !== "none" && f.acodec !== "none" && f.ext === "mp4");
          
          let bestUrl = "";
          if (directFormats.length > 0) {
            const format = directFormats.find((f: any) => f.qualityLabel === "720p") || directFormats[directFormats.length - 1];
            bestUrl = format.url;
          } else if (formats.length > 0) {
            const combined = formats.filter((f: any) => f.vcodec !== "none" && f.acodec !== "none");
            bestUrl = combined[combined.length - 1]?.url || formats[formats.length - 1]?.url;
          }

          if (bestUrl) {
            directUrl = bestUrl;
            console.log("[DOWNLOAD] Extraction locale youtube-dl-exec réussie !");
          }
        } catch (err: any) {
          console.error("[DOWNLOAD] Échec extraction locale youtube-dl-exec :", err.message);
        }
      }

      // En prod Vercel ou en local si youtube-dl-exec a échoué : utiliser les instances Invidious (en parallèle pour la rapidité)
      if (!directUrl) {
        console.log(`[DOWNLOAD] Extraction YouTube via instances Invidious pour : ${cleanUrl}`);
        const videoId = getUniqueVideoId(cleanUrl);
        if (videoId) {
          const invidiousPromises = INVIDIOUS_INSTANCES.map(async (uri) => {
            try {
              const vidRes = await fetch(`${uri}/api/v1/videos/${videoId}`, {
                signal: AbortSignal.timeout(3000)
              });
              if (vidRes.ok) {
                const videoData = await vidRes.json();
                const streams = videoData.formatStreams || [];
                if (streams.length > 0) {
                  const stream = streams.find((s: any) => s.quality === "720p") || streams[0];
                  return `${uri}/latest_version?id=${videoId}&itag=${stream.itag}&local=true`;
                }
              }
            } catch (err) {}
            throw new Error("failed");
          });

          try {
            directUrl = await Promise.any(invidiousPromises);
            console.log(`[DOWNLOAD] Succès d'Invidious en parallèle : ${directUrl}`);
          } catch (e) {
            console.warn("[DOWNLOAD] Toutes les instances Invidious ont échoué.");
          }
        }
      }
    }

    // 2. Si non résolu, tenter Cobalt (marche pour TikTok, Instagram, YouTube) en parallèle
    if (!directUrl) {
      console.log(`[DOWNLOAD] Tentative Cobalt en parallèle pour : ${cleanUrl}`);
      const cobaltPromises = COBALT_INSTANCES.map(async (instance) => {
        try {
          const res = await fetch(instance, {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            body: JSON.stringify({ url: cleanUrl, filenamePattern: "basic" }),
            signal: AbortSignal.timeout(3500)
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              return data.url;
            }
          }
        } catch (err) {}
        throw new Error("failed");
      });

      try {
        directUrl = await Promise.any(cobaltPromises);
        console.log(`[DOWNLOAD] Succès Cobalt en parallèle : ${directUrl}`);
      } catch (e) {
        console.warn("[DOWNLOAD] Toutes les instances Cobalt ont échoué.");
      }
    }

    // 3. Fallback scraper interne (TikTok/Instagram)
    if (!directUrl && (detectedPlatform === "tiktok" || detectedPlatform === "instagram")) {
      try {
        console.log(`[DOWNLOAD] Fallback scraper interne pour ${detectedPlatform}`);
        const scraped = await scrapeVideoData(cleanUrl);
        if (scraped.audioUrl) {
          directUrl = scraped.audioUrl;
        }
      } catch (err: any) {
        console.error(`[DOWNLOAD] Échec du scraper interne :`, err.message);
      }
    }

    if (!directUrl) {
      return NextResponse.json({ error: "Impossible de récupérer le lien de téléchargement direct de la vidéo.", cleanUrl }, { status: 500 });
    }

    const filename = `${detectedPlatform}_video_${Date.now()}.mp4`;
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

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      return new Response(`Failed to fetch video: ${response.statusText}`, { status: response.status });
    }

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
