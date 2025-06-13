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
import { jwtDecode } from 'jwt-decode';
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
  const [userData, setUserData] = useState({ username: '', photo: null });
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingUser(false);
        return;
      }
      try {
        let decoded;
        try {
          decoded = jwtDecode(token);
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.removeItem('token');
          setIsLoadingUser(false);
          return;
        }
        const userId = decoded.id || decoded.sub;
        const username = decoded.username || 'Admin';
        const response = await axios.get(`${API_URL}/admins`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const admins = response.data;
        const currentAdmin = admins.find(
          (admin) => admin.id === userId || admin.username === username
        );
        setUserData({
          username: username,
          photo: currentAdmin?.photo ? `${BASE_URL}${currentAdmin.photo}` : null,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUserData();
  }, []);

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
        <Route path="/admin" element={<ProtectedRoute><SelectionHub navigate={navigate} userData={userData} /></ProtectedRoute>} />
        <Route path="/kitchen/items" element={<ProtectedRoute><ItemManagement /></ProtectedRoute>} />
        <Route path="/kitchen/categories" element={<ProtectedRoute><CategoryManagement /></ProtectedRoute>} />
        <Route path="/kitchen/tables" element={<ProtectedRoute><TableManagement /></ProtectedRoute>} />
        <Route path="/kitchen/call-waiter" element={<ProtectedRoute><CallWaiterManagement /></ProtectedRoute>} />
        <Route path="/kitchen" element={<ProtectedRoute><KitchenPage navigate={navigate} /></ProtectedRoute>} />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <div className="max-w-4xl mx-auto py-8">
              <button
                className="fixed top-6 left-6 z-50 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
                onClick={() => window.history.back()}
              >
                ← Back
              </button>
              <h2 className="text-3xl font-bold mb-6 text-blue-700">Analytics & Management</h2>
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow p-6">
                  <AnalyticsDashboard />
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                  <StockPage />
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                  <ExpensePage />
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Generate & Send Report</h3>
                  <ReportGenerator />
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path="/staff" element={<ProtectedRoute><AdminManagement /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><FeedbackManagement /></ProtectedRoute>} />
        <Route path="/notifications-management" element={<ProtectedRoute><NotificationsManagement /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPanel /></ProtectedRoute>} />

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
        <Route path="/admin/stock" element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
        <Route path="/admin/expenses" element={<ProtectedRoute><ExpensePage /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="/send-report" element={<ReportGenerator />} />
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
