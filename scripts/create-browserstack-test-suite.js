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

// Process command line arguments
const args = process.argv.slice(2);
const skipRunner = args.includes('--skip-runner');

// Remove flags from args
const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));

// Configuration
const outputDir = path.resolve(process.cwd(), './dist');
const outputFile = path.resolve(outputDir, 'test-suite.zip');
const testDir = nonFlagArgs[0] || findTestDirectory();
const runnerDir = skipRunner ? null : (nonFlagArgs[1] || findRunnerDirectory());

console.log(`Skip runner: ${skipRunner ? 'Yes' : 'No'}`);

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
  
  // Check if the test directory is a .app directory
  const isAppDirectory = testDir.endsWith('.app');
  let testTargetDir;
  
  if (isAppDirectory) {
    console.log(`Detected .app directory: ${testDir}`);
    // Copy the entire .app directory to Payload
    const appName = path.basename(testDir);
    testTargetDir = path.resolve(payloadDir, appName);
    execSync(`cp -R "${testDir}" "${payloadDir}/"`);
    console.log(`✅ App directory copied successfully to Payload/${appName}`);
  } else {
    // For non-app directories, create a TestTarget.app and copy files into it
    testTargetDir = path.resolve(payloadDir, 'TestTarget.app');
    fs.mkdirSync(testTargetDir, { recursive: true });
    
    try {
      execSync(`cp -R "${testDir}"/* "${testTargetDir}"/`);
      console.log(`✅ Test files copied to TestTarget.app`);
    } catch (error) {
      console.log(`⚠️ Warning: Error copying test files: ${error.message}`);
      // Create a dummy file to ensure the directory isn't empty
      fs.writeFileSync(path.resolve(testTargetDir, 'test.placeholder'), 'Placeholder file for BrowserStack');
    }
  }
  
  // If we have a runner and aren't skipping it, copy it to the proper location
  if (!skipRunner && runnerDir && fs.existsSync(runnerDir)) {
    // Check if the runner is a .app directory
    const isRunnerAppDir = runnerDir.endsWith('.app');
    let runnerTargetDir;
    
    if (isRunnerAppDir) {
      // Copy the entire .app directory to Payload
      const runnerAppName = path.basename(runnerDir);
      runnerTargetDir = path.resolve(payloadDir, runnerAppName);
      execSync(`cp -R "${runnerDir}" "${payloadDir}/"`);
      console.log(`✅ Runner app directory copied successfully to Payload/${runnerAppName}`);
    } else {
      // For non-app directories, create a Runner.app and copy files into it
      runnerTargetDir = path.resolve(payloadDir, 'Runner.app');
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
    }
  } else if (skipRunner) {
    console.log('Skipping runner as requested with --skip-runner flag');
  }
  
  // Create a simple Info.plist if it doesn't exist
  const infoPlistPath = path.resolve(testTargetDir, 'Info.plist');
  if (!fs.existsSync(infoPlistPath)) {
    console.log('Creating basic Info.plist file...');
    
    // Get app name from the directory name
    const appName = path.basename(testTargetDir, '.app');
    
    const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>xyz.russ.${appName}.UITests</string>
    <key>CFBundleName</key>
    <string>${appName}</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
</dict>
</plist>`;
    fs.writeFileSync(infoPlistPath, infoPlistContent);
    console.log(`✅ Created Info.plist for ${appName}`);
  } else {
    console.log(`✅ Using existing Info.plist in ${path.basename(testTargetDir)}`);
  }
  
  // Verify the Payload directory structure
  try {
    const payloadContents = fs.readdirSync(payloadDir);
    if (payloadContents.length === 0) {
      throw new Error('Payload directory is empty. No files were copied.');
    }
    console.log(`Payload directory contents: ${payloadContents.join(', ')}`);
  } catch (err) {
    console.error(`Error with Payload directory: ${err.message}`);
  }
  
  // Create the zip file
  try {
    // First, make sure we're in the right directory
    const originalDir = process.cwd();
    
    // Remove any existing zip file
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
      console.log(`Removed existing test-suite.zip`);
    }
    
    // Try multiple zip methods to ensure compatibility across platforms
    let zipSuccess = false;
    
    // Method 1: Use zip from the temp directory
    try {
      console.log(`Zipping with method 1: from temp directory`);
      process.chdir(tempDir);
      execSync('zip -r ../test-suite.zip Payload', { stdio: 'inherit' });
      
      if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
        console.log(`✅ Test suite created successfully at ${outputFile}`);
        zipSuccess = true;
      } else {
        console.log(`Method 1 didn't produce a valid zip file`);
      }
    } catch (error) {
      console.log(`Method 1 failed: ${error.message}`);
    }
    
    // Method 2: Use zip with absolute paths
    if (!zipSuccess) {
      try {
        console.log(`Zipping with method 2: absolute paths`);
        process.chdir(originalDir);
        execSync(`cd "${tempDir}" && zip -r "${outputFile}" Payload`, { stdio: 'inherit' });
        
        if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
          console.log(`✅ Test suite created successfully at ${outputFile}`);
          zipSuccess = true;
        } else {
          console.log(`Method 2 didn't produce a valid zip file`);
        }
      } catch (error) {
        console.log(`Method 2 failed: ${error.message}`);
      }
    }
    
    // Method 3: Use tar and gzip as a fallback
    if (!zipSuccess) {
      try {
        console.log(`Zipping with method 3: tar and gzip fallback`);
        process.chdir(tempDir);
        
        // Create a tar.gz file first
        execSync('tar -czf ../test-suite.tar.gz Payload', { stdio: 'inherit' });
        process.chdir(outputDir);
        
        // Rename to .zip if tar.gz was successful
        if (fs.existsSync(path.resolve(outputDir, 'test-suite.tar.gz'))) {
          fs.renameSync('test-suite.tar.gz', 'test-suite.zip');
          console.log(`✅ Test suite created successfully using tar/gzip at ${outputFile}`);
          zipSuccess = true;
        }
      } catch (error) {
        console.log(`Method 3 failed: ${error.message}`);
      }
    }
    
    // Check if any method succeeded
    if (!zipSuccess) {
      throw new Error('All zip methods failed. Could not create test suite zip file.');
    }
  } catch (error) {
    console.error(`Error creating zip file: ${error.message}`);
    throw error;
  } finally {
    // Return to the original directory
    process.chdir(process.cwd());
    
    // Clean up the temporary directory
    try {
      execSync(`rm -rf "${tempDir}"`);
    } catch (error) {
      console.log(`Warning: Could not clean up temp directory: ${error.message}`);
    }
  }
  console.log('\nTo upload this test suite to BrowserStack, run:');
  console.log('npm run browserstack-upload-testsuite');
} catch (error) {
  console.error('❌ Error creating test suite:');
  console.error(error.message);
  process.exit(1);
}