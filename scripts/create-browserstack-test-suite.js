/**
 * Script to create a test suite for BrowserStack
 * 
 * This script helps you create a test suite zip file that can be uploaded to BrowserStack.
 * It packages your XCUITest files into a zip archive ready for BrowserStack.
 * 
 * Usage:
 *   node scripts/create-browserstack-test-suite.js [test-directory]
 * 
 * Arguments:
 *   test-directory: Optional. Path to the directory containing your XCUITest files.
 *                   If not provided, it will look for tests in standard locations.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const outputDir = path.resolve(process.cwd(), './dist');
const outputFile = path.resolve(outputDir, 'test-suite.zip');
const testDir = process.argv[2] || findTestDirectory();

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Find test directory if not provided
function findTestDirectory() {
  const possibleDirs = [
    path.resolve(process.cwd(), './russ5UITests'),
    path.resolve(process.cwd(), './UITests'),
    path.resolve(process.cwd(), './Tests'),
    path.resolve(process.cwd(), './russ5Tests')
  ];
  
  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      console.log(`Found test directory: ${dir}`);
      return dir;
    }
  }
  
  console.error('❌ Error: Could not find test directory');
  console.log('Please specify the path to your test directory:');
  console.log('  node scripts/create-browserstack-test-suite.js /path/to/your/tests');
  process.exit(1);
}

// Validate test directory
if (!fs.existsSync(testDir)) {
  console.error(`❌ Error: Test directory not found at ${testDir}`);
  process.exit(1);
}

console.log(`Creating BrowserStack test suite from ${testDir}...`);

try {
  // Create a temporary directory for the test suite
  const tempDir = path.resolve(outputDir, 'browserstack-test-suite-temp');
  if (fs.existsSync(tempDir)) {
    execSync(`rm -rf "${tempDir}"`);
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Copy test files to the temporary directory
  execSync(`cp -R "${testDir}"/* "${tempDir}"/`);
  
  // Create the zip file
  process.chdir(outputDir);
  execSync(`zip -r test-suite.zip browserstack-test-suite-temp`);
  
  // Clean up the temporary directory
  execSync(`rm -rf "${tempDir}"`);
  
  console.log(`✅ Test suite created successfully at ${outputFile}`);
  console.log('\nTo upload this test suite to BrowserStack, run:');
  console.log('npm run browserstack-upload-testsuite');
} catch (error) {
  console.error('❌ Error creating test suite:');
  console.error(error.message);
  process.exit(1);
}