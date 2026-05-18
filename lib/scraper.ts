// Pas d'import de soi-même

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
      let transcript = "Transcription non disponible.";
      try {
        const transRes = await fetch(`https://${transHost}/transcript?video_id=${videoId}`, {
          headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': transHost }
        });
        const transData = await transRes.json();
        
        if (transData.message && transData.message.includes("quota")) {
          throw new Error("Quota épuisé");
        }

        const v = Array.isArray(transData) ? transData[0] : transData;
        transcript = v.transcriptionAsText || v.transcript || transcript;
      } catch (e) {
        console.log("DEBUG: [YOUTUBE] Quota Transcriptor épuisé, passage au secours...");
        // Secours oEmbed ou Scraping simple pour le titre au moins
        transcript = "Le quota de transcription est épuisé pour aujourd'hui. L'analyse se basera sur le titre et la description.";
      }

      return {
        title,
        transcript,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        niche,
        views,
        likes: 0,
        followers,
        videoId
      };
    }
 else if (isInstagram) {
      console.log("DEBUG: Lancement du scan Instagram via RapidAPI...");
      const instaHost = "instagram-scraper-stable-api.p.rapidapi.com";
      const instaUrl = `https://${instaHost}/get_media_data.php?reel_post_code_or_url=${encodeURIComponent(url)}&type=reel`;

      const response = await fetch(instaUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey || "",
          'X-RapidAPI-Host': instaHost
        }
      });

      if (!response.ok) {
        throw new Error(`Instagram API Error: ${response.statusText}`);
      }

      const result = await response.json();
      const item = result.data || result.body || result;
      
      const owner = item.owner || item.user || {};
      const username = owner.username || owner.user_name;
      console.log("DEBUG: Owner Keys found:", Object.keys(owner).join(", "));
      
      const videoId = item.shortcode || item.id || url.split("/").filter(Boolean).pop();
      const caption = item.edge_media_to_caption?.edges?.[0]?.node?.text || item.caption?.text || "";

      let followers = owner.follower_count || owner.followers || owner.edge_followed_by?.count || 0;
      console.log(`DEBUG: Followers dans 1er appel: ${followers}`);

      if (!followers && username) {
        try {
          console.log(`DEBUG: Tentative fallback abonnés pour @${username}...`);
          const userUrl = `https://${instaHost}/get_ig_user_about.php?username_or_url=${username}`;
          const userRes = await fetch(userUrl, {
            headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': instaHost }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            console.log("DEBUG: Instagram User Response:", JSON.stringify(userData).substring(0, 500));
            const u = userData.data || userData.user || userData;
            followers = u.follower_count || u.followers || u.edge_followed_by?.count || u.stats?.followers || 0;
            console.log(`DEBUG: Followers trouvés via fallback: ${followers}`);
          }
        } catch (e) {
          console.error("DEBUG: Erreur fallback followers:", e);
        }
      }

      return {
        title: caption || "Reel Instagram",
        transcript: caption || "Analyse basée sur le contenu visuel.",
        thumbnail: item.display_url || item.thumbnail_src || "",
        niche: username || "Instagram Content",
        views: item.video_play_count || item.video_view_count || 0,
        likes: item.edge_media_preview_like?.count || item.like_count || 0,
        comments: item.edge_media_to_parent_comment?.count || item.comment_count || 0,
        followers: followers,
        videoId: videoId,
        finalUrl: url,
        audioUrl: item.video_url
      };

    } else {
      // TikTok Logic - Restauration de la logique complète
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

