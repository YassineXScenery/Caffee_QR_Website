import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiDollarSign, FiTag } from 'react-icons/fi';

const API_URL = 'http://localhost:3000/api';
const BASE_URL = API_URL.replace('/api', ''); // 'http://localhost:3000'

function Items() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/items`);
      console.log('Items response:', response.data);
      setItems(response.data);
    } catch (error) {
      console.error('Error loading items:', error);
      setError(error.response?.data?.error || 'Failed to load items');
      console.log('Error set to:', error.response?.data?.error || 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/menu`);
      console.log('Categories for items response:', response.data);
      setCategories(response.data);
      if (!response.data.some(cat => cat.id === parseInt(categoryId))) {
        setCategoryId('');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setError(error.response?.data?.error || 'Failed to load categories');
      console.log('Error set to:', error.response?.data?.error || 'Failed to load categories');
    }
  }, [categoryId]);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [loadItems, loadCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (!itemName.trim()) {
      setError('Please enter an item name');
      console.log('Error set to: Please enter an item name');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      console.log('Error set to: Please select a category');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid price');
      console.log('Error set to: Please enter a valid price');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', itemName);
      formData.append('category_id', parseInt(categoryId));
      formData.append('price', parsedPrice);
      if (itemImage) {
        formData.append('image', itemImage);
      } else if (editingItem) {
        formData.append('image', editingItem.image || '');
      }

      if (editingItem) {
        await axios.put(`${API_URL}/items/${editingItem.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Item updated successfully!');
      } else {
        await axios.post(`${API_URL}/items`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Item added successfully!');
      }
      resetForm();
      loadItems();
    } catch (error) {
      console.error('Error saving item:', error);
      setError(error.response?.data?.error || 'Failed to save item');
      console.log('Error set to:', error.response?.data?.error || 'Failed to save item');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/items/${id}`);
      setSuccess('Item deleted successfully!');
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error.response?.data?.error || 'Failed to delete item');
      console.log('Error set to:', error.response?.data?.error || 'Failed to delete item');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setCategoryId(item.category_id.toString());
    setPrice(item.price.toString());
    setItemImage(null);
  };

  const resetForm = () => {
    setItemName('');
    setCategoryId('');
    setPrice('');
    setItemImage(null);
    setEditingItem(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Menu Items
          <span className="ml-2 text-sm font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </h1>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 transition-all duration-300 hover:shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiTag className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="itemName"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Enter item name"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.categorie}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (DT)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Image (optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => setItemImage(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {editingItem && editingItem.image && !itemImage && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Current image:</p>
                  <img
                    src={`${BASE_URL}${editingItem.image}?t=${new Date().getTime()}`}
                    alt="Current item"
                    className="mt-1 h-16 w-16 object-cover rounded-lg"
                    onError={(e) => console.error(`Failed to load current image for editing: ${BASE_URL}${editingItem.image}`)}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : editingItem ? (
                  <FiCheck className="mr-1" />
                ) : (
                  <FiPlus className="mr-1" />
                )}
                {isLoading ? 'Processing...' : editingItem ? 'Update Item' : 'Add Item'}
              </button>
              
              {editingItem && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  <FiX className="inline mr-1" />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{typeof error === 'string' ? error : 'An unexpected error occurred'}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      {isLoading && items.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No items</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first menu item.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {item.image ? (
                      <img
                        src={`${BASE_URL}${item.image}?t=${new Date().getTime()}`}
                        alt={item.name}
                        className="h-12 w-12 object-cover rounded-lg"
                        onError={(e) => console.error(`Failed to load image for ${item.name}: ${BASE_URL}${item.image}`)}
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Image</span>
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.categorie} • {item.price} DT
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditing(item)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete"
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

export default Items; 