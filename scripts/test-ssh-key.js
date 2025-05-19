#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Tests the SSH key setup for the certificates repository
 */

function executeCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

function setupSSH() {
  const sshDir = path.join(process.env.HOME, '.ssh');
  const sshKeyPath = path.join(sshDir, 'id_ed25519');
  const sshKey = process.env.SSH_KEY;
  
  if (!sshKey) {
    console.error('❌ SSH_KEY environment variable is not set');
    return false;
  }
  
  // Create SSH directory if it doesn't exist
  if (!fs.existsSync(sshDir)) {
    console.log('Creating SSH directory...');
    fs.mkdirSync(sshDir, { recursive: true });
  }
  
  // Write SSH key
  try {
    const keyBuffer = Buffer.from(sshKey, 'base64');
    fs.writeFileSync(sshKeyPath, keyBuffer);
    fs.chmodSync(sshKeyPath, 0o600); // Set proper permissions
    console.log('✅ SSH key written to', sshKeyPath);
  } catch (error) {
    console.error('❌ Failed to write SSH key:', error.message);
    return false;
  }
  
  // Add GitHub to known hosts
  try {
    const knownHostsPath = path.join(sshDir, 'known_hosts');
    executeCommand(`ssh-keyscan github.com >> ${knownHostsPath}`);
    fs.chmodSync(knownHostsPath, 0o644); // Set proper permissions
    console.log('✅ Added GitHub to known hosts');
  } catch (error) {
    console.error('❌ Failed to add GitHub to known hosts:', error.message);
    return false;
  }
  
  // Configure git to use SSH key
  executeCommand('git config --global core.sshCommand "ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes"');
  console.log('✅ Configured git to use SSH key');
  
  return true;
}

function convertToSSHUrl(url) {
  // Check if it's already an SSH URL
  if (url.startsWith('git@')) {
    return url;
  }
  
  // Convert HTTPS URL to SSH URL
  // Format: https://github.com/username/repo.git -> git@github.com:username/repo.git
  try {
    const httpsRegex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)(\.git)?$/;
    const match = url.match(httpsRegex);
    
    if (match) {
      const [, username, repo, gitExt] = match;
      const extension = gitExt || '.git';
      return `git@github.com:${username}/${repo}${extension}`;
    }
    
    // If it doesn't match the pattern, return the original URL
    return url;
  } catch (error) {
    console.error('Error converting URL:', error.message);
    return url;
  }
}

function testGitAccess() {
  let gitUrl = process.env.MATCH_GIT_URL;
  
  if (!gitUrl) {
    console.error('❌ MATCH_GIT_URL environment variable is not set');
    return false;
  }
  
  // Convert to SSH URL if needed
  const sshUrl = convertToSSHUrl(gitUrl);
  if (sshUrl !== gitUrl) {
    console.log(`Converting HTTPS URL to SSH URL: ${gitUrl} -> ${sshUrl}`);
    gitUrl = sshUrl;
    // Update the environment variable for other processes
    process.env.MATCH_GIT_URL = sshUrl;
  }
  
  console.log(`Testing git access to ${gitUrl}...`);
  
  // Create a temporary directory
  const tempDir = fs.mkdtempSync('/tmp/git-test-');
  process.chdir(tempDir);
  
  try {
    // Try to clone the repository
    console.log('Attempting to clone repository...');
    executeCommand(`git clone ${gitUrl} cert-repo`, { stdio: 'inherit' });
    
    // Check if the clone was successful
    if (fs.existsSync(path.join(tempDir, 'cert-repo'))) {
      console.log('✅ Successfully cloned repository');
      return true;
    } else {
      console.error('❌ Failed to clone repository');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing git access:', error.message);
    return false;
  } finally {
    // Clean up
    process.chdir('/');
    executeCommand(`rm -rf ${tempDir}`);
  }
}

function main() {
  console.log('Testing SSH key setup for certificates repository...');
  
  if (!setupSSH()) {
    console.error('❌ SSH key setup failed');
    process.exit(1);
  }
  
  if (!testGitAccess()) {
    console.error('❌ Git access test failed');
    process.exit(1);
  }
  
  console.log('✅ SSH key setup and git access test successful');
}

main();