# Russ5 Safari Extension

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