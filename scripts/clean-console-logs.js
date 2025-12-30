/**
 * Console Log Cleanup Script
 * Removes development console.log statements while keeping errors and warnings
 */

const fs = require('fs');
const path = require('path');

// Files to process (most critical production files)
const filesToClean = [
    'js/main.js',
    'js/admin.js',
    'js/products.js',
    'js/api-client.js',
    'js/all-products.js',
    'js/website-content.js',
    'www/js/main.js',
    'www/js/admin.js',
    'www/js/products.js',
    'www/js/api-client.js',
    'www/js/all-products.js',
    'www/js/website-content.js'
];

function cleanConsoleLogs(filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`Skipping ${filePath} (not found)`);
        return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    let removedCount = 0;
    
    // Remove console.log, console.debug, console.info
    // Keep console.error and console.warn
    const patterns = [
        // console.log() - remove
        {
            pattern: /console\.log\([^)]*\);?\s*/g,
            name: 'console.log'
        },
        // console.debug() - remove
        {
            pattern: /console\.debug\([^)]*\);?\s*/g,
            name: 'console.debug'
        },
        // console.info() - remove
        {
            pattern: /console\.info\([^)]*\);?\s*/g,
            name: 'console.info'
        }
    ];
    
    patterns.forEach(({pattern, name}) => {
        const matches = content.match(pattern);
        if (matches) {
            removedCount += matches.length;
            content = content.replace(pattern, '');
        }
    });
    
    if (removedCount > 0) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Cleaned ${removedCount} console statements from ${filePath}`);
    } else {
        console.log(`ℹ️  No console statements found in ${filePath}`);
    }
}

// Process all files
console.log('🧹 Starting console log cleanup...\n');
filesToClean.forEach(cleanConsoleLogs);
console.log('\n✅ Console log cleanup complete!');

