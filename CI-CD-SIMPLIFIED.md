# Simplified CI/CD Pipeline for Safari Extension

This document explains the simplified CI/CD pipeline for the Safari extension. The pipeline has been redesigned to follow a fail-fast approach with no alternative paths or fallbacks.

## Key Principles

1. **Fail Fast**: The pipeline fails immediately if any required prerequisites are missing.
2. **No Alternative Paths**: Each step has a single, clear responsibility with no fallbacks or alternative execution paths.
3. **Explicit Requirements**: All required environment variables and configurations are explicitly validated before proceeding.
4. **Standardized Paths**: All file paths are absolute to avoid working directory issues.
5. **Clear Separation of Concerns**: Each job and lane has a single, well-defined responsibility.

## Required Environment Variables

The following environment variables are **required** for the pipeline to work:

| Variable | Description |
|----------|-------------|
| `MATCH_PASSWORD` | Password for the match certificate repository |
| `MATCH_GIT_URL` | URL of the match certificate repository |
| `TEAM_ID` | Apple Developer Team ID |
| `FASTLANE_APPLE_ID` | Apple ID for Fastlane |
| `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` | App-specific password for Apple ID |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | Content of the App Store Connect API key |
| `APP_STORE_CONNECT_API_KEY_ID` | ID of the App Store Connect API key |
| `APP_STORE_CONNECT_API_KEY_ISSUER_ID` | Issuer ID of the App Store Connect API key |

For BrowserStack testing, these additional variables are required:

| Variable | Description |
|----------|-------------|
| `BROWSERSTACK_USERNAME` | BrowserStack username |
| `BROWSERSTACK_ACCESS_KEY` | BrowserStack access key |
| `BROWSERSTACK_APP_ID` | BrowserStack app ID (must be pre-uploaded) |

## Pipeline Workflow

The pipeline consists of the following jobs:

1. **Validate Prerequisites**: Verifies all required environment variables and certificate access.
2. **Build**: Builds the Safari extension with proper certificates.
3. **UI Tests**: Runs UI tests on BrowserStack (only if BrowserStack credentials are available).
4. **Deploy to TestFlight**: Deploys the build to TestFlight (only on main branch or tags).
5. **Deploy to App Store**: Deploys the build to the App Store (only on tags).

## Fastlane Lanes

The following Fastlane lanes are available:

| Lane | Description |
|------|-------------|
| `verify_certificates` | Verifies access to certificates repository |
| `build_extension` | Builds the Safari extension with proper certificates |
| `run_ui_tests` | Runs UI tests on BrowserStack |
| `beta` | Deploys the build to TestFlight |
| `release` | Deploys the build to the App Store |

## NPM Scripts

The following NPM scripts are available:

| Script | Description |
|--------|-------------|
| `npm run verify-certificates` | Verifies access to certificates repository |
| `npm run build-extension` | Builds the Safari extension |
| `npm run run-ui-tests` | Runs UI tests on BrowserStack |
| `npm run deploy-testflight` | Deploys the build to TestFlight |
| `npm run deploy-appstore` | Deploys the build to the App Store |
| `npm run ci` | Runs the complete CI pipeline |
| `npm run ci-test` | Runs the CI pipeline with tests |
| `npm run ci-deploy` | Runs the CI pipeline with tests and TestFlight deployment |
| `npm run ci-release` | Runs the CI pipeline with tests, TestFlight, and App Store deployment |

## BrowserStack Testing

BrowserStack testing requires a pre-uploaded app. The app must be uploaded manually to BrowserStack and the app ID must be set as the `BROWSERSTACK_APP_ID` environment variable. The pipeline will not attempt to upload the app automatically.

## Deployment

Deployment to TestFlight happens automatically on the main branch and tags. Deployment to the App Store happens automatically on tags.

## Troubleshooting

If the pipeline fails, check the following:

1. Ensure all required environment variables are set.
2. Verify access to the certificates repository.
3. Check that the BrowserStack app ID is valid and the app is uploaded.
4. Verify that the App Store Connect API key is valid and has the necessary permissions.