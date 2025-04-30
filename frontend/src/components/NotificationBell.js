import { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiTrash2 } from 'react-icons/fi';
import { useNotification } from '../context/NotificationContext';

function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const audioRef = useRef(new Audio('/notification-sound.mp3'));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative focus:outline-none transition-all duration-200 hover:bg-blue-50 rounded-full p-2 group border-2 border-blue-100 hover:border-blue-200"
        aria-label="Notifications"
      >
        <FiBell className="h-6 w-6 text-blue-600 group-hover:text-blue-800 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1 shadow-sm border border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-2 mt-2 w-85 bg-white rounded-lg shadow-xl border-2 border-blue-200 z-50 transform transition-all duration-200 ease-out">
          <div className="p-4 border-b-2 border-blue-200 flex justify-between items-center bg-blue-50 rounded-t-lg">
            <div className="flex items-center">
              <FiBell className="mr-2 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800 mr-4">
                Notifications
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-500 transition-all duration-200 px-3 py-1 rounded-md border border-blue-300 hover:border-blue-500 whitespace-nowrap mr-2"
                  title="Mark all as read"
                >
                  Mark As Seen
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-red-500 hover:text-white hover:bg-red-500 transition-all duration-200 p-1.5 rounded-full border border-red-300 hover:border-red-500"
                  title="Clear all"
                >
                  <FiTrash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white hover:bg-gray-500 transition-all duration-200 p-1.5 rounded-full border border-gray-300 hover:border-gray-500"
                title="Close"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto border-blue-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center flex flex-col items-center bg-blue-50 rounded-b-lg border-t-2 border-blue-100">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 border-2 border-blue-200">
                  <FiBell className="h-8 w-8 text-blue-400" />
                </div>
                <p className="text-blue-700 font-medium">No notifications yet</p>
                <p className="text-sm text-blue-400 mt-1">We'll notify you when something arrives</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`p-4 border-b-2 border-blue-100 last:border-b-0 transition-colors duration-150 ${
                      notification.read 
                        ? 'bg-blue-50/50 hover:bg-blue-100/50' 
                        : 'bg-white hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`text-sm ${
                          notification.read 
                            ? 'text-blue-700' 
                            : 'text-blue-900 font-medium'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-blue-400 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="ml-3 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 transition-all duration-200 px-2 py-1 rounded-md border border-blue-600"
                          title="Mark as read"
                        >
                          New
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;