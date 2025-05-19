# Russ5 Safari Extension

This repository contains a Safari extension with GitHub Actions and Fastlane integration for building and signing.

## Setup Instructions

### Prerequisites

- Xcode 16.2 or later
- Node.js 18 or later
- Ruby 3.2 or later (for Fastlane)
- Apple Developer Account

### GitHub Actions Setup

The GitHub Actions workflow is configured to build the Safari extension using either Fastlane or xcodebuild. To make it work with code signing, you need to add the following secrets to your GitHub repository:

#### Required Secrets

- `TEAM_ID`: Your Apple Developer Team ID
- `FASTLANE_APPLE_ID`: Your Apple ID email
- `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD`: App-specific password for your Apple ID
- `PROVISIONING_PROFILE_SPECIFIER`: Name of the provisioning profile for the main app
- `EXTENSION_PROVISIONING_PROFILE_SPECIFIER`: Name of the provisioning profile for the extension

#### Optional Secrets (for manual signing)

- `CERTIFICATE_BASE64`: Base64-encoded p12 certificate file
- `CERTIFICATE_PASSWORD`: Password for the p12 certificate
- `PROVISIONING_PROFILE_BASE64`: Base64-encoded provisioning profile for the main app
- `PROVISIONING_PROFILE_EXTENSION_BASE64`: Base64-encoded provisioning profile for the extension
- `MATCH_PASSWORD`: Password for the match repository (if using match)
- `KEYCHAIN_PASSWORD`: Password for the temporary keychain (defaults to 'temporary_password')

### Generating Base64-encoded Certificates and Profiles

You can use the included script to generate the base64-encoded values for your certificates and provisioning profiles:

```bash
npm run encode-certificates /path/to/certificate.p12 /path/to/app.mobileprovision /path/to/extension.mobileprovision
```

### Fastlane Integration

This project uses Fastlane for iOS build automation. The Fastlane configuration includes:

- **Appfile**: Stores app-specific information like bundle identifier and team ID
- **Fastfile**: Contains lanes for building and signing the app
- **Matchfile**: Configuration for certificate and profile management

#### Setting Up Fastlane Match (Recommended)

Fastlane Match is the easiest way to handle code signing. To set it up:

1. **Create a private repository** for storing certificates:
   ```bash
   # Create a new private repository on GitHub
   # Example: https://github.com/yourusername/russ5-certificates
   ```

2. **Initialize Match** (do this once, locally):
   ```bash
   # Install fastlane if you haven't already
   gem install fastlane

   # Run match init to set up your repository
   fastlane match init
   # Follow the prompts to configure your repository
   ```

3. **Generate certificates and profiles**:
   ```bash
   # Generate development certificates and profiles
   npm run match-sync
   
   # Or use the full test script to sync profiles and test the build
   npm run match-test
   ```

4. **Add required GitHub secrets**:
   - `MATCH_PASSWORD`: The encryption password you set during match init
   - `MATCH_GIT_URL`: URL of your private certificates repository
   - `MATCH_GIT_BASIC_AUTHORIZATION`: Base64-encoded GitHub credentials (username:token)
   - `FASTLANE_APPLE_ID`: Your Apple ID email
   - `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD`: App-specific password
   - `TEAM_ID`: Your Apple Developer Team ID

5. **Run the workflow**:
   ```bash
   npm run ci-fastlane
   ```

#### Creating the MATCH_GIT_BASIC_AUTHORIZATION Secret

To create the `MATCH_GIT_BASIC_AUTHORIZATION` secret:

```bash
echo -n "github_username:github_personal_access_token" | base64
```

Use the output as the value for the `MATCH_GIT_BASIC_AUTHORIZATION` secret.

## Local Testing Guide

To ensure your changes work both locally and in GitHub Actions, follow these steps before pushing your code:

### 1. Validate JavaScript Files

Run the JavaScript validation script to catch syntax errors and potential issues:

```bash
npm run validate-js
```

This script checks all JavaScript files in the extension for syntax errors and potential undefined references. It's automatically run as part of the CI process and as a pre-commit hook.

### 2. Test the Build Process

Run the full build process locally to ensure it works:

```bash
npm run ci
```

This will:
1. Create logs directory
2. Print environment information
3. Validate JavaScript files
4. Build the Safari extension
5. Verify the extension was built correctly
6. Create a build summary
7. Package the extension

### 3. Check the Build Logs

After running the build, check the logs to see if there were any issues:

```bash
cat ./logs/build_summary.md
```

### Common Issues and Solutions

#### JavaScript Syntax Errors

If you see JavaScript syntax errors in the validation step:
- Check for typos or incomplete code
- Ensure all variables are properly declared
- Make sure all functions and classes used are defined or imported

#### Missing Readability.js

The extension uses Readability.js for article extraction. If you're getting errors about Readability being undefined:
- Make sure Readability.js is properly included in your project
- Add proper error handling for when Readability is not available

#### Build Failures in GitHub Actions but Not Locally

If the build succeeds locally but fails in GitHub Actions:
- Your local Xcode might be more forgiving of certain errors
- GitHub Actions uses a specific macOS and Xcode version that might be stricter
- Always run the validation script locally before pushing

## Pre-commit Hook

A pre-commit hook has been set up to automatically run the JavaScript validation before each commit. If the validation fails, the commit will be prevented.

If you need to bypass the pre-commit hook in an emergency, you can use:

```bash
git commit --no-verify
```

But this is not recommended as it may lead to broken builds in GitHub Actions.

## BrowserStack Integration

This project includes Fastlane lanes for building and testing the app on BrowserStack. BrowserStack allows you to test your app on real iOS devices in the cloud without needing physical devices.

### Prerequisites

1. A BrowserStack account with access to App Automate
2. BrowserStack username and access key

### Setting Up BrowserStack

1. **Set up environment variables**:
   ```bash
   # Add these to your .env file or export them
   export BROWSERSTACK_USERNAME="your_browserstack_username"
   export BROWSERSTACK_ACCESS_KEY="your_browserstack_access_key"
   
   # Optional: If you already have an app uploaded to BrowserStack, you can use its ID
   # to skip the build and upload steps
   export BROWSERSTACK_APP_ID="bs://your_app_id"
   
   # Optional: Your test suite ID on BrowserStack (required for running tests)
   export BROWSERSTACK_TEST_SUITE_ID="bs://your_test_suite_id"
   ```

2. **For GitHub Actions**, add these secrets:
   - `BROWSERSTACK_USERNAME`: Your BrowserStack username
   - `BROWSERSTACK_ACCESS_KEY`: Your BrowserStack access key

### Available BrowserStack Lanes

The following Fastlane lanes are available for BrowserStack integration:

#### 1. Upload App to BrowserStack

```bash
# Build and upload the app to BrowserStack
bundle exec fastlane browserstack
```

This lane:
- Builds the app for development
- Uploads the IPA file to BrowserStack App Automate

#### 2. Run Tests on BrowserStack

```bash
# Run tests on BrowserStack
bundle exec fastlane browserstack_test
```

This lane:
- Builds the app for testing
- Uploads the IPA file to BrowserStack
- Runs XCUITests on BrowserStack using an iPhone 14 Pro with iOS 16

#### 3. Build and Test on BrowserStack

```bash
# Build the app and run tests on BrowserStack
bundle exec fastlane browserstack_build_and_test
```

This lane:
- Combines the `browserstack` and `browserstack_test` lanes

### NPM Scripts for BrowserStack

For easier integration, the following npm scripts are available:

```bash
# Upload and test your app on BrowserStack (using Fastlane)
npm run browserstack-build-and-test

# Or upload only (without running tests)
npm run browserstack-upload

# Or run tests only (if app is already uploaded)
npm run browserstack-test

# Advanced BrowserStack operations:

# Upload a test suite to BrowserStack
npm run browserstack-upload-testsuite

# Run tests on BrowserStack (requires app ID and test suite ID)
npm run browserstack-run-tests

# Check test results from BrowserStack
npm run browserstack-check-results
```

### Customizing BrowserStack Tests

You can customize the BrowserStack test configuration by modifying the `browserstack_test` lane in the Fastfile. Available options include:

- `device`: The device to test on (e.g., "iPhone 14 Pro", "iPhone 13", etc.)
- `os_version`: The iOS version to test on (e.g., "16", "15", etc.)
- `project_name`: The name of your project in BrowserStack
- `build_name`: The name of your build in BrowserStack
- `test_framework`: The test framework to use (e.g., "xcui", "espresso", etc.)
- `local`: Whether to enable local testing (for testing private networks)

For more options, see the [BrowserStack App Automate documentation](https://www.browserstack.com/app-automate/xcuitest/get-started).

## Troubleshooting

### Provisioning Profile Errors

If you encounter errors like:

```
No profiles for 'xyz.russ.russ5' were found: Xcode couldn't find any iOS App Development provisioning profiles matching 'xyz.russ.russ5'. Automatic signing is disabled and unable to generate a profile. To enable automatic signing, pass -allowProvisioningUpdates to xcodebuild.
```

This means Xcode cannot find the required provisioning profiles for your app and extension. To fix this:

1. **Option 1: Use manual signing with provided profiles**
   - Generate provisioning profiles in the Apple Developer Portal
   - Encode them using `npm run encode-certificates`
   - Add them to GitHub secrets
   - Make sure `TEAM_ID`, `PROVISIONING_PROFILE_SPECIFIER`, and `EXTENSION_PROVISIONING_PROFILE_SPECIFIER` are set

2. **Option 2: Enable automatic signing**
   - The GitHub Actions workflow already includes `-allowProvisioningUpdates` flag
   - Make sure `TEAM_ID` and `FASTLANE_APPLE_ID` are set in GitHub secrets
   - This allows Xcode to automatically generate and manage provisioning profiles

3. **Option 3: Use fastlane match**
   - Set up a private repository for storing certificates and profiles
   - Configure the Matchfile with your repository URL
   - Set `MATCH_PASSWORD` in GitHub secrets
   - This provides a more robust way to manage certificates and profiles across your team

For local development, you can use Xcode's automatic signing or run:

```bash
xcodebuild -project russ5.xcodeproj -scheme "russ5" -allowProvisioningUpdates build
```

### Testing Fastlane Match Locally

To test Fastlane Match locally before pushing to GitHub:

1. **Set up environment variables** (either export them or create a `.env` file):
   ```bash
   # Option 1: Export variables
   export TEAM_ID="YOUR_TEAM_ID"
   export FASTLANE_APPLE_ID="YOUR_APPLE_ID"
   export MATCH_PASSWORD="YOUR_MATCH_PASSWORD"
   export MATCH_GIT_URL="https://github.com/yourusername/russ5-certificates.git"
   
   # Option 2: Create a .env file (recommended)
   # Copy the sample file and edit it
   cp .env.sample .env
   # Then edit the .env file with your actual values
   ```

2. **Run the test script**:
   ```bash
   npm run match-test
   ```

This script will:
1. Load environment variables from `.env` file (if it exists)
2. Sync certificates and profiles using Fastlane Match
3. Try to build the app using the `build_dev` lane
4. If that fails, try the alternative approach with `build_dev_alt` lane

### Available npm Scripts for Fastlane

The project includes several npm scripts to make working with Fastlane easier:

#### Match Commands

```bash
# Sync development certificates and profiles
npm run match:development

# Sync App Store certificates and profiles
npm run match:appstore

# Sync Ad Hoc certificates and profiles
npm run match:adhoc

# Nuke (remove) development certificates and profiles
npm run match:nuke:development

# Nuke (remove) App Store certificates and profiles
npm run match:nuke:appstore

# Nuke (remove) Ad Hoc certificates and profiles
npm run match:nuke:adhoc
```

#### Lane Commands

```bash
# Run the build_dev lane (primary approach)
npm run lane:build_dev

# Run the build_dev_alt lane (alternative approach)
npm run lane:build_dev_alt

# Run the build_manual lane (for manual signing)
npm run lane:build_manual

# Run the setup_profiles lane (to sync profiles)
npm run lane:setup_profiles
```

#### Utility Commands

```bash
# Load environment variables from .env file
npm run load-env

# Sync development certificates and profiles
npm run match-sync

# Test the full workflow (sync profiles and build)
npm run match-test
```