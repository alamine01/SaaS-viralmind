import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { handle, platform } = await req.json();

    if (!handle || !platform) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const cleanHandle = handle.replace("@", "").trim();

    // 1. Validation spécifique pour TikTok (via RapidAPI /user/info)
    if (platform === 'tiktok') {
      const tiktokHost = "tiktok-video-no-watermark2.p.rapidapi.com";
      const apiKey = process.env.RAPIDAPI_KEY;
      try {
        const userApiUrl = `https://${tiktokHost}/user/info?unique_id=${cleanHandle}`;
        const res = await fetch(userApiUrl, {
          headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': tiktokHost }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.code === -1 || data.msg === "unique_id is invalid" || !data.data) {
            return NextResponse.json({ exists: false, message: "Compte TikTok introuvable" });
          }
          return NextResponse.json({ exists: true });
        }
      } catch (err: any) {
        console.error("TikTok validation error:", err.message);
      }
    }

    // 2. Validation spécifique pour Instagram (via Apify)
    if (platform === 'instagram') {
      const apifyToken = process.env.APIFY_API_TOKEN;
      if (apifyToken) {
        try {
          const profileActor = "apify~instagram-profile-scraper";
          const profileUrl = `https://api.apify.com/v2/acts/${profileActor}/run-sync-get-dataset-items?token=${apifyToken}`;
          const response = await fetch(profileUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              "usernames": [cleanHandle],
              "resultsLimit": 1
            })
          });
          if (response.ok) {
            const items = await response.json();
            if (items.length === 0 || items[0].followersCount === undefined) {
              return NextResponse.json({ exists: false, message: "Compte Instagram introuvable" });
            }
            return NextResponse.json({ exists: true });
          }
        } catch (err: any) {
          console.error("Instagram validation error:", err.message);
        }
      }
    }

    // 3. Validation spécifique pour YouTube (via fetch standard)
    if (platform === 'youtube') {
      const url = `https://www.youtube.com/@${cleanHandle}`;
      console.log(`DEBUG: [VALIDATION YOUTUBE] Vérification de ${url}`);
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });
        if (response.status === 404) {
          return NextResponse.json({ exists: false, message: "Compte YouTube introuvable" });
        }
      } catch (err: any) {
        console.error("YouTube validation error:", err.message);
      }
    }

    // Par défaut, si tout le reste passe ou échoue de manière inattendue, on laisse passer
    return NextResponse.json({ exists: true });

  } catch (error: any) {
    console.error("Validation Error:", error.message);
    return NextResponse.json({ exists: true, warning: "Validation technique impossible" });
  }
}
