async function checkHtmlFollowers() {
  const username = "moustapha.pb";
  const url = `https://www.instagram.com/${username}/`;
  
  try {
    console.log(`Fetching HTML for @${username}...`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    const html = await res.text();
    console.log("HTML length:", html.length);
    
    // Check if we can find follower count in meta tags
    // e.g. <meta content="123K Followers, 456 Following, 78 Posts - See Instagram photos and videos from ..." name="description" />
    const metaMatch = html.match(/<meta\s+content="([^"]+)"\s+name="description"/i) || 
                      html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
                      
    if (metaMatch) {
      console.log("Found description meta tag:", metaMatch[1]);
      const desc = metaMatch[1];
      // Regex to parse followers (e.g. "12.3k Followers" or "12,3M abonnés" or "123 abonnés")
      const followersMatch = desc.match(/([0-9.,KMBm\s]+)(?:Followers|abonnés|followers)/i);
      if (followersMatch) {
        console.log("Followers match:", followersMatch[1]);
      }
    } else {
      console.log("Description meta tag not found.");
    }
  } catch (e) {
    console.log("HTML fetch error:", e.message);
  }
}

checkHtmlFollowers();
