#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Encodes files to base64 for use in GitHub secrets
 * Usage: node encode-certificates.js <certificate.p12> <app.mobileprovision> <extension.mobileprovision>
 */

function encodeFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return null;
  }

  try {
    const fileData = fs.readFileSync(filePath);
    return fileData.toString('base64');
  } catch (error) {
    console.error(`Error encoding file ${filePath}:`, error.message);
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Error: Certificate path is required');
    console.log('Usage: node encode-certificates.js <certificate.p12> <app.mobileprovision> <extension.mobileprovision>');
    process.exit(1);
  }

  // Encode certificate
  const certificatePath = args[0];
  const certificateBase64 = encodeFile(certificatePath);
  
  if (certificateBase64) {
    console.log('CERTIFICATE_BASE64 value (add this to GitHub secrets):');
    console.log(certificateBase64);
    console.log('');
  }

  // Encode app provisioning profile
  if (args.length > 1) {
    const appProfilePath = args[1];
    const appProfileBase64 = encodeFile(appProfilePath);
    
    if (appProfileBase64) {
      console.log('PROVISIONING_PROFILE_BASE64 value (add this to GitHub secrets):');
      console.log(appProfileBase64);
      console.log('');
    }
  }

  // Encode extension provisioning profile
  if (args.length > 2) {
    const extensionProfilePath = args[2];
    const extensionProfileBase64 = encodeFile(extensionProfilePath);
    
    if (extensionProfileBase64) {
      console.log('PROVISIONING_PROFILE_EXTENSION_BASE64 value (add this to GitHub secrets):');
      console.log(extensionProfileBase64);
      console.log('');
    }
  }

  console.log('Add these values to your GitHub repository secrets.');
  console.log('Remember to also add CERTIFICATE_PASSWORD, TEAM_ID, FASTLANE_APPLE_ID, and other required secrets.');
}

main();