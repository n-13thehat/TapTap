import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const API_KEY = process.env.YOUTUBE_API_KEY;
const YT_SEARCH = "https://www.googleapis.com/youtube/v3/search";
const YT_VIDEOS = "https://www.googleapis.com/youtube/v3/videos";
const YT_CHANNELS = "https://www.googleapis.com/youtube/v3/channels";

// Battle-related keywords for filtering content
const BATTLE_KEYWORDS = [
  'battle', 'vs', 'versus', 'rap battle', 'battle rap',
  'cypher', 'freestyle', 'bars', 'rounds', 'face off'
];

// YouTube API helper
async function youtubeAPI(url: string) {
  const response = await fetch(url, { next: { revalidate: 300 } }); // 5 min cache
  if (!response.ok) {
    const error = await response.text().catch(() => '');
    throw new Error(`YouTube API error ${response.status}: ${error || response.statusText}`);
  }
  return response.json();
}

// Extract battler names from title using common patterns
function extractBattlers(title: string): { battlerA?: string; battlerB?: string } {
  // Common patterns: "A vs B", "A VS B", "A v B", "A | B", "A x B"
  const patterns = [
    /(.+?)\s+(?:vs\.?|versus|v\.?)\s+(.+?)(?:\s*\||$)/i,
    /(.+?)\s*\|\s*(.+?)(?:\s*\||$)/i,
    /(.+?)\s+x\s+(.+?)(?:\s*\||$)/i,
    /(.+?)\s*-\s*(.+?)(?:\s*\||$)/i
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return {
        battlerA: match[1].trim().replace(/[^\w\s]/g, '').trim(),
        battlerB: match[2].trim().replace(/[^\w\s]/g, '').trim()
      };
    }
  }

  return {};
}

// Determine battle type from title/description
function determineBattleType(title: string, description?: string): string {
  const content = `${title} ${description || ''}`.toLowerCase();
  
  if (content.includes('tournament') || content.includes('bracket')) return 'TOURNAMENT';
  if (content.includes('cypher')) return 'CYPHER';
  if (content.includes('freestyle')) return 'FREESTYLE';
  if (content.includes('acapella') || content.includes('a cappella')) return 'ACAPELLA';
  if (content.includes('written')) return 'WRITTEN';
  
  return 'HEAD_TO_HEAD';
}

// Check if video is likely a battle based on title and metadata
function isBattleContent(title: string, description?: string): boolean {
  const content = `${title} ${description || ''}`.toLowerCase();
  return BATTLE_KEYWORDS.some(keyword => content.includes(keyword));
}

// Sync battles from YouTube for a specific league
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { leagueId, maxResults = 50, syncType = 'recent' } = body;

    // Get league details
    const league = await prisma.battleLeague.findUnique({
      where: { id: leagueId }
    });

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // Fetch recent videos from YouTube
    const searchUrl = `${YT_SEARCH}?part=snippet&channelId=${league.youtubeChannelId}&type=video&order=${syncType === 'popular' ? 'viewCount' : 'date'}&maxResults=${maxResults}&key=${API_KEY}`;
    
    const searchData = await youtubeAPI(searchUrl);
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];

    if (videoIds.length === 0) {
      return NextResponse.json({ 
        message: "No videos found for this league",
        battlesAdded: 0,
        battlesUpdated: 0
      });
    }

    // Get detailed video statistics
    const videosUrl = `${YT_VIDEOS}?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${API_KEY}`;
    const videosData = await youtubeAPI(videosUrl);

    let battlesAdded = 0;
    let battlesUpdated = 0;
    let battlesSkipped = 0;

    for (const video of videosData.items || []) {
      try {
        const snippet = video.snippet;
        const statistics = video.statistics;
        const contentDetails = video.contentDetails;

        // Skip if not battle content
        if (!isBattleContent(snippet.title, snippet.description)) {
          battlesSkipped++;
          continue;
        }

        // Parse duration (PT4M13S format)
        const durationMatch = contentDetails.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const duration = durationMatch ? 
          (parseInt(durationMatch[1] || '0') * 3600) + 
          (parseInt(durationMatch[2] || '0') * 60) + 
          parseInt(durationMatch[3] || '0') : null;

        // Extract battler names
        const { battlerA, battlerB } = extractBattlers(snippet.title);

        // Determine battle type
        const battleType = determineBattleType(snippet.title, snippet.description);

        // Upsert battle content
        const battleContent = await prisma.battleContent.upsert({
          where: { youtubeVideoId: video.id },
          update: {
            title: snippet.title,
            description: snippet.description,
            viewCount: parseInt(statistics.viewCount || '0'),
            likeCount: parseInt(statistics.likeCount || '0'),
            commentCount: parseInt(statistics.commentCount || '0'),
            battlerA,
            battlerB,
            battleType: battleType as any,
            syncedAt: new Date()
          },
          create: {
            leagueId: league.id,
            youtubeVideoId: video.id,
            title: snippet.title,
            description: snippet.description,
            thumbnailUrl: snippet.thumbnails?.maxres?.url || 
                         snippet.thumbnails?.high?.url || 
                         snippet.thumbnails?.medium?.url,
            publishedAt: new Date(snippet.publishedAt),
            viewCount: parseInt(statistics.viewCount || '0'),
            likeCount: parseInt(statistics.likeCount || '0'),
            commentCount: parseInt(statistics.commentCount || '0'),
            duration,
            battlerA,
            battlerB,
            battleType: battleType as any,
            status: 'ACTIVE'
          }
        });

        if (battleContent) {
          // Check if this was a new record
          const existing = await prisma.battleContent.findUnique({
            where: { youtubeVideoId: video.id },
            select: { createdAt: true, updatedAt: true }
          });

          if (existing && existing.createdAt.getTime() === existing.updatedAt.getTime()) {
            battlesAdded++;
          } else {
            battlesUpdated++;
          }
        }
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
        continue;
      }
    }

    // Update league statistics
    const totalBattles = await prisma.battleContent.count({
      where: { leagueId: league.id, status: 'ACTIVE' }
    });

    const totalViews = await prisma.battleContent.aggregate({
      where: { leagueId: league.id, status: 'ACTIVE' },
      _sum: { viewCount: true }
    });

    await prisma.battleLeague.update({
      where: { id: league.id },
      data: {
        totalBattles,
        totalViews: totalViews._sum.viewCount || 0,
        avgViewCount: totalBattles > 0 ? Math.round((totalViews._sum.viewCount || 0) / totalBattles) : 0,
        lastSyncAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      league: league.name,
      battlesAdded,
      battlesUpdated,
      battlesSkipped,
      totalProcessed: videosData.items?.length || 0,
      message: `Sync completed: ${battlesAdded} added, ${battlesUpdated} updated, ${battlesSkipped} skipped`
    });

  } catch (error: any) {
    console.error('Battle sync error:', error);
    return NextResponse.json({ 
      error: error.message,
      details: 'Failed to sync battle content from YouTube'
    }, { status: 500 });
  }
}
