import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { FiEye, FiHome, FiUser } from 'react-icons/fi';
import Login from './components/Login';
import MenuDisplay from './components/MenuDisplay';
import Admins from './components/Admins';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'http://localhost:3000/api';
const BASE_URL = API_URL.replace('/api', '') + '/';

function MainApp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ username: '', photo: null });
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Fetch logged-in admin data
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Validate and decode JWT token
        let decoded;
        try {
          decoded = jwtDecode(token);
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        const userId = decoded.id || decoded.sub;
        const username = decoded.username || 'Admin';

        // Fetch admins to get photo
        const response = await axios.get(`${API_URL}/admins`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Admins response:', response.data); // Debug log
        const admins = response.data;
        const currentAdmin = admins.find(
          (admin) => admin.id === userId || admin.username === username
        );

        if (!currentAdmin) {
          throw new Error('Admin not found');
        }

        setUserData({
          username: username,
          photo: currentAdmin?.photo ? `${BASE_URL}${currentAdmin.photo}` : null,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleImageError = (event) => {
    event.target.src = ''; // Match AdminManagement.js error handling
  };

  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return <Navigate to="/login" />;
    }
    if (isLoadingUser) {
      return <div className="p-4 text-center text-gray-600">{t('loading')}</div>;
    }
    return children;
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <Routes>
        {/* Public Menu Route */}
        <Route
          path="/"
          element={
            <div className="relative">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800">{t('cafeMenuTitle')}</h1>
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-110 shadow-sm flex items-center justify-center"
                >
                  <FiHome className="h-6 w-6" />
                </Link>
              </div>
              <MenuDisplay />
            </div>
          }
        />

        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Management Route */}
        <Route
          path="/manage"
          element={
            <ProtectedRoute>
              <div className="space-y-8">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-3xl font-bold text-gray-800">{t('manageCafeMenuTitle')}</h1>
                  <div className="flex items-center space-x-4">
                    {/* User Account Display */}
                    <div className="flex items-center space-x-3">
                      {isLoadingUser ? (
                        <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                          {userData.photo ? (
                            <img
                              src={userData.photo}
                              alt={userData.username}
                              className="h-12 w-12 object-cover"
                              onError={handleImageError}
                            />
                          ) : (
                            <FiUser className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {isLoadingUser ? 'Loading...' : userData.username}
                      </span>
                    </div>
                    {/* View Public Menu Button */}
                    <Link
                      to="/"
                      className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-sm"
                    >
                      <FiEye className="h-5 w-5" />
                      <span>{t('viewPublicMenu')}</span>
                    </Link>
                  </div>
                </div>
                <Admins />
              </div>
            </ProtectedRoute>
          }
        />

        {/* Redirect any unknown routes to the public menu */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

export default App;