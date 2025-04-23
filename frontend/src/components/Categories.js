import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/menu`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Failed to load categories');
    }
  };

  const addCategory = async () => {
    if (!categoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      await axios.post(`${API_URL}/menu`, { categorie: categoryName });
      setCategoryName('');
      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert(error.response?.data?.error || 'Failed to add category');
    }
  };

  const updateCategory = async () => {
    if (!categoryName.trim()) {
      alert('Category name cannot be empty');
      return;
    }

    try {
      await axios.put(`${API_URL}/menu/${editingCategory.id}`, { categorie: categoryName });
      setCategoryName('');
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      alert(error.response?.data?.error || 'Failed to update category');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? All associated items will also be deleted.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/menu/${id}`);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.error || 'Failed to delete category');
    }
  };

  const startEditing = (category) => {
    setEditingCategory(category);
    setCategoryName(category.categorie);
  };

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Categories</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="Enter category name"
          className="p-2 border rounded w-full"
        />
        {editingCategory ? (
          <button onClick={updateCategory} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Update Category
          </button>
        ) : (
          <button onClick={addCategory} className="bg-green-500 text-white p-2 rounded hover:bg-green-600">
            Add Category
          </button>
        )}
        {editingCategory && (
          <button onClick={() => { setEditingCategory(null); setCategoryName(''); }} className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
            Cancel
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {categories.map(category => (
          <li key={category.id} className="flex justify-between items-center bg-white p-3 rounded shadow">
            <span>{category.categorie}</span>
            <div>
              <button onClick={() => startEditing(category)} className="bg-blue-500 text-white px-3 py-1 rounded mr-2 hover:bg-blue-600">
                Edit
              </button>
              <button onClick={() => deleteCategory(category.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Categories;