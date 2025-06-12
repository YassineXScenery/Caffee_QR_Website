import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiEdit2, FiTrash2, FiRotateCcw } from 'react-icons/fi';

const API_URL = 'http://localhost:3000/api';

const recurringDefaults = {
  is_recurring: false,
  recurring_frequency: '',
  recurring_end_date: '',
  recurring_next_due_date: '',
};

const ExpensePage = () => {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ type: '', amount: '', description: '', expense_date: '', ...recurringDefaults });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [undoData, setUndoData] = useState(null); // For undo
  const [undoTimeout, setUndoTimeout] = useState(null);

  // Fetch expenses
  const fetchExpenses = () => {
    let url = `${API_URL}/expenses`;
    if (dateRange.start && dateRange.end) {
      url += `?start=${dateRange.start}&end=${dateRange.end}`;
    }
    axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setExpenses(res.data))
      .catch(() => setExpenses([]));
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line
  }, [dateRange]);

  // Handle form input
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  // Handle add/update expense
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = { ...form };
      if (!payload.is_recurring) {
        payload.recurring_frequency = '';
      }
      // Remove fields not needed by backend
      delete payload.recurring_end_date;
      delete payload.recurring_next_due_date;
      if (editingId) {
        await axios.put(`${API_URL}/expenses/${editingId}`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setMessage('Expense updated!');
      } else {
        await axios.post(`${API_URL}/expenses`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setMessage('Expense added!');
      }
      setForm({ type: '', amount: '', description: '', expense_date: '', ...recurringDefaults });
      setEditingId(null);
      fetchExpenses();
    } catch (err) {
      setMessage('Error saving expense');
    }
    setLoading(false);
  };

  // Edit expense
  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      type: row.type,
      amount: row.amount,
      description: row.description || '',
      expense_date: row.expense_date ? row.expense_date.slice(0, 10) : '',
      is_recurring: !!row.is_recurring,
      recurring_frequency: row.recurring_frequency || '',
      recurring_end_date: row.recurring_end_date ? row.recurring_end_date.slice(0, 10) : '',
      recurring_next_due_date: row.recurring_next_due_date ? row.recurring_next_due_date.slice(0, 10) : '',
    });
  };

  // Helper: Show undo for a few seconds
  const showUndo = (deletedRows) => {
    setUndoData(deletedRows);
    if (undoTimeout) clearTimeout(undoTimeout);
    setUndoTimeout(setTimeout(() => setUndoData(null), 6000));
  };

  // Undo delete
  const handleUndo = async () => {
    if (!undoData) return;
    setLoading(true);
    try {
      await Promise.all(
        undoData.map(row => axios.post(`${API_URL}/expenses`, {
          type: row.type,
          amount: row.amount,
          description: row.description,
          expense_date: row.expense_date,
          is_recurring: row.is_recurring ? 1 : 0,
          recurring_frequency: row.recurring_frequency || '',
          // The backend will auto-calculate recurring_end_date and recurring_next_due_date
        }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }))
      );
      setMessage('Undo successful!');
      setUndoData(null);
      fetchExpenses();
    } catch {
      setMessage('Undo failed');
    }
    setLoading(false);
  };

  // Delete expense (with confirmation and undo)
  const handleDelete = async (id) => {
    const row = expenses.find(e => e.id === id);
    if (!window.confirm('Delete this expense entry?')) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/expenses/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setMessage('Expense deleted!');
      showUndo([row]);
      fetchExpenses();
    } catch {
      setMessage('Error deleting expense');
    }
    setLoading(false);
  };

  // Bulk delete selected (with confirmation and undo)
  const handleDeleteSelected = async () => {
    if (!selected.length) return;
    const rows = expenses.filter(e => selected.includes(e.id));
    if (!window.confirm(`Delete ${selected.length} selected expense entr${selected.length === 1 ? 'y' : 'ies'}?`)) return;
    setLoading(true);
    try {
      await Promise.all(selected.map(id => axios.delete(`${API_URL}/expenses/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })));
      setMessage('Selected expenses deleted!');
      setSelected([]);
      showUndo(rows);
      fetchExpenses();
    } catch {
      setMessage('Error deleting selected');
    }
    setLoading(false);
  };

  // Bulk delete all (with confirmation and undo)
  const handleDeleteAll = async () => {
    if (!expenses.length) return;
    if (!window.confirm('Delete ALL expense entries? This cannot be undone unless you click Undo immediately.')) return;
    setLoading(true);
    try {
      const rows = [...expenses];
      await Promise.all(expenses.map(row => axios.delete(`${API_URL}/expenses/${row.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })));
      setMessage('All expenses deleted!');
      setSelected([]);
      showUndo(rows);
      fetchExpenses();
    } catch {
      setMessage('Error deleting all');
    }
    setLoading(false);
  };

  // Handle date range change
  const handleDateChange = e => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  // Select row
  const handleSelect = (id) => {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  // Select all
  const handleSelectAll = () => {
    if (selected.length === expenses.length) setSelected([]);
    else setSelected(expenses.map(row => row.id));
  };

  return (
    <div className="relative max-w-3xl mx-auto py-8">
      <button
        className="fixed top-6 left-6 z-50 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
        onClick={() => window.history.back()}
      >
        ← Back
      </button>
      <h2 className="text-xl font-bold mb-2">Expense Management</h2>
      {/* Add/Edit Expense Form */}
      <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
        <input name="type" placeholder="Type (e.g. salary, rent)" value={form.type} onChange={handleChange} required className="border p-2 rounded" />
        <input name="amount" type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={handleChange} required className="border p-2 rounded" />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} className="border p-2 rounded" />
        <input name="expense_date" type="date" value={form.expense_date} onChange={handleChange} className="border p-2 rounded" />
        <label className="flex items-center gap-2">
          <input name="is_recurring" type="checkbox" checked={form.is_recurring} onChange={handleChange} /> Recurring
        </label>
        {form.is_recurring && (
          <div className="flex flex-col md:flex-row gap-2">
            <select name="recurring_frequency" value={form.recurring_frequency} onChange={handleChange} className="border p-2 rounded" required>
              <option value="">Select Frequency</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add Expense')}
        </button>
        {editingId && <button type="button" className="bg-gray-300 px-4 py-2 rounded mt-1" onClick={() => { setEditingId(null); setForm({ type: '', amount: '', description: '', expense_date: '', ...recurringDefaults }); }}>Cancel Edit</button>}
        {message && <div className="text-green-600">{message}</div>}
      </form>
      {/* Undo Snackbar */}
      {undoData && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow-lg flex items-center gap-2 z-50">
          <span>{undoData.length === 1 ? 'Expense deleted.' : `${undoData.length} expenses deleted.`}</span>
          <button onClick={handleUndo} className="flex items-center gap-1 px-2 py-1 bg-yellow-300 hover:bg-yellow-400 rounded text-yellow-900 font-semibold"><FiRotateCcw /> Undo</button>
        </div>
      )}
      {/* Bulk Actions */}
      <div className="flex gap-2 mb-2">
        <button onClick={handleSelectAll} className="bg-gray-200 px-2 rounded">{selected.length === expenses.length ? 'Unselect All' : 'Select All'}</button>
        <button onClick={handleDeleteSelected} className="bg-red-500 text-white px-2 rounded" disabled={!selected.length}>Delete Selected</button>
        <button onClick={handleDeleteAll} className="bg-red-700 text-white px-2 rounded">Delete All</button>
      </div>
      {/* Date Range Filter */}
      <div className="flex gap-2 mb-2">
        <input name="start" type="date" value={dateRange.start} onChange={handleDateChange} className="border p-2 rounded" />
        <input name="end" type="date" value={dateRange.end} onChange={handleDateChange} className="border p-2 rounded" />
        <button onClick={fetchExpenses} className="bg-gray-300 px-2 rounded">Filter</button>
      </div>
      {/* Expense List Table */}
      <table className="w-full border mt-2">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2"><input type="checkbox" checked={selected.length === expenses.length && expenses.length > 0} onChange={handleSelectAll} /></th>
            <th className="p-2">Type</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Description</th>
            <th className="p-2">Date</th>
            <th className="p-2">Recurring</th>
            <th className="p-2">Frequency</th>
            <th className="p-2">Next Due</th>
            <th className="p-2">End Date</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(row => (
            <tr key={row.id}>
              <td className="p-2"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => handleSelect(row.id)} /></td>
              <td className="p-2">{row.type}</td>
              <td className="p-2">{row.amount}</td>
              <td className="p-2">{row.description}</td>
              <td className="p-2">{row.expense_date?.slice(0, 10)}</td>
              <td className="p-2">{row.is_recurring ? 'Yes' : ''}</td>
              <td className="p-2">{row.recurring_frequency || ''}</td>
              <td className="p-2">{row.recurring_next_due_date ? row.recurring_next_due_date.slice(0, 10) : ''}</td>
              <td className="p-2">{row.recurring_end_date ? row.recurring_end_date.slice(0, 10) : ''}</td>
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

export default ExpensePage;
