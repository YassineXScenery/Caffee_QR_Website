// Controller for expense management endpoints
const db = require('../databasemenu');

// POST /api/expenses
exports.addExpense = (req, res) => {
  const { type, amount, description, expense_date, is_recurring, recurring_frequency } = req.body;
  if (!type || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const date = expense_date || new Date();
  let recurring_next_due_date = null;
  let recurring_end_date = null;
  if (is_recurring && recurring_frequency) {
    // Calculate next due date and end date automatically
    let start = new Date(date);
    let nextDue = new Date(start);
    let endDate = new Date(start);
    switch (recurring_frequency) {
      case 'daily':
        nextDue.setDate(start.getDate() + 1);
        endDate.setDate(start.getDate() + 2);
        break;
      case 'weekly':
        nextDue.setDate(start.getDate() + 7);
        endDate.setDate(start.getDate() + 14);
        break;
      case 'monthly':
        nextDue.setMonth(start.getMonth() + 1);
        endDate.setMonth(start.getMonth() + 2);
        break;
      case 'yearly':
        nextDue.setFullYear(start.getFullYear() + 1);
        endDate.setFullYear(start.getFullYear() + 2);
        break;
    }
    recurring_next_due_date = nextDue.toISOString().slice(0, 10);
    recurring_end_date = endDate.toISOString().slice(0, 10);
  }
  db.query(
    'INSERT INTO expenses (type, amount, description, expense_date, is_recurring, recurring_frequency, recurring_end_date, recurring_next_due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [type, amount, description, date, is_recurring || 0, recurring_frequency, recurring_end_date, recurring_next_due_date],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
};

// GET /api/expenses?start=YYYY-MM-DD&end=YYYY-MM-DD
exports.getExpenses = (req, res) => {
  const { start, end } = req.query;
  let sql = 'SELECT * FROM expenses';
  let params = [];
  if (start && end) {
    sql += ' WHERE expense_date BETWEEN ? AND ?';
    params = [start, end];
  }
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// UPDATE /api/expenses/:id
exports.updateExpense = (req, res) => {
  const { id } = req.params;
  const { type, amount, description, expense_date, is_recurring, recurring_frequency } = req.body;
  if (!type || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const date = expense_date || new Date();
  let recurring_next_due_date = null;
  let recurring_end_date = null;
  if (is_recurring && recurring_frequency) {
    // Calculate next due date and end date automatically
    let start = new Date(date);
    let nextDue = new Date(start);
    let endDate = new Date(start);
    switch (recurring_frequency) {
      case 'daily':
        nextDue.setDate(start.getDate() + 1);
        endDate.setDate(start.getDate() + 2);
        break;
      case 'weekly':
        nextDue.setDate(start.getDate() + 7);
        endDate.setDate(start.getDate() + 14);
        break;
      case 'monthly':
        nextDue.setMonth(start.getMonth() + 1);
        endDate.setMonth(start.getMonth() + 2);
        break;
      case 'yearly':
        nextDue.setFullYear(start.getFullYear() + 1);
        endDate.setFullYear(start.getFullYear() + 2);
        break;
    }
    recurring_next_due_date = nextDue.toISOString().slice(0, 10);
    recurring_end_date = endDate.toISOString().slice(0, 10);
  }
  db.query(
    'UPDATE expenses SET type = ?, amount = ?, description = ?, expense_date = ?, is_recurring = ?, recurring_frequency = ?, recurring_end_date = ?, recurring_next_due_date = ? WHERE id = ?',
    [type, amount, description, date, is_recurring || 0, recurring_frequency, recurring_end_date, recurring_next_due_date, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Expense entry not found' });
      res.json({ success: true });
    }
  );
};

// DELETE /api/expenses/:id
exports.deleteExpense = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM expenses WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Expense entry not found' });
    res.json({ success: true });
  });
};
