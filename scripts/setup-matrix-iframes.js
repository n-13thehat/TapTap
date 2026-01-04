#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('?? Setting up Matrix Iframe Enhancement System...\n');

// Check if required components exist
const requiredFiles = [
  'components/MatrixRain.tsx',
  'components/MatrixLoader.tsx',
  'components/MatrixIframe.tsx',
  'components/MatrixYouTubePlayer.tsx',
  'lib/matrix-iframe-enhancer.ts',
  'hooks/useMatrixIframes.ts',
  'components/MatrixIframeInitializer.tsx'
];

console.log('?? Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ? ${file}`);
  } else {
    console.log(`  ? ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n? Some required files are missing. Please ensure all Matrix iframe components are properly installed.');
  process.exit(1);
}

console.log('\n? All required files found!');

// Check if MatrixIframeInitializer is added to layout
console.log('\n?? Checking layout integration...');
const layoutPath = path.join(process.cwd(), 'app/layout.tsx');

if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  if (layoutContent.includes('MatrixIframeInitializer')) {
    console.log('  ? MatrixIframeInitializer is integrated in layout');
  } else {
    console.log('  ??  MatrixIframeInitializer not found in layout');
    console.log('     Add the following to your app/layout.tsx:');
    console.log('     import MatrixIframeInitializer from "@/components/MatrixIframeInitializer";');
    console.log('     Then add <MatrixIframeInitializer /> inside your providers');
  }
} else {
  console.log('  ? app/layout.tsx not found');
}

// Create example usage file
console.log('\n?? Creating usage examples...');
const exampleContent = `// Matrix Iframe System Usage Examples

import React from 'react';
import MatrixIframe from '@/components/MatrixIframe';
import MatrixYouTubePlayer from '@/components/MatrixYouTubePlayer';
import { useMatrixIframes } from '@/hooks/useMatrixIframes';

// Example 1: Automatic enhancement (recommended)
export function AutoEnhancedPage() {
  useMatrixIframes(); // This will enhance all iframes automatically
  
  return (
    <div>
      <h1>My Page with Auto-Enhanced Iframes</h1>
      
      {/* These iframes will be automatically enhanced */}
      <iframe src="https://example.com" title="Example" />
      <iframe src="https://codepen.io/pen/" title="CodePen" />
    </div>
  );
}

// Example 2: Manual Matrix iframe wrapper
export function ManualMatrixIframe() {
  return (
    <MatrixIframe
      src="https://example.com"
      title="Matrix Enhanced Content"
      matrixIntensity="strong"
      showMatrixOverlay={true}
      className="w-full h-96"
      onLoad={() => console.log('Matrix iframe loaded')}
    />
  );
}

// Example 3: Matrix YouTube player
export function MatrixVideoPlayer({ videoId }: { videoId: string }) {
  return (
    <MatrixYouTubePlayer
      videoId={videoId}
      autoplay={false}
      controls={true}
      matrixIntensity="medium"
      showMatrixOverlay={true}
      onReady={() => console.log('Matrix YouTube player ready')}
      onPlay={() => console.log('Video playing')}
    />
  );
}

// Example 4: Custom configuration
export function CustomMatrixIframe() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useMatrixIframeWithConfig(iframeRef, {
    intensity: 'subtle',
    showOverlay: true,
    autoEnhance: true,
  });
  
  return (
    <div className="relative">
      <iframe
        ref={iframeRef}
        src="https://example.com"
        className="w-full h-64"
      />
    </div>
  );
}

// Matrix Intensity Levels:
// - 'subtle': Light Matrix effects (speed: 0.8, glow: subtle, trail: 1.0)
// - 'medium': Standard Matrix effects (speed: 1.0, glow: medium, trail: 1.25)
// - 'strong': Intense Matrix effects (speed: 1.3, glow: strong, trail: 1.5)
`;

const examplePath = path.join(process.cwd(), 'examples/matrix-iframe-usage.tsx');
const exampleDir = path.dirname(examplePath);

if (!fs.existsSync(exampleDir)) {
  fs.mkdirSync(exampleDir, { recursive: true });
}

fs.writeFileSync(examplePath, exampleContent);
console.log('  ? Created examples/matrix-iframe-usage.tsx');

// Check for existing iframes that could be enhanced
console.log('\n?? Scanning for existing iframes...');
const scanDirectory = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
};

const componentFiles = scanDirectory(path.join(process.cwd(), 'components'));
const appFiles = scanDirectory(path.join(process.cwd(), 'app'));
const allFiles = [...componentFiles, ...appFiles];

let iframeCount = 0;
const filesWithIframes = [];

allFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const iframeMatches = content.match(/<iframe/g);
    
    if (iframeMatches) {
      iframeCount += iframeMatches.length;
      filesWithIframes.push({
        file: path.relative(process.cwd(), file),
        count: iframeMatches.length
      });
    }
  } catch (error) {
    // Skip files that can't be read
  }
});

if (iframeCount > 0) {
  console.log(`  ?? Found ${iframeCount} iframe(s) in ${filesWithIframes.length} file(s):`);
  filesWithIframes.forEach(({ file, count }) => {
    console.log(`     ${file}: ${count} iframe(s)`);
  });
  console.log('\n  ?? These iframes will be automatically enhanced when you use useMatrixIframes() hook');
} else {
  console.log('  ??  No existing iframes found');
}

console.log('\n?? Matrix Iframe Enhancement System setup complete!');
console.log('\n?? Next steps:');
console.log('1. Visit /matrix-demo to see the system in action');
console.log('2. Add useMatrixIframes() hook to pages with iframes');
console.log('3. Use MatrixYouTubePlayer for YouTube embeds');
console.log('4. Check examples/matrix-iframe-usage.tsx for usage patterns');
console.log('\n?? Documentation: MATRIX_IFRAME_SYSTEM.md');
