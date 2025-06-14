import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000';

function TableManagement() {
  const { t } = useTranslation();
  const [tables, setTables] = useState([]);
  const [numTables, setNumTables] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedQR, setSelectedQR] = useState(null);

  const loadTables = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tables`);
      setTables(response.data);
    } catch (err) {
      setError(err.response?.data?.error || t('failedToLoadTables'));
    } finally {
      setIsLoading(false);
    }
  };

  const createTables = async (e) => {
    e.preventDefault();
    const number = parseInt(numTables);
    if (!number || number < 1 || number > 100) {
      setError(t('enterValidTableNumber'));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.post(
        `${API_URL}/tables`,
        { numberOfTables: number },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(t('tablesCreatedSuccess', { count: number }));
      setNumTables('');
      await loadTables();
    } catch (err) {
      setError(err.response?.data?.error || t('failedToCreateTables'));
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const generateQRCodesForExisting = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.post(
        `${API_URL}/tables/generate-qr-codes`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(response.data.message);
      await loadTables();
    } catch (err) {
      setError(err.response?.data?.error || t('failedToGenerateQRCodes'));
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const deleteTable = async (tableNumber) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`${API_URL}/tables/${tableNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTables((prev) => prev.filter((t) => t.table_number !== tableNumber));
    } catch (err) {
      setError(err.response?.data?.error || t('failedToDeleteTable'));
    }
  };

  const deleteAllTables = async () => {
    if (!window.confirm(t('confirmDeleteAllTables'))) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`${API_URL}/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTables([]);
      setSuccess(t('allTablesDeleted'));
    } catch (err) {
      setError(err.response?.data?.error || t('failedToDeleteTables'));
    }
  };

  const showQRCode = (qrPath) => {
    setSelectedQR(qrPath);
  };

  const closeQRModal = () => {
    setSelectedQR(null);
  };

  const downloadQRCode = () => {
    if (!selectedQR) {
      setError(t('noQRCodeSelected'));
      return;
    }
    const link = document.createElement('a');
    link.href = selectedQR;
    link.download = `qr_code_${selectedQR.split('/').pop()}`;
    link.onerror = () => setError(t('failedToDownloadQRCode'));
    link.click();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login'; // Adjust to your login route
    } else {
      loadTables();
    }
  }, []);

  return (
    <div id="tables-section" className="mb-16 px-4 sm:px-0">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{t('tableManagement')}</h1>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8 border border-gray-100">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">{t('createTables')}</h2>
          <form onSubmit={createTables} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-auto">
              <label htmlFor="numTables" className="block text-sm font-medium text-gray-600 mb-1">
                {t('numberOfTables')}
              </label>
              <input
                type="number"
                id="numTables"
                value={numTables}
                onChange={(e) => setNumTables(e.target.value)}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? t('creating') : t('createTables')}
            </button>
          </form>
          <button
            onClick={generateQRCodesForExisting}
            disabled={isLoading}
            className="mt-4 w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {isLoading ? t('generating') : t('generateQRCodesForExisting')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">
          {t('currentTables', { count: tables.length })}
        </h2>
        {tables.length > 0 && (
          <button
            onClick={deleteAllTables}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            {t('deleteAll')}
          </button>
        )}
      </div>

      {isLoading && tables.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">{t('noTablesCreated')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('createTablesPrompt')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="font-medium text-gray-700">#{table.table_number}</span>
                  </div>
                  <span className="text-gray-800">{t('table')} {table.table_number}</span>
                </div>
                <div className="flex items-center">
                  {table.qr_code_path ? (
                    <img
                      src={`${BASE_URL}${table.qr_code_path}`}
                      alt={`QR code for table ${table.table_number}`}
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => showQRCode(`${BASE_URL}${table.qr_code_path}`)}
                      onError={() => console.log(`Failed to load QR for table ${table.table_number}: ${BASE_URL}${table.qr_code_path}`)}
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">{t('noQRCode')}</span>
                  )}
                  <button
                    onClick={() => deleteTable(table.table_number)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors ml-2"
                    title={t('deleteTable')}
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeQRModal}>
          <div className="bg-white p-6 rounded-lg" onClick={(e) => e.stopPropagation()}>
            <img src={selectedQR} alt="Large QR code" className="w-64 h-64 mb-4" />
            <div className="flex justify-between">
              <button
                onClick={downloadQRCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('download')}
              </button>
              <button
                onClick={closeQRModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableManagement;