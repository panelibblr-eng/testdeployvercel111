/**
 * Production-Aware Logger
 * Automatically disables verbose logging in production
 */

const isDev = typeof window !== 'undefined' 
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : process.env.NODE_ENV !== 'production';

/**
 * Logger utility that respects environment
 */
class Logger {
    static log(...args) {
        if (isDev) {
            console.log(...args);
        }
    }
    
    static error(...args) {
        // Always show errors in production
        console.error(...args);
    }
    
    static warn(...args) {
        // Always show warnings
        console.warn(...args);
    }
    
    static debug(...args) {
        // Only in development
        if (isDev) {
            console.debug(...args);
        }
    }
    
    static info(...args) {
        // Only in development
        if (isDev) {
            console.info(...args);
        }
    }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}

// Export for browser environments
if (typeof window !== 'undefined') {
    window.Logger = Logger;
}

