const express = require('express');
const router = express.Router();
const db = require('../databasemenu'); // Import the database connection

// Get all tables
router.get('/', (req, res) => {
  db.query('SELECT * FROM tables', (err, results) => {
    if (err) {
      console.error('Error fetching tables:', err);
      return res.status(500).json({ error: 'Failed to fetch tables' });
    }
    res.status(200).json(results);
  });
});

// Create new tables
router.post('/', (req, res) => {
  const { numberOfTables } = req.body;
  if (!numberOfTables || isNaN(numberOfTables) || numberOfTables < 1 || numberOfTables > 100) {
    return res.status(400).json({ error: 'Invalid number of tables. Must be between 1 and 100.' });
  }

  // Get the current highest table number
  db.query('SELECT MAX(table_number) as maxTable FROM tables', (err, result) => {
    if (err) {
      console.error('Error fetching max table number:', err);
      return res.status(500).json({ error: 'Failed to create tables' });
    }

    const maxTable = result[0].maxTable || 0;
    const newTables = [];
    for (let i = maxTable + 1; i <= maxTable + numberOfTables; i++) {
      newTables.push([i]);
    }

    // Insert new tables
    db.query('INSERT INTO tables (table_number) VALUES ?', [newTables], (err) => {
      if (err) {
        console.error('Error creating tables:', err);
        return res.status(500).json({ error: 'Failed to create tables' });
      }
      res.status(201).json({ message: `${numberOfTables} table(s) created successfully` });
    });
  });
});

// Delete a table
router.delete('/:tableNumber', (req, res) => {
  const tableNumber = parseInt(req.params.tableNumber);
  db.query('DELETE FROM tables WHERE table_number = ?', [tableNumber], (err, result) => {
    if (err) {
      console.error('Error deleting table:', err);
      return res.status(500).json({ error: 'Failed to delete table' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.status(200).json({ message: 'Table deleted successfully' });
  });
});

// Delete all tables
router.delete('/', (req, res) => {
  db.query('DELETE FROM tables', (err, result) => {
    if (err) {
      console.error('Error deleting all tables:', err);
      return res.status(500).json({ error: 'Failed to delete all tables' });
    }
    res.status(200).json({ message: 'All tables deleted successfully' });
  });
});

module.exports = router;