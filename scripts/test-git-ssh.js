#!/usr/bin/env node

/**
 * Test Git SSH connection to the certificates repository
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the Git URL from environment
const gitUrl = process.env.MATCH_GIT_URL;

if (!gitUrl) {
  console.error('Error: MATCH_GIT_URL environment variable is not set');
  process.exit(1);
}

// Mask the URL for security in logs
const maskedUrl = gitUrl.includes('@') 
  ? gitUrl.replace(/^(.*?@)/, '***@') 
  : gitUrl;

console.log(`Testing Git SSH connection to: ${maskedUrl}`);

// Ensure SSH key exists
const sshKeyPath = path.join(process.env.HOME || '~', '.ssh', 'id_ed25519');
if (!fs.existsSync(sshKeyPath)) {
  console.error(`Error: SSH key not found at ${sshKeyPath}`);
  process.exit(1);
}

console.log(`Using SSH key: ${sshKeyPath}`);

// Test git ls-remote
try {
  console.log('Running git ls-remote...');
  
  // Set GIT_SSH_COMMAND environment variable
  const env = {
    ...process.env,
    GIT_SSH_COMMAND: `ssh -i ${sshKeyPath} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new`
  };
  
  // Execute git ls-remote
  const output = execSync(`git ls-remote ${gitUrl}`, { 
    env,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });
  
  console.log('Success! Repository is accessible.');
  console.log('Remote refs:');
  console.log(output);
  
} catch (error) {
  console.error('Error accessing repository:');
  console.error(error.message);
  
  // Try with verbose SSH for debugging
  try {
    console.log('\nRetrying with verbose SSH...');
    const verboseEnv = {
      ...process.env,
      GIT_SSH_COMMAND: `ssh -vvv -i ${sshKeyPath} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new`
    };
    
    execSync(`git ls-remote ${gitUrl}`, { 
      env: verboseEnv,
      encoding: 'utf8',
      stdio: 'inherit'
    });
  } catch (verboseError) {
    // This will likely fail too, but the verbose output will be helpful
    process.exit(1);
  }
  
  process.exit(1);
}