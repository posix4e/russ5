#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Sets up code signing for iOS builds
 * This script handles:
 * 1. Creating provisioning profiles directory
 * 2. Decoding and installing provisioning profiles
 * 3. Setting up keychain and importing certificates
 */

function executeCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

function decodeBase64ToFile(base64String, outputPath) {
  if (!base64String) {
    return false;
  }

  try {
    const buffer = Buffer.from(base64String, 'base64');
    fs.writeFileSync(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Error decoding base64 to file ${outputPath}:`, error.message);
    return false;
  }
}

function setupProvisioningProfiles() {
  const profilesDir = path.join(process.env.HOME, 'Library/MobileDevice/Provisioning Profiles');
  
  // Create profiles directory if it doesn't exist
  if (!fs.existsSync(profilesDir)) {
    console.log('Creating provisioning profiles directory...');
    fs.mkdirSync(profilesDir, { recursive: true });
  }
  
  // Install app provisioning profile
  const appProfileBase64 = process.env.PROVISIONING_PROFILE_BASE64;
  if (appProfileBase64) {
    console.log('Installing main app provisioning profile...');
    const appProfilePath = path.join(profilesDir, 'russ5.mobileprovision');
    if (decodeBase64ToFile(appProfileBase64, appProfilePath)) {
      console.log('✅ Main app provisioning profile installed');
    }
  } else {
    console.log('⚠️ No main app provisioning profile provided');
  }
  
  // Install extension provisioning profile
  const extensionProfileBase64 = process.env.PROVISIONING_PROFILE_EXTENSION_BASE64;
  if (extensionProfileBase64) {
    console.log('Installing extension provisioning profile...');
    const extensionProfilePath = path.join(profilesDir, 'russ5_extension.mobileprovision');
    if (decodeBase64ToFile(extensionProfileBase64, extensionProfilePath)) {
      console.log('✅ Extension provisioning profile installed');
    }
  } else {
    console.log('⚠️ No extension provisioning profile provided');
  }
  
  // List installed profiles
  console.log('Installed provisioning profiles:');
  executeCommand(`ls -la "${profilesDir}"`);
}

function setupCertificate() {
  const certificateBase64 = process.env.CERTIFICATE_BASE64;
  const certificatePassword = process.env.CERTIFICATE_PASSWORD;
  const keychainPassword = process.env.KEYCHAIN_PASSWORD || 'temporary_password';
  
  if (!certificateBase64 || !certificatePassword) {
    console.log('⚠️ Certificate or password not provided, skipping certificate setup');
    return;
  }
  
  console.log('Setting up certificate...');
  
  // Create temporary directory for certificate
  const tempDir = process.env.RUNNER_TEMP || '/tmp';
  const certificatePath = path.join(tempDir, 'certificate.p12');
  
  // Decode certificate
  if (!decodeBase64ToFile(certificateBase64, certificatePath)) {
    console.error('❌ Failed to decode certificate');
    return;
  }
  
  // Create and configure keychain
  const keychainPath = path.join(tempDir, 'build.keychain');
  
  executeCommand(`security create-keychain -p "${keychainPassword}" "${keychainPath}"`);
  executeCommand(`security default-keychain -s "${keychainPath}"`);
  executeCommand(`security unlock-keychain -p "${keychainPassword}" "${keychainPath}"`);
  executeCommand(`security set-keychain-settings -t 3600 -u "${keychainPath}"`);
  
  // Import certificate
  executeCommand(`security import "${certificatePath}" -k "${keychainPath}" -P "${certificatePassword}" -T /usr/bin/codesign`);
  executeCommand(`security set-key-partition-list -S apple-tool:,apple: -s -k "${keychainPassword}" "${keychainPath}"`);
  
  console.log('✅ Certificate setup complete');
  
  // Clean up
  fs.unlinkSync(certificatePath);
}

function main() {
  console.log('Setting up code signing...');
  setupProvisioningProfiles();
  setupCertificate();
  console.log('Code signing setup complete');
}

main();