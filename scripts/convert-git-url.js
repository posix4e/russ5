#!/usr/bin/env node

/**
 * Converts HTTPS GitHub URL to SSH format
 * This is used to ensure the MATCH_GIT_URL is in the correct format for SSH authentication
 */

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

// Get the URL from environment variable
const originalUrl = process.env.MATCH_GIT_URL;

if (!originalUrl) {
  console.error('MATCH_GIT_URL environment variable is not set');
  process.exit(1);
}

// Convert the URL
const sshUrl = convertToSSHUrl(originalUrl);

// Output the result
if (sshUrl !== originalUrl) {
  console.log(`Converting HTTPS URL to SSH URL: ${originalUrl} -> ${sshUrl}`);
  // Update the environment variable for the current process
  process.env.MATCH_GIT_URL = sshUrl;
} else {
  console.log(`URL is already in SSH format: ${sshUrl}`);
}

// Always output the URL (whether converted or not)
console.log(`MATCH_GIT_URL=${sshUrl}`);

// Exit with success
process.exit(0);