import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiTag, FiDollarSign, FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiImage } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:3000/api';
const BASE_URL = API_URL.replace('/api', '');

function ItemManagement({ mainContentRef }) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [categoriesForItems, setCategoriesForItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [errorItems, setErrorItems] = useState(null);
  const [successItems, setSuccessItems] = useState(null);

  const loadItems = useCallback(async () => {
    setIsLoadingItems(true);
    setErrorItems(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const response = await axios.get(`${API_URL}/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data);
    } catch (error) {
      console.error('Error loading items:', error);
      setErrorItems(error.response?.data?.error || t('failedToLoadItems'));
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setIsLoadingItems(false);
    }
  }, [t]);

  const loadCategoriesForItems = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategoriesForItems(response.data);
      if (!response.data.some((cat) => cat.id === parseInt(categoryId))) {
        setCategoryId('');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setErrorItems(error.response?.data?.error || t('failedToLoadCategories'));
    }
  }, [categoryId, t]);

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (!itemName.trim()) {
      setErrorItems(t('enterItemName'));
      return;
    }
    if (!categoryId) {
      setErrorItems(t('selectCategory'));
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorItems(t('enterValidPrice'));
      return;
    }

    setIsLoadingItems(true);
    setErrorItems(null);

    try {
      const token = localStorage.getItem('token');
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
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        setSuccessItems(t('itemUpdated'));
      } else {
        await axios.post(`${API_URL}/items`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        setSuccessItems(t('itemAdded'));
      }
      resetItemForm();
      loadItems();
    } catch (error) {
      console.error('Error saving item:', error);
      setErrorItems(error.response?.data?.error || t('failedToSaveItem'));
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setIsLoadingItems(false);
      setTimeout(() => setSuccessItems(null), 3000);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm(t('confirmDeleteItem'))) return;
    setIsLoadingItems(true);
    setErrorItems(null);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessItems(t('itemDeleted'));
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      setErrorItems(error.response?.data?.error || t('failedToDeleteItem'));
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setIsLoadingItems(false);
      setTimeout(() => setSuccessItems(null), 3000);
    }
  };

  const startEditingItem = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setCategoryId(item.category_id.toString());
    setPrice(item.price.toString());
    setItemImage(null);

    // Debugging logs
    console.log('Starting to edit item:', item);

    setTimeout(() => {
      const formSection = document.getElementById('items-section');
      const container = mainContentRef?.current;

      if (formSection && container) {
        const headerOffset = 20;
        const mainContentTop = container.getBoundingClientRect().top;
        const elementTop = formSection.getBoundingClientRect().top;
        const scrollPosition = elementTop - mainContentTop + container.scrollTop - headerOffset;

        // Debugging logs
        console.log('Scrolling to items-section within container:', {
          scrollPosition,
          headerOffset,
          formSection,
          container
        });

        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      } else {
        console.error('items-section element or container not found');
      }
    }, 200);
  };

  const resetItemForm = () => {
    setItemName('');
    setCategoryId('');
    setPrice('');
    setItemImage(null);
    setEditingItem(null);
    setErrorItems(null);
  };

  useEffect(() => {
    loadItems();
    loadCategoriesForItems();
  }, [loadItems, loadCategoriesForItems]);

  return (
    <div id="items-section" className="mb-16 px-4 sm:px-0" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
        {t('menuItems')}
        <span className="ml-3 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          {items.length} {items.length === 1 ? t('item') : t('items')}
        </span>
      </h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8 border border-gray-100">
        <div className="p-6">          <h2 className="text-lg font-medium text-gray-800 mb-4" id="item-form">
            {editingItem ? t('editItem') : t('addNewItem')}
          </h2>
          <form onSubmit={handleSubmitItem}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-gray-600 mb-1">
                  {t('itemName')}
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
                    placeholder={t('enterItemNamePlaceholder')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-600 mb-1">
                  {t('category')}
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">{t('selectCategory')}</option>
                  {categoriesForItems.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.categorie}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-600 mb-1">
                  {t('price')} (DT)
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
                    placeholder={t('enterPricePlaceholder')}
                    step="0.01"
                    min="0"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('itemImage')}</label>
              <div className="flex items-center space-x-4">
                <label className="flex flex-col items-center justify-center w-full max-w-xs p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  {itemImage ? (
                    <img 
                      src={URL.createObjectURL(itemImage)} 
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
                    onChange={(e) => setItemImage(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                {editingItem?.image && !itemImage && (
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-500 mb-1">{t('currentImage')}</p>
                    <img
                      src={`${BASE_URL}${editingItem.image}`}
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
                disabled={isLoadingItems}
                className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {isLoadingItems ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : editingItem ? (
                  <FiCheck className="mr-1" />
                ) : (
                  <FiPlus className="mr-1" />
                )}
                {isLoadingItems ? t('processing') : editingItem ? t('update') : t('add')}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={resetItemForm}
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

      {errorItems && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{errorItems}</p>
            </div>
          </div>
        </div>
      )}

      {successItems && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-600">{successItems}</p>
            </div>
          </div>
        </div>
      )}

      {isLoadingItems && items.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">{t('noItems')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('addFirstItem')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-32 bg-gray-100">
                {item.image ? (
                  <img
                    src={`${BASE_URL}${item.image}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNhYWFhYWEiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiImage className="h-10 w-10 text-gray-400" />
                  </div>
                )}                <div className="absolute top-1.5 right-1.5 flex space-x-1">                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      startEditingItem(item);
                    }}
                    className="p-1.5 bg-white rounded-full shadow-md text-blue-600 hover:bg-blue-50 transition-colors"
                    title={t('edit')}
                  >
                    <FiEdit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 bg-white rounded-full shadow-md text-red-600 hover:bg-red-50 transition-colors"
                    title={t('delete')}
                  >
                    <FiTrash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-800 truncate">{item.name}</h3>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">{item.categorie}</span>
                  <div className="flex items-center">
                    <span className="font-bold">{item.price.toFixed(2)}</span>
                    <span className="ml-1 text-blue-500 font-medium">DT</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ItemManagement;