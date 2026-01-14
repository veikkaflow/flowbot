import './embed.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import PublicWidgetLoader from './components/PublicWidgetLoader.tsx';

// Extend Window interface for FlowBot widget initialization flag
declare global {
    interface Window {
        __flowbotWidgetsInitialized?: boolean;
    }
}

// Track if initialization is in progress to prevent double initialization
let isInitializing = false;
const initializedRoots = new WeakMap<HTMLElement, any>();

/**
 * Initialize FlowBot widgets on the page
 * Finds all elements with data-flowbot-id attribute and renders a widget for each
 */
function initializeWidgets() {
    // Prevent concurrent initialization
    if (isInitializing) {
        console.warn('FlowBot: Initialization already in progress');
        return;
    }

    // Find all elements with data-flowbot-id attribute
    // Exclude already initialized elements
    const widgetContainers = document.querySelectorAll('[data-flowbot-id]:not([data-flowbot-initialized])');
    
    if (widgetContainers.length === 0) {
        // Check if there are any widgets at all
        const allContainers = document.querySelectorAll('[data-flowbot-id]');
        if (allContainers.length === 0) {
            console.warn('FlowBot: No elements with data-flowbot-id attribute found');
        }
        return;
    }

    isInitializing = true;

    try {
        widgetContainers.forEach((container) => {
            const botId = container.getAttribute('data-flowbot-id');
            
            if (!botId) {
                console.error('FlowBot: Element has data-flowbot-id attribute but no value');
                return;
            }

            // Check if widget is already initialized on this element
            if (container.hasAttribute('data-flowbot-initialized')) {
                console.warn(`FlowBot: Widget already initialized for botId: ${botId}`);
                return;
            }

            // Check if element already has a React root
            if (initializedRoots.has(container as HTMLElement)) {
                console.warn(`FlowBot: Widget already has React root for botId: ${botId}`);
                return;
            }

            // Check if element already contains flowbot-widget-container (double render check)
            if (container.querySelector('.flowbot-widget-container')) {
                console.warn(`FlowBot: Widget container already exists for botId: ${botId}`);
                container.setAttribute('data-flowbot-initialized', 'true');
                return;
            }

        try {
            // Style the container for proper widget positioning
            // Make it a minimal container that doesn't interfere with the widget
            const containerElement = container as HTMLElement;
            
            // Use setProperty with !important to override host page styles
            containerElement.style.setProperty('position', 'fixed', 'important');
            containerElement.style.setProperty('top', '0', 'important');
            containerElement.style.setProperty('left', '0', 'important');
            containerElement.style.setProperty('width', '0', 'important');
            containerElement.style.setProperty('height', '0', 'important');
            containerElement.style.setProperty('overflow', 'visible', 'important');
            containerElement.style.setProperty('pointer-events', 'none', 'important');
            containerElement.style.setProperty('z-index', '9999', 'important');
            containerElement.style.setProperty('margin', '0', 'important');
            containerElement.style.setProperty('padding', '0', 'important');
            containerElement.style.setProperty('border', 'none', 'important');
            containerElement.style.setProperty('background', 'transparent', 'important');
            containerElement.style.setProperty('transform', 'none', 'important');
            containerElement.style.setProperty('box-sizing', 'border-box', 'important');
            
            // Also set as regular style properties for browsers that don't support setProperty with important
            containerElement.style.position = 'fixed';
            containerElement.style.top = '0';
            containerElement.style.left = '0';
            containerElement.style.width = '0';
            containerElement.style.height = '0';
            containerElement.style.overflow = 'visible';
            containerElement.style.pointerEvents = 'none';
            containerElement.style.zIndex = '9999';
            containerElement.style.margin = '0';
            containerElement.style.padding = '0';
            containerElement.style.border = 'none';
            containerElement.style.background = 'transparent';
            containerElement.style.transform = 'none';
            containerElement.style.boxSizing = 'border-box';

            // Mark as initialized BEFORE creating React root to prevent race conditions
            container.setAttribute('data-flowbot-initialized', 'true');

            // Create React root and render PublicWidgetLoader
            const root = ReactDOM.createRoot(container);
            initializedRoots.set(container as HTMLElement, root);
            
            root.render(
                <React.StrictMode>
                    <PublicWidgetLoader botId={botId} />
                </React.StrictMode>
            );
        } catch (error) {
            console.error(`FlowBot: Error initializing widget for botId ${botId}:`, error);
            // Remove initialization flag on error so it can be retried
            container.removeAttribute('data-flowbot-initialized');
        }
    });
    } finally {
        isInitializing = false;
    }
}

// Prevent multiple initializations
if (window.__flowbotWidgetsInitialized) {
    console.warn('FlowBot: Widget initialization already started');
} else {
    window.__flowbotWidgetsInitialized = true;
    
    // Initialize widgets when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWidgets);
    } else {
        // DOM is already ready, but wait a tick to ensure all scripts are loaded
        setTimeout(initializeWidgets, 0);
    }
}

// Export for manual initialization if needed
export { initializeWidgets };

