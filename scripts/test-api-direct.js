import { MusicService } from '../lib/services/musicService.ts';

async function testApiDirect() {
  console.log("🧪 Testing MusicService directly...");
  
  try {
    // Test getAllTracks
    console.log("1️⃣ Testing getAllTracks...");
    const tracks = await MusicService.getAllTracks();
    console.log(`✅ Found ${tracks.length} tracks:`);
    
    tracks.forEach(track => {
      console.log(`   🎵 "${track.title}" by ${track.artist}`);
      console.log(`      📀 Album: ${track.album || 'No album'}`);
      console.log(`      🔗 Audio URL: ${track.audioUrl}`);
      console.log(`      ⏱️ Duration: ${track.duration}s`);
      console.log("");
    });
    
    // Test search
    console.log("2️⃣ Testing search for 'vx'...");
    const searchResults = await MusicService.searchTracks('vx');
    console.log(`✅ Search found ${searchResults.length} results`);
    
    // Test search for 'future'
    console.log("3️⃣ Testing search for 'future'...");
    const futureResults = await MusicService.searchTracks('future');
    console.log(`✅ Search found ${futureResults.length} results`);
    
    console.log("🎉 Direct API test completed!");
    
  } catch (error) {
    console.error("❌ Direct API test failed:", error);
  }
}

testApiDirect();
