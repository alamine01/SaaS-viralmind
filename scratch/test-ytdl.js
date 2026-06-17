const ytdl = require("@distube/ytdl-core");

async function testYtdl() {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rickroll
  console.log("Testing @distube/ytdl-core with URL:", url);
  try {
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, "audioandvideo");
    console.log(`Found ${formats.length} audioandvideo formats.`);
    
    if (formats.length > 0) {
      // Sort to get best quality or 720p
      const format = formats.find(f => f.qualityLabel === "720p" || f.qualityLabel === "1080p") || formats[0];
      console.log(`Best format found: ${format.qualityLabel || 'unknown'} - URL: ${format.url}`);
      
      // Check head status
      const res = await fetch(format.url, { method: "HEAD" });
      console.log("Stream HEAD status:", res.status);
    } else {
      console.log("No combined formats found, trying all formats...");
      console.log(info.formats.map(f => `${f.qualityLabel || f.mimeType} - hasVideo: ${f.hasVideo} - hasAudio: ${f.hasAudio}`).join("\n"));
    }
  } catch (err) {
    console.error("Ytdl error:", err);
  }
}

testYtdl();
