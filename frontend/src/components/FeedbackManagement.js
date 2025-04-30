import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { FiMessageSquare, FiTrash2 } from 'react-icons/fi';

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

// Initialize socket outside the component to ensure a single instance
const socket = io(SOCKET_URL, {
  reconnectionAttempts: 5,
});

function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [errorFeedbacks, setErrorFeedbacks] = useState(null);

  const loadFeedbacks = useCallback(async () => {
    setIsLoadingFeedbacks(true);
    setErrorFeedbacks(null);
    try {
      // Retrieve the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await axios.get(`${API_URL}/feedback`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      });
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      setErrorFeedbacks(error.response?.data?.error || error.message || 'Failed to load feedbacks');
    } finally {
      setIsLoadingFeedbacks(false);
    }
  }, []);

  const deleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    setIsLoadingFeedbacks(true);
    setErrorFeedbacks(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      await axios.delete(`${API_URL}/feedback/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      loadFeedbacks();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      setErrorFeedbacks(error.response?.data?.error || error.message || 'Failed to delete feedback');
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  const deleteAllFeedbacks = async () => {
    if (!window.confirm('Are you sure you want to delete all feedbacks?')) {
      return;
    }

    setIsLoadingFeedbacks(true);
    setErrorFeedbacks(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      await axios.delete(`${API_URL}/feedback`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      loadFeedbacks();
    } catch (error) {
      console.error('Error deleting all feedbacks:', error);
      setErrorFeedbacks(error.response?.data?.error || error.message || 'Failed to delete all feedbacks');
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();

    // Set up socket event listeners for feedback
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server (Feedback)');
    });

    socket.on('newFeedback', (newFeedback) => {
      setFeedbacks((prev) => [newFeedback, ...prev]); // Add new feedback to the top
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error (Feedback):', error);
      setErrorFeedbacks('Failed to connect to real-time updates');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server (Feedback)');
    });

    // Cleanup: Remove event listeners but keep the socket connection alive
    return () => {
      socket.off('connect');
      socket.off('newFeedback');
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, [loadFeedbacks]);

  return (
    <div id="feedback-section" className="mb-16">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
        Customer Feedback
        <span className="ml-3 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          {feedbacks.length} {feedbacks.length === 1 ? 'feedback' : 'feedbacks'}
        </span>
      </h1>
      {errorFeedbacks && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{errorFeedbacks}</p>
            </div>
          </div>
        </div>
      )}
      {isLoadingFeedbacks && feedbacks.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          </div>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No feedback</h3>
          <p className="mt-1 text-sm text-gray-500">No customer feedback has been submitted yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="p-6 flex justify-end">
            <button
              onClick={deleteAllFeedbacks}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-colors text-sm font-medium"
            >
              <FiTrash2 className="inline mr-1" />
              Delete All Feedbacks
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            {feedbacks.map((feedback) => (
              <li key={feedback.id} className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FiMessageSquare className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-base text-gray-800">{feedback.message}</p>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(feedback.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFeedback(feedback.id)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FeedbackManagement;