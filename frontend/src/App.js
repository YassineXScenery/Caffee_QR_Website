import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import MenuDisplay from './components/MenuDisplay';
import Admins from './components/Admins';

function App() {
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
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
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Manage Menu
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
                    <div className="flex space-x-3">
                      <Link
                        to="/"
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                      >
                        View Public Menu
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                      >
                        Logout
                      </button>
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
    </Router>
  );
}

export default App;