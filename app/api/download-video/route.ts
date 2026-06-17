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

const INVIDIOUS_INSTANCES = [
  "https://iv.melmac.space",
  "https://invidious.projectsegfau.lt",
  "https://yewtu.be"
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
    const isVercel = process.env.VERCEL === "1";

    // 1. Pour YouTube : local youtube-dl-exec (en local) ou Invidious (en prod)
    if (detectedPlatform === "youtube") {
      if (!isVercel) {
        // En local uniquement : extraction ultra-fiable via youtube-dl-exec (yt-dlp)
        try {
          console.log(`[DOWNLOAD] Extraction locale youtube-dl-exec pour : ${url}`);
          const { create: createYoutubeDl } = require("youtube-dl-exec");
          const path = require("path");
          const os = require("os");
          
          const isWindows = os.platform() === "win32";
          const binaryFilename = isWindows ? "yt-dlp.exe" : "yt-dlp";
          const ytDlpPath = path.join(process.cwd(), "node_modules", "youtube-dl-exec", "bin", binaryFilename);
          const youtubedl = createYoutubeDl(ytDlpPath);

          const output = await youtubedl(url, {
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

      // En prod Vercel ou en local si youtube-dl-exec a échoué : utiliser les instances Invidious (Turnstile-free)
      if (!directUrl) {
        console.log(`[DOWNLOAD] Extraction YouTube via instances Invidious pour : ${url}`);
        const videoId = getUniqueVideoId(url);
        if (videoId) {
          for (const uri of INVIDIOUS_INSTANCES) {
            try {
              const vidRes = await fetch(`${uri}/api/v1/videos/${videoId}`, {
                signal: AbortSignal.timeout(6000)
              });
              if (vidRes.ok) {
                const videoData = await vidRes.json();
                const streams = videoData.formatStreams || [];
                if (streams.length > 0) {
                  const stream = streams.find((s: any) => s.quality === "720p") || streams[0];
                  directUrl = `${uri}/latest_version?id=${videoId}&itag=${stream.itag}&local=true`;
                  console.log(`[DOWNLOAD] Succès avec Invidious : ${uri}`);
                  break;
                }
              }
            } catch (err: any) {
              console.warn(`[DOWNLOAD] Échec Invidious ${uri} :`, err.message);
            }
          }
        }
      }
    }

    // 2. Si non résolu, tenter Cobalt (marche pour TikTok, Instagram, YouTube)
    if (!directUrl) {
      for (const instance of COBALT_INSTANCES) {
        try {
          console.log(`[DOWNLOAD] Tentative Cobalt sur : ${instance}`);
          const res = await fetch(instance, {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            body: JSON.stringify({ url, filenamePattern: "basic" }),
            signal: AbortSignal.timeout(6000)
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              directUrl = data.url;
              console.log(`[DOWNLOAD] Succès avec Cobalt : ${instance}`);
              break;
            }
          }
        } catch (err: any) {
          console.warn(`[DOWNLOAD] Échec de l'instance Cobalt ${instance} :`, err.message);
        }
      }
    }

    // 3. Fallback scraper interne (TikTok/Instagram)
    if (!directUrl && (detectedPlatform === "tiktok" || detectedPlatform === "instagram")) {
      try {
        console.log(`[DOWNLOAD] Fallback scraper interne pour ${detectedPlatform}`);
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
