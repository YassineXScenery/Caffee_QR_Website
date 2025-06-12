import React from 'react';

const NotificationsManagement = () => (
  <div className="notifications-management">
    <h2>Notifications Management</h2>
    {/* Place your notifications management logic/UI here */}
    <button
      className="fixed top-6 left-6 z-50 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
      onClick={() => window.history.back()}
    >
      ← Back
    </button>
  </div>
);

export default NotificationsManagement;
