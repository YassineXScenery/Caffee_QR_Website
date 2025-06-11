const db = require('../databasemenu');

// POST /api/stock
exports.addStock = (req, res) => {
  const { item_id, quantity, cost, recurrence } = req.body;
  if (!item_id || !quantity || cost === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const totalCost = parseFloat(cost) * parseInt(quantity);
  db.query('INSERT INTO stock (item_id, quantity, cost) VALUES (?, ?, ?)', [item_id, quantity, totalCost], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query('SELECT item_name FROM items WHERE item_id = ?', [item_id], (err2, rows) => {
      const itemName = (!err2 && rows && rows[0]) ? rows[0].item_name : `Item #${item_id}`;
      // Prepare recurring fields for expenses
      let is_recurring = 0;
      let recurring_frequency = null;
      let next_due = null;
      let end_due = null;
      if (recurrence && recurrence !== 'none') {
        is_recurring = 1;
        recurring_frequency = recurrence;
        // Calculate next_due based on frequency
        const now = new Date();
        if (recurrence === 'monthly') {
          next_due = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        } else if (recurrence === 'weekly') {
          next_due = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        } else if (recurrence === 'yearly') {
          next_due = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        }
        // Set end_due to 12 periods later (optional, adjust as needed)
        if (next_due) {
          if (recurrence === 'monthly') {
            end_due = new Date(now.getFullYear(), now.getMonth() + 12, now.getDate());
          } else if (recurrence === 'weekly') {
            end_due = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7 * 12);
          } else if (recurrence === 'yearly') {
            end_due = new Date(now.getFullYear() + 12, now.getMonth(), now.getDate());
          }
        }
        // Format dates as YYYY-MM-DD
        if (next_due) next_due = next_due.toISOString().slice(0, 10);
        if (end_due) end_due = end_due.toISOString().slice(0, 10);
      }
      // Use correct column names for recurring dates if needed
      // Try both: next_due/end_due and recurring_next_due_date/recurring_end_date
      const expenseInsertQuery =
        'INSERT INTO expenses (type, amount, description, expense_date, is_recurring, recurring_frequency, recurring_next_due_date, recurring_end_date) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)';
      db.query(
        expenseInsertQuery,
        ['stock', totalCost, `Stock purchase: ${itemName}`, is_recurring, recurring_frequency, next_due, end_due],
        (err3) => {
          if (err3) {
            // fallback: try with next_due/end_due if first insert fails
            db.query(
              'INSERT INTO expenses (type, amount, description, expense_date, is_recurring, recurring_frequency, next_due, end_due) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)',
              ['stock', totalCost, `Stock purchase: ${itemName}`, is_recurring, recurring_frequency, next_due, end_due],
              (err4) => {
                if (err4) return res.status(500).json({ error: 'Stock added but failed to log expense (recurring columns mismatch)' });
                res.json({ success: true, id: result.insertId });
              }
            );
          } else {
            res.json({ success: true, id: result.insertId });
          }
        }
      );
    });
  });
};

// GET /api/stock/current
exports.getCurrentStock = (req, res) => {
  db.query('SELECT cs.item_id, i.item_name, cs.stock_level FROM current_stock cs JOIN items i ON cs.item_id = i.item_id', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// GET /api/stock/low?threshold=5
exports.getLowStock = (req, res) => {
  const threshold = parseInt(req.query.threshold) || 5;
  db.query('SELECT cs.item_id, i.item_name, cs.stock_level FROM current_stock cs JOIN items i ON cs.item_id = i.item_id WHERE cs.stock_level < ?', [threshold], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// UPDATE /api/stock/:id
exports.updateStock = (req, res) => {
  const { id } = req.params;
  const { item_id, quantity, cost } = req.body;
  if (!item_id || !quantity || cost === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const totalCost = parseFloat(cost) * parseInt(quantity);
  db.query('UPDATE stock SET item_id = ?, quantity = ?, cost = ? WHERE id = ?', [item_id, quantity, totalCost, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Stock entry not found' });
    res.json({ success: true });
  });
};

// DELETE /api/stock/:id
exports.deleteStock = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM stock WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Stock entry not found' });
    res.json({ success: true });
  });
};

// GET /api/stock
exports.getAllStock = (req, res) => {
  db.query('SELECT s.id, s.item_id, i.item_name, s.quantity, s.cost FROM stock s JOIN items i ON s.item_id = i.item_id', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};