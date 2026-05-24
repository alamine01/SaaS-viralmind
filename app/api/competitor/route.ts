import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { analyzeCompetitorProfile } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const { handle, platform, userId, forceRefresh = false } = await req.json();

    if (!handle || !platform || !userId) {
      return NextResponse.json({ error: "Handle, plateforme et userId requis." }, { status: 400 });
    }

    const cleanHandle = handle.trim().replace("@", "");
    const apiKey = process.env.RAPIDAPI_KEY;

    // Authenticated Supabase Server Client to respect RLS policies
    const supabase = await createSupabaseServerClient();

    // 1. VÉRIFICATION DU CACHE : charger l'audit si déjà existant
    if (!forceRefresh) {
      const { data: existingAccount } = await supabase
        .from("monitored_accounts")
        .select("*")
        .eq("user_id", userId)
        .eq("handle", cleanHandle)
        .eq("platform", platform)
        .maybeSingle();

      if (existingAccount && existingAccount.audit_report) {
        // Charger aussi ses outliers depuis la table detected_outliers
        const { data: existingOutliers } = await supabase
          .from("detected_outliers")
          .select("*")
          .eq("account_id", existingAccount.id)
          .order("views", { ascending: false });

        return NextResponse.json({
          account: existingAccount,
          outliers: existingOutliers || [],
          cached: true
        });
      }
    }

    // 2. SCRAPING DU PROFIL ET DE SES POSTS
    let posts: any[] = [];
    let followers = 0;

    if (platform === 'youtube') {
      // --- LOGIQUE SCRAPING YOUTUBE ---
      const ytUrl = `https://www.youtube.com/@${cleanHandle}`;
      const res = await fetch(ytUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      const html = await res.text();
      
      let channelId = null;
      const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/);
      if (canonicalMatch) channelId = canonicalMatch[1];
      else {
        const ogUrlMatch = html.match(/<meta property="og:url" content="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/);
        if (ogUrlMatch) channelId = ogUrlMatch[1];
      }

      if (!channelId) {
        const channelIdMatch = html.match(/"channelId":"(UC[A-Za-z0-9_-]{22})"/);
        if (channelIdMatch) channelId = channelIdMatch[1];
      }

      if (!channelId) {
        throw new Error("Impossible de trouver le Channel ID YouTube pour @" + cleanHandle);
      }

      // Extraction du nombre d'abonnés par scraping
      let subText = "";
      const subRegex = /"metadataParts":\s*\[\s*\{\s*"text"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"/g;
      let subMatch;
      while ((subMatch = subRegex.exec(html)) !== null) {
        const text = subMatch[1].toLowerCase();
        if (text.includes('abon') || text.includes('sub') || text.includes('mille')) {
          subText = text;
          break;
        }
      }

      if (subText) {
        const subLower = subText.toLowerCase();
        const numMatch = subLower.match(/([0-9,.\s ]+)/);
        if (numMatch) {
          let cleanNum = numMatch[1].replace(/[\s\u00a0]/g, '').trim();
          if (cleanNum.includes(',')) {
            const parts = cleanNum.split(',');
            cleanNum = parts[1].length < 3 ? cleanNum.replace(',', '.') : cleanNum.replace(',', '');
          }
          let val = parseFloat(cleanNum);
          if (subLower.includes('k') || subLower.includes('mille')) followers = val * 1000;
          else if (subLower.includes('m') || subLower.includes('million')) followers = val * 1000000;
          else followers = val;
        }
      }

      // Scraping direct de l'onglet /videos pour récupérer les vidéos longs formats
      let longCount = 0;
      try {
        const videosTabUrl = `https://www.youtube.com/@${cleanHandle}/videos`;
        const vRes = await fetch(videosTabUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
          }
        });
        const vHtml = await vRes.text();
        
        const blockRegex = /"watchEndpoint":\s*\{\s*"videoId"\s*:\s*"([^"]+)"[\s\S]*?"lockupMetadataViewModel":\s*\{\s*"title"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"\s*\}\s*,\s*"metadata"\s*:\s*\{\s*"contentMetadataViewModel"\s*:\s*\{\s*"metadataRows"\s*:\s*\[\s*\{\s*"metadataParts"\s*:\s*\[\s*\{\s*"text"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"/g;
        let vMatch;
        while ((vMatch = blockRegex.exec(vHtml)) !== null && longCount < 10) {
          const videoId = vMatch[1];
          const title = vMatch[2];
          const viewsText = vMatch[3];
          
          let views = 0;
          if (viewsText) {
            const cleanLower = viewsText.toLowerCase();
            const numMatch = cleanLower.match(/([0-9,.\s ]+)/);
            if (numMatch) {
              let cleanNum = numMatch[1].replace(/[\s\u00a0]/g, '').trim();
              if (cleanNum.includes(',')) {
                const parts = cleanNum.split(',');
                cleanNum = parts[1].length < 3 ? cleanNum.replace(',', '.') : cleanNum.replace(',', '');
              }
              let val = parseFloat(cleanNum);
              if (cleanLower.includes('k') || cleanLower.includes('mille')) views = val * 1000;
              else if (cleanLower.includes('m') || cleanLower.includes('million')) views = val * 1000000;
              else views = val;
            }
          }

          longCount++;
          posts.push({
            id: videoId,
            title: title,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            views: views,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            type: "LONG"
          });
        }
      } catch (vErr: any) {
        console.error("YouTube long videos scraping failed:", vErr.message);
      }

      // Récupération des Shorts via RSS feed
      try {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const rssRes = await fetch(rssUrl);
        const rssText = await rssRes.text();
        const entryRegex = /<entry>[\s\S]*?<yt:videoId>([\w-]+)<\/yt:videoId>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<\/entry>/g;
        let entryMatch;
        while ((entryMatch = entryRegex.exec(rssText)) !== null) {
          const videoId = entryMatch[1];
          if (!posts.some(p => p.id === videoId)) {
            const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
            const watchHtml = await watchRes.text();
            let views = 0;
            const viewMatch = watchHtml.match(/"viewCount":"(\d+)"/);
            if (viewMatch) views = parseInt(viewMatch[1]);

            posts.push({
              id: videoId,
              title: entryMatch[2].trim(),
              thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              views: views,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              type: "SHORT"
            });
          }
        }
      } catch (rssErr: any) {
        console.error("YouTube RSS feed parsing failed:", rssErr.message);
      }

    } else if (platform === 'instagram') {
      // --- LOGIQUE SCRAPING INSTAGRAM ---
      const apifyToken = process.env.APIFY_API_TOKEN;
      if (apifyToken) {
        try {
          const profileUrl = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apifyToken}`;
          const postsUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${apifyToken}`;

          const [profileRes, postsRes] = await Promise.all([
            fetch(profileUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ "usernames": [cleanHandle], "resultsLimit": 1 })
            }),
            fetch(postsUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ "directUrls": [`https://www.instagram.com/${cleanHandle}/`], "resultsLimit": 10 })
            })
          ]);

          if (profileRes.ok && postsRes.ok) {
            const [profileData, postsData] = await Promise.all([profileRes.json(), postsRes.json()]);
            if (profileData.length > 0) followers = parseInt(profileData[0].followersCount || "0");
            posts = postsData.map((p: any) => {
              const views = p.videoPlayCount || p.playCount || p.videoViewCount || 0;
              return {
                id: p.shortCode || p.id,
                title: p.caption || "Reel Instagram",
                views: parseInt(views) || 0,
                thumbnail: p.displayUrl || "",
                url: `https://www.instagram.com/reel/${p.shortCode || p.id}/`
              };
            }).filter((p: any) => p.views > 0);
          }
        } catch (err: any) {
          console.error("Instagram Apify scraper failed:", err.message);
        }
      }

      // Secours Instagram via RapidAPI
      if (posts.length === 0) {
        try {
          const instaHost = "instagram-scraper-stable-api.p.rapidapi.com";
          const [postsRes, aboutRes] = await Promise.all([
            fetch(`https://${instaHost}/get_ig_user_posts.php`, {
              method: 'POST',
              headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': instaHost, 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({ username_or_url: cleanHandle })
            }),
            fetch(`https://${instaHost}/get_ig_user_about.php?username_or_url=${cleanHandle}`, {
              headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': instaHost }
            })
          ]);

          if (aboutRes.ok) {
            const userData = await aboutRes.json();
            const u = userData.data || userData.user || userData;
            followers = parseInt(u.follower_count || u.followers || u.edge_followed_by?.count || "0");
          }

          if (postsRes.ok) {
            const instaData = await postsRes.json();
            const mediaList = instaData.posts || instaData.data || instaData.user || [];
            posts = mediaList.map((edge: any) => {
              const node = edge.node || edge;
              const views = node.video_play_count || node.play_count || node.video_view_count || node.views || 0;
              const shortcode = node.code || node.shortcode || node.id;
              return {
                id: shortcode,
                title: node.caption?.text || "Reel Instagram",
                views: parseInt(views) || 0,
                thumbnail: node.display_url || node.thumbnail_src || "",
                url: `https://www.instagram.com/reel/${shortcode}/`
              };
            }).filter((p: any) => p.views > 0);
          }
        } catch (err: any) {
          console.error("Instagram RapidAPI scraper failed:", err.message);
        }
      }

    } else if (platform === 'tiktok') {
      // --- LOGIQUE SCRAPING TIKTOK ---
      try {
        const tiktokHost = "tiktok-video-no-watermark2.p.rapidapi.com";
        const [postsRes, infoRes] = await Promise.all([
          fetch(`https://${tiktokHost}/user/posts?unique_id=${cleanHandle}&count=10`, {
            headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': tiktokHost }
          }),
          fetch(`https://${tiktokHost}/user/info?unique_id=${cleanHandle}`, {
            headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': tiktokHost }
          })
        ]);

        if (infoRes.ok) {
          const userData = await infoRes.json();
          const stats = userData.data?.stats || userData.data || {};
          followers = parseInt(stats.followerCount || stats.follower_count || stats.followers || "0");
        }

        if (postsRes.ok) {
          const tiktokData = await postsRes.json();
          const videosList = tiktokData.data?.videos || tiktokData.videos || tiktokData.data || [];
          posts = videosList.map((v: any) => ({
            id: v.video_id || v.aweme_id,
            title: v.title || v.description || "Vidéo TikTok",
            views: parseInt(v.play_count || v.view_count || "0"),
            thumbnail: v.cover || v.origin_cover || "",
            url: `https://www.tiktok.com/@${cleanHandle}/video/${v.video_id || v.aweme_id}`
          }));

          if (followers === 0 && videosList.length > 0) {
            followers = parseInt(videosList[0].author?.follower_count || "0");
          }
        }
      } catch (err: any) {
        console.error("TikTok scraping failed:", err.message);
      }
    }

    if (posts.length === 0) {
      return NextResponse.json({ error: `Impossible de récupérer les posts de @${cleanHandle}. Vérifiez que le profil est public.` }, { status: 404 });
    }

    // 3. CALCUL DE LA MÉDIANE DES VUES
    const sortedViews = [...posts].map(p => p.views).sort((a, b) => a - b);
    const medianViews = sortedViews[Math.floor(sortedViews.length / 2)] || 1;

    // 4. IDENTIFICATION DES OUTLIERS (Ratio >= 2.0x et vues > 1000)
    const outliersList: any[] = [];
    posts.forEach(post => {
      const outlierScore = parseFloat((post.views / medianViews).toFixed(1));
      if (outlierScore >= 2.0 && post.views > 1000) {
        outliersList.push({
          ...post,
          outlierScore
        });
      }
    });

    // 5. RAPPORT D'AUDIT GLOBAL PAR L'IA (GEMINI)
    let auditReport: any = null;
    try {
      auditReport = await analyzeCompetitorProfile(cleanHandle, platform, followers, medianViews, posts, outliersList);
    } catch (aiErr: any) {
      console.error("Gemini global profile audit failed:", aiErr.message);
      auditReport = {
        strategy_summary: "L'IA n'a pas pu générer l'analyse textuelle de la stratégie.",
        hook_patterns: ["Accroche virale standard"],
        retention_secrets: "Rétention basée sur des formats engageants.",
        action_plan: ["Créer des vidéos de qualité.", "Soigner l'accroche."]
      };
    }

    // 6. ENREGISTREMENT EN BASE DE DONNÉES (MONITORED_ACCOUNTS)
    // On fait un upsert dans la table monitored_accounts
    const { data: updatedAccount, error: dbError } = await supabase
      .from("monitored_accounts")
      .upsert(
        {
          user_id: userId,
          handle: cleanHandle,
          platform,
          followers_count: followers,
          median_views: medianViews,
          audit_report: auditReport,
          last_scanned_at: new Date().toISOString()
        },
        { onConflict: "user_id,handle,platform" } // Unique conflict constraint or we find existing and update
      )
      .select()
      .single();

    // Note: if upsert on Conflict target fails because we don't have a unique constraint on those 3 columns,
    // we can do standard check & insert/update.
    let finalAccount = updatedAccount;
    if (dbError) {
      console.log("DB Upsert conflict/error, trying fallback select and insert/update");
      
      const { data: existing } = await supabase
        .from("monitored_accounts")
        .select("id")
        .eq("user_id", userId)
        .eq("handle", cleanHandle)
        .eq("platform", platform)
        .maybeSingle();

      if (existing) {
        const { data: updated } = await supabase
          .from("monitored_accounts")
          .update({
            followers_count: followers,
            median_views: medianViews,
            audit_report: auditReport,
            last_scanned_at: new Date().toISOString()
          })
          .eq("id", existing.id)
          .select()
          .single();
        finalAccount = updated;
      } else {
        const { data: inserted } = await supabase
          .from("monitored_accounts")
          .insert({
            user_id: userId,
            handle: cleanHandle,
            platform,
            followers_count: followers,
            median_views: medianViews,
            audit_report: auditReport,
            last_scanned_at: new Date().toISOString()
          })
          .select()
          .single();
        finalAccount = inserted;
      }
    }

    // 7. ENREGISTREMENT DES OUTLIERS DANS DETECTED_OUTLIERS
    if (finalAccount && outliersList.length > 0) {
      try {
        // Vider les anciens outliers pour ce compte afin d'éviter les doublons lors du rafraîchissement
        await supabase
          .from("detected_outliers")
          .delete()
          .eq("account_id", finalAccount.id);

        const insertPayload = outliersList.map(o => ({
          user_id: userId,
          account_id: finalAccount.id,
          video_url: o.url,
          thumbnail: o.thumbnail,
          views: o.views,
          followers_at_time: followers,
          outlier_score: o.outlierScore
        }));

        await supabase
          .from("detected_outliers")
          .insert(insertPayload);
      } catch (outError) {
        console.error("Failed to save detected outliers to DB:", outError);
      }
    }

    return NextResponse.json({
      account: finalAccount,
      outliers: outliersList,
      cached: false
    });

  } catch (error: any) {
    console.error("Competitor Audit API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
