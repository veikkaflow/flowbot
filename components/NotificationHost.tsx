
import React from 'react';
import { useNotification } from '../context/NotificationContext.tsx';
import ToastNotification from './ToastNotification.tsx';

const NotificationHost: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed bottom-5 left-5 z-[100] w-full max-w-md flex flex-col-reverse gap-3">
      {notifications.map(notification => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationHost;
