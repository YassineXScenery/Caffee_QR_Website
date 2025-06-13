import React from 'react';
import './SelectionHub.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUtensils,
  faChartLine,
  faUsers,
  faCommentDots,
  faBell,
  faCog,
  faSignOutAlt,
  faUtensilSpoon
} from '@fortawesome/free-solid-svg-icons';

const SelectionHub = ({ navigate, userData }) => {
  const handleNavigation = (path) => {
    console.log('Navigating to:', { path, role: userData.role });
    navigate(path);
  };

const PremiumButton = ({ children, onClick, isWide = false }) => {
  return (
    <div className={`premium-btn-container ${isWide ? 'wide-btn' : ''}`}>
      <button 
        className="premium-btn"
        onClick={onClick}
      >
        <span className="btn-content">
          {children}
        </span>
        <span className="btn-background"></span>
      </button>
    </div>
  );
};

  return (
    <div className="selection-hub">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="user-info">
          {userData.photo ? (
            <img
              src={userData.photo}
              alt={userData.username}
              className="user-avatar"
              onError={e => (e.target.style.display = 'none')}
            />
          ) : (
            <div className="avatar-placeholder">
              {userData.username ? userData.username[0].toUpperCase() : '?'}
            </div>
          )}
          <span className="welcome-text">Welcome, {userData.username || 'Admin'}!</span>
        </div>
        <div className="mobile-actions">
          <button className="mobile-btn menu-btn" onClick={() => handleNavigation('/')}>
            <FontAwesomeIcon icon={faUtensilSpoon} />
            <span>Menu</span>
          </button>
          <button 
            className="mobile-btn logout-btn" 
            onClick={() => {
              console.log('Logging out:', { username: userData.username });
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              window.location.href = '/login';
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="desktop-sidebar">
        <div className="sidebar-user">
          {userData.photo ? (
            <img
              src={userData.photo}
              alt={userData.username}
              className="user-avatar"
              onError={e => (e.target.style.display = 'none')}
            />
          ) : (
            <div className="avatar-placeholder">
              {userData.username ? userData.username[0].toUpperCase() : '?'}
            </div>
          )}
          <div className="sidebar-user-info">
            <span className="welcome-text">Welcome back</span>
            <span className="username">{userData.username || 'Admin'}</span>
          </div>
        </div>
        <button className="sidebar-btn menu-btn" onClick={() => handleNavigation('/')}>
          <FontAwesomeIcon icon={faUtensilSpoon} />
          <span>See Menu</span>
        </button>
        <button 
          className="sidebar-btn logout-btn" 
          onClick={() => {
            console.log('Logging out:', { username: userData.username });
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            window.location.href = '/login';
          }}
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="hub-content">
        <h1 className="hub-title">Admin Panel</h1>
        <div className="hub-grid">
          {userData.role === 'Owner' && (
            <PremiumButton onClick={() => handleNavigation('/kitchen')}>
              <FontAwesomeIcon icon={faUtensils} className="btn-icon" />
              Kitchen
            </PremiumButton>
          )}
          {(userData.role === 'Owner' || userData.role === 'Manager') && (
            <PremiumButton onClick={() => handleNavigation('/admin/analytics')}>
              <FontAwesomeIcon icon={faChartLine} className="btn-icon" />
              Analytics
            </PremiumButton>
          )}
          {userData.role === 'Owner' && (
            <PremiumButton onClick={() => handleNavigation('/staff')}>
              <FontAwesomeIcon icon={faUsers} className="btn-icon" />
              Staff
            </PremiumButton>
          )}
          {(userData.role === 'Owner' || userData.role === 'Waiter') && (
            <PremiumButton onClick={() => handleNavigation('/feedback')}>
              <FontAwesomeIcon icon={faCommentDots} className="btn-icon" />
              Feedback
            </PremiumButton>
          )}
          {(userData.role === 'Owner' || userData.role === 'Waiter') && (
            <PremiumButton isWide onClick={() => handleNavigation('/notifications-management')}>
              <FontAwesomeIcon icon={faBell} className="btn-icon" />
              Notifications
            </PremiumButton>
          )}
          {userData.role === 'Owner' && (
            <PremiumButton isWide onClick={() => handleNavigation('/settings')}>
              <FontAwesomeIcon icon={faCog} className="btn-icon" />
              Settings
            </PremiumButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectionHub;