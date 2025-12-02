// FIX: This file was created to resolve "Cannot find name" and module resolution errors.
import { useState, useEffect } from 'react';
import { useBotContext } from '../context/BotContext.tsx';

const timeToMinutes = (timeStr: string): number => {
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    } catch (e) {
        return 0; // Fallback for invalid time format
    }
};

export const useScheduler = () => {
    const { activeBot } = useBotContext();
    const settings = activeBot?.settings.schedule;
    
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (!settings) return;

        const checkStatus = () => {
            if (settings.isAlwaysOnline) {
                setIsOnline(true);
                return;
            }

            const now = new Date();
            const currentDay = now.getDay(); // Sunday is 0, Monday is 1, etc.
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const daySchedule = settings.dailySchedules[currentDay];

            if (!daySchedule || !daySchedule.isEnabled || !daySchedule.startTime || !daySchedule.endTime) {
                setIsOnline(false);
                return;
            }
            
            const startMinutes = timeToMinutes(daySchedule.startTime);
            const endMinutes = timeToMinutes(daySchedule.endTime);

            const isTimeMatch = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
            setIsOnline(isTimeMatch);
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [settings]);

    return { isOnline, settings };
};