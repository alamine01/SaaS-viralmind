const youtubedl = require("youtube-dl-exec");

async function run() {
  const url = "https://www.youtube.com/shorts/N8Szc3UGrl4";
  try {
    console.log("Extracting with exact route options...");
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
    });
    
    const formats = output.formats || [];
    const directFormats = formats.filter(f => f.vcodec !== "none" && f.acodec !== "none" && f.ext === "mp4");
    console.log("Direct MP4 formats length:", directFormats.length);
    
    if (directFormats.length > 0) {
      const format = directFormats.find(f => f.qualityLabel === "720p") || directFormats[directFormats.length - 1];
      console.log("URL:", format.url);
    } else {
      console.log("No combined MP4 format found.");
      console.log("All formats:", formats.map(f => `${f.format_id} - ${f.ext} - vcodec: ${f.vcodec} - acodec: ${f.acodec}`));
    }
  } catch (err) {
    console.error("EXACT ROUTE ERROR:", err);
  }
}

run();
