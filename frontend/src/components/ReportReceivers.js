import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const ReportReceivers = () => {
  const { t } = useTranslation();
  const [receivers, setReceivers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({
    admin_id: '',
    receive_daily: false,
    receive_monthly: false,
    receive_yearly: false
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Base URL for API
  const API_URL = 'http://localhost:3000/api';

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  // Fetch receivers
  const fetchReceivers = async () => {
    try {
      const response = await axios.get(`${API_URL}/report-receivers`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setReceivers(response.data);
      setError('');
    } catch (err) {
      console.error('Fetch receivers error:', err.response?.data || err.message);
      setError(err.response?.data?.error || err.response?.data?.details || t('failedToFetchReceivers'));
    }
  };

  // Fetch admins for dropdown
  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${API_URL}/admins`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setAdmins(response.data);
    } catch (err) {
      console.error('Fetch admins error:', err.response?.data || err.message);
      setError(t('failedToFetchAdmins'));
      // Fallback if /api/admins doesn't exist
      setAdmins([{ id: 1, username: 'testadmin', email: 'test@admin.com' }]);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchReceivers();
    fetchAdmins();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  // Add or update receiver
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const config = { headers: { Authorization: `Bearer ${getToken()}` } };
      if (editId) {
        // Update
        await axios.put(`${API_URL}/report-receivers/${editId}`, formData, config);
        setSuccess(t('receiverUpdatedSuccessfully'));
        setEditId(null);
      } else {
        // Add
        await axios.post(`${API_URL}/report-receivers`, formData, config);
        setSuccess(t('receiverAddedSuccessfully'));
      }
      setFormData({
        admin_id: '',
        receive_daily: false,
        receive_monthly: false,
        receive_yearly: false
      });
      fetchReceivers();
    } catch (err) {
      console.error('Submit error:', err.response?.data || err.message);
      setError(err.response?.data?.error || err.response?.data?.details || t('operationFailed'));
    }
  };

  // Edit receiver
  const handleEdit = (receiver) => {
    setFormData({
      admin_id: receiver.admin_id,
      receive_daily: receiver.receive_daily,
      receive_monthly: receiver.receive_monthly,
      receive_yearly: receiver.receive_yearly
    });
    setEditId(receiver.id);
    setError('');
    setSuccess('');
  };

  // Delete receiver
  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDeleteReceiver'))) return;
    try {
      await axios.delete(`${API_URL}/report-receivers/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setSuccess(t('receiverDeletedSuccessfully'));
      fetchReceivers();
    } catch (err) {
      console.error('Delete error:', err.response?.data || err.message);
      setError(err.response?.data?.error || err.response?.data?.details || t('failedToDeleteReceiver'));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">{t('manageReportReceivers')}</h3>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {success && <div className="text-green-500 mb-4">{success}</div>}

      {/* Form for adding/updating */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="font-medium">{t('admin')}:</label>
          <select
            name="admin_id"
            value={formData.admin_id}
            onChange={handleChange}
            className="p-2 border rounded-md flex-1"
            required
          >
            <option value="">{t('selectAdmin')}</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.username} ({admin.email})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="receive_daily"
              checked={formData.receive_daily}
              onChange={handleChange}
              className="h-4 w-4"
            />
            {t('receiveDailyReports')}
          </label>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="receive_monthly"
              checked={formData.receive_monthly}
              onChange={handleChange}
              className="h-4 w-4"
            />
            {t('receiveMonthlyReports')}
          </label>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="receive_yearly"
              checked={formData.receive_yearly}
              onChange={handleChange}
              className="h-4 w-4"
            />
            {t('receiveYearlyReports')}
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {editId ? t('updateReceiver') : t('addReceiver')}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setFormData({ admin_id: '', receive_daily: false, receive_monthly: false, receive_yearly: false });
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              {t('cancel')}
            </button>
          )}
        </div>
      </form>

      {/* Receivers table */}
      <table className="w-full border-collapse mt-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">{t('id')}</th>
            <th className="border p-2 text-left">{t('admin')}</th>
            <th className="border p-2 text-left">{t('daily')}</th>
            <th className="border p-2 text-left">{t('monthly')}</th>
            <th className="border p-2 text-left">{t('yearly')}</th>
            <th className="border p-2 text-left">{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {receivers.map((receiver) => (
            <tr key={receiver.id}>
              <td className="border p-2">{receiver.id}</td>
              <td className="border p-2">{receiver.username} ({receiver.email})</td>
              <td className="border p-2">{receiver.receive_daily ? t('yes') : t('no')}</td>
              <td className="border p-2">{receiver.receive_monthly ? t('yes') : t('no')}</td>
              <td className="border p-2">{receiver.receive_yearly ? t('yes') : t('no')}</td>
              <td className="border p-2">
                <button
                  onClick={() => handleEdit(receiver)}
                  className="bg-blue-600 text-white px-2 py-1 rounded mr-2 hover:bg-blue-700"
                >
                  {t('edit')}
                </button>
                <button
                  onClick={() => handleDelete(receiver.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                >
                  {t('delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportReceivers;