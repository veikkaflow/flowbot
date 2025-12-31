/**
 * FlowBot Widget Embed Script
 * 
 * This script loads the necessary dependencies and initializes FlowBot widgets
 * on the page. It should be included with a script tag:
 * 
 * <script src="https://your-domain.com/embed.js" defer></script>
 * 
 * Widgets are initialized by adding elements with data-flowbot-id attribute:
 * <div data-flowbot-id="YOUR_BOT_ID"></div>
 */

(function() {
    'use strict';

    // Get the base URL from the script src
    const scriptTag = document.currentScript || document.querySelector('script[src*="embed.js"]');
    const baseUrl = scriptTag ? scriptTag.src.replace(/\/embed\.js.*$/, '') : window.location.origin;

    // Configuration
    const CONFIG = {
        baseUrl: baseUrl,
        cssPath: '/assets/index.css', // Will be updated after build with hash
        // Embed bundle will be in assets folder with hash, we'll find it dynamically
        embedJsPath: '/assets/embed-bundle.js' // Will be updated to actual filename with hash
    };

    // Check if already initialized
    if (window.__flowbotInitialized) {
        console.warn('FlowBot: Already initialized');
        return;
    }
    window.__flowbotInitialized = true;

    /**
     * Load Tailwind CSS from CDN
     */
    function loadTailwindCSS() {
        return new Promise((resolve) => {
            // Check if Tailwind is already loaded
            if (window.tailwind) {
                resolve();
                return;
            }

            // Check if Tailwind script already exists
            const existingTailwind = document.querySelector('script[src*="tailwindcss"]');
            if (existingTailwind) {
                resolve();
                return;
            }

            // Load Tailwind CSS from CDN
            const tailwindScript = document.createElement('script');
            tailwindScript.src = 'https://cdn.tailwindcss.com';
            tailwindScript.onload = () => resolve();
            tailwindScript.onerror = () => {
                console.warn('FlowBot: Could not load Tailwind CSS, continuing anyway');
                resolve();
            };
            document.head.appendChild(tailwindScript);
        });
    }

    /**
     * Inject critical CSS variables and styles
     */
    function injectCriticalStyles() {
        const style = document.createElement('style');
        style.id = 'flowbot-critical-styles';
        style.textContent = `
            /* FlowBot Critical CSS Variables and Styles */
            :root {
                --color-primary: #10b981;
                --color-primary-light: #34d399;
            }
            
            .theme-dark {
                --chat-bg: rgba(23, 23, 33, 1);
                --chat-header-bg: rgba(30, 30, 42, 0.5);
                --chat-footer-bg: rgba(30, 30, 42, 0.5);
                --chat-input-bg: rgba(55, 55, 75, 0.7);
                --chat-button-bg: rgba(55, 55, 75, 0.5);
                --chat-border-color: rgba(255, 255, 255, 0.1);
                --chat-text-primary: #f3f4f6;
                --chat-text-secondary: #d1d5db;
                --chat-text-muted: #9ca3af;
                --chat-bubble-bot-bg: rgba(45, 45, 60, 0.9);
                --chat-bubble-user-text: #ffffff;
                --chat-header-text: #f3f4f6;
            }
            
            .theme-light {
                --chat-bg: #ffffff;
                --chat-header-bg: var(--color-primary);
                --chat-footer-bg: #f9fafb;
                --chat-input-bg: #f3f4f6;
                --chat-button-bg: #e5e7eb;
                --chat-border-color: #e5e7eb;
                --chat-text-primary: #111827;
                --chat-text-secondary: #4b5563;
                --chat-text-muted: #6b7280;
                --chat-bubble-bot-bg: #f3f4f6;
                --chat-bubble-user-text: #ffffff;
                --chat-header-text: #ffffff;
            }
            
            [data-flowbot-id] {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 0 !important;
                height: 0 !important;
                overflow: visible !important;
                z-index: 9999 !important;
            }
            
            .flowbot-widget-container * {
                box-sizing: border-box;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Create import map for ES modules
     */
    function createImportMap() {
        const importMap = {
            imports: {
                "react": "https://aistudiocdn.com/react@^19.1.1",
                "react-dom/": "https://aistudiocdn.com/react-dom@^19.1.1/",
                "react/": "https://aistudiocdn.com/react@^19.1.1/",
                "@google/genai": "https://aistudiocdn.com/@google/genai@^1.19.0",
                "firebase/app": "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js",
                "firebase/auth": "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js",
                "firebase/firestore": "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js",
                "firebase/": "https://aistudiocdn.com/firebase@^12.5.0/",
                "pdfjs-dist": "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs",
                "pdfjs-dist/build/pdf.worker.min.mjs": "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs",
                "react-markdown": "https://aistudiocdn.com/react-markdown@^10.1.0",
                "tty": "https://aistudiocdn.com/tty@^1.0.1"
            }
        };

        // Check if import map already exists
        let existingMap = document.querySelector('script[type="importmap"]');
        if (existingMap) {
            try {
                const existing = JSON.parse(existingMap.textContent);
                // Merge imports
                importMap.imports = { ...existing.imports, ...importMap.imports };
                existingMap.textContent = JSON.stringify(importMap);
                return;
            } catch (e) {
                console.warn('FlowBot: Could not merge with existing import map', e);
            }
        }

        // Create new import map
        const script = document.createElement('script');
        script.type = 'importmap';
        script.textContent = JSON.stringify(importMap);
        document.head.appendChild(script);
    }

    /**
     * Load CSS file - try to find it dynamically
     */
    function loadCSS() {
        return new Promise((resolve, reject) => {
            // Try to find existing CSS link
            const existingLink = document.querySelector('link[href*="index"]');
            if (existingLink) {
                resolve();
                return;
            }

            // Try multiple CSS paths - Vite generates CSS with hash
            const cssPaths = [
                '/assets/index.css',
                '/assets/index-[hash].css',
            ];

            // Try to find CSS file by checking if it exists
            let cssLoaded = false;
            let attempts = 0;
            const maxAttempts = cssPaths.length;

            function tryLoadCSS(pathIndex) {
                if (pathIndex >= cssPaths.length) {
                    // If all paths failed, try to find any CSS file in assets
                    console.warn('FlowBot: Could not find CSS file, trying to inject inline styles');
                    injectCriticalCSS();
                    resolve();
                    return;
                }

                const cssPath = cssPaths[pathIndex];
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = CONFIG.baseUrl + cssPath;
                
                cssLink.onload = () => {
                    cssLoaded = true;
                    resolve();
                };
                
                cssLink.onerror = () => {
                    attempts++;
                    if (attempts < maxAttempts) {
                        tryLoadCSS(pathIndex + 1);
                    } else {
                        // Last attempt: try to find CSS dynamically
                        findCSSDynamically().then(resolve).catch(() => {
                            injectCriticalCSS();
                            resolve();
                        });
                    }
                };
                
                document.head.appendChild(cssLink);
            }

            // Try to find CSS file by fetching assets manifest or checking common patterns
            function findCSSDynamically() {
                return new Promise((resolve, reject) => {
                    // Try common CSS filename patterns
                    const patterns = [
                        '/assets/index-*.css',
                    ];
                    
                    // Since we can't glob, try fetching the main HTML to find CSS link
                    fetch(CONFIG.baseUrl + '/index.html')
                        .then(res => res.text())
                        .then(html => {
                            const match = html.match(/href=["']([^"']*index[^"']*\.css[^"']*)["']/);
                            if (match) {
                                const cssPath = match[1].startsWith('/') ? match[1] : '/' + match[1];
                                const cssLink = document.createElement('link');
                                cssLink.rel = 'stylesheet';
                                cssLink.href = CONFIG.baseUrl + cssPath;
                                cssLink.onload = () => resolve();
                                cssLink.onerror = () => reject();
                                document.head.appendChild(cssLink);
                            } else {
                                reject();
                            }
                        })
                        .catch(() => reject());
                });
            }

            // Inject critical CSS if file loading fails
            function injectCriticalCSS() {
                const style = document.createElement('style');
                style.textContent = `
                    /* Critical FlowBot Widget Styles */
                    [data-flowbot-id] {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 0;
                        height: 0;
                        overflow: visible;
                        z-index: 9999;
                    }
                    /* Tailwind-like utilities for widget */
                    .flowbot-widget-container * {
                        box-sizing: border-box;
                    }
                `;
                document.head.appendChild(style);
            }

            tryLoadCSS(0);
        });
    }

    /**
     * Load and initialize the embed module
     */
    function loadEmbedModule() {
        return new Promise((resolve, reject) => {
            // Load the embed bundle (fixed name from build config)
            const bundleUrl = CONFIG.baseUrl + '/assets/embed-bundle.js';
            
            const script = document.createElement('script');
            script.type = 'module';
            script.src = bundleUrl;
            
            script.onload = () => resolve();
            script.onerror = (error) => {
                console.error('FlowBot: Failed to load embed bundle from', bundleUrl, error);
                reject(error);
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize widgets when DOM is ready
     */
    function initialize() {
        // Inject critical styles first
        injectCriticalStyles();
        
        // Load Tailwind CSS
        loadTailwindCSS().then(() => {
            // Create import map
            createImportMap();

            // Wait for import map to be processed
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    Promise.all([
                        loadCSS(),
                        loadEmbedModule()
                    ]).catch(error => {
                        console.error('FlowBot: Initialization error', error);
                    });
                });
            } else {
                // DOM already ready, but wait a bit for import map
                setTimeout(() => {
                    Promise.all([
                        loadCSS(),
                        loadEmbedModule()
                    ]).catch(error => {
                        console.error('FlowBot: Initialization error', error);
                    });
                }, 100);
            }
        });
    }

    // Start initialization
    initialize();
})();

