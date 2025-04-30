import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiUsers, FiTag, FiBell, FiList, FiMessageSquare } from 'react-icons/fi';
import AdminManagement from './AdminManagement';
import ItemManagement from './ItemManagement';
import TableManagement from './TableManagement';
import CategoryManagement from './CategoryManagement';
import CallWaiterManagement from './CallWaiterManagement';
import FeedbackManagement from './FeedbackManagement';
import { NotificationProvider } from '../context/NotificationContext'; // Corrected path
import NotificationBell from './NotificationBell';

function Admins() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const mainContentRef = useRef(null);

  const scrollToSection = (sectionId) => {
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element && mainContentRef.current) {
        const mainContentTop = mainContentRef.current.getBoundingClientRect().top;
        const elementTop = element.getBoundingClientRect().top;
        const headerHeight = 64;

        let scrollPosition = elementTop - mainContentTop + mainContentRef.current.scrollTop - headerHeight;

        if (sectionId === 'admins-section') {
          scrollPosition = 0;
        }

        console.log(`Scrolling to section: ${sectionId}, Position: ${scrollPosition}`);

        mainContentRef.current.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
        setIsSidebarOpen(false);
      } else {
        console.error(`Section with ID ${sectionId} not found or mainContentRef is not set. Element: ${element}, Ref: ${mainContentRef.current}`);
      }
    }, 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-300 ease-in-out md:w-64 md:static md:shadow-none`}
        >
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
            <button
              className="md:hidden text-gray-600 hover:text-gray-800"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-6">
            <button
              onClick={() => scrollToSection('admins-section')}
              className="flex items-center w-full px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <FiUsers className="h-5 w-5 mr-3" />
              Admin Accounts
            </button>
            <button
              onClick={() => scrollToSection('categories-section')}
              className="flex items-center w-full px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <FiList className="h-5 w-5 mr-3" />
              Categories
            </button>
            <button
              onClick={() => scrollToSection('items-section')}
              className="flex items-center w-full px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <FiTag className="h-5 w-5 mr-3" />
              Menu Items
            </button>
            <button
              onClick={() => scrollToSection('tables-section')}
              className="flex items-center w-full px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <svg className="h-5 w-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m4-8h4m-4 0a2 2 0 00-2 2v2h8V5a2 2 0 00-2-2m-4 8v4m4-4v4" />
              </svg>
              Tables
            </button>
            <button
              onClick={() => scrollToSection('call-waiter-section')}
              className="flex items-center w-full px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <FiBell className="h-5 w-5 mr-3" />
              Call Waiter Requests
            </button>
            <button
              onClick={() => scrollToSection('feedback-section')}
              className="flex items-center w-full px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <FiMessageSquare className="h-5 w-5 mr-3" />
              Customer Feedback
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-6 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <FiX className="h-5 w-5 mr-3" />
              Logout
            </button>
          </nav>
        </div>

        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-semibold text-gray-800">Cafe Management</h1>
                <NotificationBell />
              </div>
              <button
                className="md:hidden text-gray-600 hover:text-gray-800"
                onClick={() => setIsSidebarOpen(true)}
              >
                <FiMenu className="h-6 w-6" />
              </button>
            </div>
          </header>
          <main
            ref={mainContentRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8"
            style={{ maxHeight: 'calc(100vh - 4rem)' }}
          >
            <div className="max-w-7xl mx-auto">
              <AdminManagement />
              <CategoryManagement />
              <ItemManagement />
              <TableManagement />
              <CallWaiterManagement />
              <FeedbackManagement />
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}

export default Admins;