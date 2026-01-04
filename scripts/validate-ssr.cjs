#!/usr/bin/env node

/**
 * SSR Validation Script
 * Validates that all SSR improvements are working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating SSR Improvements...\n');

// Check if required files exist
const requiredFiles = [
  'components/ClientLayoutWrapper.tsx',
  'lib/utils/ssr-safe-storage.ts',
  'lib/utils/ssr-safe-browser.ts',
  'lib/utils/dynamic-imports.tsx',
  'hooks/useHydration.ts'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all SSR improvements are in place.');
  process.exit(1);
}

// Scan for unsafe browser API usage
console.log('\n🔍 Scanning for unsafe browser API usage...');

const unsafePatterns = [
  { pattern: /window\./g, description: 'Direct window access', safe: 'typeof window !== "undefined"' },
  { pattern: /document\./g, description: 'Direct document access', safe: 'typeof window !== "undefined"' },
  { pattern: /localStorage\./g, description: 'Direct localStorage access', safe: 'ssrSafeLocalStorage' },
  { pattern: /sessionStorage\./g, description: 'Direct sessionStorage access', safe: 'ssrSafeSessionStorage' },
  { pattern: /navigator\./g, description: 'Direct navigator access', safe: 'safeNavigator' },
  { pattern: /requestAnimationFrame/g, description: 'Direct requestAnimationFrame', safe: 'safeRequestAnimationFrame' }
];

function scanDirectory(dir) {
  const files = [];

  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scan(fullPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js'))) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

const componentFiles = scanDirectory(path.join(process.cwd(), 'components'));
const appFiles = scanDirectory(path.join(process.cwd(), 'app'));
const libFiles = scanDirectory(path.join(process.cwd(), 'lib'));
const hookFiles = scanDirectory(path.join(process.cwd(), 'hooks'));
const allFiles = [...componentFiles, ...appFiles, ...libFiles, ...hookFiles];

let issuesFound = 0;
const issuesByFile = new Map();

allFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(process.cwd(), file);

    // Skip files that are known to be safe or are utility files
    if (relativePath.includes('ssr-safe-') ||
        relativePath.includes('dynamic-imports') ||
        relativePath.includes('useHydration') ||
        relativePath.includes('.d.ts')) {
      return;
    }

    unsafePatterns.forEach(({ pattern, description, safe }) => {
      const matches = content.match(pattern);
      if (matches) {
        // Check if there's a proper guard
        const lines = content.split('\n');
        let hasIssues = false;

        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            // Look for guards in surrounding lines
            const contextStart = Math.max(0, index - 3);
            const contextEnd = Math.min(lines.length, index + 3);
            const context = lines.slice(contextStart, contextEnd).join('\n');

            if (!context.includes('typeof window !== "undefined"') &&
                !context.includes('isBrowser') &&
                !context.includes('useHydration') &&
                !context.includes('useEffect') &&
                !line.includes('//')) { // Skip commented lines
              hasIssues = true;

              if (!issuesByFile.has(relativePath)) {
                issuesByFile.set(relativePath, []);
              }

              issuesByFile.get(relativePath).push({
                line: index + 1,
                content: line.trim(),
                issue: description,
                suggestion: safe
              });

              issuesFound++;
            }
          }
        });
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
});

if (issuesFound > 0) {
  console.log(`\n⚠️  Found ${issuesFound} potential SSR issues:\n`);

  issuesByFile.forEach((issues, file) => {
    console.log(`📄 ${file}:`);
    issues.forEach(({ line, content, issue, suggestion }) => {
      console.log(`  Line ${line}: ${issue}`);
      console.log(`    Code: ${content}`);
      console.log(`    Suggestion: Use ${suggestion}\n`);
    });
  });
} else {
  console.log('✅ No unsafe browser API usage found!');
}

// Check for proper "use client" directives
console.log('\n🔍 Checking client component boundaries...');

let clientComponentIssues = 0;

allFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(process.cwd(), file);

    // Skip non-component files
    if (!relativePath.includes('components/') && !relativePath.includes('app/')) {
      return;
    }

    const hasUseClient = content.includes('"use client"') || content.includes("'use client'");
    const hasHooks = /use[A-Z]/.test(content) && !content.includes('// @ts-ignore');
    const hasEventHandlers = /on[A-Z]/.test(content);
    const hasBrowserAPIs = /window\.|document\.|localStorage\.|navigator\./.test(content);

    if ((hasHooks || hasEventHandlers || hasBrowserAPIs) && !hasUseClient && !relativePath.includes('layout.')) {
      console.log(`  ⚠️  ${relativePath} might need "use client" directive`);
      clientComponentIssues++;
    }
  } catch (error) {
    // Skip files that can't be read
  }
});

if (clientComponentIssues === 0) {
  console.log('✅ Client component boundaries look good!');
}

// Summary
console.log('\n📊 SSR Validation Summary:');
console.log(`  ✅ Required files: ${allFilesExist ? 'All present' : 'Missing files'}`);
console.log(`  ${issuesFound === 0 ? '✅' : '⚠️ '} Browser API usage: ${issuesFound === 0 ? 'Safe' : `${issuesFound} issues found`}`);
console.log(`  ${clientComponentIssues === 0 ? '✅' : '⚠️ '} Client boundaries: ${clientComponentIssues === 0 ? 'Proper' : `${clientComponentIssues} potential issues`}`);

const totalIssues = (allFilesExist ? 0 : 1) + (issuesFound > 0 ? 1 : 0) + (clientComponentIssues > 0 ? 1 : 0);

if (totalIssues === 0) {
  console.log('\n🎉 SSR validation passed! Your app should be 100% SSR-safe.');
} else {
  console.log(`\n⚠️  Found ${totalIssues} categories of issues. Please address them for optimal SSR performance.`);
}

console.log('\n💡 Next steps:');
console.log('  1. Run: npm run build');
console.log('  2. Check for hydration warnings in the console');
console.log('  3. Test in production mode: npm run start');
console.log('  4. Verify no client/server mismatches');

process.exit(totalIssues === 0 ? 0 : 1);