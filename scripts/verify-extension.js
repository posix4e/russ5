#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

// Function to write to log file
function writeToLog(filename, content) {
  fs.writeFileSync(path.join('./logs', filename), content);
}

// Function to append to log file
function appendToLog(filename, content) {
  fs.appendFileSync(path.join('./logs', filename), content + '\n');
}

try {
  console.log('Verifying Safari extension build...');
  
  // Find the built app
  const derivedDataPath = path.join(process.env.HOME, 'Library/Developer/Xcode/DerivedData');
  
  // Use find command to locate the app
  const findAppCmd = `find ${derivedDataPath} -name "*.app" -type d | grep -v "PlugIns" | head -1`;
  const appPath = execSync(findAppCmd).toString().trim();
  
  let extensionPath = '';
  
  if (appPath) {
    console.log(`App built at: ${appPath}`);
    appendToLog('build_result.log', `App built at: ${appPath}`);
    
    // Check for extension in the app bundle
    const findExtensionInAppCmd = `find "${appPath}" -name "*.appex" -type d | head -1`;
    extensionPath = execSync(findExtensionInAppCmd).toString().trim();
  } else {
    console.log('❌ Could not find built app, looking for standalone extension...');
    appendToLog('build_result.log', '❌ Could not find built app, looking for standalone extension...');
  }
  
  // If extension not found in app bundle, look for standalone extension
  if (!extensionPath) {
    console.log('Looking for standalone extension...');
    const findStandaloneExtensionCmd = `find ${derivedDataPath} -path "*/Build/Products/Debug/*.appex" -type d | head -1`;
    extensionPath = execSync(findStandaloneExtensionCmd).toString().trim();
  }
  
  if (!extensionPath) {
    console.error('❌ No extension found in app bundle or as standalone!');
    appendToLog('build_result.log', '❌ No extension found in app bundle or as standalone!');
    process.exit(1);
  }
  
  console.log(`✅ Extension found at: ${extensionPath}`);
  appendToLog('build_result.log', `✅ Extension found at: ${extensionPath}`);
  
  // List extension contents
  const extensionContentsCmd = `ls -la "${extensionPath}"`;
  const extensionContents = execSync(extensionContentsCmd).toString();
  console.log('Extension contents:');
  console.log(extensionContents);
  writeToLog('extension_contents.log', extensionContents);
  
  // Check Info.plist
  const infoPlistPath = path.join(extensionPath, 'Info.plist');
  if (fs.existsSync(infoPlistPath)) {
    const infoPlistCmd = `plutil -p "${infoPlistPath}"`;
    const infoPlistContents = execSync(infoPlistCmd).toString();
    console.log('Extension Info.plist contents:');
    console.log(infoPlistContents);
    writeToLog('extension_info.log', infoPlistContents);
    
    // Extract key information from Info.plist
    try {
      const bundleId = execSync(`plutil -p "${infoPlistPath}" | grep CFBundleIdentifier | cut -d':' -f2 | tr -d ' ",'`).toString().trim();
      const version = execSync(`plutil -p "${infoPlistPath}" | grep CFBundleShortVersionString | cut -d':' -f2 | tr -d ' ",'`).toString().trim();
      const build = execSync(`plutil -p "${infoPlistPath}" | grep CFBundleVersion | head -1 | cut -d':' -f2 | tr -d ' ",'`).toString().trim();
      
      console.log('Extension details:');
      console.log(`- Bundle ID: ${bundleId}`);
      console.log(`- Version: ${version}`);
      console.log(`- Build: ${build}`);
      
      appendToLog('extension_info.log', `\nExtension details:`);
      appendToLog('extension_info.log', `- Bundle ID: ${bundleId}`);
      appendToLog('extension_info.log', `- Version: ${version}`);
      appendToLog('extension_info.log', `- Build: ${build}`);
    } catch (e) {
      console.log('Could not extract all extension details from Info.plist');
    }
  }
  
  console.log('✅ Safari extension verification completed successfully!');
  appendToLog('build_result.log', '✅ Safari extension verification completed successfully!');
  
} catch (error) {
  console.error('Error during verification:', error.message);
  appendToLog('build_result.log', `Error during verification: ${error.message}`);
  process.exit(1);
}