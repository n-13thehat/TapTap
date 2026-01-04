#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🧪 Testing All TapTap Matrix Routes');
console.log('====================================\n');

// Define all the main routes to test
const routes = [
  // Core pages
  { path: '/', name: 'Root/Landing' },
  { path: '/home', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/signup', name: 'Signup' },
  
  // Main app sections
  { path: '/social', name: 'Social Feed' },
  { path: '/library', name: 'Music Library' },
  { path: '/battles', name: 'Battle System' },
  { path: '/marketplace', name: 'Marketplace' },
  { path: '/creator', name: 'Creator Hub' },
  { path: '/discover', name: 'Discover' },
  { path: '/explore', name: 'Explore' },
  
  // Tools & Features
  { path: '/upload', name: 'Upload' },
  { path: '/stemstation', name: 'Stem Station' },
  { path: '/posterize', name: 'Posterize NFTs' },
  { path: '/surf', name: 'YouTube Surf' },
  { path: '/live', name: 'Live Streaming' },
  
  // System & Admin
  { path: '/mainframe', name: 'Mainframe' },
  { path: '/settings', name: 'Settings' },
  { path: '/wallet', name: 'Wallet' },
  { path: '/staking', name: 'Staking' },
  { path: '/governance', name: 'Governance' },
  
  // AI & Advanced
  { path: '/ai', name: 'AI Agents' },
  { path: '/astro', name: 'Astro Tech' },
  { path: '/visuals', name: 'Visuals' },
  
  // Utility
  { path: '/featured', name: 'Featured Content' },
  { path: '/messages', name: 'Messages' },
  { path: '/dm', name: 'Direct Messages' },
  { path: '/beta', name: 'Beta Features' },
  { path: '/changelog', name: 'Changelog' }
];

async function testRoute(route) {
  try {
    const response = await fetch(`http://localhost:3000${route.path}`);
    const html = await response.text();
    
    const result = {
      path: route.path,
      name: route.name,
      status: response.status,
      success: response.status === 200,
      contentLength: html.length,
      hasReactRoot: html.includes('__next'),
      hasHydrationData: html.includes('__NEXT_DATA__'),
      hasErrors: html.includes('error') || html.includes('Error'),
      hasSSRBailout: html.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING'),
      hasClientComponents: html.includes('"use client"') || html.includes('client'),
      hasNavigation: html.includes('href=') || html.includes('router'),
      hasInteractivity: html.includes('onClick') || html.includes('button')
    };
    
    return result;
  } catch (error) {
    return {
      path: route.path,
      name: route.name,
      status: 'ERROR',
      success: false,
      error: error.message
    };
  }
}

async function testAllRoutes() {
  console.log('🚀 Starting route tests...\n');
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (const route of routes) {
    process.stdout.write(`Testing ${route.name.padEnd(20)} (${route.path})... `);
    
    const result = await testRoute(route);
    results.push(result);
    
    if (result.success) {
      console.log('✅');
      successCount++;
    } else {
      console.log(`❌ (${result.status})`);
      errorCount++;
    }
  }
  
  console.log('\n📊 ROUTE TEST SUMMARY');
  console.log('=====================');
  console.log(`✅ Successful: ${successCount}/${routes.length}`);
  console.log(`❌ Failed: ${errorCount}/${routes.length}`);
  console.log(`📈 Success Rate: ${Math.round((successCount / routes.length) * 100)}%\n`);
  
  // Detailed analysis
  console.log('🔍 DETAILED ANALYSIS');
  console.log('====================\n');
  
  const workingRoutes = results.filter(r => r.success);
  const failedRoutes = results.filter(r => !r.success);
  
  if (workingRoutes.length > 0) {
    console.log('✅ Working Routes:');
    workingRoutes.forEach(route => {
      const flags = [];
      if (route.hasHydrationData) flags.push('Hydrated');
      if (route.hasSSRBailout) flags.push('SSR-Bailout');
      if (route.hasInteractivity) flags.push('Interactive');
      
      console.log(`   ${route.name.padEnd(20)} - ${flags.join(', ') || 'Basic'}`);
    });
    console.log();
  }
  
  if (failedRoutes.length > 0) {
    console.log('❌ Failed Routes:');
    failedRoutes.forEach(route => {
      console.log(`   ${route.name.padEnd(20)} - Status: ${route.status}`);
      if (route.error) {
        console.log(`     Error: ${route.error}`);
      }
    });
    console.log();
  }
  
  // Check for common issues
  const ssrBailouts = workingRoutes.filter(r => r.hasSSRBailout);
  const missingHydration = workingRoutes.filter(r => !r.hasHydrationData);
  const nonInteractive = workingRoutes.filter(r => !r.hasInteractivity);
  
  if (ssrBailouts.length > 0) {
    console.log('⚠️  SSR Bailout Issues:');
    ssrBailouts.forEach(route => {
      console.log(`   ${route.name} (${route.path})`);
    });
    console.log();
  }
  
  if (missingHydration.length > 0) {
    console.log('⚠️  Missing Hydration Data:');
    missingHydration.forEach(route => {
      console.log(`   ${route.name} (${route.path})`);
    });
    console.log();
  }
  
  console.log('🎯 RECOMMENDATIONS');
  console.log('==================');
  
  if (errorCount > 0) {
    console.log('• Fix failed routes first - check for build errors or missing components');
  }
  
  if (ssrBailouts.length > 0) {
    console.log('• Address SSR bailout issues to improve performance and SEO');
  }
  
  if (missingHydration.length > 0) {
    console.log('• Investigate missing hydration data - may affect interactivity');
  }
  
  console.log('• Test sign-in flow on working routes');
  console.log('• Verify navigation between routes works correctly');
  console.log('• Check responsive design on different screen sizes');
  
  return results;
}

// Run the tests
testAllRoutes().catch(console.error);
