import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const API_URL = 'http://localhost:3000/api';

function MenuDisplay() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/menu`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error loading categories:', error);
        setError('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Fetch items for the selected category
  const loadItemsForCategory = async (categoryId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/items`);
      const filteredItems = response.data.filter(item => item.category_id === categoryId);
      setItems(filteredItems);
    } catch (error) {
      console.error('Error loading items for category:', error);
      setError('Failed to load items for this category');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle category click
  const handleCategoryClick = (categoryId) => {
    if (selectedCategoryId === categoryId) {
      // Collapse the items
      setSelectedCategoryId(null);
      setItems([]);
    } else {
      // Load items for the clicked category
      setSelectedCategoryId(categoryId);
      loadItemsForCategory(categoryId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Our Menu</h1>
        <p className="text-gray-600">Browse our delicious offerings by category</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && categories.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(category => (
          <div key={category.id} className="overflow-hidden">
            {/* Category Card - Square with Circular Edges */}
            <div
              onClick={() => handleCategoryClick(category.id)}
              className={`cursor-pointer p-6 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg ${
                selectedCategoryId === category.id ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{category.categorie}</h3>
                {selectedCategoryId === category.id ? (
                  <FiChevronUp className="h-5 w-5" />
                ) : (
                  <FiChevronDown className="h-5 w-5" />
                )}
              </div>
            </div>

            {/* Items List */}
            {selectedCategoryId === category.id && (
              <div className="mt-2 space-y-2 transition-all duration-500 ease-in-out">
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : items.length > 0 ? (
                  items.map(item => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center text-gray-500">
                    No items in this category
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && categories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No categories found</h3>
          <p className="mt-1 text-sm text-gray-500">Please add some categories to display the menu.</p>
        </div>
      )}
    </div>
  );
}

export default MenuDisplay;