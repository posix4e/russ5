#!/usr/bin/env node

/**
 * Debug SSH connection issues in CI environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeCommand(command, options = {}) {
  try {
    console.log(`Executing: ${command}`);
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

function debugSSH() {
  console.log('=== SSH Debug Information ===');
  
  // Check SSH directory and key
  const sshDir = path.join(process.env.HOME, '.ssh');
  const sshKeyPath = path.join(sshDir, 'id_ed25519');
  
  console.log(`SSH directory: ${sshDir}`);
  console.log(`SSH key path: ${sshKeyPath}`);
  
  if (fs.existsSync(sshDir)) {
    console.log('SSH directory exists');
    console.log('SSH directory permissions:');
    executeCommand(`ls -la ${sshDir}`);
  } else {
    console.error('SSH directory does not exist');
  }
  
  if (fs.existsSync(sshKeyPath)) {
    console.log('SSH key exists');
    console.log('SSH key permissions:');
    executeCommand(`ls -la ${sshKeyPath}`);
  } else {
    console.error('SSH key does not exist');
  }
  
  // Check known_hosts
  const knownHostsPath = path.join(sshDir, 'known_hosts');
  if (fs.existsSync(knownHostsPath)) {
    console.log('known_hosts exists');
    console.log('known_hosts permissions:');
    executeCommand(`ls -la ${knownHostsPath}`);
    console.log('known_hosts content:');
    executeCommand(`cat ${knownHostsPath}`);
  } else {
    console.error('known_hosts does not exist');
  }
  
  // Check git config
  console.log('Git config:');
  executeCommand('git config --list');
  
  // Test SSH connection
  console.log('Testing SSH connection to GitHub:');
  executeCommand('ssh -T git@github.com -o StrictHostKeyChecking=accept-new -v');
  
  // Check MATCH_GIT_URL
  console.log('MATCH_GIT_URL:');
  if (process.env.MATCH_GIT_URL) {
    // Mask the URL for security
    const maskedUrl = process.env.MATCH_GIT_URL.replace(/https:\/\/[^@]*@/, 'https://***@');
    console.log(maskedUrl);
  } else {
    console.error('MATCH_GIT_URL is not set');
  }
  
  // Try a git ls-remote
  console.log('Testing git ls-remote:');
  if (process.env.MATCH_GIT_URL) {
    executeCommand(`git ls-remote ${process.env.MATCH_GIT_URL}`);
  }
}

debugSSH();