import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiImage } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:3000/api';
const BASE_URL = API_URL.replace('/api', '');

function CategoryManagement({ onCategoryChange = () => {}, mainContentRef }) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [errorCategories, setErrorCategories] = useState(null);
  const [successCategories, setSuccessCategories] = useState(null);
  const fileInputRef = useRef(null);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setErrorCategories(null);
    try {
      const response = await axios.get(`${API_URL}/menu`);
      console.log('Loaded categories:', response.data);
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setErrorCategories(error.response?.data?.error || t('failedToLoadCategories'));
    } finally {
      setIsLoadingCategories(false);
    }
  }, [t]);

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setErrorCategories(t('enterCategoryName'));
      return;
    }

    setIsLoadingCategories(true);
    setErrorCategories(null);

    try {
      const formData = new FormData();
      formData.append('categorie', categoryName);

      if (categoryImage) {
        formData.append('image', categoryImage);
        console.log('Appending new image to formData:', categoryImage.name);
      } else if (editingCategory && editingCategory.image) {
        // Only append existing image if it's a valid path
        if (editingCategory.image.startsWith('/uploads/')) {
          formData.append('image', editingCategory.image);
          console.log('Appending existing image to formData:', editingCategory.image);
        }
      }

      if (editingCategory) {
        const response = await axios.put(`${API_URL}/menu/${editingCategory.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('Category update response:', response.data);
        setSuccessCategories(t('categoryUpdated'));
      } else {
        const response = await axios.post(`${API_URL}/menu`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('Category create response:', response.data);
        setSuccessCategories(t('categoryAdded'));
      }

      // Reset form and states
      setCategoryName('');
      setCategoryImage(null);
      setEditingCategory(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadCategories();
      // Call onCategoryChange only if it's a function
      if (typeof onCategoryChange === 'function') {
        onCategoryChange();
      }
    } catch (error) {
      console.error('Error saving category:', error);
      const errorMessage = error.response?.data?.error || t('failedToSaveCategory');
      setErrorCategories(errorMessage);
      console.log('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    } finally {
      setIsLoadingCategories(false);
      // Clear success and error messages after 3 seconds
      setTimeout(() => {
        setSuccessCategories(null);
        setErrorCategories(null);
      }, 3000);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm(t('confirmDeleteCategory'))) {
      return;
    }

    setIsLoadingCategories(true);
    setErrorCategories(null);
    try {
      const response = await axios.delete(`${API_URL}/menu/${id}`);
      console.log('Category delete response:', response.data);
      setSuccessCategories(t('categoryDeleted'));
      loadCategories();
      // Call onCategoryChange only if it's a function
      if (typeof onCategoryChange === 'function') {
        onCategoryChange();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setErrorCategories(error.response?.data?.error || t('failedToDeleteCategory'));
    } finally {
      setIsLoadingCategories(false);
      setTimeout(() => {
        setSuccessCategories(null);
        setErrorCategories(null);
      }, 3000);
    }
  };

  const startEditingCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.categorie);
    setCategoryImage(null);
    setErrorCategories(null);

    console.log('Starting to edit category:', category);

    setTimeout(() => {
      const formSection = document.getElementById('categories-section');
      const container = mainContentRef?.current;

      if (formSection && container) {
        const headerOffset = 20;
        const mainContentTop = container.getBoundingClientRect().top;
        const elementTop = formSection.getBoundingClientRect().top;
        const scrollPosition = elementTop - mainContentTop + container.scrollTop - headerOffset;

        console.log('Scrolling to categories-section within container:', {
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
        console.error('categories-section element or container not found');
      }
    }, 200);
  };

  const cancelEditingCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryImage(null);
    setErrorCategories(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <div id="categories-section" className="mb-16 px-4 sm:px-0">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
        {t('menuCategories')}
        <span className="ml-3 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          {categories.length} {categories.length === 1 ? t('category') : t('categories')}
        </span>
      </h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8 border border-gray-100">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4" id="category-form">
            {editingCategory ? t('editCategory') : t('addNewCategory')}
          </h2>
          <form onSubmit={handleSubmitCategory}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('categoryName')}</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t('enterCategoryNamePlaceholder')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('categoryImage')}</label>
              <div className="flex items-center space-x-4">
                <label className="flex flex-col items-center justify-center w-full max-w-xs p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  {categoryImage ? (
                    <img 
                      src={URL.createObjectURL(categoryImage)} 
                      alt={t('preview')} 
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <FiImage className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">{t('clickToUpload')}</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => setCategoryImage(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                {editingCategory?.image && !categoryImage && (
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-500 mb-1">{t('currentImage')}</p>
                    <img
                      src={`${BASE_URL}${editingCategory.image}`}
                      alt={t('currentImageAlt')}
                      className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoadingCategories}
                className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {isLoadingCategories ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : editingCategory ? (
                  <FiCheck className="mr-1" />
                ) : (
                  <FiPlus className="mr-1" />
                )}
                {isLoadingCategories ? t('processing') : editingCategory ? t('update') : t('add')}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={cancelEditingCategory}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">{t('noCategories')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('addFirstCategory')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-40 bg-gray-100">
                {category.image ? (
                  <img
                    src={`${BASE_URL}${category.image}`}
                    alt={category.categorie}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNhYWFhYWEiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiImage className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      startEditingCategory(category);
                    }}
                    className="p-2 bg-white rounded-full shadow-md text-blue-600 hover:bg-blue-50 transition-colors"
                    title={t('edit')}
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-2 bg-white rounded-full shadow-md text-red-600 hover:bg-red-50 transition-colors"
                    title={t('delete')}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-800 truncate">{category.categorie}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryManagement;