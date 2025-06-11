import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import AnalyticsDashboard from './AnalyticsDashboard';

const API_URL = 'http://localhost:3000/api';

const StockPage = () => {
  const [items, setItems] = useState([]);
  const [currentStock, setCurrentStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [form, setForm] = useState({ item_id: '', quantity: '', cost: '', recurrence: 'none' });
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const recurrenceOptions = [
    { value: 'none', label: 'None' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  useEffect(() => {
    axios.get(`${API_URL}/items`)
      .then(res => setItems(res.data))
      .catch(() => setItems([]));
  }, []);

  const fetchStock = () => {
    axios.get(`${API_URL}/stock`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setCurrentStock(res.data))
      .catch(() => setCurrentStock([]));
  };

  const fetchLowStock = () => {
    axios.get(`${API_URL}/stock/low?threshold=5`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setLowStock(res.data))
      .catch(() => setLowStock([]));
  };

  useEffect(() => {
    fetchStock();
    fetchLowStock();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (editingId) {
        const updatePayload = {
          quantity: form.quantity,
          cost: form.cost
        };
        await axios.put(`${API_URL}/stock/${editingId}`, updatePayload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setMessage('Stock updated!');
      } else {
        await axios.post(`${API_URL}/stock`, form, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setMessage('Stock added!');
      }
      setForm({ item_id: '', quantity: '', cost: '', recurrence: 'none' });
      setEditingId(null);
      fetchStock();
      fetchLowStock();
    } catch (err) {
      setMessage('Error updating stock');
    }
    setLoading(false);
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      item_id: row.item_id,
      quantity: row.quantity,
      cost: row.cost !== undefined && row.cost !== null ? row.cost.toString() : '',
      recurrence: row.recurrence || 'none',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ item_id: '', quantity: '', cost: '', recurrence: 'none' });
  };

  useEffect(() => {
    if (editingId) {
      const row = currentStock.find(r => r.id === editingId);
      if (row) {
        setForm({
          item_id: row.item_id,
          quantity: row.quantity,
          cost: row.cost !== undefined && row.cost !== null ? row.cost.toString() : '',
          recurrence: row.recurrence || 'none',
        });
      }
    }
  }, [editingId, currentStock]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this stock entry?')) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/stock/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setMessage('Stock deleted!');
      fetchStock();
      fetchLowStock();
    } catch {
      setMessage('Error deleting stock');
    }
    setLoading(false);
  };

  const handleSelect = (id) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const handleSelectAll = () => {
    if (selected.length === currentStock.length) setSelected([]);
    else setSelected(currentStock.map(row => row.id));
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm('Delete selected stock entries?')) return;
    setLoading(true);
    try {
      await Promise.all(selected.map(id => axios.delete(`${API_URL}/stock/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })));
      setMessage('Selected stock deleted!');
      setSelected([]);
      fetchStock();
      fetchLowStock();
    } catch {
      setMessage('Error deleting selected');
    }
    setLoading(false);
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete ALL stock entries?')) return;
    setLoading(true);
    try {
      await Promise.all(currentStock.map(row => axios.delete(`${API_URL}/stock/${row.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })));
      setMessage('All stock deleted!');
      setSelected([]);
      fetchStock();
      fetchLowStock();
    } catch {
      setMessage('Error deleting all');
    }
    setLoading(false);
  };

  return (
    <div>
      {/* --- Analytics Dashboard --- */}
      <AnalyticsDashboard />
      {/* --- End Analytics Dashboard --- */}
      <h2 className="text-xl font-bold mb-2">Stock Management</h2>
      <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
        <select name="item_id" value={form.item_id} onChange={handleChange} required className="border p-2 rounded" disabled={!!editingId}>
          <option value="">Select Item</option>
          {items.map(item => (
            <option key={item.id || item.item_id} value={item.id || item.item_id}>{item.name || item.item_name}</option>
          ))}
        </select>
        <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleChange} required className="border p-2 rounded" />
        <input name="cost" type="number" step="0.01" placeholder="Cost" value={form.cost} onChange={handleChange} required className="border p-2 rounded" />
        <select name="recurrence" value={form.recurrence} onChange={handleChange} className="border p-2 rounded">
          {recurrenceOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add Stock')}
        </button>
        {editingId && <button type="button" className="bg-gray-300 px-4 py-2 rounded mt-1" onClick={cancelEdit}>Cancel Edit</button>}
        {message && <div className="text-green-600">{message}</div>}
      </form>
      <div className="flex gap-2 mb-2">
        <button onClick={handleSelectAll} className="bg-gray-200 px-2 rounded">{selected.length === currentStock.length ? 'Unselect All' : 'Select All'}</button>
        <button onClick={handleDeleteSelected} className="bg-red-500 text-white px-2 rounded" disabled={!selected.length}>Delete Selected</button>
        <button onClick={handleDeleteAll} className="bg-red-700 text-white px-2 rounded">Delete All</button>
      </div>
      {lowStock.length > 0 && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2">{lowStock.length} item(s) low on stock!</div>
      )}
      <table className="w-full border mt-2">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2"><input type="checkbox" checked={selected.length === currentStock.length && currentStock.length > 0} onChange={handleSelectAll} /></th>
            <th className="p-2">Item</th>
            <th className="p-2">Quantity</th>
            <th className="p-2">Cost</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentStock.map(row => (
            <tr key={row.id}>
              <td className="p-2"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => handleSelect(row.id)} /></td>
              <td className="p-2">{row.item_name}</td>
              <td className="p-2">{row.quantity}</td>
              <td className="p-2">{row.cost}</td>
              <td className="p-2 flex gap-2">
                <button onClick={() => handleEdit(row)} className="text-blue-600 hover:underline" title="Edit"><FiEdit2 /></button>
                <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:underline" title="Delete"><FiTrash2 /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockPage;