const db = require('../databasemenu');

// CREATE wastage and log it in expenses
exports.createWastage = (req, res) => {
  console.log('Attempting to create wastage with data:', req.body);
  const { item_id, quantity, reason, created_by } = req.body;

  if (!item_id || !quantity || !created_by) {
    console.error('Validation error: Missing required fields for wastage creation');
    return res.status(400).json({ message: 'Item ID, quantity, and created_by are required.' });
  }

  // Get item price
  console.log(`Fetching item price for item_id: ${item_id}`);
  db.query('SELECT item_price FROM items WHERE item_id = ?', [item_id], (err, items) => {
    if (err) {
      console.error('Error fetching item price:', err.message, err.stack);
      return res.status(500).json({ message: 'Internal server error' });
    }
    const item = items[0];
    if (!item) {
      console.error(`Item not found for item_id: ${item_id}`);
      return res.status(404).json({ message: 'Item not found' });
    }
    console.log('Item price fetched:', item.item_price);

    const amount = item.item_price * quantity;
    console.log(`Calculated expense amount: ${amount}`);

    // Insert into wastage
    console.log('Inserting into wastage table...');
    db.query(
      `INSERT INTO wastage (item_id, quantity, reason, created_by)
       VALUES (?, ?, ?, ?)`,
      [item_id, quantity, reason, created_by],
      (err, wastageResult) => {
        if (err) {
          console.error('Error inserting wastage:', err.message, err.stack);
          return res.status(500).json({ message: 'Internal server error' });
        }
        console.log('Wastage inserted, result:', wastageResult);

        // Insert into expenses
        console.log('Inserting into expenses table...');
        db.query(
          `INSERT INTO expenses (type, amount, description, is_recurring)
           VALUES (?, ?, ?, ?)`,
          ['Wastage', amount, reason, 0],
          (err) => {
            if (err) {
              console.error('Error recording expense:', err.message, err.stack);
              return res.status(500).json({ message: 'Internal server error' });
            }
            console.log('Expense recorded successfully.');
            res.status(201).json({ message: 'Wastage and expense recorded successfully' });
          }
        );
      }
    );
  });
};

// READ all wastage records
exports.getAllWastage = (req, res) => {
  console.log('Attempting to fetch all wastage records.');
  db.query(
    `SELECT w.*, i.item_name, a.username
     FROM wastage w
     JOIN items i ON w.item_id = i.item_id
     LEFT JOIN admins a ON w.created_by = a.id
     ORDER BY w.created_at DESC`,
    (err, rows) => {
      if (err) {
        console.error('Error in getAllWastage:', err.message, err.stack);
        return res.status(500).json({ message: 'Internal server error' });
      }
      console.log(`Fetched ${rows.length} wastage records.`);
      res.json(rows);
    }
  );
};

// UPDATE wastage entry (only reason & quantity editable)
exports.updateWastage = (req, res) => {
  const { id } = req.params;
  console.log(`Attempting to update wastage record ID: ${id} with data:`, req.body);
  const { quantity, reason } = req.body;

  if (!quantity || quantity <= 0) {
    console.error('Validation error: Invalid quantity for update');
    return res.status(400).json({ message: 'Quantity must be a positive number.' });
  }

  // Get original item and quantity
  console.log(`Fetching original wastage record for ID: ${id}`);
  db.query(
    'SELECT w.*, i.item_price FROM wastage w JOIN items i ON w.item_id = i.item_id WHERE w.id = ?',
    [id],
    (err, originalRecords) => {
      if (err) {
        console.error('Error fetching original wastage record for update:', err.message, err.stack);
        return res.status(500).json({ message: 'Internal server error' });
      }
      const original = originalRecords[0];
      if (!original) {
        console.error(`Wastage record ID ${id} not found for update.`);
        return res.status(404).json({ message: 'Wastage record not found' });
      }
      console.log('Original record and item price fetched:', original.item_price);

      const newAmount = original.item_price * quantity;
      console.log(`Calculated new expense amount: ${newAmount}`);

      // Update wastage
      console.log('Updating wastage table...');
      db.query(
        `UPDATE wastage SET quantity = ?, reason = ? WHERE id = ?`,
        [quantity, reason, id],
        (err) => {
          if (err) {
            console.error('Error updating wastage:', err.message, err.stack);
            return res.status(500).json({ message: 'Internal server error' });
          }
          console.log('Wastage record updated.');

          // Update expense (assuming only one expense entry per wastage)
          console.log('Updating associated expense record...');
          db.query(
            `UPDATE expenses SET amount = ?, description = ? WHERE type = 'Wastage' AND description = ? LIMIT 1`,
            [newAmount, reason, original.reason],
            (err) => {
              if (err) {
                console.error('Error updating associated expense:', err.message, err.stack);
                return res.status(500).json({ message: 'Internal server error' });
              }
              console.log('Associated expense record updated.');
              res.json({ message: 'Wastage and expense updated successfully' });
            }
          );
        }
      );
    }
  );
};

// DELETE wastage entry
exports.deleteWastage = (req, res) => {
  const { id } = req.params;
  console.log(`Attempting to delete wastage record ID: ${id}`);

  // Get wastage record for expense deletion
  console.log(`Fetching wastage record for ID: ${id} before deletion.`);
  db.query(
    'SELECT * FROM wastage WHERE id = ?',
    [id],
    (err, records) => {
      if (err) {
        console.error('Error fetching wastage record for deletion:', err.message, err.stack);
        return res.status(500).json({ message: 'Internal server error' });
      }
      const record = records[0];
      if (!record) {
        console.error(`Wastage record ID ${id} not found for deletion.`);
        return res.status(404).json({ message: 'Wastage record not found' });
      }
      console.log('Record found:', record);

      // Delete expense
      console.log('Deleting associated expense record...');
      db.query(
        `DELETE FROM expenses WHERE type = 'Wastage' AND description = ? LIMIT 1`,
        [record.reason],
        (err) => {
          if (err) {
            console.error('Error deleting associated expense:', err.message, err.stack);
            return res.status(500).json({ message: 'Internal server error' });
          }
          console.log('Associated expense record deleted.');

          // Delete wastage
          console.log('Deleting wastage record...');
          db.query('DELETE FROM wastage WHERE id = ?', [id], (err) => {
            if (err) {
              console.error('Error deleting wastage:', err.message, err.stack);
              return res.status(500).json({ message: 'Internal server error' });
            }
            console.log('Wastage record deleted.');
            res.json({ message: 'Wastage and associated expense deleted successfully' });
          });
        }
      );
    }
  );
};