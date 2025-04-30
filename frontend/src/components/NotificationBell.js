import { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNotification } from '../context/NotificationContext';

function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef(new Audio('/notification-sound.mp3'));

  useEffect(() => {
    // Load notifications from localStorage on mount
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      const parsedNotifications = JSON.parse(storedNotifications);
      const now = Date.now();
      const validNotifications = parsedNotifications.filter(
        (notification) => now - notification.timestamp < 24 * 60 * 60 * 1000
      );
      if (validNotifications.length !== parsedNotifications.length) {
        localStorage.setItem('notifications', JSON.stringify(validNotifications));
      }
    }
  }, []);

  const handleNewNotification = (notification) => {
    // Play sound for new notifications
    audioRef.current.play().catch(error => {
      console.warn('Failed to play notification sound:', error);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-2"
      >
        <FiBell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            {notifications.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Mark all as read
                </button>
                <button
                  onClick={clearNotifications}
                  className="text-sm text-red-600 hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 flex justify-between items-start ${
                    notification.read ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex-1">
                    <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-sm text-blue-600 hover:underline ml-2"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;