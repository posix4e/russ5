/**
 * Script to check test results on BrowserStack
 * 
 * This script checks the status of a test build on BrowserStack.
 * 
 * Usage:
 *   npm run browserstack-check-results
 * 
 * Required environment variables:
 *   - BROWSERSTACK_USERNAME: Your BrowserStack username
 *   - BROWSERSTACK_ACCESS_KEY: Your BrowserStack access key
 * 
 * Optional environment variables:
 *   - BROWSERSTACK_BUILD_ID: The build ID to check (if not provided, will use the last build ID from file)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
const buildId = process.env.BROWSERSTACK_BUILD_ID;

// Try to load build ID from file if not provided in environment
let resolvedBuildId = buildId;
if (!resolvedBuildId) {
  const buildIdPath = path.resolve(process.cwd(), '.browserstack-build-id');
  if (fs.existsSync(buildIdPath)) {
    resolvedBuildId = fs.readFileSync(buildIdPath, 'utf8').trim();
    console.log(`Using build ID from file: ${resolvedBuildId}`);
  }
}

// Validate environment
if (!username || !accessKey) {
  console.error('❌ Error: BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables are required');
  process.exit(1);
}

if (!resolvedBuildId) {
  console.error('❌ Error: BROWSERSTACK_BUILD_ID environment variable is required or no previous build ID found');
  console.log('Please run tests first using "npm run browserstack-run-tests"');
  process.exit(1);
}

console.log(`Checking test results on BrowserStack...`);
console.log(`Build ID: ${resolvedBuildId}`);

try {
  // Get build status
  const statusCommand = `curl -u "${username}:${accessKey}" -X GET "https://api-cloud.browserstack.com/app-automate/xcuitest/v2/builds/${resolvedBuildId}"`;
  
  const result = execSync(statusCommand, { encoding: 'utf8' });
  const response = JSON.parse(result);
  
  if (response.build_id) {
    console.log(`\n=== Build Status ===`);
    console.log(`Status: ${response.status || 'Unknown'}`);
    console.log(`Project: ${response.project || 'Unknown'}`);
    console.log(`Build Name: ${response.name || 'Unknown'}`);
    console.log(`Duration: ${response.duration || 'Unknown'}`);
    
    if (response.devices && response.devices.length > 0) {
      console.log(`\n=== Devices ===`);
      response.devices.forEach(device => {
        console.log(`- ${device.device} (${device.os}): ${device.status || 'Unknown'}`);
      });
    }
    
    if (response.test_cases && response.test_cases.length > 0) {
      console.log(`\n=== Test Cases ===`);
      const passed = response.test_cases.filter(test => test.status === 'passed').length;
      const failed = response.test_cases.filter(test => test.status === 'failed').length;
      const skipped = response.test_cases.filter(test => test.status === 'skipped').length;
      const total = response.test_cases.length;
      
      console.log(`Total: ${total}, Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}`);
      
      if (failed > 0) {
        console.log(`\n=== Failed Tests ===`);
        response.test_cases
          .filter(test => test.status === 'failed')
          .forEach(test => {
            console.log(`- ${test.name}: ${test.reason || 'Unknown reason'}`);
          });
      }
    }
    
    console.log(`\nView detailed results at: https://app-automate.browserstack.com/dashboard/v2/builds/${resolvedBuildId}`);
  } else {
    console.error('❌ Error: Failed to get build status');
    console.error(result);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error checking test results on BrowserStack:');
  console.error(error.message);
  process.exit(1);
}