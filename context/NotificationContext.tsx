
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Notification, NotificationType, NotificationAction } from '../types.ts';
import { generateId } from '../utils/id.ts';

type AddNotificationPayload = {
    message: string;
    type: NotificationType;
    duration?: number;
    timestamp?: string;
    action?: NotificationAction;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (payload: AddNotificationPayload) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback(({ message, type, duration = 5000, timestamp, action }: AddNotificationPayload) => {
    const id = generateId();
    const newNotification: Notification = { id, message, type, duration, timestamp, action };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
