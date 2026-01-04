#!/usr/bin/env node

/**
 * Complete User Journey Test Script
 * Tests the full user experience from sign-in to dashboard navigation
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retries: 3,
  credentials: {
    email: 'vx9@taptap.local',
    password: 'N13thehat'
  }
};

// User journey test routes in order of typical user flow
const USER_JOURNEY_ROUTES = [
  // 1. Landing and Authentication
  { path: '/', name: 'Landing Page', critical: true },
  { path: '/login', name: 'Login Page', critical: true },
  { path: '/signup', name: 'Signup Page', critical: false },
  
  // 2. Post-Login Dashboard
  { path: '/dashboard', name: 'Dashboard (Post-Login)', critical: true },
  { path: '/featured-embed', name: 'Featured Content Embed', critical: true },
  
  // 3. Core Features Navigation
  { path: '/social', name: 'Social Feed', critical: true },
  { path: '/library', name: 'Music Library', critical: true },
  { path: '/creator', name: 'Creator Hub', critical: true },
  { path: '/battles', name: 'Battle System', critical: true },
  { path: '/marketplace', name: 'Marketplace', critical: true },
  
  // 4. Discovery and Content
  { path: '/explore', name: 'Explore', critical: true },
  { path: '/discover', name: 'Discover', critical: false },
  { path: '/surf', name: 'YouTube Surf', critical: true },
  { path: '/featured', name: 'Featured Content', critical: false },
  
  // 5. Creation Tools
  { path: '/upload', name: 'Upload', critical: true },
  { path: '/stemstation', name: 'Stem Station', critical: false },
  { path: '/posterize', name: 'Posterize NFTs', critical: false },
  
  // 6. Advanced Features
  { path: '/live', name: 'Live Streaming', critical: false },
  { path: '/mainframe', name: 'Mainframe', critical: false },
  { path: '/ai', name: 'AI Agents', critical: false },
  { path: '/astro', name: 'Astro Tech', critical: false },
  { path: '/visuals', name: 'Visual Components', critical: false },
  
  // 7. Account Management
  { path: '/wallet', name: 'Wallet', critical: false },
  { path: '/settings', name: 'Settings', critical: false },
  { path: '/messages', name: 'Messages', critical: false },
  { path: '/dm', name: 'Direct Messages', critical: false },
  
  // 8. Additional Features
  { path: '/staking', name: 'Staking', critical: false },
  { path: '/governance', name: 'Governance', critical: false },
  { path: '/beta', name: 'Beta Features', critical: false },
  { path: '/changelog', name: 'Changelog', critical: false }
];

// Utility functions
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const request = http.get(url, { timeout: TEST_CONFIG.timeout }, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          responseTime,
          contentLength: data.length
        });
      });
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.on('error', reject);
  });
}

function analyzeResponse(response, routeName) {
  const analysis = {
    status: 'unknown',
    issues: [],
    features: [],
    performance: 'good'
  };

  // Status analysis
  if (response.statusCode === 200) {
    analysis.status = 'success';
  } else if (response.statusCode === 404) {
    analysis.status = 'not_found';
    analysis.issues.push('Route not found');
  } else if (response.statusCode >= 500) {
    analysis.status = 'server_error';
    analysis.issues.push(`Server error: ${response.statusCode}`);
  } else {
    analysis.status = 'client_error';
    analysis.issues.push(`Client error: ${response.statusCode}`);
  }

  // Performance analysis
  if (response.responseTime > 5000) {
    analysis.performance = 'slow';
    analysis.issues.push(`Slow response: ${response.responseTime}ms`);
  } else if (response.responseTime > 2000) {
    analysis.performance = 'moderate';
  }

  // Content analysis
  if (response.data) {
    const content = response.data.toLowerCase();
    
    // Check for interactive elements
    if (content.includes('onclick') || content.includes('button') || content.includes('form')) {
      analysis.features.push('Interactive');
    }
    
    // Check for navigation
    if (content.includes('nav') || content.includes('menu') || content.includes('sidebar')) {
      analysis.features.push('Navigation');
    }
    
    // Check for real-time features
    if (content.includes('live') || content.includes('real-time') || content.includes('websocket')) {
      analysis.features.push('Real-time');
    }
    
    // Check for authentication
    if (content.includes('sign in') || content.includes('login') || content.includes('auth')) {
      analysis.features.push('Authentication');
    }
    
    // Check for errors
    if (content.includes('error') || content.includes('failed') || content.includes('not found')) {
      analysis.issues.push('Error content detected');
    }
    
    // Check for SSR bailout
    if (content.includes('ssr-bailout') || content.includes('hydration')) {
      analysis.issues.push('SSR bailout detected');
    }
  }

  return analysis;
}

async function testUserJourney() {
  console.log('🚀 Starting Complete User Journey Test');
  console.log('=====================================\n');

  const results = {
    total: USER_JOURNEY_ROUTES.length,
    successful: 0,
    failed: 0,
    critical_failed: 0,
    routes: []
  };

  for (const route of USER_JOURNEY_ROUTES) {
    const url = `${BASE_URL}${route.path}`;

    try {
      console.log(`Testing ${route.name.padEnd(25)} (${route.path})...`);

      const response = await makeRequest(url);
      const analysis = analyzeResponse(response, route.name);

      const routeResult = {
        ...route,
        ...analysis,
        responseTime: response.responseTime,
        contentLength: response.contentLength,
        statusCode: response.statusCode
      };

      results.routes.push(routeResult);

      if (analysis.status === 'success') {
        results.successful++;
        console.log(`✅ ${route.name} - OK (${response.responseTime}ms, ${analysis.features.join(', ') || 'Basic'})`);
      } else {
        results.failed++;
        if (route.critical) {
          results.critical_failed++;
        }
        console.log(`❌ ${route.name} - ${analysis.status.toUpperCase()} (${analysis.issues.join(', ')})`);
      }

    } catch (error) {
      results.failed++;
      if (route.critical) {
        results.critical_failed++;
      }

      results.routes.push({
        ...route,
        status: 'error',
        issues: [error.message],
        features: [],
        responseTime: 0,
        contentLength: 0,
        statusCode: 0
      });

      console.log(`❌ ${route.name} - ERROR (${error.message})`);
    }
  }

  // Generate summary report
  console.log('\n📊 USER JOURNEY TEST SUMMARY');
  console.log('============================');
  console.log(`✅ Successful: ${results.successful}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`🚨 Critical Failed: ${results.critical_failed}`);
  console.log(`📈 Success Rate: ${((results.successful / results.total) * 100).toFixed(1)}%`);

  // Critical path analysis
  const criticalRoutes = results.routes.filter(r => r.critical);
  const criticalSuccess = criticalRoutes.filter(r => r.status === 'success').length;
  console.log(`🎯 Critical Path Success: ${criticalSuccess}/${criticalRoutes.length} (${((criticalSuccess / criticalRoutes.length) * 100).toFixed(1)}%)`);

  // Performance analysis
  const avgResponseTime = results.routes
    .filter(r => r.responseTime > 0)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.routes.filter(r => r.responseTime > 0).length;
  console.log(`⚡ Average Response Time: ${avgResponseTime.toFixed(0)}ms`);

  // Feature analysis
  const featureCount = {};
  results.routes.forEach(route => {
    route.features.forEach(feature => {
      featureCount[feature] = (featureCount[feature] || 0) + 1;
    });
  });

  console.log('\n🔍 FEATURE ANALYSIS');
  console.log('===================');
  Object.entries(featureCount).forEach(([feature, count]) => {
    console.log(`${feature}: ${count} routes`);
  });

  // Recommendations
  console.log('\n🎯 RECOMMENDATIONS');
  console.log('==================');

  if (results.critical_failed > 0) {
    console.log('🚨 CRITICAL: Fix failed critical routes immediately');
  }

  if (avgResponseTime > 2000) {
    console.log('⚡ PERFORMANCE: Optimize slow routes for better user experience');
  }

  const ssrIssues = results.routes.filter(r => r.issues.some(i => i.includes('SSR')));
  if (ssrIssues.length > 0) {
    console.log('🔧 SSR: Address SSR bailout issues for better SEO and performance');
  }

  console.log('\n✨ User journey testing complete!');

  return results;
}

// Run the test
if (require.main === module) {
  testUserJourney().catch(console.error);
}

module.exports = { testUserJourney };
