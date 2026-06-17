export function getCleanVideoUrl(url: string): { cleanUrl: string; platform: string } {
  const isYT = url.includes('youtube.com') || url.includes('youtu.be');
  const isIG = url.includes('instagram.com');
  const isTT = url.includes('tiktok.com');
  let clean = url;
  // Remove tracking params
  try {
    const urlObj = new URL(url);
    urlObj.search = '';
    clean = urlObj.toString();
  } catch (e) {
    // ignore invalid URL parsing
  }
  // Extract shortcodes/ids for IG and TT
  if (isIG) {
    const parts = clean.split('/');
    const last = parts[parts.length - 1];
    clean = last.replace('@', '');
  }
  if (isTT) {
    const match = clean.match(/tiktok.com\/@?([^?]+)/);
    if (match) clean = match[1];
  }
  const platform = isYT ? 'youtube' : isIG ? 'instagram' : isTT ? 'tiktok' : 'unknown';
  return { cleanUrl: clean, platform };
}
