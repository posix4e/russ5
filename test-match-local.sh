#!/bin/bash

# Set environment variables for testing
# Replace these values with your actual values
export TEAM_ID="YOUR_TEAM_ID"
export FASTLANE_APPLE_ID="YOUR_APPLE_ID"
export MATCH_PASSWORD="YOUR_MATCH_PASSWORD"
export MATCH_GIT_URL="https://github.com/yourusername/russ5-certificates.git"

# Print environment variables (without sensitive info)
echo "Testing with:"
echo "TEAM_ID: $TEAM_ID"
echo "FASTLANE_APPLE_ID: $FASTLANE_APPLE_ID"
echo "MATCH_GIT_URL: $MATCH_GIT_URL"

# Run match to sync certificates and profiles
echo "Running match development..."
bundle exec fastlane match development

# Run the build_dev lane
echo "Running build_dev lane..."
bundle exec fastlane build_dev

echo "Test completed!"