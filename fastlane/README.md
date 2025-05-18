# Fastlane Setup for russ5 Safari Extension

This directory contains the Fastlane configuration for building and signing the russ5 Safari Extension.

## Prerequisites

- Xcode 16.2 or later
- Ruby 3.0 or later
- Fastlane (`gem install fastlane`)
- Apple Developer Account

## GitHub Actions Setup

The GitHub Actions workflow is configured to build the Safari extension using Fastlane. To make it work, you need to add the following secrets to your GitHub repository:

### Required Secrets

- `TEAM_ID`: Your Apple Developer Team ID
- `FASTLANE_APPLE_ID`: Your Apple ID email
- `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD`: App-specific password for your Apple ID
- `PROVISIONING_PROFILE_SPECIFIER`: Name of the provisioning profile for the main app
- `EXTENSION_PROVISIONING_PROFILE_SPECIFIER`: Name of the provisioning profile for the extension

### Optional Secrets (for manual signing)

- `CERTIFICATE_BASE64`: Base64-encoded p12 certificate file
- `CERTIFICATE_PASSWORD`: Password for the p12 certificate
- `PROVISIONING_PROFILE_BASE64`: Base64-encoded provisioning profile for the main app
- `PROVISIONING_PROFILE_EXTENSION_BASE64`: Base64-encoded provisioning profile for the extension
- `MATCH_PASSWORD`: Password for the match repository (if using match)
- `KEYCHAIN_PASSWORD`: Password for the temporary keychain (defaults to 'temporary_password')

## Local Usage

### Setup Certificates and Profiles

```bash
fastlane match development
```

### Build for Development

```bash
fastlane build_dev
```

### Manual Signing Build

```bash
fastlane build_manual
```

## Troubleshooting

If you encounter the error:

```
No profiles for 'xyz.russ.russ5' were found: Xcode couldn't find any iOS App Development provisioning profiles matching 'xyz.russ.russ5'.
```

This means you need to:

1. Create provisioning profiles in the Apple Developer Portal
2. Add them to your GitHub secrets
3. Make sure the workflow is using the correct team ID and profile names

## Setting up Match Repository

To use fastlane match for managing certificates and provisioning profiles:

1. Create a private GitHub repository (e.g., `russ5-certificates`)
2. Initialize match:

```bash
fastlane match init
```

3. Generate and store certificates and profiles:

```bash
fastlane match development
```