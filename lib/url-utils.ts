export function getCleanVideoUrl(url: string): { cleanUrl: string; platform: string } {
  if (!url || typeof url !== 'string') {
    return { cleanUrl: '', platform: 'unknown' };
  }

  const trimmed = url.trim();
  const isYT = trimmed.includes('youtube.com') || trimmed.includes('youtu.be');
  const isIG = trimmed.includes('instagram.com');
  const isTT = trimmed.includes('tiktok.com');
  const platform = isYT ? 'youtube' : isIG ? 'instagram' : isTT ? 'tiktok' : 'unknown';

  let clean = trimmed;

  try {
    const urlObj = new URL(trimmed);

    if (isYT) {
      if (urlObj.hostname.includes('youtu.be')) {
        urlObj.search = '';
        clean = urlObj.toString();
      } else if (urlObj.pathname.includes('/shorts/')) {
        urlObj.search = '';
        clean = urlObj.toString();
      } else if (urlObj.searchParams.has('v')) {
        const videoId = urlObj.searchParams.get('v');
        clean = `https://www.youtube.com/watch?v=${videoId}`;
      } else {
        urlObj.search = '';
        clean = urlObj.toString();
      }
    } else {
      urlObj.search = '';
      clean = urlObj.toString();
    }
  } catch (e) {
    clean = trimmed.split('?')[0];
  }

  return { cleanUrl: clean, platform };
}

