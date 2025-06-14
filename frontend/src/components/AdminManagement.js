import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  FiUser, 
  FiEdit2, 
  FiTrash2, 
  FiX, 
  FiCheck, 
  FiPlus, 
  FiAward,  // Changed from FiCrown
  FiSettings, 
  FiUsers,
  FiMail,
  FiPhone,
  FiCamera,
  FiUpload,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:3000/api';
const BASE_URL = API_URL.replace('/api', '') + '/';

const ROLE_CONFIG = {
  Owner: {
    icon: FiAward,  // Changed from FiCrown
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    accentColor: 'bg-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800',
    gradient: 'from-purple-500 to-purple-600'
  },
  Manager: {
    icon: FiSettings,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    accentColor: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800',
    gradient: 'from-blue-500 to-blue-600'
  },
  Waiter: {
    icon: FiUsers,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    accentColor: 'bg-green-500',
    badgeColor: 'bg-green-100 text-green-800',
    gradient: 'from-green-500 to-green-600'
  }
};

function AdminManagement({ mainContentRef }) {
  const { t } = useTranslation();
  const [admins, setAdmins] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('Waiter');
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [errorAdmins, setErrorAdmins] = useState(null);
  const [successAdmins, setSuccessAdmins] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState({ Owner: true, Manager: true, Waiter: true });
  const fileInputRef = useRef();

  // Group admins by role
  const groupedAdmins = admins.reduce((groups, admin) => {
    const role = admin.role || 'Waiter';
    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role].push(admin);
    return groups;
  }, {});

  // Get role statistics
  const getRoleStats = () => {
    const stats = {};
    Object.keys(ROLE_CONFIG).forEach(role => {
      stats[role] = groupedAdmins[role]?.length || 0;
    });
    return stats;
  };

  const toggleRoleExpansion = (roleName) => {
    setExpandedRoles(prev => ({
      ...prev,
      [roleName]: !prev[roleName]
    }));
  };

  const loadAdmins = useCallback(async () => {
    setIsLoadingAdmins(true);
    setErrorAdmins(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const response = await axios.get(`${API_URL}/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(response.data);
    } catch (error) {
      console.error('Error loading admins:', error);
      setErrorAdmins(error.response?.data?.error || t('errorLoadingAdmins'));
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setIsLoadingAdmins(false);
    }
  }, [t]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorAdmins(null);
    setIsUploadingPhoto(true);
    
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/admins/upload-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setPhoto(response.data.filename);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setErrorAdmins(error.response?.data?.error || t('failedToUploadPhoto'));
      setPhoto(null);
      setPhotoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorAdmins(t('enterUsername'));
      return;
    }
    if (!editingAdmin && (!password.trim() || password.length < 6)) {
      setErrorAdmins(t('passwordMinLength'));
      return;
    }
    setIsLoadingAdmins(true);
    setErrorAdmins(null);
    try {
      const token = localStorage.getItem('token');
      const payload = { username, email, phone_number: phoneNumber, role };

      if (!editingAdmin) {
        payload.password = password;
      }

      payload.photo = photo;

      if (editingAdmin) {
        await axios.put(`${API_URL}/admins/${editingAdmin.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessAdmins(t('adminUpdated'));
      } else {
        await axios.post(`${API_URL}/admins`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessAdmins(t('adminAdded'));
      }

      setUsername('');
      setPassword('');
      setEmail('');
      setPhoneNumber('');
      setRole('Waiter');
      setPhoto(null);
      setPhotoPreview(null);
      setEditingAdmin(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadAdmins();
    } catch (error) {
      console.error('Error saving admin:', error);
      setErrorAdmins(error.response?.data?.error || t('error'));
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setIsLoadingAdmins(false);
      setTimeout(() => setSuccessAdmins(null), 3000);
    }
  };

  const deleteAdmin = async (id) => {
    if (!window.confirm(t('confirmDeleteAdmin'))) {
      return;
    }

    setIsLoadingAdmins(true);
    setErrorAdmins(null);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessAdmins(t('adminDeleted'));
      loadAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      setErrorAdmins(error.response?.data?.error || t('error'));
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setIsLoadingAdmins(false);
      setTimeout(() => setSuccessAdmins(null), 3000);
    }
  };

  const startEditingAdmin = (admin) => {
    setEditingAdmin(admin);
    setUsername(admin.username);
    setPassword('');
    setEmail(admin.email || '');
    setPhoneNumber(admin.phone_number || '');
    setRole(admin.role || 'Waiter');
    setPhoto(admin.photo || null);
    setPhotoPreview(admin.photo ? `${BASE_URL}${admin.photo}` : null);

    setTimeout(() => {
      const formSection = document.getElementById('admins-section');
      const container = mainContentRef?.current;

      if (formSection && container) {
        const headerOffset = 20;
        const mainContentTop = container.getBoundingClientRect().top;
        const elementTop = formSection.getBoundingClientRect().top;
        const scrollPosition = elementTop - mainContentTop + container.scrollTop - headerOffset;

        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
      }
    }, 200);
  };

  const cancelEditingAdmin = () => {
    setEditingAdmin(null);
    setUsername('');
    setPassword('');
    setEmail('');
    setPhoneNumber('');
    setRole('Waiter');
    setPhoto(null);
    setPhotoPreview(null);
    setErrorAdmins(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleImageError = (event) => {
    event.target.src = '';
  };

  const renderAdminCard = (admin, index) => {
    const roleConfig = ROLE_CONFIG[admin.role] || ROLE_CONFIG.Waiter;
    
    return (
      <div 
        key={admin.id}
        className={`transform transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl ${roleConfig.bgColor} rounded-xl border-2 ${roleConfig.borderColor} p-6 group relative overflow-hidden`}
        style={{
          animationDelay: `${index * 100}ms`,
          animation: `slideInUp 0.5s ease-out forwards`
        }}
      >
        {/* Accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${roleConfig.gradient}`}></div>
        
        {/* Admin Photo */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div className={`w-16 h-16 rounded-full border-3 border-white shadow-lg overflow-hidden ${roleConfig.accentColor} flex items-center justify-center group-hover:ring-4 group-hover:ring-opacity-30 transition-all duration-300`}>
              {admin.photo ? (
                <img 
                  src={`${BASE_URL}${admin.photo}`} 
                  alt={admin.username}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="w-8 h-8 text-white" />
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                startEditingAdmin(admin);
              }}
              className="p-2 bg-white text-blue-600 hover:bg-blue-50 rounded-full shadow-md transition-all duration-200 hover:scale-110"
              title={t('edit')}
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteAdmin(admin.id)}
              className="p-2 bg-white text-red-600 hover:bg-red-50 rounded-full shadow-md transition-all duration-200 hover:scale-110"
              title={t('delete')}
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin Info */}
        <div className="space-y-3">
          <div>
            <h3 className="font-bold text-lg text-gray-800 mb-1">{admin.username}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig.badgeColor}`}>
              {admin.role}
            </span>
          </div>
          
          {admin.email && (
            <div className="flex items-center text-sm text-gray-600">
              <FiMail className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate">{admin.email}</span>
            </div>
          )}
          
          {admin.phone_number && (
            <div className="flex items-center text-sm text-gray-600">
              <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
              <span>{admin.phone_number}</span>
            </div>
          )}
          
          {/* Created date */}
          <div className="flex items-center text-xs text-gray-500 mt-4">
            <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
            {t('memberSince')} • {new Date(admin.created_at || Date.now()).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  };

  const renderRoleSection = (roleName) => {
    const roleConfig = ROLE_CONFIG[roleName];
    const roleAdmins = groupedAdmins[roleName] || [];
    const IconComponent = roleConfig.icon;
    const isExpanded = expandedRoles[roleName];

    return (
      <div key={roleName} className="mb-8">
        <div 
          className={`${roleConfig.bgColor} rounded-xl border-2 ${roleConfig.borderColor} overflow-hidden transition-all duration-300 hover:shadow-lg`}
        >
          {/* Role Header */}
          <div 
            className={`bg-gradient-to-r ${roleConfig.gradient} p-4 cursor-pointer select-none`}
            onClick={() => toggleRoleExpansion(roleName)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {t(roleName.toLowerCase())}s
                  </h2>
                  <p className="text-white text-opacity-80 text-sm">
                    {roleAdmins.length} {roleAdmins.length === 1 ? t('member') : t('members')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {roleAdmins.length}
                </span>
                {isExpanded ? (
                  <FiChevronUp className="w-5 h-5 text-white transition-transform duration-300" />
                ) : (
                  <FiChevronDown className="w-5 h-5 text-white transition-transform duration-300" />
                )}
              </div>
            </div>
          </div>
          
          {/* Role Content */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="p-6">
              {roleAdmins.length === 0 ? (
                <div className="text-center py-8">
                  <IconComponent className={`w-12 h-12 mx-auto ${roleConfig.textColor} opacity-50 mb-3`} />
                  <p className={`${roleConfig.textColor} font-medium`}>
                    {t('noAdminsInRole', { role: roleName })}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {t('addFirstAdminInRole', { role: roleName })}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roleAdmins.map((admin, index) => renderAdminCard(admin, index))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const stats = getRoleStats();

  return (
    <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      <button
        className="fixed top-6 left-6 z-50 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xl font-bold py-3 px-8 rounded-full shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 transform hover:scale-105"
        onClick={() => window.history.back()}
      >
        ← Back
      </button>

      <div id="admins-section" className="mb-16">
        {/* Header with Statistics */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {t('adminAccounts')}
          </h1>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl p-4 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-200 text-sm">{t('totalAdmins')}</p>
                  <p className="text-2xl font-bold">{admins.length}</p>
                </div>
                <FiUsers className="w-8 h-8 text-gray-300" />
              </div>
            </div>
            
            {Object.entries(ROLE_CONFIG).map(([roleName, config]) => (
              <div key={roleName} className={`bg-gradient-to-r ${config.gradient} rounded-xl p-4 text-white shadow-md`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-opacity-90 text-sm">{t(roleName.toLowerCase())}s</p>
                    <p className="text-2xl font-bold">{stats[roleName]}</p>
                  </div>
                  <config.icon className="w-8 h-8 text-white text-opacity-90" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add/Edit Admin Form */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8 border border-gray-200 animate-fadeIn">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center" id="admin-form">
              {editingAdmin ? (
                <>
                  <FiEdit2 className="mr-3 text-blue-600" />
                  {t('editAdmin')}
                </>
              ) : (
                <>
                  <FiPlus className="mr-3 text-green-600" />
                  {t('addNewAdmin')}
                </>
              )}
            </h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmitAdmin}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('username')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('enterUsername')}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
                      required
                    />
                  </div>
                </div>
                
                {!editingAdmin && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('enterPassword')}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
                        required={!editingAdmin}
                        minLength="6"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t('enterEmail')}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('phoneNumber')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder={t('enterPhoneNumber')}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('role')}
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
                    required
                  >
                    <option value="Owner">{t('owner')}</option>
                    <option value="Manager">{t('manager')}</option>
                    <option value="Waiter">{t('waiter')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiCamera className="inline mr-2" />
                    {t('photo')}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className={`w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {isUploadingPhoto ? (
                        <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <FiUpload className="w-5 h-5 text-gray-500 mr-2" />
                      )}
                      {t('uploadPhoto')}
                    </button>
                  </div>
                  {(photoPreview || photo) && (
                    <div className="mt-3 flex items-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                        <img 
                          src={photoPreview || `${BASE_URL}${photo}`} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      </div>
                      <span className="ml-3 text-sm text-gray-600 truncate">
                        {photo?.split('/').pop() || t('newPhoto')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoadingAdmins}
                  className={`flex items-center justify-center px-6 py-3 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    editingAdmin 
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 text-white' 
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-300 text-white'
                  } ${isLoadingAdmins ? 'opacity-50' : ''}`}
                >
                  {isLoadingAdmins ? (
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : editingAdmin ? (
                    <FiCheck className="mr-2" />
                  ) : (
                    <FiPlus className="mr-2" />
                  )}
                  {isLoadingAdmins ? t('loading') : editingAdmin ? t('update') : t('add')}
                </button>
                
                {editingAdmin && (
                  <button
                    type="button"
                    onClick={cancelEditingAdmin}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors"
                  >
                    <FiX className="inline mr-2" />
                    {t('cancel')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Error/Success Messages */}
        {errorAdmins && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600">{errorAdmins}</p>
              </div>
            </div>
          </div>
        )}

        {successAdmins && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-600">{successAdmins}</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin List by Roles */}
        <div className="space-y-6">
          {Object.keys(ROLE_CONFIG).map(roleName => renderRoleSection(roleName))}
        </div>
      </div>
    </div>
  );
}

export default AdminManagement;