import { NextRequest, NextResponse } from 'next/server';
import { DefaultLibraryService } from '@/lib/services/defaultLibraryService';
import { MusicService } from '@/lib/services/musicService';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🌟 GET /api/featured called');

    // Get all tracks and filter for VX tracks
    const allTracks = await MusicService.getAllTracks();
    const vxTracks = allTracks.filter(track =>
      track.artist.toLowerCase().includes('vx') ||
      track.album?.toLowerCase().includes('future')
    );

    // Create a simple featured playlist from VX tracks
    const featuredPlaylists = vxTracks.length > 0 ? [{
      id: 'featured-music-for-future',
      title: 'Music For The Future -vx9',
      description: 'The complete Music For The Future collection by VX. Free for all TapTap Matrix users!',
      coverUrl: vxTracks[0]?.cover || '/default-cover.jpg',
      trackCount: vxTracks.length,
      creator: 'VX',
      featured: true,
      free: true,
      tracks: vxTracks.map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration
      }))
    }] : [];

    console.log(`✅ Returning ${vxTracks.length} featured tracks and ${featuredPlaylists.length} playlists`);

    return NextResponse.json({
      tracks: vxTracks.map(track => ({ ...track, featured: true, free: true })),
      playlists: featuredPlaylists,
      featured: {
        artist: {
          name: "VX",
          bio: "Visionary creator of Music For The Future",
          trackCount: vxTracks.length,
          verified: true
        },
        album: {
          title: "Music For The Future -vx9",
          artist: "VX",
          trackCount: vxTracks.length,
          description: "A groundbreaking collection that defines tomorrow's sound"
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching featured content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch featured content',
        tracks: [],
        playlists: [],
        featured: null
      },
      { status: 500 }
    );
  }
}
