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

const SelectionHub = ({ navigate, userData }) => (
  <div className="selection-hub">
    {/* Mobile Header (unchanged) */}
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
        <button className="mobile-btn menu-btn" onClick={() => navigate('/')}>
          <FontAwesomeIcon icon={faUtensilSpoon} />
          <span>Menu</span>
        </button>
        <button 
          className="mobile-btn logout-btn" 
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span>Logout</span>
        </button>
      </div>
    </div>

    {/* Desktop Sidebar (improved) */}
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
      <button className="sidebar-btn menu-btn" onClick={() => navigate('/')}>
        <FontAwesomeIcon icon={faUtensilSpoon} />
        <span>See Menu</span>
      </button>
      <button 
        className="sidebar-btn logout-btn" 
        onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }}
      >
        <FontAwesomeIcon icon={faSignOutAlt} />
        <span>Logout</span>
      </button>
    </div>

    {/* Main Content (unchanged structure) */}
    <div className="hub-content">
      <h1 className="hub-title">Admin Panel</h1>
      <div className="hub-grid">
        <button className="hub-btn" onClick={() => navigate('/kitchen')}>
          <FontAwesomeIcon icon={faUtensils} className="btn-icon" />
          Kitchen
        </button>
        <button className="hub-btn" onClick={() => navigate('/analytics')}>
          <FontAwesomeIcon icon={faChartLine} className="btn-icon" />
          Analytics
        </button>
        <button className="hub-btn" onClick={() => navigate('/staff')}>
          <FontAwesomeIcon icon={faUsers} className="btn-icon" />
          Staff
        </button>
        <button className="hub-btn" onClick={() => navigate('/feedback')}>
          <FontAwesomeIcon icon={faCommentDots} className="btn-icon" />
          Feedback
        </button>
        <button className="hub-btn wide-btn" onClick={() => navigate('/notifications-management')}>
          <FontAwesomeIcon icon={faBell} className="btn-icon" />
          Notifications
        </button>
        <button className="hub-btn wide-btn" onClick={() => navigate('/settings')}>
          <FontAwesomeIcon icon={faCog} className="btn-icon" />
          Settings
        </button>
      </div>
    </div>
  </div>
);

export default SelectionHub;