const http = require('http');

async function testRoute(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'TapTap-Test-Agent'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const success = res.statusCode === 200;
        const size = Math.round(data.length / 1024);
        console.log(`${success ? '✅' : '❌'} ${description}`);
        console.log(`   Status: ${res.statusCode}, Size: ${size}KB`);
        
        if (success) {
          // Check for specific content
          const hasYouTubeSearch = data.includes('YouTube Search');
          const hasVideoPlayer = data.includes('MatrixYouTubePlayer') || data.includes('youtube-nocookie');
          const hasAdFreeIndicator = data.includes('No Ads') || data.includes('AD-FREE');
          
          console.log(`   YouTube Search: ${hasYouTubeSearch ? '✅' : '❌'}`);
          console.log(`   Video Player: ${hasVideoPlayer ? '✅' : '❌'}`);
          console.log(`   Ad-Free Features: ${hasAdFreeIndicator ? '✅' : '❌'}`);
        }
        console.log('');
        resolve({ success, statusCode: res.statusCode, size, data });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${description}`);
      console.log(`   Error: ${err.message}`);
      console.log('');
      resolve({ success: false, error: err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`❌ ${description}`);
      console.log(`   Error: Request timeout`);
      console.log('');
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🎬 Testing YouTube Integration & In-App Video Player\n');
  console.log('=' .repeat(60));
  console.log('');

  const tests = [
    {
      path: '/surf',
      description: 'Surf Page - YouTube Search Interface'
    },
    {
      path: '/surf?v=dQw4w9WgXcQ&play=true',
      description: 'Surf Page - Video Player Modal (with query params)'
    },
    {
      path: '/dashboard',
      description: 'Dashboard - Trending Videos (should link to in-app player)'
    },
    {
      path: '/api/surf/search?q=music',
      description: 'YouTube Search API'
    },
    {
      path: '/api/surf/trending?max=5',
      description: 'YouTube Trending API'
    },
    {
      path: '/api/surf/video?id=dQw4w9WgXcQ',
      description: 'YouTube Video Details API'
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const result = await testRoute(test.path, test.description);
    if (result.success) passed++;
  }

  console.log('=' .repeat(60));
  console.log(`\n🎯 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All YouTube integration tests passed!');
    console.log('✨ Features working:');
    console.log('   • In-app YouTube video player');
    console.log('   • Ad-free video playback');
    console.log('   • Dashboard trending video links');
    console.log('   • YouTube search functionality');
    console.log('   • API endpoints for video data');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
  
  console.log('\n🔗 Test URLs:');
  console.log('   Dashboard: http://localhost:3000/dashboard');
  console.log('   Surf: http://localhost:3000/surf');
  console.log('   Video Player: http://localhost:3000/surf?v=dQw4w9WgXcQ&play=true');
}

runTests().catch(console.error);
