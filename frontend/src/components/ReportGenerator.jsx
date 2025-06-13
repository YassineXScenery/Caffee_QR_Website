import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './react-datepicker-custom.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ReportGenerator() {
  const [period, setPeriod] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [email, setEmail] = useState('');
  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch admins for dropdown
    const fetchAdmins = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/admins', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdmins(response.data);
      } catch (err) {
        setAdmins([]);
      }
    };
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (selectedAdminId) {
      const admin = admins.find(a => String(a.id) === String(selectedAdminId));
      setEmail(admin?.email || '');
    } else {
      setEmail('');
    }
  }, [selectedAdminId, admins]);

  const formatDateForAPI = (date, period) => {
    if (period === 'daily') {
      return date.toISOString().split('T')[0];
    } else if (period === 'monthly') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === 'yearly') {
      return date.getFullYear().toString();
    }
  };

  const handleSendReport = async () => {
    if (!period || !selectedDate || !email) {
      setMessage({ text: 'Please fill all fields', type: 'error' });
      return;
    }
    const dateForAPI = formatDateForAPI(selectedDate, period);
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('http://localhost:3000/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, date: dateForAPI, email }),
      });
      const data = await response.json();
      setMessage({ text: data.message || 'Report sent successfully!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Error sending report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const goToReportReceivers = () => {
    navigate('/settings', { state: { openSection: 'report-receivers' } });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Generate & Send Report</h2>

        {/* Manual send controls */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Report Period</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {period === 'daily' ? 'Select Date' :
              period === 'monthly' ? 'Select Month' : 'Select Year'}
          </label>
          <DatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            dateFormat={
              period === 'daily' ? 'dd MMMM yyyy' :
                period === 'monthly' ? 'MMMM yyyy' :
                  'yyyy'
            }
            showMonthYearPicker={period === 'monthly'}
            showYearPicker={period === 'yearly'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            wrapperClassName="w-full"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Admin</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all mb-2"
            value={selectedAdminId}
            onChange={e => setSelectedAdminId(e.target.value)}
          >
            <option value="">Select an admin</option>
            {admins.map(admin => (
              <option key={admin.id} value={admin.id}>
                {admin.username} {admin.email ? `(${admin.email})` : ''}
              </option>
            ))}
          </select>
          <input
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="recipient@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={!!selectedAdminId}
          />
        </div>

        <button
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center space-x-2
            ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          onClick={handleSendReport}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : 'Send Report'}
        </button>

        <button
          type="button"
          onClick={goToReportReceivers}
          className="w-full mt-4 py-3 px-4 rounded-lg font-medium text-blue-700 border border-blue-600 bg-blue-50 hover:bg-blue-100 transition-all flex items-center justify-center space-x-2"
        >
          Go to Report Receivers Settings
        </button>

        {message.text && (
          <div className={`mt-4 p-3 rounded-lg text-sm text-center ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportGenerator;
