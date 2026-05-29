const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const apiKey = process.env.RAPIDAPI_KEY;

// Map each niche to a super reliable, working creator on Scraper A
const creators = {
  "motivation": "karamo_officiel",
  "business": "yomidenzel",
  "tech": "micode",
  "lifestyle": "inoxtag",
  "fitness": "tiboinshape",
  "finance": "yann_darwin",
  "comedy": "paulmirabel",
  "education": "hugodecrypte",
  "food": "fastgoodcuisine",
  "gaming": "gotaga"
};

function formatViewCount(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

async function getRealReelsForCreator(username, niche) {
  try {
    const url = `https://instagram-public-bulk-scraper.p.rapidapi.com/v1/user_reels?username_or_id=${username}`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "instagram-public-bulk-scraper.p.rapidapi.com",
      }
    });
    const data = await res.json();
    const items = data.data?.items || data.data || [];
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const formatted = [];
    // Take the top 3 highly viral reels (views > 10000)
    for (const item of items) {
      const media = item.media || item;
      const shortcode = media.code || media.shortcode;
      if (!shortcode) continue;

      const views = media.play_count || media.view_count || 0;
      if (views < 10000) continue; // Only viral ones!

      const likes = media.like_count || 0;
      const caption = (media.caption?.text || "Reel Instagram").replace(/"/g, '\\"').replace(/\n/g, " ");
      const thumbnail = media.image_versions2?.candidates?.[0]?.url || media.thumbnail_url || "";

      formatted.push({
        id: `ig-real-${shortcode}`,
        source: "instagram",
        platform: "Instagram",
        title: caption.length > 100 ? caption.slice(0, 100) + "..." : caption,
        author: `@${username}`,
        thumbnail: thumbnail,
        url: `https://www.instagram.com/reel/${shortcode}/`,
        embed_url: `https://www.instagram.com/reel/${shortcode}/embed`,
        views: views,
        views_formatted: formatViewCount(views),
        likes: likes,
        niche: niche,
        viral_score: Math.min(99, Math.round(50 + (Math.log10(views + 1) * 8))),
      });

      if (formatted.length >= 3) break; // We need exactly 3 per niche
    }
    return formatted;
  } catch (e) {
    console.error(`Failed for ${username}:`, e.message);
    return [];
  }
}

async function run() {
  console.log("Generating 100% REAL Instagram fallbacks from live API...");
  const finalFallbacks = {};
  
  for (const [niche, creator] of Object.entries(creators)) {
    console.log(`Fetching real Reels for niche: ${niche} via creator: ${creator}...`);
    const reels = await getRealReelsForCreator(creator, niche);
    finalFallbacks[niche] = reels;
    await new Promise(r => setTimeout(r, 1000)); // 1s delay to be perfectly safe against rate limits
  }

  console.log("\n=== COPY PASTE THIS OBJECT INTO app/api/feed/route.ts ===\n");
  console.log(`const FALLBACK_INSTAGRAM_REELS: Record<string, any[]> = ${JSON.stringify(finalFallbacks, null, 2)};`);
}

run();
