// Pas d'import de soi-même
import { create as createYoutubeDl } from "youtube-dl-exec";
import path from "path";
import os from "os";

const getLocalYtdlp = () => {
  const isWindows = os.platform() === "win32";
  const binaryFilename = isWindows ? "yt-dlp.exe" : "yt-dlp";
  const ytDlpPath = path.join(process.cwd(), "node_modules", "youtube-dl-exec", "bin", binaryFilename);
  return createYoutubeDl(ytDlpPath);
};

export async function scrapeVideoData(url: string) {
  try {
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
    const isInstagram = url.includes("instagram.com");
    const platform = isYouTube ? "youtube" : (isInstagram ? "instagram" : "tiktok");
    
    const apiKey = process.env.RAPIDAPI_KEY;
    const apifyToken = process.env.APIFY_API_TOKEN;

    let finalUrl = url;
    
    // Résolution des liens courts TikTok
    if (url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
      const res = await fetch(url, { redirect: 'follow' });
      finalUrl = res.url;
      console.log("DEBUG: URL redirigée vers :", finalUrl);
    }

    const videoId = getUniqueVideoId(finalUrl);

    if (isYouTube) {
      console.log(`DEBUG: [YOUTUBE] Scan API pour ID: ${videoId}`);
      const ytHost = "youtube-v31.p.rapidapi.com";
      const transHost = "youtube-transcriptor.p.rapidapi.com";
      
      let views = 0;
      let followers = 0;
      let title = "Vidéo YouTube";
      let niche = "YouTube Content";

      try {
        // 1. Récupération des stats (Vues, Likes, ChannelId)
        const detailsRes = await fetch(`https://${ytHost}/videos?part=statistics,snippet&id=${videoId}`, {
          headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': ytHost }
        });
        const detailsData = await detailsRes.json();
        
        if (detailsData.message && detailsData.message.includes("subscribed")) {
          throw new Error("NOT_SUBSCRIBED");
        }

        const item = detailsData.items?.[0] || {};
        views = parseInt(item.statistics?.viewCount || "0");
        title = item.snippet?.title || title;
        niche = item.snippet?.channelTitle || niche;
        
        // Récupération abonnés
        if (item.snippet?.channelId) {
          const chanRes = await fetch(`https://${ytHost}/channels?part=statistics&id=${item.snippet.channelId}`, {
            headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': ytHost }
          });
          const chanData = await chanRes.json();
          followers = parseInt(chanData.items?.[0]?.statistics?.subscriberCount || "0");
        }
      } catch (e) {
        console.log("DEBUG: [YOUTUBE] API bloquée ou non abonnée, passage au secours...");
        // SECOURS : Scraping direct
        const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const html = await watchRes.text();
        const viewMatch = html.match(/\"viewCount\":\"(\d+)\"/);
        if (viewMatch) views = parseInt(viewMatch[1]);
        
        const subMatch = html.match(/\"subscriberCountText\":\{.*?\"label\":\"([^\"]+)\"/);
        if (subMatch) {
          console.log(`DEBUG: [YOUTUBE] Texte abonnés trouvé: ${subMatch[1]}`);
          const subText = subMatch[1].toLowerCase();
          
          // Extraction du nombre pur (ex: "1.2m abonnés" -> 1.2)
          const numMatch = subText.match(/([0-9,.]+)/);
          if (numMatch) {
            let val = parseFloat(numMatch[1].replace(',', '.'));
            if (subText.includes('k') || subText.includes('mille')) followers = val * 1000;
            else if (subText.includes('m') || subText.includes('million')) followers = val * 1000000;
            else followers = val;
          }
        }
        console.log(`DEBUG: [YOUTUBE] Abonnés après secours: ${followers}`);
      }

      // 3. Transcription (Avec secours si quota 100% épuisé)
      let transcript = "";
      let transcriptQuotaExhausted = false;
      try {
        const transRes = await fetch(`https://${transHost}/transcript?video_id=${videoId}`, {
          headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': transHost }
        });
        const transData = await transRes.json();
        
        if (transData.message && transData.message.includes("quota")) {
          throw new Error("Quota épuisé");
        }

        const v = Array.isArray(transData) ? transData[0] : transData;
        transcript = v.transcriptionAsText || v.transcript || "";
      } catch (e: any) {
        console.log("DEBUG: [YOUTUBE] Quota Transcriptor épuisé, passage au secours...");
        // On marque explicitement que c'est un épuisement de quota API
        transcriptQuotaExhausted = true;
        transcript = "";
      }

      return {
        title,
        transcript,
        transcriptQuotaExhausted,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        niche,
        views,
        likes: 0,
        followers,
        videoId
      };
    } else if (isInstagram) {
      console.log("DEBUG: Lancement du scan Instagram avec Double API Failover...");
      
      let item: any = null;
      let hostUsed = "instagram-public-bulk-scraper.p.rapidapi.com";
      
      try {
        // Tentative avec l'API A (instagram-public-bulk-scraper)
        const infoUrl = `https://instagram-public-bulk-scraper.p.rapidapi.com/v1/post/info?shortcode_or_url=${encodeURIComponent(url)}`;
        const response = await fetch(infoUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey || "",
            'X-RapidAPI-Host': "instagram-public-bulk-scraper.p.rapidapi.com"
          }
        });
        if (response.ok) {
          const result = await response.json();
          item = result.data || result.body || result;
          hostUsed = "instagram-public-bulk-scraper.p.rapidapi.com";
        } else {
          throw new Error(`API A non-ok: ${response.statusText}`);
        }
      } catch (errorA) {
        console.warn("DEBUG: API Instagram A (Bulk Scraper) échouée, tentative avec API B (Stable API)...", errorA);
        try {
          // Tentative avec l'API B (instagram-scraper-stable-api)
          const infoUrl = `https://instagram-scraper-stable-api.p.rapidapi.com/get_media_data.php?reel_post_code_or_url=${encodeURIComponent(url)}&type=reel`;
          const response = await fetch(infoUrl, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': apiKey || "",
              'X-RapidAPI-Host': "instagram-scraper-stable-api.p.rapidapi.com"
            }
          });
          if (response.ok) {
            const result = await response.json();
            item = result.data || result.body || result;
            hostUsed = "instagram-scraper-stable-api.p.rapidapi.com";
          } else {
            throw new Error(`API B non-ok: ${response.statusText}`);
          }
        } catch (errorB) {
          console.warn("DEBUG: API Instagram B (Stable API) également échouée. Passage au secours local youtube-dl-exec...", errorB);
          try {
            const youtubedl = getLocalYtdlp();
            const output = await youtubedl(url, {
              dumpSingleJson: true,
              noWarnings: true,
              noCheckCertificates: true,
            }) as any;
            
            if (output) {
              console.log("DEBUG: Secours youtube-dl-exec Instagram réussi !");
              return {
                title: output.description || output.title || "Reel Instagram",
                transcript: output.description || output.title || "Analyse basée sur le contenu visuel.",
                thumbnail: output.thumbnail || "",
                niche: output.uploader || "Instagram Content",
                views: output.view_count || 0,
                likes: output.like_count || 0,
                comments: output.comment_count || 0,
                followers: 0,
                videoId: output.id || url.split("/").filter(Boolean).pop(),
                finalUrl: url,
                audioUrl: output.url
              };
            }
            throw new Error("Aucun résultat retourné par le secours local.");
          } catch (errorC: any) {
            console.error("DEBUG: Le secours youtube-dl-exec Instagram a également échoué:", errorC.message);
            throw new Error("Impossible de récupérer les données Instagram : les deux serveurs Scraper et le secours local ont échoué.");
          }
        }
      }

      if (!item) {
        throw new Error("Données de média Instagram non récupérées.");
      }

      const owner = item.owner || item.user || {};
      const username = owner.username || owner.user_name;
      console.log("DEBUG: Instagram Owner trouvé :", username);
      
      const videoId = item.shortcode || item.id || url.split("/").filter(Boolean).pop();
      const caption = item.edge_media_to_caption?.edges?.[0]?.node?.text || item.caption?.text || "";

      let followers = owner.follower_count || owner.followers || owner.edge_followed_by?.count || 0;
      console.log(`DEBUG: Followers dans 1er appel Instagram: ${followers}`);

      if (!followers && username) {
        try {
          console.log(`DEBUG: Tentative fallback abonnés pour @${username}...`);
          let userUrl = `https://instagram-scraper-stable-api.p.rapidapi.com/get_ig_user_about.php?username_or_url=${username}`;
          let fallbackHost = "instagram-scraper-stable-api.p.rapidapi.com";
          
          if (hostUsed === "instagram-public-bulk-scraper.p.rapidapi.com") {
            userUrl = `https://instagram-public-bulk-scraper.p.rapidapi.com/v1/user/info?username_or_id=${username}`;
            fallbackHost = "instagram-public-bulk-scraper.p.rapidapi.com";
          }

          const userRes = await fetch(userUrl, {
            headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': fallbackHost }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            const u = userData.data || userData.user || userData;
            followers = u.follower_count || u.followers || u.edge_followed_by?.count || u.stats?.followers || 0;
            console.log(`DEBUG: Followers trouvés via fallback Instagram: ${followers}`);
          }
        } catch (e) {
          console.error("DEBUG: Erreur fallback followers Instagram:", e);
        }
      }

      return {
        title: caption || "Reel Instagram",
        transcript: caption || "Analyse basée sur le contenu visuel.",
        thumbnail: item.display_url || item.thumbnail_src || "",
        niche: username || "Instagram Content",
        views: item.video_play_count || item.play_count || item.video_view_count || 0,
        likes: item.edge_media_preview_like?.count || item.like_count || 0,
        comments: item.edge_media_to_parent_comment?.count || item.comment_count || 0,
        followers: followers,
        videoId: videoId,
        finalUrl: url,
        audioUrl: item.video_url
      };
    } else {
      // TikTok Logic - Restauration de la logique complète
      try {
        const host = "tiktok-video-no-watermark2.p.rapidapi.com";
        const apiUrl = `https://${host}/?url=${encodeURIComponent(finalUrl)}`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey || "",
            'X-RapidAPI-Host': host
          }
        });

        const data = await response.json();
        const videoInfo = data.data || data;
        const realId = getUniqueVideoId(finalUrl) || videoInfo.aweme_id || videoInfo.id || videoInfo.video_id;
        
        // Recherche exhaustive des followers TikTok
        let followersCount = videoInfo.author?.follower_count || 
                             videoInfo.author?.followerCount || 
                             videoInfo.author?.followers || 
                             videoInfo.author_stats?.followerCount || 
                             videoInfo.author_stats?.follower_count || 
                             videoInfo.stats?.followerCount || 0;

        // Si toujours à 0, on tente l'appel secondaire pour les infos de l'utilisateur
        if (followersCount === 0 && videoInfo.author?.unique_id) {
          try {
            const userApiUrl = `https://${host}/user/info?unique_id=${videoInfo.author.unique_id}`;
            const userResponse = await fetch(userApiUrl, {
              method: 'GET',
              headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': host }
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              const stats = userData.data?.stats || userData.data || {};
              followersCount = stats.followerCount || stats.follower_count || stats.followers || 0;
            }
          } catch (e) {
            console.error("TikTok secondary followers fetch failed", e);
          }
        }

        const captions = videoInfo.v_captions || videoInfo.captions || [];
        const captionText = Array.isArray(captions) 
          ? captions.map((c: any) => c.text || c.caption_text).join(" ") 
          : "";

        return {
          title: videoInfo.title || videoInfo.description || "Vidéo TikTok",
          transcript: captionText || videoInfo.description || "Analyse visuelle.",
          thumbnail: videoInfo.cover || videoInfo.origin_cover || "",
          niche: videoInfo.author?.nickname || "TikTok Viral",
          audioUrl: videoInfo.play || videoInfo.music || "", 
          videoId: realId,
          finalUrl: finalUrl,
          views: videoInfo.play_count || videoInfo.view_count || 0,
          likes: videoInfo.digg_count || 0,
          comments: videoInfo.comment_count || 0,
          followers: followersCount
        };
      } catch (err: any) {
        console.warn("DEBUG: API TikTok échouée. Passage au secours local youtube-dl-exec...", err.message);
        try {
          const youtubedl = getLocalYtdlp();
          const output = await youtubedl(finalUrl, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificates: true,
          }) as any;

          if (output) {
            console.log("DEBUG: Secours youtube-dl-exec TikTok réussi !");
            return {
              title: output.description || output.title || "Vidéo TikTok",
              transcript: output.description || output.title || "Analyse visuelle.",
              thumbnail: output.thumbnail || "",
              niche: output.uploader || "TikTok Viral",
              audioUrl: output.url || "",
              videoId: output.id || getUniqueVideoId(finalUrl),
              finalUrl: finalUrl,
              views: output.view_count || 0,
              likes: output.like_count || 0,
              comments: output.comment_count || 0,
              followers: 0
            };
          }
          throw new Error("Aucun résultat retourné par le secours local.");
        } catch (errorC: any) {
          console.error("DEBUG: Le secours youtube-dl-exec TikTok a également échoué:", errorC.message);
          throw new Error("Impossible de récupérer les données TikTok : l'API et le secours local ont échoué.");
        }
      }
    }
  } catch (error: any) {
    console.error("Scraping Error:", error);
    throw error;
  }
}

export function getUniqueVideoId(url: string) {
  if (url.includes("v=")) return url.split("v=")[1].split("&")[0];
  if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split("?")[0];
  if (url.includes("youtube.com/shorts/")) return url.split("shorts/")[1].split("?")[0];
  if (url.includes("instagram.com")) {
    const parts = url.split("/");
    // Les URLs Instagram sont souvent /reels/ID/ ou /p/ID/
    const index = parts.findIndex(p => p === "reels" || p === "p" || p === "reel");
    return index !== -1 ? parts[index + 1] : parts[parts.length - 1];
  }
  if (url.includes("tiktok.com")) {
    const cleanUrl = url.replace(/\/$/, "");
    const parts = cleanUrl.split("/");
    return parts[parts.length - 1].split("?")[0];
  }
  return url;
}

