import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck } from 'react-icons/fi';

const API_URL = 'http://localhost:3000/api';
const BASE_URL = API_URL.replace('/api', '');

function CategoryManagement({ onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [errorCategories, setErrorCategories] = useState(null);
  const [successCategories, setSuccessCategories] = useState(null);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setErrorCategories(null);
    try {
      const response = await axios.get(`${API_URL}/menu`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setErrorCategories(error.response?.data?.error || 'Failed to load categories');
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setErrorCategories('Please enter a category name');
      return;
    }

    setIsLoadingCategories(true);
    setErrorCategories(null);
    try {
      const formData = new FormData();
      formData.append('categorie', categoryName);
      if (categoryImage) {
        formData.append('image', categoryImage);
      } else if (editingCategory) {
        formData.append('image', editingCategory.image || '');
      }

      if (editingCategory) {
        await axios.put(`${API_URL}/menu/${editingCategory.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccessCategories('Category updated successfully!');
      } else {
        await axios.post(`${API_URL}/menu`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccessCategories('Category added successfully!');
      }
      setCategoryName('');
      setCategoryImage(null);
      setEditingCategory(null);
      loadCategories();
      onCategoryChange();
    } catch (error) {
      console.error('Error saving category:', error);
      setErrorCategories(error.response?.data?.error || 'Failed to save category');
    } finally {
      setIsLoadingCategories(false);
      setTimeout(() => setSuccessCategories(null), 3000);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? All associated items will also be deleted.')) {
      return;
    }

    setIsLoadingCategories(true);
    setErrorCategories(null);
    try {
      await axios.delete(`${API_URL}/menu/${id}`);
      setSuccessCategories('Category deleted successfully!');
      loadCategories();
      onCategoryChange();
    } catch (error) {
      console.error('Error deleting category:', error);
      setErrorCategories(error.response?.data?.error || 'Failed to delete category');
    } finally {
      setIsLoadingCategories(false);
      setTimeout(() => setSuccessCategories(null), 3000);
    }
  };

  const startEditingCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.categorie);
    setCategoryImage(null);
  };

  const cancelEditingCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryImage(null);
    setErrorCategories(null);
  };

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <div id="categories-section" className="mb-16">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
        Menu Categories
        <span className="ml-3 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          {categories.length} {categories.length === 1 ? 'category' : 'categories'}
        </span>
      </h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8 border border-gray-100">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={handleSubmitCategory}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-1">Category Name</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-1">Category Image (optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => setCategoryImage(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {editingCategory && editingCategory.image && !categoryImage && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Current image:</p>
                  <img
                    src={`${BASE_URL}${editingCategory.image}?t=${new Date().getTime()}`}
                    alt="Current category"
                    className="mt-1 h-16 w-16 object-cover rounded-lg"
                    onError={(e) => console.error(`Failed to load current image for editing: ${BASE_URL}${editingCategory.image}`)}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoadingCategories}
                className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {isLoadingCategories ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : editingCategory ? (
                  <FiCheck className="mr-1" />
                ) : (
                  <FiPlus className="mr-1" />
                )}
                {isLoadingCategories ? 'Processing...' : editingCategory ? 'Update Category' : 'Add Category'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={cancelEditingCategory}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors text-sm font-medium"
                >
                  <FiX className="inline mr-1" />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      {errorCategories && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{errorCategories}</p>
            </div>
          </div>
        </div>
      )}
      {successCategories && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-600">{successCategories}</p>
            </div>
          </div>
        </div>
      )}
      {isLoadingCategories && categories.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          </div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No categories</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first category.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <ul className="divide-y divide-gray-100">
            {categories.map((category) => (
              <li key={category.id} className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {category.image ? (
                      <img
                        src={`${BASE_URL}${category.image}?t=${new Date().getTime()}`}
                        alt={category.categorie}
                        className="h-12 w-12 object-cover rounded-lg"
                        onError={(e) => console.error(`Failed to load image for ${category.categorie}: ${BASE_URL}${category.image}`)}
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Image</span>
                      </div>
                    )}
                    <div>
                      <p className="text-base font-medium text-gray-800">{category.categorie}</p>
                      <p className="text-sm text-gray-500">Category ID: {category.id}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditingCategory(category)}
                      className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
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

export default CategoryManagement;