import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTrash2, FiEdit } from 'react-icons/fi';

const API_URL = 'http://localhost:3000/api';

function TableManagement() {
  const [tables, setTables] = useState([]);
  const [numberOfTables, setNumberOfTables] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchTables = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/tables`);
        setTables(response.data);
      } catch (error) {
        console.error('Error fetching tables:', error);
        setError(error.response?.data?.error || 'Failed to load tables');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTables();
  }, []);

  const handleCreateTables = async (e) => {
    e.preventDefault();
    if (!numberOfTables || isNaN(numberOfTables) || numberOfTables < 1 || numberOfTables > 100) {
      setError('Please enter a valid number of tables (1-100)');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/tables`, { numberOfTables: parseInt(numberOfTables) });
      setSuccess(response.data.message);
      setNumberOfTables('');
      // Refresh the table list
      const tablesResponse = await axios.get(`${API_URL}/tables`);
      setTables(tablesResponse.data);
    } catch (error) {
      console.error('Error creating tables:', error);
      setError(error.response?.data?.error || 'Failed to create tables');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTable = async (tableNumber) => {
    try {
      await axios.delete(`${API_URL}/tables/${tableNumber}`);
      setTables((prev) => prev.filter((table) => table.table_number !== tableNumber));
    } catch (error) {
      console.error('Error deleting table:', error);
      setError(error.response?.data?.error || 'Failed to delete table');
    }
  };

  const handleRemoveAllTables = async () => {
    try {
      await axios.delete(`${API_URL}/tables`);
      setTables([]);
      setSuccess('All tables removed successfully');
    } catch (error) {
      console.error('Error removing all tables:', error);
      setError(error.response?.data?.error || 'Failed to remove all tables');
    }
  };

  return (
    <div id="tables-section" className="mb-16">
      {/* Create Table Form */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Tables</h1>
        <div className="flex gap-4 max-w-md items-end">
          <div className="flex-1">
            <label htmlFor="numberOfTables" className="block text-sm font-medium text-gray-600 mb-1">
              # Enter number of tables (1-100)
            </label>
            <input
              type="number"
              id="numberOfTables"
              value={numberOfTables}
              onChange={(e) => setNumberOfTables(e.target.value)}
              placeholder="Enter number of tables"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              min="1"
              max="100"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            onClick={handleCreateTables}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Table'}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg max-w-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg max-w-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
      </div>

      {/* Table List */}
      {isLoading && tables.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          </div>
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No tables</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your tables.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="flex justify-end p-4">
            <button
              onClick={handleRemoveAllTables}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Remove All Tables
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            {tables.map((table) => (
              <li key={table.id} className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 font-medium">#{table.table_number}</span>
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-800">Table ID: {table.table_number}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit table"
                    >
                      <FiEdit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.table_number)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete table"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TableManagement;