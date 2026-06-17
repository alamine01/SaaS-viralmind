async function testInvidious() {
  const videoId = "dQw4w9WgXcQ"; // Rickroll
  console.log("Fetching invidious instances...");
  try {
    const res = await fetch("https://api.invidious.io/api/v1/instances");
    const instances = await res.json();
    console.log(`Fetched ${instances.length} instances.`);
    
    // Sort by health/uptime or just filter open ones
    const openInstances = instances
      .filter(i => i[1] && i[1].api && i[1].type === "https" && i[1].monitor && i[1].monitor.dailyRatios && i[1].monitor.dailyRatios[0] > 90)
      .map(i => i[1].uri);
      
    console.log(`Found ${openInstances.length} healthy instances.`);
    
    // Try the top 3 healthy ones
    for (const uri of openInstances.slice(0, 5)) {
      console.log(`\nTesting instance: ${uri}...`);
      try {
        const vidRes = await fetch(`${uri}/api/v1/videos/${videoId}`);
        if (vidRes.ok) {
          const videoData = await vidRes.json();
          const streams = videoData.formatStreams || [];
          console.log(`Found ${streams.length} formatStreams.`);
          
          if (streams.length > 0) {
            // Pick a stream (e.g. 360p or 720p)
            const stream = streams.find(s => s.quality === "720p") || streams[0];
            // Format URL to use proxy local=true
            const downloadUrl = `${uri}/latest_version?id=${videoId}&itag=${stream.itag}&local=true`;
            console.log(`SUCCESS! Download url via local proxy: ${downloadUrl}`);
            
            // Try to fetch headers of downloadUrl to make sure it works and doesn't return 403
            const checkRes = await fetch(downloadUrl, { method: 'HEAD' });
            console.log(`HEAD status for download: ${checkRes.status}`);
            if (checkRes.ok) {
              console.log("Confirmed working download URL!");
              break;
            }
          }
        }
      } catch (err) {
        console.error(`Instance ${uri} failed:`, err.message);
      }
    }
  } catch (err) {
    console.error("Failed to query Invidious API:", err.message);
  }
}

testInvidious();
