import './embed.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import PublicWidgetLoader from './components/PublicWidgetLoader.tsx';

/**
 * Initialize FlowBot widgets on the page
 * Finds all elements with data-flowbot-id attribute and renders a widget for each
 */
function initializeWidgets() {
    // Find all elements with data-flowbot-id attribute
    const widgetContainers = document.querySelectorAll('[data-flowbot-id]');
    
    if (widgetContainers.length === 0) {
        console.warn('FlowBot: No elements with data-flowbot-id attribute found');
        return;
    }

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

        try {
            // Style the container for proper widget positioning
            // Make it a minimal container that doesn't interfere with the widget
            const containerElement = container as HTMLElement;
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

            // Create React root and render PublicWidgetLoader
            const root = ReactDOM.createRoot(container);
            root.render(
                <React.StrictMode>
                    <PublicWidgetLoader botId={botId} />
                </React.StrictMode>
            );

            // Mark as initialized to prevent double initialization
            container.setAttribute('data-flowbot-initialized', 'true');
        } catch (error) {
            console.error(`FlowBot: Error initializing widget for botId ${botId}:`, error);
        }
    });
}

// Initialize widgets when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidgets);
} else {
    // DOM is already ready
    initializeWidgets();
}

// Export for manual initialization if needed
export { initializeWidgets };

