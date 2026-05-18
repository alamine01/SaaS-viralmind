import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/mail";

export async function GET(req: Request) {
  try {
    const apiKey = process.env.RAPIDAPI_KEY;

    // 1. Récupérer les comptes qui n'ont pas été scannés depuis 4h (pour correspondre aux nouveaux plans)
    const { data: accounts, error: accError } = await supabase
      .from("monitored_accounts")
      .select("*, profiles(email)")
      .or(`last_scanned_at.is.null,last_scanned_at.lt.${new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()}`)
      .limit(5); // On en traite 5 à la fois pour éviter les timeouts

    if (accError) throw accError;
    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: "Aucun compte à scanner pour le moment." });
    }

    const results = [];

    for (const account of accounts) {
      console.log(`DEBUG: [RADAR] Scan réel de @${account.handle} sur ${account.platform}`);
      
      try {
        let posts: any[] = [];
        let followers = 0;

        if (account.platform === 'youtube') {
          // --- LOGIQUE YOUTUBE ---
          // 1. Résolution de l'ID du canal à partir du handle et scraping abonnés
          const ytUrl = `https://www.youtube.com/@${account.handle.replace("@", "")}`;
          const res = await fetch(ytUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
          });
          const html = await res.text();
          
          let channelId = null;
          const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/);
          if (canonicalMatch) {
            channelId = canonicalMatch[1];
          } else {
            const ogUrlMatch = html.match(/<meta property="og:url" content="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/);
            if (ogUrlMatch) {
              channelId = ogUrlMatch[1];
            } else {
              const twitterMatch = html.match(/<meta name="twitter:url" content="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/);
              if (twitterMatch) {
                channelId = twitterMatch[1];
              }
            }
          }

          if (!channelId) {
            const channelIdMatch = html.match(/"channelId":"(UC[A-Za-z0-9_-]{22})"/);
            if (channelIdMatch) {
              channelId = channelIdMatch[1];
            } else {
              const relMatch = html.match(/youtube\.com\/feeds\/videos\.xml\?channel_id=(UC[A-Za-z0-9_-]{22})/);
              if (relMatch) channelId = relMatch[1];
            }
          }

          if (!channelId) {
            throw new Error("Impossible de trouver le Channel ID YouTube");
          }

          // Extraction du nombre d'abonnés par scraping (secours & précision)
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

          if (!subText) {
            const subMatch = html.match(/"subscriberCountText":\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/);
            subText = subMatch ? subMatch[1].toLowerCase() : "";
          }

          if (subText) {
            const subLower = subText.toLowerCase();
            const numMatch = subLower.match(/([0-9,.\s ]+)/);
            if (numMatch) {
              let cleanNum = numMatch[1].replace(/[\s\u00a0]/g, '').trim();
              if (cleanNum.includes(',')) {
                const parts = cleanNum.split(',');
                if (parts[1].length < 3) {
                  cleanNum = cleanNum.replace(',', '.');
                } else {
                  cleanNum = cleanNum.replace(',', '');
                }
              }
              let val = parseFloat(cleanNum);
              if (subLower.includes('k') || subLower.includes('mille')) followers = val * 1000;
              else if (subLower.includes('m') || subLower.includes('million')) followers = val * 1000000;
              else followers = val;
            }
          }

          // 2. Fetch du flux RSS pour obtenir les Shorts et les chargements récents
          const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
          const rssRes = await fetch(rssUrl);
          const rssText = await rssRes.text();
          
          const rssEntries: any[] = [];
          const entryRegex = /<entry>[\s\S]*?<yt:videoId>([\w-]+)<\/yt:videoId>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<\/entry>/g;
          let entryMatch;
          while ((entryMatch = entryRegex.exec(rssText)) !== null) {
            rssEntries.push({
              id: entryMatch[1],
              title: entryMatch[2].trim(),
              url: `https://www.youtube.com/watch?v=${entryMatch[1]}`
            });
          }

          // 3. Scraping direct de l'onglet /videos pour récupérer les vidéos longs formats (secours ultra-performant)
          let longCount = 0;
          try {
            const videosTabUrl = `https://www.youtube.com/@${account.handle.replace("@", "")}/videos`;
            const vRes = await fetch(videosTabUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
              }
            });
            const vHtml = await vRes.text();
            
            const blockRegex = /"watchEndpoint":\s*\{\s*"videoId"\s*:\s*"([^"]+)"[\s\S]*?"lockupMetadataViewModel":\s*\{\s*"title"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"\s*\}\s*,\s*"metadata"\s*:\s*\{\s*"contentMetadataViewModel"\s*:\s*\{\s*"metadataRows"\s*:\s*\[\s*\{\s*"metadataParts"\s*:\s*\[\s*\{\s*"text"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"/g;
            let vMatch;
            while ((vMatch = blockRegex.exec(vHtml)) !== null && longCount < 6) {
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
                    if (parts[1].length < 3) {
                      cleanNum = cleanNum.replace(',', '.');
                    } else {
                      cleanNum = cleanNum.replace(',', '');
                    }
                  }
                  let val = parseFloat(cleanNum);
                  if (cleanLower.includes('k') || cleanLower.includes('mille')) {
                    views = val * 1000;
                  } else if (cleanLower.includes('m') || cleanLower.includes('million')) {
                    views = val * 1000000;
                  } else {
                    views = val;
                  }
                }
              }

              longCount++;
              posts.push({
                id: videoId,
                title: title,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                views: views,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                type: "LONG"
              });
            }
          } catch (vErr: any) {
            console.error("Échec récupération de l'onglet vidéos, repli RSS seul...", vErr.message);
          }

          // 4. Ajout des Shorts récents (ceux qui sont dans le RSS mais pas dans l'onglet /videos)
          if (rssEntries.length > 0) {
            console.log("DEBUG: [RADAR] Fusion des Shorts récents depuis le flux RSS...");
            for (const entry of rssEntries.slice(0, 6)) {
              if (!posts.some(p => p.id === entry.id)) {
                try {
                  const watchRes = await fetch(entry.url);
                  const watchHtml = await watchRes.text();
                  
                  let views = 0;
                  const viewMatch = watchHtml.match(/"viewCount":"(\d+)"/);
                  if (viewMatch) views = parseInt(viewMatch[1]);
                  
                  if (!views) {
                    const alternativeMatch = watchHtml.match(/(\d+)\s*views/i);
                    if (alternativeMatch) views = parseInt(alternativeMatch[1]);
                  }

                  posts.push({
                    id: entry.id,
                    title: entry.title,
                    thumbnail: `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
                    views: views,
                    url: entry.url,
                    type: "SHORT"
                  });
                } catch (err: any) {
                  console.error(`Erreur de secours pour le Short RSS ${entry.id}:`, err.message);
                }
              }
            }
          }
        } else if (account.platform === 'instagram') {
          // --- LOGIQUE INSTAGRAM ---
          const apifyToken = process.env.APIFY_API_TOKEN;
          if (apifyToken) {
            try {
              console.log(`[SCAN INSTAGRAM] Début scan Apify en parallèle pour @${account.handle}...`);
              const profileUrl = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apifyToken}`;
              const postsUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${apifyToken}`;

              const [profileRes, postsRes] = await Promise.all([
                fetch(profileUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    "usernames": [account.handle.replace("@", "")],
                    "resultsLimit": 1
                  })
                }),
                fetch(postsUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    "directUrls": [`https://www.instagram.com/${account.handle.replace("@", "")}/`],
                    "resultsLimit": 10
                  })
                })
              ]);

              if (profileRes.ok && postsRes.ok) {
                const [profileData, postsData] = await Promise.all([
                  profileRes.json(),
                  postsRes.json()
                ]);

                if (profileData.length > 0) {
                  followers = parseInt(profileData[0].followersCount || "0");
                }

                posts = postsData.map((p: any) => {
                  const views = p.videoPlayCount || p.playCount || p.videoViewCount || 0;
                  return {
                    id: p.shortCode || p.id,
                    title: p.caption || "Reel Instagram",
                    views: parseInt(views) || 0,
                    thumbnail: p.displayUrl || "",
                    url: `https://www.instagram.com/reel/${p.shortCode || p.id}/`
                  };
                }).filter((p: any) => p.views > 0).slice(0, 10);
              } else {
                console.error("[SCAN INSTAGRAM] Échec des appels Apify:", profileRes.status, postsRes.status);
              }
            } catch (err: any) {
              console.error("[SCAN INSTAGRAM] Erreur Apify en parallèle:", err.message);
            }
          }

          // Secours si Apify absent ou a échoué à récupérer des posts
          if (posts.length === 0) {
            console.log("[SCAN INSTAGRAM] Passage au secours via RapidAPI...");
            try {
              const instaHost = "instagram-scraper-stable-api.p.rapidapi.com";
              const instaRes = await fetch(`https://${instaHost}/get_ig_user_posts.php`, {
                method: 'POST',
                headers: { 
                  'X-RapidAPI-Key': apiKey || "", 
                  'X-RapidAPI-Host': instaHost,
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                  username_or_url: account.handle
                })
              });
              const instaData = await instaRes.json();
              
              // Tenter de récupérer les followers via get_ig_user_about.php
              try {
                const userRes = await fetch(`https://${instaHost}/get_ig_user_about.php?username_or_url=${account.handle}`, {
                  headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': instaHost }
                });
                if (userRes.ok) {
                  const userData = await userRes.json();
                  const u = userData.data || userData.user || userData;
                  followers = parseInt(u.follower_count || u.followers || u.edge_followed_by?.count || u.stats?.followers || "0");
                }
              } catch (e: any) {
                console.error("[SCAN INSTAGRAM] Échec get_ig_user_about:", e.message);
              }

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
              }).filter((p: any) => p.views > 0).slice(0, 10);
            } catch (err: any) {
              console.error("[SCAN INSTAGRAM] Erreur secours RapidAPI:", err.message);
            }
          }

        } else if (account.platform === 'tiktok') {
          // --- LOGIQUE TIKTOK ---
          const tiktokHost = "tiktok-video-no-watermark2.p.rapidapi.com";
          const tiktokRes = await fetch(`https://${tiktokHost}/user/posts?unique_id=${account.handle.replace("@", "")}&count=10`, {
            headers: { 
              'X-RapidAPI-Key': apiKey || "", 
              'X-RapidAPI-Host': tiktokHost 
            }
          });
          const tiktokData = await tiktokRes.json();
          const videosList = tiktokData.data?.videos || tiktokData.videos || tiktokData.data || [];

          posts = videosList.map((v: any) => ({
            id: v.video_id || v.aweme_id,
            title: v.title || v.description || "Vidéo TikTok",
            views: parseInt(v.play_count || v.view_count || "0"),
            thumbnail: v.cover || v.origin_cover || "",
            url: `https://www.tiktok.com/@${account.handle.replace("@", "")}/video/${v.video_id || v.aweme_id}`
          }));

          // Appel secondaire pour les infos utilisateur TikTok (nombre d'abonnés)
          try {
            console.log(`[SCAN TIKTOK] Récupération des abonnés secondaires pour @${account.handle}...`);
            const userApiUrl = `https://${tiktokHost}/user/info?unique_id=${account.handle.replace("@", "")}`;
            const userResponse = await fetch(userApiUrl, {
              method: 'GET',
              headers: { 'X-RapidAPI-Key': apiKey || "", 'X-RapidAPI-Host': tiktokHost }
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              const stats = userData.data?.stats || userData.data || {};
              followers = parseInt(stats.followerCount || stats.follower_count || stats.followers || "0");
              console.log(`[SCAN TIKTOK] Abonnés trouvés: ${followers}`);
            }
          } catch (e: any) {
            console.error("[SCAN TIKTOK] Échec de la récupération des abonnés secondaires:", e.message);
          }

          if (followers === 0 && videosList.length > 0) {
            const firstVideo = videosList[0];
            followers = parseInt(firstVideo.author?.follower_count || firstVideo.author?.followers || "0");
          }
        }

        // --- ALGORITHME DE DÉTECTION D'OUTLIER ---
        if (posts.length > 0) {
          // Tri des vues pour calculer la médiane générale (par défaut)
          const sortedViews = [...posts].map(p => p.views).sort((a, b) => a - b);
          const medianViews = sortedViews[Math.floor(sortedViews.length / 2)] || 1;

          // Calculer les médianes par type pour YouTube si présents
          const longPosts = posts.filter(p => p.type === 'LONG');
          const shortPosts = posts.filter(p => p.type === 'SHORT');
          
          const sortedLong = longPosts.map(p => p.views).sort((a, b) => a - b);
          const medianLong = sortedLong[Math.floor(sortedLong.length / 2)] || 1;

          const sortedShort = shortPosts.map(p => p.views).sort((a, b) => a - b);
          const medianShort = sortedShort[Math.floor(sortedShort.length / 2)] || 1;

          // Seuil d'Outlier : 2.5x supérieur à la médiane ET au moins 1 000 vues
          const outliersFound = [];
          for (const post of posts) {
            let activeMedian = medianViews;
            if (post.type === 'LONG') {
              activeMedian = medianLong;
            } else if (post.type === 'SHORT') {
              activeMedian = medianShort;
            }

            const outlierScore = parseFloat((post.views / activeMedian).toFixed(1));
            
            if (outlierScore >= 2.5 && post.views > 1000) {
              // 1. Vérifier si cette pépite est déjà détectée
              const { data: existing } = await supabase
                .from("detected_outliers")
                .select("id")
                .eq("user_id", account.user_id)
                .eq("video_url", post.url)
                .maybeSingle();

              if (!existing) {
                // 2. Insérer l'outlier
                const { error: insertError } = await supabase
                  .from("detected_outliers")
                  .insert({
                    user_id: account.user_id,
                    account_id: account.id,
                    video_url: post.url,
                    thumbnail: post.thumbnail,
                    views: post.views,
                    followers_at_time: followers,
                    outlier_score: outlierScore
                  });

                if (!insertError) {
                  outliersFound.push({ ...post, outlierScore });
                }
              }
            }
          }

          // 3. Envoyer un email d'alerte si de nouvelles pépites sont trouvées
          const userEmail = account.profiles?.email;
          if (outliersFound.length > 0 && userEmail) {
            console.log(`DEBUG: [MAIL] Nouvel Outlier détecté! Envoi de l'alerte à ${userEmail}`);
            await sendEmail({
              to: userEmail,
              subject: `🔥 ${outliersFound.length} nouvelle(s) pépite(s) détectée(s) !`,
              htmlContent: `
                <div style="font-family: sans-serif; background-color: #0f111a; color: #ffffff; padding: 40px; border-radius: 24px; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #6366f1; font-weight: 900; margin-bottom: 20px; font-size: 28px;">ViralMind Radar Alert</h2>
                  <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">Le radar a analysé les posts de <strong>@${account.handle}</strong> (${account.platform}) et a trouvé des vidéos qui ont littéralement explosé par rapport à leur moyenne habituelle !</p>
                  
                  <div style="margin-top: 30px; space-y: 20px;">
                    ${outliersFound.map(o => `
                      <div style="background-color: #1e293b; padding: 20px; border-radius: 16px; margin-bottom: 20px; border: 1px solid #334155;">
                        <img src="${o.thumbnail}" style="width: 100%; border-radius: 12px; margin-bottom: 15px; max-height: 200px; object-cover;" />
                        <h4 style="color: #ffffff; margin: 0 0 10px 0; font-size: 18px;">${o.title || "Vidéo Virale"}</h4>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                          <span style="background-color: rgba(99, 102, 241, 0.2); color: #818cf8; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold;">x${o.outlierScore} OUTLIER</span>
                          <span style="color: #cbd5e1; font-size: 14px; font-weight: bold;">${(o.views / 1000).toFixed(1)}k vues</span>
                        </div>
                        <a href="${o.url}" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 14px;" target="_blank">Analyser le Script</a>
                      </div>
                    `).join("")}
                  </div>
                  
                  <p style="color: #475569; font-size: 12px; margin-top: 40px; text-align: center;">Vous recevez cet email car vous suivez @${account.handle} sur ViralMind.</p>
                </div>
              `
            });
          }
        }

        // Mettre à jour la date du scan du compte surveillé
        await supabase
          .from("monitored_accounts")
          .update({ last_scanned_at: new Date().toISOString() })
          .eq("id", account.id);

        results.push({ handle: account.handle, platform: account.platform, status: "success" });

      } catch (e: any) {
        console.error(`Erreur scan réel @${account.handle}:`, e.message);
        results.push({ handle: account.handle, platform: account.platform, status: "error", error: e.message });
      }
    }

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error("Radar Scan Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
