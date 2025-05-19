/**
 * Script to upload a test suite to BrowserStack
 * 
 * This script uploads an XCUITest test suite to BrowserStack and saves the test suite ID
 * to the environment variable BROWSERSTACK_TEST_SUITE_ID.
 * 
 * Usage:
 *   npm run browserstack-upload-testsuite
 * 
 * Required environment variables:
 *   - BROWSERSTACK_USERNAME: Your BrowserStack username
 *   - BROWSERSTACK_ACCESS_KEY: Your BrowserStack access key
 * 
 * Optional environment variables:
 *   - BROWSERSTACK_TEST_SUITE_PATH: Path to the test suite zip file (default: ./dist/test-suite.zip)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
const testSuitePath = process.env.BROWSERSTACK_TEST_SUITE_PATH || path.resolve(process.cwd(), './dist/test-suite.zip');

// Validate environment
if (!username || !accessKey) {
  console.error('❌ Error: BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables are required');
  process.exit(1);
}

if (!fs.existsSync(testSuitePath)) {
  console.error(`❌ Error: Test suite file not found at ${testSuitePath}`);
  console.log('Please build your test suite first or specify the correct path using BROWSERSTACK_TEST_SUITE_PATH');
  process.exit(1);
}

console.log(`Uploading test suite from ${testSuitePath} to BrowserStack...`);

try {
  // Upload test suite to BrowserStack
  const uploadCommand = `curl -u "${username}:${accessKey}" -X POST "https://api-cloud.browserstack.com/app-automate/xcuitest/v2/test-suite" -F "file=@${testSuitePath}"`;
  
  const result = execSync(uploadCommand, { encoding: 'utf8' });
  const response = JSON.parse(result);
  
  if (response.test_suite_url) {
    console.log(`✅ Test suite uploaded successfully!`);
    console.log(`Test Suite ID: ${response.test_suite_url}`);
    console.log(`Expiry: ${response.expiry}`);
    
    // Save the test suite ID to a file for later use
    fs.writeFileSync(path.resolve(process.cwd(), '.browserstack-test-suite-id'), response.test_suite_url);
    
    console.log('\nTo use this test suite ID in your tests, set the following environment variable:');
    console.log(`export BROWSERSTACK_TEST_SUITE_ID="${response.test_suite_url}"`);
  } else {
    console.error('❌ Error: Failed to upload test suite');
    console.error(result);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error uploading test suite to BrowserStack:');
  console.error(error.message);
  process.exit(1);
}