
import React, { useEffect, useState } from 'react';
import { Notification } from '../types.ts';
import { Info, Check, AlertTriangle, X, MessageSquare } from './Icons.tsx';
import { formatRelativeTime } from '../utils/time.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface ToastNotificationProps {
  notification: Notification;
  onClose: () => void;
}

const icons = {
  info: <MessageSquare className="w-6 h-6 text-blue-400" />,
  success: <Check className="w-6 h-6 text-green-400" />,
  warning: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
  error: <AlertTriangle className="w-6 h-6 text-red-400" />,
};


const ToastNotification: React.FC<ToastNotificationProps> = ({ notification, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    const { language } = useLanguage();

    useEffect(() => {
        if (notification.duration) {
            const timer = setTimeout(() => {
                handleClose();
            }, notification.duration);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notification.id]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Wait for exit animation
    };
    
    const handleActionClick = () => {
        notification.action?.onClick();
        handleClose();
    }

    const animationClass = isExiting ? 'animate-[fadeOut]' : 'animate-[fadeIn]';

    return (
        <div className={`flex items-start w-full p-4 bg-gray-800 border border-gray-700 text-white rounded-lg shadow-lg ${animationClass}`}>
            <div className="flex-shrink-0 mt-0.5">
                {icons[notification.type]}
            </div>
            <div className="ml-4 flex-1">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-200">Uusi Keskustelu</p>
                    {notification.timestamp && (
                         <p className="text-xs text-gray-400">{formatRelativeTime(notification.timestamp, language)}</p>
                    )}
                </div>
                <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
                 {notification.action && (
                    <button onClick={handleActionClick} className="mt-3 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 rounded-md">
                        {notification.action.label}
                    </button>
                )}
            </div>
            <button onClick={handleClose} className="ml-4 -my-1 -mr-1 p-1 text-gray-500 hover:text-white rounded-md">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default ToastNotification;
