import { ok, server } from '../_lib/json';
import { ytFetch, VideoItem } from '../_lib/youtube';
import { rateGate } from "../../_lib/rate";

/**
 * /api/surf/trending?region=US&max=10
 */
export async function GET(req: Request) {
  const gate = await rateGate(req, "surf:trending", { capacity: 20, refillPerSec: 0.5 });
  if (gate) return gate;
  try {
    const { searchParams } = new URL(req.url);
    const regionCode = (searchParams.get('region') || 'US').toUpperCase();
    const max = Math.min(Number(searchParams.get('max')) || 10, 25);

    const data = await ytFetch<{ items?: VideoItem[] }>('videos', {
      part: 'snippet,contentDetails,statistics',
      chart: 'mostPopular',
      regionCode,
      maxResults: max,
    });

    const items = (data.items ?? []).map((v) => ({
      id: v.id || '',
      title: v.snippet?.title || '',
      channel: v.snippet?.channelTitle || '',
      thumb: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
      duration: v.contentDetails?.duration || '',
      stats: {
        views: v.statistics?.viewCount || '0',
        likes: v.statistics?.likeCount || '0',
      },
    }));

    return ok({ items, region: regionCode });
  } catch (e) {
    return server('trending failed', e);
  }
}
