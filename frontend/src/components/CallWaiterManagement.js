import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { FiBell, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

const socket = io(SOCKET_URL, { reconnectionAttempts: 5 });

function CallWaiterManagement() {
  const [requests, setRequests] = useState([]);
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, i18n } = useTranslation();

  // Fetch tables only once on component mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const tablesRes = await axios.get(`${API_URL}/tables`);
        setTables(tablesRes.data.map(t => t.table_number));
      } catch (err) {
        setError(err.response?.data?.error || t('Failed to load tables'));
      }
    };

    fetchTables();
  }, []); // Empty dependency array to run only once on mount

  // Fetch requests and set up socket listener
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const requestsRes = await axios.get(`${API_URL}/call-waiter`);
        setRequests(requestsRes.data);
      } catch (err) {
        setError(err.response?.data?.error || t('Failed to load requests'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();

    const handleCallWaiter = (request) => {
      setRequests(prev => {
        const exists = prev.some(r => r.id === request.id);
        if (!exists && tables.includes(request.tableNumber)) {
          return [...prev, request];
        }
        return prev;
      });
    };

    socket.on('waiterCalled', handleCallWaiter);

    return () => {
      socket.off('waiterCalled', handleCallWaiter);
    };
  }, [tables]); // Depend on tables, but tables is now stable

  const handleClearRequest = async (id) => {
    try {
      await axios.delete(`${API_URL}/call-waiter/${id}`);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to clear request'));
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t('Clear all requests?'))) return;
    try {
      await axios.delete(`${API_URL}/call-waiter`);
      setRequests([]);
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to clear requests'));
    }
  };

  return (
    <div id="call-waiter-section" className="mb-16 px-4 sm:px-0" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <FiBell className="mr-2" />
          {t('waiterCalls')}
          <span className="ml-3 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
            {requests.length} {requests.length === 1 ? t('request') : t('requests')}
          </span>
        </h1>
        {requests.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('clearAll')}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="min-h-[200px]">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <FiBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{t('No active requests')}</h3>
            <p className="text-sm text-gray-500">{t('Tables will appear here when they call for service')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(request => (
                <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">{t('Table')} {request.tableNumber}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleClearRequest(request.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title={t('Clear request')}
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CallWaiterManagement;