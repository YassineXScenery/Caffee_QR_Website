import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { FiUser, FiEdit2, FiTrash2, FiX, FiCheck, FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:3000/api';

function AdminManagement({ mainContentRef }) {
  const { t } = useTranslation();
  const [admins, setAdmins] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [errorAdmins, setErrorAdmins] = useState(null);
  const [successAdmins, setSuccessAdmins] = useState(null);
  const [photo, setPhoto] = useState(null); // Initialize as null
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef();

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
      console.log('Received admins data:', response.data);
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

      console.log('Photo upload response:', response.data);
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
      const payload = { username };

      if (!editingAdmin) {
        payload.password = password;
      }

      // Always include photo in payload (null if no photo)
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

      // Reset form and states
      setUsername('');
      setPassword('');
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
    setPhoto(admin.photo || null);
    setPhotoPreview(admin.photo ? `${API_URL.replace('/api', '')}${admin.photo}` : null);
    console.log('Starting to edit admin:', admin);

    setTimeout(() => {
      const formSection = document.getElementById('admins-section');
      const container = mainContentRef?.current;

      if (formSection && container) {
        const headerOffset = 20;
        const mainContentTop = container.getBoundingClientRect().top;
        const elementTop = formSection.getBoundingClientRect().top;
        const scrollPosition = elementTop - mainContentTop + container.scrollTop - headerOffset;

        console.log('Scrolling to admins-section within container:', {
          scrollPosition,
          headerOffset,
          formSection,
          container,
        });

        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
      } else {
        console.error('admins-section element or container not found');
      }
    }, 200);
  };

  const cancelEditingAdmin = () => {
    setEditingAdmin(null);
    setUsername('');
    setPassword('');
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
    event.target.src = ''; // Remove fallback logic
  };

  return (
    <div id="admins-section" className="mb-16 px-4 sm:px-0">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
        {t('adminAccounts')}
        <span className="ml-3 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          {t('adminsCount', { count: admins.length })}
        </span>
      </h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8 border border-gray-100">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4" id="admin-form">
            {editingAdmin ? t('editAdmin') : t('addNewAdmin')}
          </h2>
          <form onSubmit={handleSubmitAdmin}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-1">
                  {t('username')}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('enterUsername')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              {!editingAdmin && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                    {t('password')}
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('enterPassword')}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t('photo')}</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    disabled={isUploadingPhoto}
                    className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                      <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        < circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="mt-2 h-20 w-20 object-cover rounded-full border"
                  />
                )}
                {photo && !photoPreview && (
                  <img
                    src={`${API_URL.replace('/api', '')}${photo}`}
                    alt="Admin"
                    className="mt-2 h-20 w-20 object-cover rounded-full border"
                    onError={handleImageError}
                  />
                )}
                {photo && (
                  <div className="text-xs text-gray-500 mt-1">{photo}</div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoadingAdmins}
                className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {isLoadingAdmins ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : editingAdmin ? (
                  <FiCheck className="mr-1" />
                ) : (
                  <FiPlus className="mr-1" />
                )}
                {isLoadingAdmins ? t('loading') : editingAdmin ? t('update') : t('add')}
              </button>
              {editingAdmin && (
                <button
                  type="button"
                  onClick={cancelEditingAdmin}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors text-sm font-medium"
                >
                  <FiX className="inline mr-1" />
                  {t('cancel')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {errorAdmins && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
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
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
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

      {isLoadingAdmins && admins.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">{t('noAdmins')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('addFirstAdmin')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map((admin) => (
            <div key={admin.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {admin.photo ? (
                      <img 
                        src={`${API_URL.replace('/api', '')}${admin.photo}`} 
                        alt={admin.username}
                        onError={handleImageError}
                        className="h-12 w-12 object-cover"
                      />
                    ) : (
                      <FiUser className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{admin.username}</h3>
                    <p className="text-xs text-gray-500">{t('adminAccount')}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      startEditingAdmin(admin);
                      const formSection = document.getElementById('admin-form');
                      if (formSection) {
                        const headerOffset = 120;
                        const elementPosition = formSection.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({
                          top: offsetPosition,
                          behavior: 'smooth',
                        });
                      }
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title={t('edit')}
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteAdmin(admin.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title={t('delete')}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminManagement;