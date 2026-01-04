import { NextRequest, NextResponse } from 'next/server';
import { MusicService } from '@/lib/services/musicService';
import { SmartPlaylistService } from '@/lib/services/smartPlaylistService';
import { MusicAnalysisService } from '@/lib/services/musicAnalysisService';

export async function GET(request: NextRequest) {
  try {
    console.log('🧠 GET /api/discovery called');
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'playlists', 'recommendations', 'analysis'
    const trackId = searchParams.get('trackId');
    const mood = searchParams.get('mood');
    const energy = searchParams.get('energy');
    const timeOfDay = searchParams.get('timeOfDay');
    const activity = searchParams.get('activity');

    // Get all tracks
    const allTracks = await MusicService.getAllTracks();
    
    if (type === 'playlists') {
      // Return all smart playlists
      const smartPlaylists = SmartPlaylistService.generateAllSmartPlaylists(allTracks);
      
      console.log(`✅ Generated ${smartPlaylists.length} smart playlists`);
      
      return NextResponse.json({
        playlists: smartPlaylists,
        totalTracks: allTracks.length,
        generatedAt: new Date().toISOString()
      });
    }
    
    if (type === 'recommendations' && trackId) {
      // Get similar tracks for a specific track
      const targetTrack = allTracks.find(t => t.id === trackId);
      if (!targetTrack) {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }
      
      const similarTracks = MusicAnalysisService.getSimilarTracks(targetTrack, allTracks);
      const trackAnalysis = MusicAnalysisService.getTrackAnalysis(targetTrack);
      
      console.log(`✅ Found ${similarTracks.length} similar tracks for "${targetTrack.title}"`);
      
      return NextResponse.json({
        targetTrack,
        similarTracks,
        analysis: trackAnalysis,
        recommendations: {
          mood: trackAnalysis?.mood,
          energy: trackAnalysis?.energy,
          tags: trackAnalysis?.tags || []
        }
      });
    }
    
    if (type === 'mood' && mood) {
      // Get tracks by mood
      const moodTracks = MusicAnalysisService.getTracksByMood(mood as any, allTracks);
      
      console.log(`✅ Found ${moodTracks.length} tracks for mood: ${mood}`);
      
      return NextResponse.json({
        mood,
        tracks: moodTracks,
        totalFound: moodTracks.length
      });
    }
    
    if (type === 'energy' && energy) {
      // Get tracks by energy level
      const energyTracks = MusicAnalysisService.getTracksByEnergy(energy as any, allTracks);
      
      console.log(`✅ Found ${energyTracks.length} tracks for energy: ${energy}`);
      
      return NextResponse.json({
        energy,
        tracks: energyTracks,
        totalFound: energyTracks.length
      });
    }
    
    if (type === 'time' && timeOfDay) {
      // Get tracks for time of day
      const timeTracks = MusicAnalysisService.getTracksForTimeOfDay(timeOfDay as any, allTracks);
      
      console.log(`✅ Found ${timeTracks.length} tracks for time: ${timeOfDay}`);
      
      return NextResponse.json({
        timeOfDay,
        tracks: timeTracks,
        totalFound: timeTracks.length
      });
    }
    
    if (type === 'activity' && activity) {
      // Get tracks for activity
      const activityTracks = MusicAnalysisService.getTracksForActivity(activity as any, allTracks);
      
      console.log(`✅ Found ${activityTracks.length} tracks for activity: ${activity}`);
      
      return NextResponse.json({
        activity,
        tracks: activityTracks,
        totalFound: activityTracks.length
      });
    }
    
    if (type === 'analysis') {
      // Return analysis for all tracks
      const analysis = MusicAnalysisService.getMusicForTheFutureAnalysis();
      
      console.log(`✅ Returning analysis for ${Object.keys(analysis).length} tracks`);
      
      return NextResponse.json({
        analysis,
        tracks: allTracks.map(track => ({
          ...track,
          analysis: analysis[track.title]
        }))
      });
    }
    
    // Default: return overview
    const smartPlaylists = SmartPlaylistService.generateAllSmartPlaylists(allTracks);
    const currentHour = new Date().getHours();
    
    // Determine current context
    let currentTimeOfDay = 'morning';
    if (currentHour >= 12 && currentHour < 17) currentTimeOfDay = 'afternoon';
    else if (currentHour >= 17 && currentHour < 21) currentTimeOfDay = 'evening';
    else if (currentHour >= 21 || currentHour < 6) currentTimeOfDay = 'night';
    
    const timeRecommendation = smartPlaylists.find(p => p.id.includes(currentTimeOfDay));
    const featuredPlaylists = smartPlaylists.filter(p => 
      ['complete-journey', 'daily-discovery', 'hidden-gems'].includes(p.id)
    );
    
    console.log(`✅ Discovery overview: ${smartPlaylists.length} playlists, current time: ${currentTimeOfDay}`);
    
    return NextResponse.json({
      overview: {
        totalTracks: allTracks.length,
        totalPlaylists: smartPlaylists.length,
        currentTimeOfDay,
        currentHour
      },
      recommendations: {
        timeOfDay: timeRecommendation,
        featured: featuredPlaylists
      },
      playlists: {
        byType: {
          time: smartPlaylists.filter(p => p.type === 'time'),
          activity: smartPlaylists.filter(p => p.type === 'activity'),
          mood: smartPlaylists.filter(p => p.type === 'mood'),
          energy: smartPlaylists.filter(p => p.type === 'energy'),
          discovery: smartPlaylists.filter(p => p.type === 'discovery')
        }
      },
      tracks: allTracks
    });

  } catch (error) {
    console.error('❌ Error in discovery API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate discovery data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
