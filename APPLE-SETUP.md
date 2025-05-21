# Apple Developer Setup for CI/CD Pipeline

This document provides step-by-step instructions for obtaining all the required Apple-related variables needed for the CI/CD pipeline.

## Required Variables

The following Apple-related variables are required for the CI/CD pipeline:

1. `TEAM_ID`: Apple Developer Team ID
2. `FASTLANE_APPLE_ID`: Apple ID for Fastlane
3. `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD`: App-specific password for Apple ID
4. `APP_STORE_CONNECT_API_KEY_CONTENT`: Content of the App Store Connect API key
5. `APP_STORE_CONNECT_API_KEY_ID`: ID of the App Store Connect API key
6. `APP_STORE_CONNECT_API_KEY_ISSUER_ID`: Issuer ID of the App Store Connect API key

## 1. Obtaining Your Team ID

1. Log in to [Apple Developer Portal](https://developer.apple.com/account)
2. Click on "Membership" in the left sidebar
3. Your Team ID is displayed in the "Team ID" field under your membership information
4. Copy this value for the `TEAM_ID` environment variable

## 2. Setting Up Your Apple ID for Fastlane

1. Use your regular Apple ID email address for the `FASTLANE_APPLE_ID` environment variable

## 3. Creating an App-Specific Password

1. Log in to [Apple ID Account Page](https://appleid.apple.com/)
2. In the "Security" section, click on "Generate Password..." under "App-Specific Passwords"
3. Enter a label for the password (e.g., "GitHub CI/CD")
4. Click "Create"
5. Copy the generated password for the `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` environment variable

## 4. Creating App Store Connect API Key

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Go to "Users and Access" > "Keys" tab
3. Click the "+" button to create a new key
4. Enter a name for the key (e.g., "GitHub CI/CD")
5. Select the appropriate access level (Admin access is recommended for CI/CD)
6. Click "Generate"
7. Download the API key (.p8 file) - **Note: You can only download this file once!**
8. Note the Key ID displayed on the page - this is your `APP_STORE_CONNECT_API_KEY_ID`
9. Note the Issuer ID displayed at the top of the page - this is your `APP_STORE_CONNECT_API_KEY_ISSUER_ID`

## 5. Preparing the API Key Content

1. Open the downloaded .p8 file in a text editor
2. Copy the entire content of the file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
3. This content is your `APP_STORE_CONNECT_API_KEY_CONTENT`

## 6. Adding the Variables to GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add each of the following secrets:
   - `TEAM_ID`
   - `FASTLANE_APPLE_ID`
   - `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD`
   - `APP_STORE_CONNECT_API_KEY_CONTENT`
   - `APP_STORE_CONNECT_API_KEY_ID`
   - `APP_STORE_CONNECT_API_KEY_ISSUER_ID`

## Verifying Your Setup

After adding all the secrets, you can verify your setup by running the CI/CD pipeline. The pipeline will validate all the required environment variables and check access to certificates and profiles.

## Troubleshooting

If you encounter issues with the Apple Developer setup:

1. **Invalid Team ID**: Ensure you're using the correct Team ID from the Apple Developer Portal
2. **Authentication Failures**: Verify your Apple ID and app-specific password are correct
3. **API Key Issues**: Make sure the API key content is copied correctly, including the BEGIN and END lines
4. **Certificate Access**: Ensure your match repository is correctly set up and accessible from GitHub Actions