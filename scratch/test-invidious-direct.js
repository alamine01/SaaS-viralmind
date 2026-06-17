const instances = [
  "https://yewtu.be",
  "https://invidious.projectsegfau.lt",
  "https://invidious.privacydev.net",
  "https://invidious.slipfox.xyz",
  "https://iv.melmac.space"
];

async function runTest() {
  const videoId = "N8Szc3UGrl4"; // The user's YouTube Shorts ID
  
  for (const uri of instances) {
    console.log(`\nTesting instance: ${uri}...`);
    try {
      const vidRes = await fetch(`${uri}/api/v1/videos/${videoId}`, {
        signal: AbortSignal.timeout(5000)
      });
      console.log(`Status: ${vidRes.status}`);
      if (vidRes.ok) {
        const videoData = await vidRes.json();
        const streams = videoData.formatStreams || [];
        console.log(`Found ${streams.length} formatStreams.`);
        if (streams.length > 0) {
          const stream = streams.find(s => s.quality === "720p") || streams[0];
          const downloadUrl = `${uri}/latest_version?id=${videoId}&itag=${stream.itag}&local=true`;
          console.log(`🎉 SUCCESS! Download URL: ${downloadUrl}`);
          break;
        }
      }
    } catch (err) {
      console.error(`Instance ${uri} failed:`, err.message);
    }
  }
}

runTest();
