import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for debounced saving of text input values
 * @param initialValue - Initial value from database
 * @param onSave - Function to call when saving (should update database)
 * @param debounceMs - Debounce delay in milliseconds (default: 1000ms)
 * @returns [localValue, setLocalValue, isSaving] - Local state value, setter function, and saving status
 */
export const useDebouncedSave = <T extends string>(
    initialValue: T | undefined,
    onSave: (value: T) => void | Promise<void>,
    debounceMs: number = 1000
): [T, (value: T) => void, boolean] => {
    const [localValue, setLocalValue] = useState<T>(() => (initialValue || '') as T);
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMount = useRef(true);
    const lastSavedValue = useRef<T | undefined>(initialValue);

    // Sync local value when initialValue changes (e.g., when switching bots)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        
        // Only update if the value actually changed from external source
        if (initialValue !== lastSavedValue.current) {
            setLocalValue((initialValue || '') as T);
            lastSavedValue.current = initialValue;
        }
    }, [initialValue]);

    // Debounced save effect
    useEffect(() => {
        // Don't save on initial mount or if value hasn't changed
        if (isInitialMount.current || localValue === (initialValue || '')) {
            return;
        }

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setIsSaving(true);
        timeoutRef.current = setTimeout(async () => {
            try {
                await onSave(localValue);
                lastSavedValue.current = localValue;
            } catch (error) {
                console.error('Error saving debounced value:', error);
            } finally {
                setIsSaving(false);
            }
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [localValue, onSave, debounceMs, initialValue]);

    // Immediate save on blur
    const handleBlur = useCallback(async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (localValue !== lastSavedValue.current) {
            setIsSaving(true);
            try {
                await onSave(localValue);
                lastSavedValue.current = localValue;
            } catch (error) {
                console.error('Error saving on blur:', error);
            } finally {
                setIsSaving(false);
            }
        }
    }, [localValue, onSave]);

    const setValue = useCallback((value: T) => {
        setLocalValue(value);
    }, []);

    return [localValue, setValue, isSaving];
};

/**
 * Hook for immediate save on blur (no debounce)
 * Useful for short text inputs like names
 */
export const useImmediateSave = <T extends string>(
    initialValue: T | undefined,
    onSave: (value: T) => void | Promise<void>
): [T, (value: T) => void, boolean, () => void] => {
    const [localValue, setLocalValue] = useState<T>(() => (initialValue || '') as T);
    const [isSaving, setIsSaving] = useState(false);
    const isInitialMount = useRef(true);
    const lastSavedValue = useRef<T | undefined>(initialValue);

    // Sync local value when initialValue changes
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        
        if (initialValue !== lastSavedValue.current) {
            setLocalValue((initialValue || '') as T);
            lastSavedValue.current = initialValue;
        }
    }, [initialValue]);

    const handleBlur = useCallback(async () => {
        if (localValue !== lastSavedValue.current) {
            setIsSaving(true);
            try {
                await onSave(localValue);
                lastSavedValue.current = localValue;
            } catch (error) {
                console.error('Error saving on blur:', error);
            } finally {
                setIsSaving(false);
            }
        }
    }, [localValue, onSave]);

    const setValue = useCallback((value: T) => {
        setLocalValue(value);
    }, []);

    return [localValue, setValue, isSaving, handleBlur];
};

