// Test the API endpoints via HTTP
async function testApiHttp() {
  console.log("🧪 Testing TapTap Matrix API via HTTP...");
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Get all tracks
    console.log("1️⃣ Testing GET /api/tracks...");
    const response = await fetch(`${baseUrl}/api/tracks`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Found ${data.tracks?.length || 0} tracks`);
      
      if (data.tracks && data.tracks.length > 0) {
        console.log("   🎵 Tracks found:");
        data.tracks.forEach((track, index) => {
          console.log(`      ${index + 1}. "${track.title}" by ${track.artist}`);
          if (track.album) console.log(`         📀 Album: ${track.album}`);
          console.log(`         🔗 Stream: ${track.audioUrl}`);
          console.log(`         ⏱️ Duration: ${track.duration || 'Unknown'}s`);
        });
        
        // Check for VX tracks specifically
        const vxTracks = data.tracks.filter(t => 
          t.artist.toLowerCase().includes('vx') || 
          t.album?.toLowerCase().includes('future')
        );
        
        if (vxTracks.length > 0) {
          console.log(`   🎵 Music For The Future tracks: ${vxTracks.length}`);
          vxTracks.forEach(track => {
            console.log(`      ✨ "${track.title}" by ${track.artist}`);
          });
        } else {
          console.log("   ⚠️ No Music For The Future tracks found in API response");
        }
      } else {
        console.log("   ⚠️ No tracks returned from API");
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ API Error: ${errorText}`);
    }
    
    // Test 2: Search for VX
    console.log("\n2️⃣ Testing search for 'vx'...");
    const searchResponse = await fetch(`${baseUrl}/api/tracks?q=vx`);
    console.log(`   Status: ${searchResponse.status} ${searchResponse.statusText}`);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`   ✅ Search found ${searchData.tracks?.length || 0} results`);
    }
    
    // Test 3: Test streaming endpoint
    console.log("\n3️⃣ Testing streaming endpoint...");
    const streamResponse = await fetch(`${baseUrl}/api/stream/vx-1764091884235-2Horns.mp3`, {
      method: 'HEAD'
    });
    console.log(`   Status: ${streamResponse.status} ${streamResponse.statusText}`);
    
    if (streamResponse.ok) {
      console.log(`   ✅ Streaming endpoint working`);
      console.log(`   📄 Content-Type: ${streamResponse.headers.get('content-type')}`);
      console.log(`   📏 Content-Length: ${streamResponse.headers.get('content-length')}`);
    } else {
      console.log(`   ⚠️ Streaming endpoint issue`);
    }
    
    console.log("\n🎉 HTTP API test completed!");
    
  } catch (error) {
    console.error("❌ HTTP API test failed:", error.message);
  }
}

// Run the test
testApiHttp();
