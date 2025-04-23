import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

function Items() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  const loadItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/items`);
      setItems(response.data);
    } catch (error) {
      console.error('Error loading items:', error);
      alert('Failed to load items');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/menu`);
      setCategories(response.data);
      if (!response.data.some(cat => cat.id === parseInt(categoryId))) {
        setCategoryId('');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Failed to load categories');
    }
  };

  const addItem = async () => {
    const parsedPrice = parseFloat(price);
    if (!itemName.trim()) {
      alert('Please enter an item name');
      return;
    }
    if (!categoryId) {
      alert('Please select a category');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      await axios.post(`${API_URL}/items`, {
        name: itemName,
        category_id: parseInt(categoryId),
        price: parsedPrice
      });
      setItemName('');
      setCategoryId('');
      setPrice('');
      loadItems();
    } catch (error) {
      console.error('Error adding item:', error);
      alert(error.response?.data?.error || 'Failed to add item');
    }
  };

  const updateItem = async () => {
    const parsedPrice = parseFloat(price);
    if (!itemName.trim()) {
      alert('Item name cannot be empty');
      return;
    }
    if (!categoryId) {
      alert('Please select a category');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      await axios.put(`${API_URL}/items/${editingItem.id}`, {
        name: itemName,
        category_id: parseInt(categoryId),
        price: parsedPrice
      });
      setItemName('');
      setCategoryId('');
      setPrice('');
      setEditingItem(null);
      loadItems();
    } catch (error) {
      console.error('Error updating item:', error);
      alert(error.response?.data?.error || 'Failed to update item');
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/items/${id}`);
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(error.response?.data?.error || 'Failed to delete item');
    }
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setCategoryId(item.category_id.toString());
    setPrice(item.price.toString());
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Items</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Enter item name"
          className="p-2 border rounded flex-1"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">Select Category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.categorie}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter price"
          step="0.01"
          className="p-2 border rounded w-32"
        />
        {editingItem ? (
          <button onClick={updateItem} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Update Item
          </button>
        ) : (
          <button onClick={addItem} className="bg-green-500 text-white p-2 rounded hover:bg-green-600">
            Add Item
          </button>
        )}
        {editingItem && (
          <button onClick={() => { setEditingItem(null); setItemName(''); setCategoryId(''); setPrice(''); }} className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
            Cancel
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="flex justify-between items-center bg-white p-3 rounded shadow">
            <span>{item.name} (Category ID: {item.category_id}) - ${item.price}</span>
            <div>
              <button onClick={() => startEditing(item)} className="bg-blue-500 text-white px-3 py-1 rounded mr-2 hover:bg-blue-600">
                Edit
              </button>
              <button onClick={() => deleteItem(item.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Items;