const express = require('express');
const router = express.Router();
const db = require('../databasemenu');
const adminController = require('../controllers/adminController');

// Load requests from the database
const loadRequests = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM call_waiter_requests', (err, results) => {
      if (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        const requests = results.map((row) => ({
          id: row.id,
          tableNumber: row.table_number,
          createdAt: row.created_at.toISOString(),
        }));
        resolve(requests);
      }
    });
  });
};

router.get('/', async (req, res) => {
  try {
    const requests = await loadRequests();
    res.status(200).json(requests);
  } catch (err) {
    console.error('Failed to load call waiter requests:', err);
    res.status(500).json({ error: 'Failed to load call waiter requests' });
  }
});

// Protect POST (create call-waiter request) with admin authentication, keep GET public
router.post('/', adminController.verifyToken, (req, res, next) => next(), (req, res) => {
  const { tableNumber } = req.body;

  if (!tableNumber || isNaN(tableNumber) || tableNumber < 1) {
    return res.status(400).json({ error: 'Invalid table number' });
  }

  // Validate table number against existing tables
  db.query('SELECT table_number FROM tables WHERE table_number = ?', [tableNumber], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ error: 'Tables are not set up in the database' });
      }
      return res.status(500).json({ error: 'Failed to validate table number' });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: `Table ${tableNumber} does not exist` });
    }

    // Insert the new request into the database
    const createdAt = new Date();
    db.query(
      'INSERT INTO call_waiter_requests (table_number, created_at) VALUES (?, ?)',
      [tableNumber, createdAt],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ error: 'Call waiter requests table is not set up' });
          }
          return res.status(500).json({ error: 'Failed to save call waiter request' });
        }

        const newRequest = {
          id: result.insertId,
          tableNumber: parseInt(tableNumber),
          createdAt: createdAt.toISOString(),
        };

        // Emit the event using Socket.IO
        const io = req.app.get('io');
        io.emit('waiterCalled', newRequest); // Changed event name to match client expectation

        res.status(201).json(newRequest);
      }
    );
  });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`Deleting call waiter request with ID: ${id}`);

  // Check if the request exists
  db.query('SELECT * FROM call_waiter_requests WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error checking call waiter request:', err);
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(404).json({ error: 'No call waiter requests found. Please ensure the database is set up correctly.' });
      }
      return res.status(500).json({ error: 'Failed to delete call waiter request' });
    }

    if (results.length === 0) {
      console.log(`Call waiter request with ID ${id} not found`);
      return res.status(404).json({ error: 'Request not found' });
    }

    // Delete the request from the database
    db.query('DELETE FROM call_waiter_requests WHERE id = ?', [id], (err) => {
      if (err) {
        console.error('Error deleting call waiter request:', err);
        return res.status(500).json({ error: 'Failed to delete call waiter request' });
      }

      console.log(`Call waiter request with ID ${id} deleted`);
      res.status(200).json({ message: 'Request cleared' });
    });
  });
});

// Delete all call waiter requests
router.delete('/', (req, res) => {
  db.query('DELETE FROM call_waiter_requests', (err, result) => {
    if (err) {
      console.error('Error deleting all call waiter requests:', err);
      return res.status(500).json({ error: 'Failed to delete all call waiter requests' });
    }
    res.status(200).json({ message: 'All call waiter requests deleted successfully' });
  });
});

module.exports = router;