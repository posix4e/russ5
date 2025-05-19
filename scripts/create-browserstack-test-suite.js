/**
 * Script to create a test suite for BrowserStack
 * 
 * This script helps you create a test suite zip file that can be uploaded to BrowserStack.
 * It packages your XCUITest files into a zip archive with the proper structure for BrowserStack.
 * 
 * Usage:
 *   node scripts/create-browserstack-test-suite.js [test-directory] [runner-directory] [--skip-runner]
 * 
 * Arguments:
 *   test-directory: Optional. Path to the directory containing your XCUITest files.
 *                   If not provided, it will look for tests in standard locations.
 *   runner-directory: Optional. Path to the directory containing your XCUITest runner.
 *                     If not provided, it will look in standard locations.
 *   --skip-runner: Optional flag. If provided, the script will not attempt to include a runner
 *                  in the test suite, which can be useful if you're having issues with the runner.
 * 
 * Examples:
 *   # Create a test suite with auto-detected test and runner directories
 *   node scripts/create-browserstack-test-suite.js
 * 
 *   # Create a test suite with a specific test directory
 *   node scripts/create-browserstack-test-suite.js /path/to/tests
 * 
 *   # Create a test suite without including a runner
 *   node scripts/create-browserstack-test-suite.js --skip-runner
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const outputDir = path.resolve(process.cwd(), './dist');
const outputFile = path.resolve(outputDir, 'test-suite.zip');
const testDir = process.argv[2] || findTestDirectory();
const runnerDir = process.argv[3] || findRunnerDirectory();
const skipRunner = process.argv.includes('--skip-runner');

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

// Find runner directory if not provided
function findRunnerDirectory() {
  // Look for the XCUITest runner in DerivedData
  try {
    // First try to find the .xctest directory
    const findCmd = "find ~/Library/Developer/Xcode/DerivedData -path '*/Build/Products/Debug-iphonesimulator/*.xctest' -type d | head -1";
    let runnerPath = execSync(findCmd, { encoding: 'utf8' }).trim();
    
    if (runnerPath) {
      // Verify the directory exists and has content
      if (fs.existsSync(runnerPath)) {
        try {
          const files = fs.readdirSync(runnerPath);
          if (files.length > 0) {
            console.log(`Found XCUITest runner at: ${runnerPath}`);
            return runnerPath;
          }
        } catch (e) {
          console.log(`Found runner directory but couldn't read its contents: ${e.message}`);
        }
      }
      
      // If the .xctest directory is empty or inaccessible, try the parent app directory
      const parentAppDir = runnerPath.replace(/\/PlugIns\/.*\.xctest$/, '');
      if (fs.existsSync(parentAppDir)) {
        console.log(`Using parent app directory instead: ${parentAppDir}`);
        return parentAppDir;
      }
    }
  } catch (error) {
    console.log(`Could not find XCUITest runner in DerivedData: ${error.message}`);
  }
  
  // Try alternative locations
  try {
    // Look for any .app directory in DerivedData
    const findAppCmd = "find ~/Library/Developer/Xcode/DerivedData -path '*/Build/Products/Debug-iphonesimulator/*.app' -type d | head -1";
    const appPath = execSync(findAppCmd, { encoding: 'utf8' }).trim();
    
    if (appPath && fs.existsSync(appPath)) {
      console.log(`Found app directory at: ${appPath}`);
      return appPath;
    }
  } catch (error) {
    // Ignore errors in the fallback search
  }
  
  console.log('⚠️ Warning: XCUITest runner not found. Creating test suite without runner.');
  console.log('You may need to build your tests first using Xcode or fastlane.');
  return null;
}

// Validate test directory
if (!fs.existsSync(testDir)) {
  console.error(`❌ Error: Test directory not found at ${testDir}`);
  process.exit(1);
}

console.log(`Creating BrowserStack test suite from ${testDir}...`);

try {
  // Create a temporary directory for the test suite with the proper structure
  const tempDir = path.resolve(outputDir, 'browserstack-test-suite-temp');
  if (fs.existsSync(tempDir)) {
    execSync(`rm -rf "${tempDir}"`);
  }
  
  // Create the Payload directory structure required by BrowserStack
  const payloadDir = path.resolve(tempDir, 'Payload');
  fs.mkdirSync(payloadDir, { recursive: true });
  
  // Copy test files to the temporary directory
  const testTargetDir = path.resolve(payloadDir, 'TestTarget.app');
  fs.mkdirSync(testTargetDir, { recursive: true });
  execSync(`cp -R "${testDir}"/* "${testTargetDir}"/`);
  
  // If we have a runner and aren't skipping it, copy it to the proper location
  if (!skipRunner && runnerDir && fs.existsSync(runnerDir)) {
    const runnerTargetDir = path.resolve(payloadDir, 'Runner.app');
    fs.mkdirSync(runnerTargetDir, { recursive: true });
    
    try {
      // Check if the directory has any files
      const files = fs.readdirSync(runnerDir);
      if (files.length > 0) {
        execSync(`cp -R "${runnerDir}"/* "${runnerTargetDir}"/`);
        console.log(`✅ Runner files copied successfully from ${runnerDir}`);
      } else {
        console.log(`⚠️ Warning: Runner directory exists but is empty: ${runnerDir}`);
        // Create a dummy file to ensure the directory isn't empty
        fs.writeFileSync(path.resolve(runnerTargetDir, 'runner.placeholder'), 'Placeholder file for BrowserStack');
      }
    } catch (error) {
      console.log(`⚠️ Warning: Could not copy files from runner directory: ${error.message}`);
      // Create a dummy file to ensure the directory isn't empty
      fs.writeFileSync(path.resolve(runnerTargetDir, 'runner.placeholder'), 'Placeholder file for BrowserStack');
    }
  } else if (skipRunner) {
    console.log('Skipping runner as requested with --skip-runner flag');
  }
  
  // Create a simple Info.plist if it doesn't exist
  const infoPlistPath = path.resolve(testTargetDir, 'Info.plist');
  if (!fs.existsSync(infoPlistPath)) {
    console.log('Creating basic Info.plist file...');
    const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>xyz.russ.russ5.UITests</string>
    <key>CFBundleName</key>
    <string>russ5UITests</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
</dict>
</plist>`;
    fs.writeFileSync(infoPlistPath, infoPlistContent);
  }
  
  // Create the zip file
  process.chdir(outputDir);
  execSync(`zip -r test-suite.zip Payload -C "${tempDir}"`);
  
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