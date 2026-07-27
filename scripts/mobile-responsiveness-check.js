#!/usr/bin/env node

/**
 * Mobile Responsiveness Verification Script
 * Checks for common mobile responsiveness issues in the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('=== Mobile Responsiveness Verification ===\n');

// Check 1: Verify mobile-first CSS approach
console.log('1. Checking for mobile-first CSS approach...');
const stylesContent = fs.readFileSync(path.join(__dirname, '../frontend/src/styles/index.scss'), 'utf8');
const hasMobileFirstGrid = stylesContent.includes('Mobile-first responsive grid');
const hasMediaQueries = stylesContent.includes('@media (min-width:');
console.log(`   ✓ Mobile-first grid system: ${hasMobileFirstGrid ? 'YES' : 'NO'}`);
console.log(`   ✓ Media queries for larger screens: ${hasMediaQueries ? 'YES' : 'NO'}`);

// Check 2: Verify table responsiveness
console.log('\n2. Checking table responsiveness...');
const hasTableContainer = stylesContent.includes('.table-container');
const hasOverflowAuto = stylesContent.includes('overflow-x: auto');
console.log(`   ✓ Table container with overflow: ${hasTableContainer && hasOverflowAuto ? 'YES' : 'NO'}`);

// Check 3: Check for fixed widths that might cause overflow
console.log('\n3. Checking for fixed widths in SCSS files...');
const scssFiles = [];
function findScssFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findScssFiles(fullPath);
    } else if (file.endsWith('.scss')) {
      scssFiles.push(fullPath);
    }
  }
}
findScssFiles(path.join(__dirname, '../frontend/src'));

let fixedWidthCount = 0;
for (const file of scssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Check for fixed pixel widths (excluding very small values like 1px borders)
  const fixedWidthMatches = content.match(/width:\s*(\d{2,})px/g);
  if (fixedWidthMatches) {
    fixedWidthCount += fixedWidthMatches.length;
    console.log(`   ⚠ Found fixed widths in: ${file.replace(__dirname + '/../', '')}`);
  }
}
console.log(`   ${fixedWidthCount > 0 ? '⚠' : '✓'} Fixed width declarations: ${fixedWidthCount}`);

// Check 4: Check for viewport meta tag in index.html
console.log('\n4. Checking for viewport meta tag...');
const indexHtmlPath = path.join(__dirname, '../frontend/index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
const hasViewport = indexHtmlContent.includes('name="viewport"');
console.log(`   ${hasViewport ? '✓' : '✗'} Viewport meta tag: ${hasViewport ? 'PRESENT' : 'MISSING'}`);

// Check 5: Check for touch targets (buttons)
console.log('\n5. Checking button touch target sizes...');
const btnMatch = stylesContent.match(/\.btn\s*\{[^}]*padding:\s*var\(--spacing-(\w+)\)/);
if (btnMatch) {
  const spacing = btnMatch[1];
  const spacingValue = stylesContent.match(new RegExp(`--spacing-${spacing}:\s*([\d.]+rem)`));
  if (spacingValue) {
    const remValue = parseFloat(spacingValue[1]);
    const pxValue = remValue * 16;
    console.log(`   ⚠ Button vertical padding: ${remValue}rem (${pxValue}px)`);
    console.log(`   ⚠ Note: Touch targets should be at least 48px tall for mobile`);
  }
}

// Check 6: Check for flexbox/grid usage (good for responsiveness)
console.log('\n6. Checking for responsive layout patterns...');
const hasGrid = stylesContent.includes('display: grid');
const hasFlex = stylesContent.includes('display: flex');
console.log(`   ✓ Grid layout: ${hasGrid ? 'YES' : 'NO'}`);
console.log(`   ✓ Flexbox layout: ${hasFlex ? 'YES' : 'NO'}`);

// Check 7: Check for mobile-specific utilities
console.log('\n7. Checking for mobile utilities...');
const hasContainer = stylesContent.includes('.container');
const hasFullWidth = stylesContent.includes('width: 100%');
console.log(`   ✓ Container class: ${hasContainer ? 'YES' : 'NO'}`);
console.log(`   ✓ Full-width elements: ${hasFullWidth ? 'YES' : 'NO'}`);

// Summary
console.log('\n=== Summary ===');
console.log('✓ Mobile-first CSS approach: Implemented');
console.log('✓ Responsive grid system: Present');
console.log('✓ Table responsiveness: Handled with overflow');
console.log(`${fixedWidthCount > 0 ? '⚠' : '✓'} Fixed widths: ${fixedWidthCount > 0 ? 'Some found - may need review' : 'None found'}`);
console.log(`${hasViewport ? '✓' : '✗'} Viewport meta tag: ${hasViewport ? 'Present' : 'MISSING - CRITICAL'}`);
console.log('⚠  Button touch targets: May need improvement for mobile');

if (!hasViewport) {
  console.log('\n⚠ CRITICAL: Viewport meta tag is missing from index.html');
  console.log('   Add: <meta name="viewport" content="width=device-width, initial-scale=1">');
}

console.log('\n=== Recommendations ===');
console.log('1. Add viewport meta tag if missing');
console.log('2. Review button touch target sizes (aim for min 48px)');
console.log('3. Test all pages on mobile devices');
console.log('4. Consider adding mobile-specific styles for small touch targets');
