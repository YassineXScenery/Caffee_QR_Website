import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiUsers, FiTag, FiBell, FiList, FiMessageSquare, FiLogOut, FiHome, FiSettings } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import AdminManagement from './AdminManagement';
import ItemManagement from './ItemManagement';
import TableManagement from './TableManagement';
import CategoryManagement from './CategoryManagement';
import CallWaiterManagement from './CallWaiterManagement';
import FeedbackManagement from './FeedbackManagement';
import { NotificationProvider } from '../context/NotificationContext';
import NotificationBell from './NotificationBell';
import SettingsPanel from './SettingsPanel';

function Admins() {
  const { t, i18n } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('admins-section');
  const navigate = useNavigate();
  const mainContentRef = useRef(null);

  const scrollToSection = (sectionId) => {
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element && mainContentRef.current) {
        setActiveSection(sectionId);
        const mainContentTop = mainContentRef.current.getBoundingClientRect().top;
        const elementTop = element.getBoundingClientRect().top;
        const headerHeight = 20;

        let scrollPosition = elementTop - mainContentTop + mainContentRef.current.scrollTop - headerHeight;

        if (sectionId === 'admins-section') {
          scrollPosition = 0;
        }

        mainContentRef.current.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
        setIsSidebarOpen(false);
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

  useEffect(() => {
    const sections = [
      'admins-section',
      'categories-section',
      'items-section',
      'tables-section',
      'call-waiter-section',
      'feedback-section',
      'settings-section',
    ];

    const handleScroll = () => {
      if (!mainContentRef.current) return;

      let currentSection = 'admins-section';
      let minDistance = Infinity;

      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          const mainContentTop = mainContentRef.current.getBoundingClientRect().top;
          const elementTop = element.getBoundingClientRect().top;
          const distance = Math.abs(elementTop - mainContentTop);

          if (distance < minDistance) {
            minDistance = distance;
            currentSection = sectionId;
          }
        }
      });

      setActiveSection(currentSection);
    };

    const mainContent = mainContentRef.current;
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-blue-50 flex" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Mobile sidebar backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 ${i18n.language === 'ar' ? 'right-0' : 'left-0'} z-50 w-72 bg-white shadow-2xl transform ${
            isSidebarOpen ? 'translate-x-0' : (i18n.language === 'ar' ? 'translate-x-full' : '-translate-x-full')
          } md:translate-x-0 transition-transform duration-300 ease-in-out md:w-64 md:static rounded-r-3xl overflow-hidden`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-20 px-6 border-b border-blue-100 bg-blue-500">
              <h2 className="text-xl font-semibold text-white">{t('adminPanel')}</h2>
              <button
                className="md:hidden text-blue-100 hover:text-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
              <button
                onClick={() => scrollToSection('admins-section')}
                className={`flex items-center w-full px-4 py-3 rounded-2xl transition-all ${
                  activeSection === 'admins-section' 
                    ? 'bg-blue-100 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                }`}
              >
                <FiUsers className="h-5 w-5 mr-3" />
                <span className="font-medium">{t('adminAccounts')}</span>
              </button>

              <button
                onClick={() => scrollToSection('categories-section')}
                className={`flex items-center w-full px-4 py-3 rounded-2xl transition-all ${
                  activeSection === 'categories-section' 
                    ? 'bg-blue-100 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                }`}
              >
                <FiList className="h-5 w-5 mr-3" />
                <span className="font-medium">{t('categories')}</span>
              </button>

              <button
                onClick={() => scrollToSection('items-section')}
                className={`flex items-center w-full px-4 py-3 rounded-2xl transition-all ${
                  activeSection === 'items-section' 
                    ? 'bg-blue-100 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                }`}
              >
                <FiTag className="h-5 w-5 mr-3" />
                <span className="font-medium">{t('menuItems')}</span>
              </button>

              <button
                onClick={() => scrollToSection('tables-section')}
                className={`flex items-center w-full px-4 py-3 rounded-2xl transition-all ${
                  activeSection === 'tables-section' 
                    ? 'bg-blue-100 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                }`}
              >
                <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m4-8h4m-4 0a2 2 0 00-2 2v2h8V5a2 2 0 00-2-2m-4 8v4m4-4v4" />
                </svg>
                <span className="font-medium">{t('tables')}</span>
              </button>

              <button
                onClick={() => scrollToSection('call-waiter-section')}
                className={`flex items-center w-full px-4 py-3 rounded-2xl transition-all ${
                  activeSection === 'call-waiter-section' 
                    ? 'bg-blue-100 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                }`}
              >
                <FiBell className="h-5 w-5 mr-3" />
                <span className="font-medium">{t('waitersCalls')}</span>
              </button>

              <button
                onClick={() => scrollToSection('feedback-section')}
                className={`flex items-center w-full px-4 py-3 rounded-2xl transition-all ${
                  activeSection === 'feedback-section' 
                    ? 'bg-blue-100 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                }`}
              >
                <FiMessageSquare className="h-5 w-5 mr-3" />
                <span className="font-medium">{t('customerFeedback')}</span>
              </button>

              <button
                onClick={() => scrollToSection('settings-section')}
                className={`flex items-center w-full px-4 py-3 rounded-2xl transition-all ${
                  activeSection === 'settings-section'
                    ? 'bg-blue-100 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                }`}
              >
                <FiSettings className="h-5 w-5 mr-3" />
                <span className="font-medium">{t('settings')}</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 mt-4 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
              >
                <FiLogOut className="h-5 w-5 mr-3" />
                <span className="font-medium">{t('logout')}</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm sticky top-0 z-30">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                <button
                  className="md:hidden text-gray-600 hover:text-blue-500"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <FiMenu className="h-6 w-6" />
                </button>
                <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
                  <FiHome className="mr-2 text-blue-500" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    {t('adminPanel')}
                  </span>
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationBell />
              </div>
            </div>
          </header>

          <main
            ref={mainContentRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 bg-blue-50"
            style={{ maxHeight: 'calc(100vh - 4rem)' }}
          >
            <div className="max-w-7xl mx-auto space-y-8">
              <AdminManagement mainContentRef={mainContentRef} />
              <CategoryManagement mainContentRef={mainContentRef} />
              <ItemManagement mainContentRef={mainContentRef} />
              <TableManagement />
              <CallWaiterManagement />
              <FeedbackManagement />
              <SettingsPanel />
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}

export default Admins;