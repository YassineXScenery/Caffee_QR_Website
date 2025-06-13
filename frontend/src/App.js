import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';
import Login from './components/Login';
import MenuDisplay from './components/MenuDisplay';
import StockPage from './components/StockPage';
import ExpensePage from './components/ExpensePage';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SelectionHub from './components/SelectionHub';
import ItemManagement from './components/ItemManagement';
import CategoryManagement from './components/CategoryManagement';
import TableManagement from './components/TableManagement';
import CallWaiterManagement from './components/CallWaiterManagement';
import FeedbackManagement from './components/FeedbackManagement';
import AdminManagement from './components/AdminManagement';
import SettingsPanel from './components/SettingsPanel';
import NotificationsManagement from './components/NotificationsManagement';
import KitchenPage from './components/KitchenPage';
import ReportGenerator from './components/ReportGenerator';

const API_URL = 'http://localhost:3000/api';
const BASE_URL = API_URL.replace('/api', '') + '/';

function MainApp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ username: '', photo: null, role: null });
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      if (!token) {
        setIsLoadingUser(false);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/admins/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const admin = response.data;
        setUserData({
          username: admin.username,
          photo: admin.photo ? `${BASE_URL}${admin.photo}` : null,
          role: role || admin.role,
        });
      } catch (error) {
        console.error('Error fetching user data:', error.response?.status, error.response?.data);
        if (error.response?.status === 401) {
          setAuthError('Session expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          navigate('/login');
        }
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) {
      return <Navigate to="/login" />;
    }
    if (isLoadingUser) {
      return <div className="p-4 text-center text-gray-600">{t('loading')}</div>;
    }
    if (authError) {
      return <Navigate to="/login" />;
    }
    if (allowedRoles && !allowedRoles.includes(role)) {
      return <Navigate to="/admin" />;
    }
    return children;
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <Routes>
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['Owner', 'Manager', 'Waiter']}><SelectionHub navigate={navigate} userData={userData} /></ProtectedRoute>} />
        <Route path="/kitchen/items" element={<ProtectedRoute allowedRoles={['Owner']}><ItemManagement /></ProtectedRoute>} />
        <Route path="/kitchen/categories" element={<ProtectedRoute allowedRoles={['Owner']}><CategoryManagement /></ProtectedRoute>} />
        <Route path="/kitchen/tables" element={<ProtectedRoute allowedRoles={['Owner']}><TableManagement /></ProtectedRoute>} />
        <Route path="/kitchen/call-waiter" element={<ProtectedRoute allowedRoles={['Owner']}><CallWaiterManagement /></ProtectedRoute>} />
        <Route path="/kitchen" element={<ProtectedRoute allowedRoles={['Owner']}><KitchenPage navigate={navigate} /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['Owner', 'Manager']}><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="/admin/stock" element={<ProtectedRoute allowedRoles={['Owner']}><StockPage /></ProtectedRoute>} />
        <Route path="/admin/expenses" element={<ProtectedRoute allowedRoles={['Owner']}><ExpensePage /></ProtectedRoute>} />
        <Route path="/admin/report" element={<ProtectedRoute allowedRoles={['Owner']}><ReportGenerator /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute allowedRoles={['Owner', 'Waiter']}><FeedbackManagement /></ProtectedRoute>} />
        <Route path="/notifications-management" element={<ProtectedRoute allowedRoles={['Owner', 'Waiter']}><NotificationsManagement /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute allowedRoles={['Owner']}><AdminManagement /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['Owner']}><SettingsPanel /></ProtectedRoute>} />
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
        <Route path="/login" element={<Login />} />
        <Route path="/manage" element={<Navigate to="/admin" replace />} />
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