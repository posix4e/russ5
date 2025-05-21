#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

try {
  console.log('Creating build summary...');
  
  // Get macOS version
  const macOSVersion = execSync('sw_vers -productVersion').toString().trim();
  
  // Get Xcode version
  const xcodeVersion = execSync('xcodebuild -version | head -n 1').toString().trim();
  
  // Check build status
  let buildStatus = '❌ Failed';
  let extensionStatus = '❌ Not found';
  let packageStatus = '❌ Not created';
  let extensionDetails = '';
  
  if (fs.existsSync('./logs/build_result.log')) {
    const buildResultLog = fs.readFileSync('./logs/build_result.log', 'utf8');
    
    if (buildResultLog.includes('Safari extension verification completed successfully')) {
      buildStatus = '✅ Success';
    }
    
    if (buildResultLog.includes('Extension found at:')) {
      extensionStatus = '✅ Found';
      
      // Extract extension path
      const extensionPathMatch = buildResultLog.match(/Extension found at: (.*)/);
      if (extensionPathMatch && extensionPathMatch[1]) {
        const extensionPath = extensionPathMatch[1].trim();
        extensionDetails = `\n  Path: ${extensionPath}`;
        
        // Package the extension
        try {
          console.log('Packaging extension for distribution...');
          
          // Create dist directory if it doesn't exist
          if (!fs.existsSync('./dist')) {
            fs.mkdirSync('./dist', { recursive: true });
          }
          
          console.log(`Packaging extension from: ${extensionPath}`);
          
          // Copy extension to dist directory
          execSync(`cp -R "${extensionPath}" ./dist/`);
          
          // Create zip archive
          const currentDir = process.cwd();
          process.chdir('./dist');
          execSync('zip -r safari-extension.zip *.appex');
          process.chdir(currentDir);
          
          console.log('✅ Extension packaged at ./dist/safari-extension.zip');
          packageStatus = '✅ Created';
        } catch (packageError) {
          console.error('Error packaging extension:', packageError.message);
        }
      }
    }
  }
  
  // Get extension details from extension_info.log if available
  if (fs.existsSync('./logs/extension_info.log')) {
    const extensionInfoLog = fs.readFileSync('./logs/extension_info.log', 'utf8');
    
    // Extract bundle ID, version, and build if available
    if (extensionInfoLog.includes('Bundle ID:')) {
      const bundleIdMatch = extensionInfoLog.match(/Bundle ID: (.+)/);
      if (bundleIdMatch && bundleIdMatch[1]) {
        extensionDetails += `\n  Bundle ID: ${bundleIdMatch[1]}`;
      }
    }
    
    if (extensionInfoLog.includes('Version:')) {
      const versionMatch = extensionInfoLog.match(/Version: (.+)/);
      if (versionMatch && versionMatch[1]) {
        extensionDetails += `\n  Version: ${versionMatch[1]}`;
      }
    }
    
    if (extensionInfoLog.includes('Build:')) {
      const buildMatch = extensionInfoLog.match(/Build: (.+)/);
      if (buildMatch && buildMatch[1]) {
        extensionDetails += `\n  Build: ${buildMatch[1]}`;
      }
    }
  }
  
  // Create summary markdown
  const summary = `# Safari Extension Build Summary

## Environment
- macOS: ${macOSVersion}
- Xcode: ${xcodeVersion}

## Build Status
- Build: ${buildStatus}
- Extension: ${extensionStatus}${extensionDetails}
- Package: ${packageStatus}${packageStatus === '✅ Created' ? '\n  Location: ./dist/safari-extension.zip' : ''}
`;
  
  // Write summary to file
  fs.writeFileSync('./logs/build_summary.md', summary);
  console.log('Build summary created successfully!');
  
} catch (error) {
  console.error('Error creating summary:', error.message);
  process.exit(1);
}