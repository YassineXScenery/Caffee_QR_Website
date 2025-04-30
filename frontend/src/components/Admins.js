import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiUsers, FiTag, FiBell, FiList, FiMessageSquare } from 'react-icons/fi';
import AdminManagement from './AdminManagement';
import ItemManagement from './ItemManagement';
import TableManagement from './TableManagement';
import CategoryManagement from './CategoryManagement';
import CallWaiterManagement from './CallWaiterManagement';
import FeedbackManagement from './FeedbackManagement';

function Admins() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsSidebarOpen(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-300 ease-in-out md:static md:shadow-none`}
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
              onClick={() => scrollToSection('categories-section')}
              className="flex items-center w-full px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <FiList className="h-5 w-5 mr-3" />
              Categories
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

        {/* Main Content */}
        <div className="flex-1">
          <header className="bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <h1 className="text-2xl font-semibold text-gray-800">Cafe Management</h1>
              <button
                className="md:hidden text-gray-600 hover:text-gray-800"
                onClick={() => setIsSidebarOpen(true)}
              >
                <FiMenu className="h-6 w-6" />
              </button>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminManagement />
            <CategoryManagement />
            <ItemManagement />
            <TableManagement />
            <CallWaiterManagement />
            <FeedbackManagement />
          </main>
        </div>
      </div>
    </div>
  );
}

export default Admins;