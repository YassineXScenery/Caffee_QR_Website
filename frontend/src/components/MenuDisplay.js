import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const API_URL = 'http://localhost:3000/api';

function MenuDisplay() {
  const [menu, setMenu] = useState({});
  const [categoryImages, setCategoryImages] = useState({}); // New state for category images
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoryStates, setCategoryStates] = useState({});

  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [categoriesResponse, itemsResponse] = await Promise.all([
          axios.get(`${API_URL}/menu`, { headers: { Authorization: undefined } }),
          axios.get(`${API_URL}/items`, { headers: { Authorization: undefined } })
        ]);

        // Map category images
        const categoryImageMap = categoriesResponse.data.reduce((acc, category) => {
          acc[category.categorie] = category.image || null; // Store image for each category
          return acc;
        }, {});

        const groupedMenu = categoriesResponse.data.reduce((acc, category) => {
          const categoryItems = itemsResponse.data.filter(item => item.category_id === category.id);
          if (categoryItems.length > 0) {
            acc[category.categorie] = categoryItems;
          }
          return acc;
        }, {});

        setMenu(groupedMenu);
        setCategoryImages(categoryImageMap);
        const initialStates = Object.keys(groupedMenu).reduce((acc, category) => {
          acc[category] = false;
          return acc;
        }, {});
        setCategoryStates(initialStates);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError(err.response?.data?.error || 'Failed to load menu. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const toggleCategory = (category) => {
    console.log(`Before toggle - Category: ${category}, Current states:`, categoryStates);
    setCategoryStates(prev => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach(key => {
        newStates[key] = key === category ? !newStates[key] : false;
      });
      console.log(`After toggle - Category: ${category}, New states:`, newStates);
      return newStates;
    });
  };

  console.log('Rendering MenuDisplay with categoryStates:', categoryStates);
  console.log('Category images:', categoryImages);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Our Menu</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover our culinary delights, carefully crafted for your enjoyment
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
              <div className="p-5">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-2xl mx-auto bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-8">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && Object.keys(menu).length === 0 && !error && (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Menu Coming Soon</h3>
          <p className="text-gray-600">We're preparing something delicious for you!</p>
        </div>
      )}

      {/* Menu Categories */}
      {!isLoading && Object.keys(menu).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(menu).map(([category, items]) => (
            <div key={category}>
              {/* Category Header with Image */}
              <button
                onClick={() => toggleCategory(category)}
                className={`w-full flex items-center p-6 text-left transition-colors duration-300 rounded-t-2xl
                  ${categoryStates[category] ? 
                    'bg-blue-700 text-white rounded-b-none' : 
                    'bg-blue-600 text-white hover:bg-blue-500 rounded-b-2xl'}`}
              >
                {/* Category Image */}
                {categoryImages[category] ? (
                  <img
                    src={`http://localhost:3000${categoryImages[category]}`}
                    alt={category}
                    className="w-20 h-20 object-cover rounded-full mr-4"
                    onError={(e) => {
                      console.error('Category image failed to load:', categoryImages[category], e);
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2248%22%20height%3D%2248%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2048%2048%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18945b7b5b4%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18945b7b5b4%22%3E%3Crect%20width%3D%2248%22%20height%3D%2248%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2210%22%20y%3D%2226%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-full mr-4 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No Image</span>
                  </div>
                )}
                {/* Category Name and Chevron */}
                <div className="flex-1 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{category}</h2>
                  {categoryStates[category] ? (
                    <FiChevronUp className="h-6 w-6" />
                  ) : (
                    <FiChevronDown className="h-6 w-6" />
                  )}
                </div>
              </button>

              {/* Items Container with Slide Animation */}
              <div
                className="transition-all duration-500 ease-in-out overflow-hidden bg-white rounded-b-2xl shadow-lg"
                style={{
                  maxHeight: categoryStates[category] ? '1000px' : '0px', // Large max-height to accommodate content
                }}
              >
                <div className="p-6 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden"
                      >
                        {/* Item Image */}
                        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                          {item.image ? (
                            <img
                              src={`http://localhost:3000${item.image}`}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                              onError={(e) => {
                                console.error('Item image failed to load:', item.image, e);
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18945b7b5b4%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18945b7b5b4%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.5%22%20y%3D%22107.1%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-t-lg">
                              <span className="text-gray-400 font-medium">No Image</span>
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="p-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-1">{item.name.toLowerCase()}</h3>
                          <div className="flex items-center text-gray-700">
                            <span className="font-medium">{item.price.toFixed(2)}</span>
                            <span className="mr-1 text-gray-500 font-medium">DT</span>
                          </div>
                        </div>
                      </div>
                    ))}
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

export default MenuDisplay;