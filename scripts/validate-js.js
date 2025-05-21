#!/usr/bin/env node

/**
 * This script validates JavaScript files in the Safari extension
 * to catch syntax errors before they reach GitHub Actions.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

// Function to validate JavaScript syntax
function validateJavaScript(filePath) {
  try {
    // Create a sandbox with browser extension globals
    const sandbox = {
      browser: {
        runtime: {
          sendMessage: function() { return Promise.resolve({}); },
          onMessage: {
            addListener: function() {}
          }
        },
        tabs: {
          query: function() { return Promise.resolve([]); },
          create: function() { return Promise.resolve({}); },
          update: function() { return Promise.resolve({}); }
        }
      },
      window: {
        location: { href: 'https://example.com' },
        addEventListener: function() {}
      },
      document: {
        title: 'Example Page',
        querySelector: function() { return null; },
        querySelectorAll: function() { return []; },
        getElementsByTagName: function() { return []; },
        cloneNode: function() { return {}; },
        baseURI: 'https://example.com'
      },
      console: {
        log: function() {},
        warn: function() {},
        error: function() {}
      },
      URL: global.URL,
      Promise: Promise,
      Readability: function() { 
        this.parse = function() { return { textContent: 'Sample article text' }; };
      }
    };
    
    // Use Node.js to check for syntax errors
    // This will throw an error if there's a syntax problem
    require('vm').runInNewContext(fs.readFileSync(filePath, 'utf8'), sandbox, {
      filename: filePath,
      displayErrors: true
    });
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error.message,
      line: error.lineNumber,
      column: error.columnNumber
    };
  }
}

// Function to check for undefined references
function checkForUndefinedReferences(filePath, knownGlobals = []) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const warnings = [];
  
  // Very basic check for new ClassName() patterns where ClassName might not be defined
  const newObjectRegex = /new\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
  
  lines.forEach((line, index) => {
    let match;
    while ((match = newObjectRegex.exec(line)) !== null) {
      const className = match[1];
      // Skip checking for built-in objects and known globals
      const builtIns = ['URL', 'Error', 'Date', 'RegExp', 'Map', 'Set', 'Promise', 'Proxy', 'WeakMap', 'WeakSet'];
      if (!builtIns.includes(className) && !knownGlobals.includes(className)) {
        // Check if the class is defined in the file
        const classDefRegex = new RegExp(`(class|function)\\s+${className}|const\\s+${className}\\s*=|let\\s+${className}\\s*=|var\\s+${className}\\s*=`);
        if (!classDefRegex.test(content)) {
          warnings.push({
            line: index + 1,
            column: match.index,
            message: `Potential undefined reference: '${className}'. Make sure this class/constructor is defined or imported.`
          });
        }
      }
    }
  });
  
  // Special check for Readability usage
  if (path.basename(filePath) === 'content.js') {
    // Check for direct Readability usage without window prefix
    const readabilityRegex = /new\s+Readability\s*\(/g;
    const windowReadabilityRegex = /new\s+window\.Readability\s*\(/g;
    
    let readabilityMatch;
    while ((readabilityMatch = readabilityRegex.exec(content)) !== null) {
      // Check if this is not a window.Readability usage
      const lineIndex = content.substring(0, readabilityMatch.index).split('\n').length - 1;
      const line = lines[lineIndex];
      
      if (!line.includes('window.Readability') && !line.includes('typeof Readability !== "undefined"')) {
        warnings.push({
          line: lineIndex + 1,
          column: readabilityMatch.index,
          message: `Using 'new Readability()' without checking if it exists. Use 'window.Readability' with existence check instead.`
        });
      }
    }
    
    // Check if Readability is used but no existence check is present
    // This is a warning, not an error, so we'll just log it but not fail the build
    const hasReadabilityCheck = 
      content.includes('typeof window.Readability !== "undefined"') || 
      content.includes('typeof window.Readability !== \'undefined\'') || 
      content.includes('typeof Readability !== "undefined"') ||
      content.includes('typeof Readability !== \'undefined\'') ||
      content.includes('window.Readability !== undefined') ||
      content.includes('Readability !== undefined');
      
    if (content.includes('Readability') && !hasReadabilityCheck) {
      console.warn(`⚠️ Warning: File uses Readability but doesn't check if it exists. This is just a warning, not an error.`);
      warnings.push({
        line: 1,
        column: 0,
        message: `File uses Readability but doesn't check if it exists. Add a check like 'if (typeof window.Readability !== "undefined")'.`
      });
    }
  }
  
  return warnings;
}

// Main function to validate all JS files in the extension
function validateExtensionJS() {
  console.log('Validating Safari extension JavaScript files...');
  
  const extensionDir = path.join(process.cwd(), 'russ5 Extension');
  const resourcesDir = path.join(extensionDir, 'Resources');
  
  if (!fs.existsSync(resourcesDir)) {
    console.error(`❌ Resources directory not found at ${resourcesDir}`);
    return false;
  }
  
  // Find all JS files in the Resources directory
  const jsFiles = [];
  
  function findJSFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findJSFiles(filePath);
      } else if (file.endsWith('.js')) {
        jsFiles.push(filePath);
      }
    });
  }
  
  findJSFiles(resourcesDir);
  
  if (jsFiles.length === 0) {
    console.error('❌ No JavaScript files found in the extension');
    return false;
  }
  
  console.log(`Found ${jsFiles.length} JavaScript files to validate`);
  
  let hasErrors = false;
  let validationResults = [];
  
  // Validate each JS file
  jsFiles.forEach(file => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`Validating ${relativePath}...`);
    
    // Check for syntax errors
    const syntaxResult = validateJavaScript(file);
    
    if (!syntaxResult.valid) {
      hasErrors = true;
      validationResults.push({
        file: relativePath,
        type: 'error',
        message: `Syntax error: ${syntaxResult.error}`,
        line: syntaxResult.line,
        column: syntaxResult.column
      });
      console.error(`❌ ${relativePath}: Syntax error at line ${syntaxResult.line || 'unknown'}: ${syntaxResult.error}`);
    } else {
      console.log(`✅ ${relativePath}: Syntax is valid`);
      
      // If syntax is valid, check for potential undefined references
      // For Safari extensions, these are known globals
      const knownGlobals = ['browser', 'window', 'document', 'console', 'Readability'];
      const referenceWarnings = checkForUndefinedReferences(file, knownGlobals);
      
      if (referenceWarnings.length > 0) {
        referenceWarnings.forEach(warning => {
          validationResults.push({
            file: relativePath,
            type: 'warning',
            message: warning.message,
            line: warning.line,
            column: warning.column
          });
          console.warn(`⚠️ ${relativePath}:${warning.line}: ${warning.message}`);
        });
      }
    }
  });
  
  // Write validation results to log file
  const logFile = path.join('./logs', 'js_validation.log');
  fs.writeFileSync(logFile, JSON.stringify(validationResults, null, 2));
  
  console.log(`Validation results written to ${logFile}`);
  
  return !hasErrors;
}

// Run the validation
try {
  const isValid = validateExtensionJS();
  
  if (isValid) {
    console.log('✅ All JavaScript files passed syntax validation');
    process.exit(0);
  } else {
    console.error('❌ JavaScript validation failed. See logs for details.');
    process.exit(1);
  }
} catch (error) {
  console.error('Error during validation:', error.message);
  process.exit(1);
}