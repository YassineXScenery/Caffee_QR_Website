import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { FiBell, FiTrash2 } from 'react-icons/fi';

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

// Initialize socket outside the component to ensure a single instance
const socket = io(SOCKET_URL, {
  reconnectionAttempts: 5,
});

function CallWaiterManagement() {
  const [callWaiterRequests, setCallWaiterRequests] = useState([]);
  const [validTableNumbers, setValidTableNumbers] = useState([]);
  const [isLoadingCallWaiter, setIsLoadingCallWaiter] = useState(false);
  const [errorCallWaiter, setErrorCallWaiter] = useState(null);

  useEffect(() => {
    const loadCallWaiterRequests = async () => {
      setIsLoadingCallWaiter(true);
      setErrorCallWaiter(null);
      try {
        // Fetch valid table numbers
        let tableNumbers = [];
        try {
          const tablesResponse = await axios.get(`${API_URL}/tables`);
          tableNumbers = tablesResponse.data.map(table => table.table_number);
        } catch (error) {
          console.error('Error fetching table numbers:', error);
          setErrorCallWaiter(error.response?.data?.error || 'Failed to fetch table numbers');
          tableNumbers = [];
        }
        setValidTableNumbers(tableNumbers);

        // Fetch call waiter requests
        const response = await axios.get(`${API_URL}/call-waiter`);
        setCallWaiterRequests(response.data);
      } catch (error) {
        console.error('Error loading call waiter requests:', error);
        setErrorCallWaiter(error.response?.data?.error || 'Failed to load call waiter requests');
      } finally {
        setIsLoadingCallWaiter(false);
      }
    };

    loadCallWaiterRequests();

    // Set up socket event listeners
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    socket.on('callWaiter', (request) => {
      if (validTableNumbers.includes(request.tableNumber)) {
        setCallWaiterRequests((prev) => [...prev, request]);
        const audio = new Audio('/notification.mp3');
        audio.play().catch((error) => console.error('Error playing notification sound:', error));
        alert(`Table ${request.tableNumber} has called for a waiter!`);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setErrorCallWaiter('Failed to connect to real-time updates');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    // Cleanup: Remove event listeners but keep the socket connection alive
    return () => {
      socket.off('connect');
      socket.off('callWaiter');
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, []); // Remove validTableNumbers from dependencies to prevent loop

  const handleClearRequest = async (requestId) => {
    try {
      await axios.delete(`${API_URL}/call-waiter/${requestId}`);
      setCallWaiterRequests((prev) => prev.filter((request) => request.id !== requestId));
    } catch (error) {
      console.error('Error clearing call waiter request:', error);
      setErrorCallWaiter(error.response?.data?.error || 'Failed to clear call waiter request');
    }
  };

  const handleRemoveAllRequests = async () => {
    try {
      await axios.delete(`${API_URL}/call-waiter`);
      setCallWaiterRequests([]);
    } catch (error) {
      console.error('Error removing all call waiter requests:', error);
      setErrorCallWaiter(error.response?.data?.error || 'Failed to remove all call waiter requests');
    }
  };

  const filteredRequests = callWaiterRequests.filter(request =>
    validTableNumbers.includes(request.tableNumber)
  );

  return (
    <div id="call-waiter-section" className="mb-16">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
        Call Waiter Requests
        <span className="ml-3 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
        </span>
      </h1>
      {errorCallWaiter && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex">
            <div class="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{errorCallWaiter}</p>
            </div>
          </div>
        </div>
      )}
      {isLoadingCallWaiter && callWaiterRequests.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No call waiter requests</h3>
          <p className="mt-1 text-sm text-gray-500">No tables have called for service yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="flex justify-end p-4">
            <button
              onClick={handleRemoveAllRequests}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Remove All Requests
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            {filteredRequests
              .slice()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((request) => (
                <li key={request.id} className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FiBell className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-800">Table {request.tableNumber}</p>
                        <p className="text-sm text-gray-500">
                          Called at: {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleClearRequest(request.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Clear request"
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

export default CallWaiterManagement;