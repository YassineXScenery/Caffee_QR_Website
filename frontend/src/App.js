import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { FiEye, FiHome } from 'react-icons/fi';
import Login from './components/Login';
import MenuDisplay from './components/MenuDisplay';
import Admins from './components/Admins';

function App() {
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="p-4 min-h-screen bg-gray-50">
        <Routes>
          {/* Public Menu Route */}
          <Route
            path="/"
            element={
              <div className="relative">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-3xl font-bold text-gray-800">Cafe Menu</h1>
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
                    <h1 className="text-3xl font-bold text-gray-800">Manage Cafe Menu</h1>
                    <Link
                      to="/"
                      className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-sm"
                    >
                      <FiEye className="h-5 w-5" />
                      <span>View Public Menu</span>
                    </Link>
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
    </Router>
  );
}

export default App;