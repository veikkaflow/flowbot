import { useEffect, RefObject } from 'react';

interface UseHostStyleOverrideOptions {
    /** Theme mode for color determination */
    themeMode?: 'dark' | 'light';
    /** Whether this is a header component (uses white text) */
    isHeader?: boolean;
    /** Additional selectors to process */
    additionalSelectors?: string[];
    /** Custom text color override (overrides theme-based color) */
    customTextColor?: string;
}

/**
 * Hook to override host site CSS styles using inline styles with !important flag
 * This ensures that embedded widgets are not affected by host site CSS
 */
export function useHostStyleOverride(
    containerRefs: RefObject<HTMLElement>[],
    dependencies: any[],
    options: UseHostStyleOverrideOptions = {}
) {
    const { themeMode, isHeader = false, additionalSelectors = [], customTextColor } = options;

    useEffect(() => {
        const applyStylesToContainer = (container: HTMLElement | null) => {
            if (!container) return;

            // Get computed styles to read CSS variables
            const computedStyle = getComputedStyle(container);
            
            // Determine text color based on context
            let textColor: string;
            if (customTextColor) {
                textColor = customTextColor;
            } else if (isHeader) {
                // Header always uses white - use CSS variable if available, fallback to direct value
                textColor = computedStyle.getPropertyValue('--chat-header-text').trim() || '#ffffff';
            } else {
                // Use theme-based color from CSS variable
                const chatTextPrimary = computedStyle.getPropertyValue('--chat-text-primary').trim();
                if (chatTextPrimary) {
                    textColor = chatTextPrimary;
                } else {
                    // Fallback to direct values if CSS variable not available
                    const isDark = themeMode === 'dark';
                    textColor = isDark ? '#f3f4f6' : '#111827';
                }
            }

            // Select all critical elements that might be affected by host site CSS
            const baseSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'dd', 'dl', 'figure', 'hr', 'pre'];
            const selectors = [...baseSelectors, ...additionalSelectors];

            // Apply margin resets and font styles
            selectors.forEach((selector) => {
                const elements = container.querySelectorAll(selector);
                elements.forEach((element) => {
                    const htmlElement = element as HTMLElement;
                    
                    // Reset margins to override host site !important styles
                    htmlElement.style.setProperty('margin-bottom', '0', 'important');
                    htmlElement.style.setProperty('margin', '0', 'important');
                    htmlElement.style.setProperty('margin-top', '0', 'important');
                    htmlElement.style.setProperty('margin-right', '0', 'important');
                    htmlElement.style.setProperty('margin-left', '0', 'important');
                    
                    // Handle font styles for headings
                    if (selector.startsWith('h')) {
                        htmlElement.style.setProperty('font-size', 'inherit', 'important');
                        htmlElement.style.setProperty('font-weight', 'inherit', 'important');
                        htmlElement.style.setProperty('line-height', 'inherit', 'important');
                    }
                });
            });

            // Handle text-current elements - override currentColor
            const textCurrentElements = container.querySelectorAll('[class*="text-current"]');
            textCurrentElements.forEach((element) => {
                const htmlElement = element as HTMLElement;
                htmlElement.style.setProperty('color', textColor, 'important');
            });

            // Ensure parent elements use correct color (affects currentColor value)
            // This is especially important for prose elements
            const proseElements = container.querySelectorAll('[class*="prose"]');
            proseElements.forEach((element) => {
                const htmlElement = element as HTMLElement;
                htmlElement.style.setProperty('color', textColor, 'important');
            });

            // For header components, ensure all text elements use header text color
            if (isHeader) {
                const headerTextColor = computedStyle.getPropertyValue('--chat-header-text').trim() || '#ffffff';
                const headerTextElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
                headerTextElements.forEach((element) => {
                    const htmlElement = element as HTMLElement;
                    htmlElement.style.setProperty('color', headerTextColor, 'important');
                });
            }
        };

        // Apply styles to all provided container refs
        containerRefs.forEach((ref) => {
            applyStylesToContainer(ref.current);
        });
    }, dependencies);
}
