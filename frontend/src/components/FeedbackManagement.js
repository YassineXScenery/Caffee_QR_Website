import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

const socket = io(SOCKET_URL, { reconnectionAttempts: 5 });

function FeedbackManagement() {
  const { t, i18n } = useTranslation();
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFeedbacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(response.data);
    } catch (err) {
      setError(err.response?.data?.error || t('failedToLoadFeedback'));
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadFeedbacks();

    socket.on('newFeedback', (feedback) => {
      setFeedbacks(prev => [feedback, ...prev]);
    });

    return () => {
      socket.off('newFeedback');
    };
  }, [loadFeedbacks]);

  const deleteFeedback = async (id) => {
    if (!window.confirm(t('confirmDeleteFeedback'))) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/feedback/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || t('failedToDeleteFeedback'));
    }
  };

  const deleteAllFeedbacks = async () => {
    if (!window.confirm(t('confirmDeleteAllFeedback'))) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks([]);
    } catch (err) {
      setError(err.response?.data?.error || t('failedToDeleteFeedbacks'));
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto py-8">
      <button
        className="fixed top-6 left-6 z-50 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
        onClick={() => window.history.back()}
      >
        ← Back
      </button>

      <div id="feedback-section" className="mb-16 px-4 sm:px-0" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
            <FiMessageSquare className="mr-2" />
            {t('customerFeedback')}
            <span className="ml-3 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
              {feedbacks.length} {feedbacks.length === 1 ? t('entry') : t('entries')}
            </span>
          </h1>
          {feedbacks.length > 0 && (
            <button 
              onClick={deleteAllFeedbacks}
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

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{t('noFeedbackYet')}</h3>
            <p className="text-sm text-gray-500">{t('customerFeedbackWillAppear')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map(feedback => (
              <div key={feedback.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-500">
                    {new Date(feedback.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={() => deleteFeedback(feedback.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title={t('deleteFeedback')}
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-gray-800">{feedback.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackManagement;