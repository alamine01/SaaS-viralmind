const youtubedl = require("youtube-dl-exec");

async function runTest() {
  const url = "https://www.youtube.com/shorts/N8Szc3UGrl4";
  console.log("Fetching formats for url:", url);
  try {
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
    });
    
    console.log("Title:", output.title);
    const formats = output.formats || [];
    const directFormats = formats.filter(f => f.vcodec !== "none" && f.acodec !== "none" && f.ext === "mp4");
    console.log(`Found ${directFormats.length} direct MP4 formats.`);
    
    if (directFormats.length > 0) {
      const format = directFormats.find(f => f.qualityLabel === "720p") || directFormats[directFormats.length - 1];
      console.log(`URL: ${format.url}`);
      console.log(`Resolution: ${format.resolution} - Quality: ${format.format_note}`);
      
      console.log("Testing server-side fetch to direct URL...");
      const res = await fetch(format.url, { method: "HEAD" });
      console.log("Fetch status:", res.status);
      console.log("Fetch Headers:", [...res.headers.entries()]);
    }
  } catch (err) {
    console.error("Error with youtube-dl-exec:", err);
  }
}

runTest();
