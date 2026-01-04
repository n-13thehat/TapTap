const puppeteer = require('puppeteer');

async function debugSignInButton() {
  let browser;
  try {
    console.log('🔍 Starting sign-in button debug...');
    
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      devtools: true,  // Open DevTools
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`🖥️  [${type.toUpperCase()}] ${text}`);
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });
    
    // Listen for request failures
    page.on('requestfailed', request => {
      console.error('🚫 Request Failed:', request.url(), request.failure().errorText);
    });
    
    console.log('📱 Navigating to home page...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);
    
    // Check if sign-in button exists
    const signInButton = await page.$('button:has-text("Sign in")');
    if (!signInButton) {
      console.log('🔍 Looking for sign-in button with different selector...');
      const buttons = await page.$$('button');
      console.log(`Found ${buttons.length} buttons on page`);
      
      for (let i = 0; i < buttons.length; i++) {
        const buttonText = await buttons[i].textContent();
        console.log(`Button ${i + 1}: "${buttonText}"`);
        if (buttonText && buttonText.includes('Sign in')) {
          console.log('✅ Found sign-in button!');
          break;
        }
      }
    }
    
    console.log('🖱️  Attempting to click sign-in button...');
    
    // Try multiple selectors for the sign-in button
    const selectors = [
      'button:has-text("Sign in")',
      'button[type="button"]:has(span:text("Sign in"))',
      'button:contains("Sign in")',
      'button span:text("Sign in")',
      '.inline-flex:has(span:text("Sign in"))'
    ];
    
    let clicked = false;
    for (const selector of selectors) {
      try {
        await page.click(selector, { timeout: 1000 });
        console.log(`✅ Successfully clicked with selector: ${selector}`);
        clicked = true;
        break;
      } catch (error) {
        console.log(`❌ Failed with selector: ${selector}`);
      }
    }
    
    if (!clicked) {
      console.log('🔍 Trying to find and click button by text content...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const signInButton = buttons.find(btn => 
          btn.textContent && btn.textContent.includes('Sign in')
        );
        if (signInButton) {
          console.log('Found sign-in button, clicking...');
          signInButton.click();
          return true;
        }
        return false;
      });
    }
    
    console.log('⏳ Waiting for navigation or error...');
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login') || currentUrl.includes('/api/auth')) {
      console.log('✅ Sign-in button worked! Navigated successfully.');
    } else {
      console.log('❌ Sign-in button may not have worked. Still on same page.');
    }
    
  } catch (error) {
    console.error('💥 Debug script error:', error.message);
  } finally {
    if (browser) {
      console.log('🔒 Closing browser...');
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  debugSignInButton();
} catch (error) {
  console.log('⚠️  Puppeteer not available. Install with: npm install puppeteer');
  console.log('🔧 Alternative: Open browser manually and check console for errors');
  console.log('📍 Navigate to: http://localhost:3000');
  console.log('🖱️  Click the "Sign in" button');
  console.log('🔍 Check browser console (F12) for any error messages');
}
