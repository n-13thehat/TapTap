import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

type LyricsResponse = {
  text?: string;
  source?: string;
  error?: string;
};

// Simple lyrics search using Genius API (if available)
async function searchGeniusLyrics(artist: string, title: string): Promise<string | null> {
  const geniusToken = env.GENIUS_ACCESS_TOKEN;
  if (!geniusToken) return null;

  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    const searchUrl = `https://api.genius.com/search?q=${query}`;

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${geniusToken}`,
        'User-Agent': 'TapTap-Matrix/1.0'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const hits = data.response?.hits;
    if (!hits || hits.length === 0) return null;

    // Return the URL to the lyrics page (Genius doesn't provide full lyrics via API)
    const firstHit = hits[0];
    return `Lyrics available at: ${firstHit.result?.url || 'Genius.com'}`;
  } catch (error) {
    console.warn('Genius API error:', error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get("trackId");
    const artist = searchParams.get("artist");
    const title = searchParams.get("title");

    if (!trackId && (!artist || !title)) {
      return NextResponse.json({
        error: "Either trackId or both artist and title are required"
      }, { status: 400 });
    }

    let lyricsText: string | null = null;
    let source = "database";

    // First, try to get lyrics from database if trackId is provided
    if (trackId) {
      const track = await prisma.track.findUnique({
        where: { id: trackId },
        select: {
          lyrics: true,
          title: true,
          artist: {
            select: { stageName: true }
          }
        }
      });

      if (track?.lyrics) {
        lyricsText = track.lyrics;
      } else if (track) {
        // Try external search with track info
        const externalLyrics = await searchGeniusLyrics(
          track.artist?.stageName || 'Unknown Artist',
          track.title
        );
        if (externalLyrics) {
          lyricsText = externalLyrics;
          source = "genius";
        }
      }
    }

    // If no lyrics found and we have artist/title, try external search
    if (!lyricsText && artist && title) {
      const externalLyrics = await searchGeniusLyrics(artist, title);
      if (externalLyrics) {
        lyricsText = externalLyrics;
        source = "genius";
      }
    }

    // Fallback response
    if (!lyricsText) {
      const trackInfo = trackId ? `track ${trackId}` : `${artist} - ${title}`;
      lyricsText = `No lyrics available for ${trackInfo}.\n\nLyrics may be available on external platforms.`;
      source = "fallback";
    }

    const response: LyricsResponse = {
      text: lyricsText,
      source
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Lyrics API error:', error);
    return NextResponse.json({
      text: "Unable to fetch lyrics at this time.",
      error: "Internal server error"
    });
  }
}
