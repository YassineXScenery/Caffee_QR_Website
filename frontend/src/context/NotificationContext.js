import { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';

const NotificationContext = createContext();
const socket = io('http://localhost:3000', {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load notifications from localStorage on mount
    const loadNotifications = () => {
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        const now = Date.now();
        const validNotifications = parsedNotifications.filter(
          (notification) => now - notification.timestamp < 24 * 60 * 60 * 1000
        );
        setNotifications(validNotifications);
        const unread = validNotifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
        localStorage.setItem('notifications', JSON.stringify(validNotifications));
      }
    };

    loadNotifications();

    // Socket event handlers
    const handleWaiterCalled = (data) => {
      const newNotification = {
        id: Date.now(),
        message: `Waiter called from table ${data.tableNumber}`,
        timestamp: Date.now(),
        read: false,
      };
      setNotifications((prev) => {
        const updatedNotifications = [...prev, newNotification];
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        return updatedNotifications;
      });
      setUnreadCount((prev) => prev + 1);
    };

    const handleFeedbackSubmitted = (data) => {
      const newNotification = {
        id: Date.now(),
        message: `New feedback submitted: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`,
        timestamp: Date.now(),
        read: false,
      };
      setNotifications((prev) => {
        const updatedNotifications = [...prev, newNotification];
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        return updatedNotifications;
      });
      setUnreadCount((prev) => prev + 1);
    };

    // Set up socket event listeners
    socket.on('waiterCalled', handleWaiterCalled);
    socket.on('feedbackSubmitted', handleFeedbackSubmitted);

    // Cleanup function
    return () => {
      socket.off('waiterCalled', handleWaiterCalled);
      socket.off('feedbackSubmitted', handleFeedbackSubmitted);
    };
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) => {
      const updatedNotifications = prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      return updatedNotifications;
    });
    setUnreadCount((prev) => Math.max(prev - 1, 0));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updatedNotifications = prev.map((notification) => ({ ...notification, read: true }));
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      return updatedNotifications;
    });
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export { NotificationProvider, useNotification };