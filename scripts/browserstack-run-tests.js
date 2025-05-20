/**
 * Script to run tests on BrowserStack
 * 
 * This script triggers test execution on BrowserStack using the app ID and test suite ID.
 * 
 * Usage:
 *   npm run browserstack-run-tests
 * 
 * Required environment variables:
 *   - BROWSERSTACK_USERNAME: Your BrowserStack username
 *   - BROWSERSTACK_ACCESS_KEY: Your BrowserStack access key
 *   - BROWSERSTACK_APP_ID: The app ID on BrowserStack
 *   - BROWSERSTACK_TEST_SUITE_ID: The test suite ID on BrowserStack
 * 
 * Optional environment variables:
 *   - BROWSERSTACK_DEVICES: Comma-separated list of devices to test on (default: "iPhone 14 Pro-16")
 *   - BROWSERSTACK_PROJECT: Project name (default: "russ5")
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
const appId = process.env.BROWSERSTACK_APP_ID;
const testSuiteId = process.env.BROWSERSTACK_TEST_SUITE_ID;
const devices = process.env.BROWSERSTACK_DEVICES ? process.env.BROWSERSTACK_DEVICES.split(',') : ["iPhone 14 Pro-16"];
const projectName = process.env.BROWSERSTACK_PROJECT || "russ5";

// Try to load test suite ID from file if not provided in environment
let resolvedTestSuiteId = testSuiteId;
if (!resolvedTestSuiteId) {
  const testSuiteIdPath = path.resolve(process.cwd(), '.browserstack-test-suite-id');
  if (fs.existsSync(testSuiteIdPath)) {
    resolvedTestSuiteId = fs.readFileSync(testSuiteIdPath, 'utf8').trim();
    console.log(`Using test suite ID from file: ${resolvedTestSuiteId}`);
  }
}

// Validate environment
if (!username || !accessKey) {
  console.error('❌ Error: BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables are required');
  process.exit(1);
}

if (!appId) {
  console.error('❌ Error: BROWSERSTACK_APP_ID environment variable is required');
  console.log('Please upload your app to BrowserStack first using "npm run browserstack-upload"');
  process.exit(1);
}

if (!resolvedTestSuiteId) {
  console.error('❌ Error: BROWSERSTACK_TEST_SUITE_ID environment variable is required');
  console.log('Please upload your test suite to BrowserStack first using "npm run browserstack-upload-testsuite"');
  process.exit(1);
}

console.log(`Running tests on BrowserStack...`);
console.log(`App ID: ${appId}`);
console.log(`Test Suite ID: ${resolvedTestSuiteId}`);
console.log(`Devices: ${devices.join(', ')}`);

try {
  // Create the request payload
  const payload = {
    app: appId,
    testSuite: resolvedTestSuiteId,
    devices: devices,
    project: projectName,
    buildName: `${projectName}-${new Date().toISOString().replace(/[:.]/g, '-')}`
  };
  
  // Write the payload to a temporary file
  const payloadPath = path.resolve(process.cwd(), '.browserstack-payload.json');
  fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2));
  
  // Execute the tests on BrowserStack
  const runCommand = `curl -u "${username}:${accessKey}" -X POST "https://api-cloud.browserstack.com/app-automate/xcuitest/v2/build" -d @${payloadPath} -H "Content-Type: application/json"`;
  
  const result = execSync(runCommand, { encoding: 'utf8' });
  const response = JSON.parse(result);
  
  if (response.message === "Success" && response.build_id) {
    console.log(`✅ Tests started successfully!`);
    console.log(`Build ID: ${response.build_id}`);
    
    // Save the build ID to a file for later use
    fs.writeFileSync(path.resolve(process.cwd(), '.browserstack-build-id'), response.build_id);
    
    console.log('\nTo check the status of your tests, run:');
    console.log('npm run browserstack-check-results');
    console.log('\nOr visit your BrowserStack dashboard:');
    console.log('https://app-automate.browserstack.com/dashboard');
  } else {
    console.error('❌ Error: Failed to start tests');
    console.error(result);
    process.exit(1);
  }
  
  // Clean up the temporary payload file
  fs.unlinkSync(payloadPath);
} catch (error) {
  console.error('❌ Error running tests on BrowserStack:');
  console.error(error.message);
  process.exit(1);
}