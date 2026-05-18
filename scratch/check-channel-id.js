async function checkChannel() {
  const channelId = "UCY-_QmcW09PHAImgVnKxU2g";
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  
  console.log(`Fetching RSS feed from ${rssUrl}...`);
  const res = await fetch(rssUrl);
  const text = await res.text();
  
  const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/);
  console.log("\n=================================");
  console.log("RSS Feed Channel Title:", titleMatch ? titleMatch[1].trim() : "Not found");
  console.log("=================================");
}

checkChannel();
