#!/usr/bin/env node

/**
 * This is a mock validation script for testing GitHub Actions
 */

console.log('Running mock JavaScript validation...');

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');

if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

// Write a mock validation result
const logFile = path.join('./logs', 'js_validation.log');
fs.writeFileSync(logFile, JSON.stringify([
  {
    file: 'mock-file.js',
    type: 'info',
    message: 'Mock validation passed',
    line: 1,
    column: 1
  }
], null, 2));

console.log(`Mock validation results written to ${logFile}`);
console.log('✅ Mock JavaScript validation passed');
process.exit(0);