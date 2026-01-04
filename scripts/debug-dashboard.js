#!/usr/bin/env node

console.log('🔍 Debugging TapTap Matrix Dashboard');
console.log('====================================\n');

async function debugDashboard() {
  try {
    const response = await fetch('http://localhost:3000/dashboard');
    const html = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📏 Content Length: ${html.length} bytes\n`);
    
    // Extract key sections for debugging
    console.log('🔍 HTML Analysis:');
    console.log('=================');
    
    // Check for errors
    const errorMatches = html.match(/error|Error|ERROR/gi);
    if (errorMatches) {
      console.log(`❌ Found ${errorMatches.length} error references`);
      
      // Extract error context
      const lines = html.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes('error')) {
          console.log(`   Line ${index + 1}: ${line.trim().substring(0, 100)}...`);
        }
      });
    } else {
      console.log('✅ No explicit errors found');
    }
    
    // Check for key dashboard elements
    console.log('\n🔍 Content Analysis:');
    console.log('====================');
    
    const checks = [
      { name: 'Welcome back text', pattern: /Welcome back/i },
      { name: 'Dashboard title', pattern: /dashboard/i },
      { name: 'TapTap Matrix branding', pattern: /TapTap Matrix/i },
      { name: 'User role display', pattern: /(CREATOR|ADMIN|LISTENER)/i },
      { name: 'Navigation sidebar', pattern: /sidebar|nav/i },
      { name: 'Featured content', pattern: /(Trending|Social Feed|Featured)/i },
      { name: 'React hydration data', pattern: /__NEXT_DATA__/i },
      { name: 'Loading states', pattern: /(Loading|loading)/i },
      { name: 'Authentication check', pattern: /(useAuth|session)/i }
    ];
    
    checks.forEach(check => {
      const found = check.pattern.test(html);
      const status = found ? '✅' : '❌';
      console.log(`${status} ${check.name.padEnd(25)} - ${found ? 'FOUND' : 'MISSING'}`);
    });
    
    // Check for specific component rendering
    console.log('\n🧩 Component Analysis:');
    console.log('======================');
    
    const componentChecks = [
      { name: 'DashboardContent', pattern: /DashboardContent/i },
      { name: 'DashboardSection', pattern: /DashboardSection/i },
      { name: 'Suspense fallback', pattern: /Loading dashboard/i },
      { name: 'Authentication redirect', pattern: /(router\.push|redirect)/i },
      { name: 'Mock data sections', pattern: /(mockSections|Trending Now)/i }
    ];
    
    componentChecks.forEach(check => {
      const found = check.pattern.test(html);
      const status = found ? '✅' : '❌';
      console.log(`${status} ${check.name.padEnd(25)} - ${found ? 'RENDERED' : 'NOT RENDERED'}`);
    });
    
    // Extract title and meta information
    console.log('\n📄 Page Metadata:');
    console.log('==================');
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      console.log(`📝 Title: ${titleMatch[1]}`);
    }
    
    const metaViewport = html.match(/<meta[^>]*name="viewport"[^>]*content="([^"]+)"/i);
    if (metaViewport) {
      console.log(`📱 Viewport: ${metaViewport[1]}`);
    }
    
    // Check for client-side JavaScript
    console.log('\n⚡ JavaScript Analysis:');
    console.log('=======================');
    
    const scriptTags = html.match(/<script[^>]*>/g);
    if (scriptTags) {
      console.log(`📜 Found ${scriptTags.length} script tags`);
    }
    
    const hasNextJS = html.includes('_next/static');
    console.log(`🔧 Next.js assets: ${hasNextJS ? 'LOADED' : 'MISSING'}`);
    
    const hasReact = html.includes('react');
    console.log(`⚛️  React references: ${hasReact ? 'FOUND' : 'MISSING'}`);
    
    // Extract first 500 characters of body content for inspection
    console.log('\n📖 Body Content Preview:');
    console.log('=========================');
    
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const bodyContent = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').trim();
      console.log(bodyContent.substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugDashboard();
