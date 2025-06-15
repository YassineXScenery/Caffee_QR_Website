import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode

// --- Icon Components (replaces react-icons/fi to avoid resolution errors) ---
const FiPlus = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const FiEdit = ({ size = 16, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const FiTrash2 = ({ size = 16, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const FiAlertTriangle = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

const FiLoader = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38" stroke="#4a90e2" {...props}>
        <g fill="none" fillRule="evenodd">
            <g transform="translate(1 1)" strokeWidth="2">
                <circle strokeOpacity=".5" cx="18" cy="18" r="18"/>
                <path d="M36 18c0-9.94-8.06-18-18-18">
                    <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
                </path>
            </g>
        </g>
    </svg>
);


// Define the API URL. This should ideally come from a central config file.
const API_URL = 'http://localhost:3000/api';

// Helper to get the auth token from localStorage
const getAuthToken = () => localStorage.getItem('token');

// Helper to get admin ID by decoding the JWT token
const getAdminId = () => {
    const token = getAuthToken();
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            return decodedToken.id; // Assuming the ID is stored as 'id' in the token payload
        } catch (error) {
            console.error("Error decoding token:", error);
            return null;
        }
    }
    return null;
};

// Helper function to get a user-friendly error message from Axios errors
const getErrorMessage = (err) => {
    if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.data && err.response.data.error) {
            return err.response.data.error;
        }
        if (err.response.data && err.response.data.message) {
            return err.response.data.message;
        }
        return `Server Error: ${err.response.status}`;
    } else if (err.request) {
        // The request was made but no response was received
        return 'Network Error: No response from server. Please check your connection.';
    } else {
        // Something happened in setting up the request that triggered an Error
        return `Error: ${err.message}`;
    }
};


/**
 * Main Wastage Management Component
 */
const Wastage = () => {
  // State management
  const [wastageRecords, setWastageRecords] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // State for modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // State for the record being currently edited or deleted
  const [currentRecord, setCurrentRecord] = useState(null);

  // Fetch all wastage records and items from the backend
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Use Promise.all to fetch both datasets concurrently
      const [wastageRes, itemsRes] = await Promise.all([
        axios.get(`${API_URL}/wastage`, { headers }),
        axios.get(`${API_URL}/items`, { headers }),
      ]);

      setWastageRecords(wastageRes.data);
      setItems(itemsRes.data);

    } catch (err) {
      console.error('Failed to fetch data:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // useEffect to run fetchData on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Modal Handlers ---

  const openAddModal = () => {
    setCurrentRecord(null); // Ensure no record is selected
    setIsFormModalOpen(true);
  };

  const openEditModal = (record) => {
    setCurrentRecord(record);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (record) => {
    setCurrentRecord(record);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentRecord(null); // Clear selection on close
  };

  // --- CRUD Operations ---

  const handleFormSubmit = async (formData) => {
    const toastId = toast.loading(currentRecord ? 'Updating record...' : 'Adding new record...');
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };

      if (currentRecord) {
        // Update existing record
        await axios.put(`${API_URL}/wastage/${currentRecord.id}`, formData, { headers });
        toast.success('Wastage record updated successfully!', { id: toastId });
      } else {
        // Create new record
        const adminId = getAdminId(); // Now correctly gets ID from token
        if (!adminId) {
            toast.error('Could not identify the user. Please log in again.', { id: toastId });
            return;
        }
        await axios.post(`${API_URL}/wastage`, { ...formData, created_by: adminId }, { headers });
        toast.success('Wastage recorded successfully!', { id: toastId });
      }

      fetchData(); // Re-fetch data to show changes
      closeModal(); // Close the modal on success

    } catch (err) {
      console.error('Failed to submit form:', err);
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage, { id: toastId });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentRecord) return;
    const toastId = toast.loading('Deleting record...');
    try {
        const token = getAuthToken();
        const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/wastage/${currentRecord.id}`, { headers });
      toast.success('Record deleted successfully!', { id: toastId });

      fetchData(); // Re-fetch data
      closeModal(); // Close the modal

    } catch (err) {
      console.error('Failed to delete record:', err);
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage, { id: toastId });
    }
  };


  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Wastage Logs</h2>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        >
          <FiPlus className="mr-2" />
          Log Wastage
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <FiLoader className="text-blue-500 text-4xl" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>
      ) : (
        <WastageTable
          records={wastageRecords}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
        />
      )}

      {/* Modals */}
      {isFormModalOpen && (
        <WastageFormModal
          isOpen={isFormModalOpen}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
          record={currentRecord}
          items={items}
        />
      )}

      {isDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeModal}
          onConfirm={handleDeleteConfirm}
          title="Confirm Deletion"
          message={`Are you sure you want to delete the wastage record for "${currentRecord?.item_name}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
};


/**
 * Wastage Table Component
 */
const WastageTable = ({ records, onEdit, onDelete }) => {
    if (records.length === 0) {
        return <div className="text-center py-10 text-gray-500">No wastage records found.</div>;
    }

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logged By</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.item_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate" title={record.reason}>{record.reason || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.username || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(record.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => onEdit(record)} className="text-indigo-600 hover:text-indigo-900 p-1"><FiEdit size={16}/></button>
                        <button onClick={() => onDelete(record)} className="text-red-600 hover:text-red-900 p-1"><FiTrash2 size={16}/></button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

/**
 * Wastage Form Modal (for Add/Edit)
 */
const WastageFormModal = ({ isOpen, onClose, onSubmit, record, items }) => {
    const [formData, setFormData] = useState({
        item_id: record?.item_id || '',
        quantity: record?.quantity || 1,
        reason: record?.reason || '',
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        // Reset form when record changes
        setFormData({
            item_id: record?.item_id || '',
            quantity: record?.quantity || 1,
            reason: record?.reason || '',
        });
        setFormErrors({}); // Clear errors
    }, [record]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.item_id) errors.item_id = 'Item is required.';
        if (!formData.quantity || formData.quantity <= 0) errors.quantity = 'Quantity must be a positive number.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    {record ? 'Edit Wastage Record' : 'Log New Wastage'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="item_id" className="block text-sm font-medium text-gray-700">Item</label>
                        <select
                            id="item_id"
                            name="item_id"
                            value={formData.item_id}
                            onChange={handleChange}
                            disabled={!!record} // Disable changing item on edit
                            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${formErrors.item_id ? 'border-red-500' : ''}`}
                        >
                            <option value="" disabled>Select an item</option>
                            {items.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                         {formErrors.item_id && <p className="text-xs text-red-600 mt-1">{formErrors.item_id}</p>}
                    </div>

                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                            type="number"
                            name="quantity"
                            id="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            min="1"
                            className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${formErrors.quantity ? 'border-red-500' : ''}`}
                        />
                         {formErrors.quantity && <p className="text-xs text-red-600 mt-1">{formErrors.quantity}</p>}
                    </div>

                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
                        <textarea
                            id="reason"
                            name="reason"
                            rows="3"
                            value={formData.reason}
                            onChange={handleChange}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


/**
 * Confirmation Modal Component
 */
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <FiAlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                        Confirm
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Wastage;