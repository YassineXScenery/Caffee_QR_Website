const express = require('express');
const router = express.Router();
const db = require('../databasemenu');
const util = require('util');

// Promisify db.query
const query = util.promisify(db.query).bind(db);

// Ensure call_waiter tables exist
const ensureTablesExist = async () => {
  const createLogsTableQuery = `
    CREATE TABLE IF NOT EXISTS call_waiter_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      table_number INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  const createRequestsTableQuery = `
    CREATE TABLE IF NOT EXISTS call_waiter_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      table_number INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  try {
    await Promise.all([
      query(createLogsTableQuery),
      query(createRequestsTableQuery)
    ]);
    console.log('Call waiter tables ensured');
  } catch (err) {
    console.error('Error creating call waiter tables:', err);
    throw err;
  }
};

// Initialize tables
ensureTablesExist();

// POST /callwaiter - Handle waiter call from menu
// This will be accessible at /api/call-waiter/callwaiter
router.post('/callwaiter', async (req, res) => {
  console.log('Call waiter endpoint hit:', req.body);
  console.log('Request URL:', req.originalUrl);
  console.log('Request method:', req.method);
  
  const { table_number } = req.body;

  if (!table_number || isNaN(table_number) || table_number < 1) {
    console.log('Invalid table number:', table_number);
    return res.status(400).json({ error: 'Invalid table number' });
  }

  try {
    // Skip table validation if tables table is empty
    const tableCount = await query('SELECT COUNT(*) as count FROM tables');
    console.log('Table count check:', tableCount[0].count);
    
    if (tableCount[0].count > 0) {
      const tables = await query('SELECT table_number FROM tables WHERE table_number = ?', [table_number]);
      if (tables.length === 0) {
        console.log('Table does not exist:', table_number);
        return res.status(400).json({ error: `Table ${table_number} does not exist` });
      }
    }

    console.log('Inserting call waiter request for table:', table_number);

    // Insert into call_waiter_logs
    const result = await query(
      'INSERT INTO call_waiter_logs (table_number) VALUES (?)',
      [table_number]
    );

    // Insert into call_waiter_requests for CallWaiterManagement.js
    await query(
      'INSERT INTO call_waiter_requests (table_number) VALUES (?)',
      [table_number]
    );

    console.log('Database inserts successful, log ID:', result.insertId);

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      const newRequest = {
        id: result.insertId,
        tableNumber: parseInt(table_number),
        createdAt: new Date().toISOString(),
      };
      io.emit('waiterCalled', newRequest);
      console.log('Socket.IO event emitted:', newRequest);
    } else {
      console.warn('Socket.IO instance not found on app');
    }

    res.status(201).json({ message: `Waiter has been notified for table ${table_number}` });
  } catch (err) {
    console.error('Error processing waiter call:', err);
    res.status(500).json({ error: 'Failed to save waiter call' });
  }
});

// GET / - Load requests for CallWaiterManagement.js
router.get('/', async (req, res) => {
  console.log('GET / endpoint hit');
  try {
    const results = await query('SELECT * FROM call_waiter_requests ORDER BY created_at DESC');
    const requests = results.map((row) => ({
      id: row.id,
      tableNumber: row.table_number,
      createdAt: row.created_at.toISOString(),
    }));
    console.log('Returning requests:', requests.length);
    res.status(200).json(requests);
  } catch (err) {
    console.error('Failed to load call waiter requests:', err);
    res.status(500).json({ error: 'Failed to load call waiter requests' });
  }
});

// DELETE /:id - Delete a specific request
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  console.log('DELETE /:id endpoint hit for ID:', id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid request ID' });
  }

  try {
    const result = await query('DELETE FROM call_waiter_requests WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      console.log('Request not found for ID:', id);
      return res.status(404).json({ error: 'Request not found' });
    }
    console.log('Request deleted successfully:', id);
    res.status(200).json({ message: 'Request cleared' });
  } catch (err) {
    console.error('Error deleting call waiter request:', err);
    res.status(500).json({ error: 'Failed to delete call waiter request' });
  }
});

// DELETE / - Delete all requests
router.delete('/', async (req, res) => {
  console.log('DELETE / endpoint hit - clearing all requests');
  try {
    const result = await query('DELETE FROM call_waiter_requests');
    console.log('All requests deleted, affected rows:', result.affectedRows);
    res.status(200).json({ message: 'All call waiter requests deleted successfully' });
  } catch (err) {
    console.error('Error deleting all call waiter requests:', err);
    res.status(500).json({ error: 'Failed to delete all call waiter requests' });
  }
});

// Add a test endpoint to verify the route is working
router.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Call waiter route is working', timestamp: new Date().toISOString() });
});

module.exports = router;