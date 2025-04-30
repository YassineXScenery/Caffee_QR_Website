import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiChevronDown, FiChevronUp, FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { NotificationProvider } from '../context/NotificationContext';
import NotificationBell from './NotificationBell';

const API_URL = 'http://localhost:3000/api';

function MenuDisplay() {
  const [menu, setMenu] = useState({});
  const [categoryImages, setCategoryImages] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoryStates, setCategoryStates] = useState({});
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [callWaiterError, setCallWaiterError] = useState(null);
  const [callWaiterSuccess, setCallWaiterSuccess] = useState(null);
  const [isCallWaiterDisabled, setIsCallWaiterDisabled] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [categoriesResponse, itemsResponse] = await Promise.all([
          axios.get(`${API_URL}/menu`, { headers: { Authorization: undefined } }),
          axios.get(`${API_URL}/items`, { headers: { Authorization: undefined } }),
        ]);

        const categoryImageMap = categoriesResponse.data.reduce((acc, category) => {
          acc[category.categorie] = category.image || null;
          return acc;
        }, {});

        const groupedMenu = categoriesResponse.data.reduce((acc, category) => {
          const categoryItems = itemsResponse.data.filter(item => item.category_id === category.id);
          if (categoryItems.length > 0) {
            acc[category.categorie] = categoryItems;
          }
          return acc;
        }, {});

        setMenu(groupedMenu);
        setCategoryImages(categoryImageMap);
        const initialStates = Object.keys(groupedMenu).reduce((acc, category) => {
          acc[category] = false;
          return acc;
        }, {});
        setCategoryStates(initialStates);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError(err.response?.data?.error || 'Failed to load menu. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();

    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const toggleCategory = (category) => {
    setCategoryStates(prev => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach(key => {
        newStates[key] = key === category ? !newStates[key] : false;
      });
      return newStates;
    });
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (isSubmitting) return;
    if (!feedback.trim()) {
      setFeedbackError('Please enter your feedback');
      return;
    }

    setFeedbackError(null);
    setFeedbackSuccess(null);
    setIsSubmitting(true);

    try {
      await axios.post(`${API_URL}/feedback`, { message: feedback });
      setFeedbackSuccess('Thank you for your feedback!');
      setFeedback('');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setFeedbackError(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallWaiter = async (e) => {
    e.preventDefault();
    const parsedTableNumber = parseInt(tableNumber, 10);
    if (!parsedTableNumber || isNaN(parsedTableNumber) || parsedTableNumber < 1) {
      setCallWaiterError('Please enter a valid table number');
      return;
    }

    setCallWaiterError(null);
    setCallWaiterSuccess(null);

    try {
      await axios.post(`${API_URL}/call-waiter`, { tableNumber: parsedTableNumber });
      setCallWaiterSuccess('Waiter called successfully!');
      setShowDialog(false);
      setTableNumber('');
      setIsCallWaiterDisabled(true);
      setCooldownTime(60);
      const interval = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsCallWaiterDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimeout(() => setCallWaiterSuccess(null), 3000);
    } catch (err) {
      console.error('Error calling waiter:', err);
      setCallWaiterError(err.response?.data?.error || 'Failed to call waiter');
    }
  };

  return (
    <NotificationProvider>
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center items-center space-x-4">
              <p className="text-lg text-gray-600 max-w-2xl">
                Discover our culinary delights, carefully crafted for your enjoyment
              </p>
              {isLoggedIn && <NotificationBell />}
            </div>
            <button
              onClick={() => setShowDialog(true)}
              disabled={isCallWaiterDisabled}
              className={`mt-4 px-6 py-3 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center mx-auto ${
                isCallWaiterDisabled ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <FiBell className="h-5 w-5 mr-2" />
              {isCallWaiterDisabled ? `Call Waiter (Wait ${cooldownTime}s)` : 'Call Waiter'}
            </button>
            {callWaiterSuccess && (
              <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg max-w-md mx-auto">
                <p className="text-sm text-green-600">{callWaiterSuccess}</p>
              </div>
            )}
          </div>

          {showDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Call Waiter</h2>
                <form onSubmit={handleCallWaiter}>
                  <div className="mb-4">
                    <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-600 mb-1">
                      Table Number
                    </label>
                    <input
                      type="number"
                      id="tableNumber"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Enter your table number"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      min="1"
                    />
                    {callWaiterError && (
                      <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                        <p className="text-sm text-red-600">{callWaiterError}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDialog(false);
                        setTableNumber('');
                        setCallWaiterError(null);
                      }}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                  <div className="p-5">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="max-w-2xl mx-auto bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-8">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && Object.keys(menu).length === 0 && !error && (
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Menu Coming Soon</h3>
              <p className="text-gray-600">We're preparing something delicious for you!</p>
            </div>
          )}

          {!isLoading && Object.keys(menu).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(menu).map(([category, items]) => (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className={`w-full flex items-center p-6 text-left transition-colors duration-300 rounded-t-2xl
                      ${categoryStates[category] ? 
                        'bg-blue-700 text-white rounded-b-none' : 
                        'bg-blue-600 text-white hover:bg-blue-500 rounded-b-2xl'}`}
                  >
                    {categoryImages[category] ? (
                      <img
                        src={`http://localhost:3000${categoryImages[category]}`}
                        alt={category}
                        className="w-20 h-20 object-cover rounded-full mr-4"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2248%22%20height%3D%2248%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18945b7b5b4%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18945b7b5b4%22%3E%3Crect%20width%3D%2248%22%20height%3D%2248%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2210%22%20y%3D%2226%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-full mr-4 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Image</span>
                      </div>
                    )}
                    <div className="flex-1 flex justify-between items-center">
                      <h2 className="text-2xl font-bold">{category}</h2>
                      {categoryStates[category] ? (
                        <FiChevronUp className="h-6 w-6" />
                      ) : (
                        <FiChevronDown className="h-6 w-6" />
                      )}
                    </div>
                  </button>
                  <div
                    className="transition-all duration-500 ease-in-out overflow-hidden bg-white rounded-b-2xl shadow-lg"
                    style={{
                      maxHeight: categoryStates[category] ? '1000px' : '0px',
                    }}
                  >
                    <div className="p-6 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden"
                          >
                            <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                              {item.image ? (
                                <img
                                  src={`http://localhost:3000${item.image}`}
                                  alt={item.name}
                                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18945b7b5b4%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18945b7b5b4%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.5%22%20y%3D%22107.1%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-t-lg">
                                  <span className="text-gray-400 font-medium">No Image</span>
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="text-lg font-medium text-gray-900 mb-1">{item.name.toLowerCase()}</h3>
                              <div className="flex items-center text-gray-700">
                                <span className="font-medium">{item.price.toFixed(2)}</span>
                                <span className="mr-1 text-gray-500 font-medium">DT</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">We Value Your Feedback</h2>
            <form onSubmit={handleFeedbackSubmit}>
              <div className="mb-4">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts or suggestions..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  rows="4"
                  maxLength="500"
                  disabled={isSubmitting}
                />
              </div>
              {feedbackError && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                  <p className="text-sm text-red-700">{feedbackError}</p>
                </div>
              )}
              {feedbackSuccess && (
                <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                  <p className="text-sm text-green-600">{feedbackSuccess}</p>
                </div>
              )}
              <button
                type="submit"
                className={`px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                  isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}

export default MenuDisplay;