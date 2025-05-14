import { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiTrash2 } from 'react-icons/fi';
import { useNotification } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';

function NotificationBell() {
  const { t, i18n } = useTranslation();
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
    <div className="relative" ref={dropdownRef} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative focus:outline-none transition-all duration-200 hover:bg-blue-50 rounded-full p-2 group border-2 border-blue-100 hover:border-blue-200"
        aria-label={t('notifications')}
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
                {t('notifications')}
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-500 transition-all duration-200 px-3 py-1 rounded-md border border-blue-300 hover:border-blue-500 whitespace-nowrap mr-2"
                  title={t('markAllAsRead')}
                >
                  {t('markAllAsRead')}
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-xs font-medium text-red-600 hover:text-white hover:bg-red-500 transition-all duration-200 px-3 py-1 rounded-md border border-red-300 hover:border-red-500 whitespace-nowrap"
                  title={t('clearAll')}
                >
                  <FiTrash2 className="inline mr-1" />
                  {t('clearAll')}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none"
                title={t('close')}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-blue-50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {t('noNotifications')}
              </div>
            ) : (
              notifications.map((notification, idx) => (
                <div
                  key={notification.id || idx}
                  className={`p-4 flex items-start gap-3 ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-2 text-xs text-blue-600 hover:underline"
                      title={t('markAsRead')}
                    >
                      {t('markAsRead')}
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
