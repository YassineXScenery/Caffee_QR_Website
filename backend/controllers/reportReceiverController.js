const db = require("../databasemenu");

exports.getReportReceivers = (req, res) => {
  // Test connection
  db.query('SELECT 1 AS test', (err, testResult) => {
    if (err) {
      console.error('Database connection test failed:', {
        message: err.message,
        code: err.code || 'N/A',
        sqlMessage: err.sqlMessage || 'N/A'
      });
      return res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
    console.log('Database connection test passed');

    // Check table existence
    db.query('SHOW TABLES LIKE "report_receivers"', (err, tables) => {
      if (err || !tables.length) {
        console.error('report_receivers table check failed:', err ? err.message : 'Table not found');
        return res.status(500).json({ error: 'Table report_receivers not found', details: err ? err.message : 'No table' });
      }

      db.query('SHOW TABLES LIKE "admins"', (err, adminTables) => {
        if (err || !adminTables.length) {
          console.error('admins table check failed:', err ? err.message : 'Table not found');
          return res.status(500).json({ error: 'Table admins not found', details: err ? err.message : 'No table' });
        }

        // Check columns
        db.query('DESCRIBE report_receivers', (err, receiverCols) => {
          if (err) {
            console.error('report_receivers describe failed:', err.message);
            return res.status(500).json({ error: 'Failed to verify report_receivers schema', details: err.message });
          }
          const requiredCols = ['id', 'admin_id', 'receive_daily', 'receive_monthly', 'receive_yearly'];
          const missingCols = requiredCols.filter(col => !receiverCols.some(c => c.Field === col));
          if (missingCols.length) {
            console.error('Missing columns in report_receivers:', missingCols);
            return res.status(500).json({ error: 'Missing columns in report_receivers', details: missingCols.join(', ') });
          }

          db.query('DESCRIBE admins', (err, adminCols) => {
            if (err) {
              console.error('admins describe failed:', err.message);
              return res.status(500).json({ error: 'Failed to verify admins schema', details: err.message });
            }
            const requiredAdminCols = ['id', 'username', 'email'];
            const missingAdminCols = requiredAdminCols.filter(col => !adminCols.some(c => c.Field === col));
            if (missingAdminCols.length) {
              console.error('Missing columns in admins:', missingAdminCols);
              return res.status(500).json({ error: 'Missing columns in admins', details: missingAdminCols.join(', ') });
            }

            // Main query
            db.query(
              `SELECT r.*, a.username, a.email 
               FROM report_receivers r
               JOIN admins a ON r.admin_id = a.id`,
              (err, rows) => {
                if (err) {
                  console.error('Error in getReportReceivers:', {
                    message: err.message,
                    code: err.code || 'N/A',
                    sqlMessage: err.sqlMessage || 'N/A'
                  });
                  return res.status(500).json({ error: 'Failed to load receivers', details: err.message });
                }
                console.log('getReportReceivers: Success, rows:', rows.length);
                res.json(rows);
              }
            );
          });
        });
      });
    });
  });
};

exports.addReportReceiver = (req, res) => {
  const { admin_id, receive_daily, receive_monthly, receive_yearly } = req.body;

  // Validate required fields
  if (!admin_id || receive_daily === undefined || receive_monthly === undefined || receive_yearly === undefined) {
    return res.status(400).json({ error: 'Missing required fields: admin_id, receive_daily, receive_monthly, receive_yearly' });
  }

  // Validate admin_id exists
  db.query('SELECT id FROM admins WHERE id = ?', [admin_id], (err, adminResult) => {
    if (err) {
      console.error('Error checking admin_id:', {
        message: err.message,
        code: err.code || 'N/A',
        sqlMessage: err.sqlMessage || 'N/A'
      });
      return res.status(500).json({ error: 'Failed to validate admin_id', details: err.message });
    }

    if (adminResult.length === 0) {
      return res.status(400).json({ error: `Invalid admin_id: ${admin_id} does not exist in admins table` });
    }

    // Check for existing receiver
    db.query('SELECT id FROM report_receivers WHERE admin_id = ?', [admin_id], (err, existing) => {
      if (err) {
        console.error('Error checking existing receiver:', {
          message: err.message,
          code: err.code || 'N/A',
          sqlMessage: err.sqlMessage || 'N/A'
        });
        return res.status(500).json({ error: 'Failed to check existing receiver', details: err.message });
      }

      if (existing.length > 0) {
        return res.status(400).json({ error: `Receiver already exists for admin_id: ${admin_id}` });
      }

      // Insert new receiver
      db.query(
        `INSERT INTO report_receivers (admin_id, receive_daily, receive_monthly, receive_yearly)
         VALUES (?, ?, ?, ?)`,
        [admin_id, receive_daily, receive_monthly, receive_yearly],
        (err, result) => {
          if (err) {
            console.error('Error inserting receiver:', {
              message: err.message,
              code: err.code || 'N/A',
              sqlMessage: err.sqlMessage || 'N/A'
            });
            return res.status(500).json({ error: 'Failed to add receiver', details: err.message });
          }
          console.log(`Inserted receiver for admin_id: ${admin_id}`);
          res.json({ success: true, message: 'Receiver added successfully', id: result.insertId });
        }
      );
    });
  });
};

exports.modifyReportReceiver = (req, res) => {
  const { id } = req.params;
  const { admin_id, receive_daily, receive_monthly, receive_yearly } = req.body;

  // Validate required fields
  if (!id) {
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }
  if (!admin_id || receive_daily === undefined || receive_monthly === undefined || receive_yearly === undefined) {
    return res.status(400).json({ error: 'Missing required fields: admin_id, receive_daily, receive_monthly, receive_yearly' });
  }

  // Validate receiver exists
  db.query('SELECT id FROM report_receivers WHERE id = ?', [id], (err, receiverResult) => {
    if (err) {
      console.error('Error checking receiver:', {
        message: err.message,
        code: err.code || 'N/A',
        sqlMessage: err.sqlMessage || 'N/A'
      });
      return res.status(500).json({ error: 'Failed to check receiver', details: err.message });
    }

    if (receiverResult.length === 0) {
      return res.status(404).json({ error: `Receiver with id ${id} not found` });
    }

    // Validate admin_id exists
    db.query('SELECT id FROM admins WHERE id = ?', [admin_id], (err, adminResult) => {
      if (err) {
        console.error('Error checking admin_id:', {
          message: err.message,
          code: err.code || 'N/A',
          sqlMessage: err.sqlMessage || 'N/A'
        });
        return res.status(500).json({ error: 'Failed to validate admin_id', details: err.message });
      }

      if (adminResult.length === 0) {
        return res.status(400).json({ error: `Invalid admin_id: ${admin_id} does not exist in admins table` });
      }

      // Check for duplicate admin_id (excluding current receiver)
      db.query(
        'SELECT id FROM report_receivers WHERE admin_id = ? AND id != ?',
        [admin_id, id],
        (err, duplicateResult) => {
          if (err) {
            console.error('Error checking duplicate admin_id:', {
              message: err.message,
              code: err.code || 'N/A',
              sqlMessage: err.sqlMessage || 'N/A'
            });
            return res.status(500).json({ error: 'Failed to check for duplicates', details: err.message });
          }

          if (duplicateResult.length > 0) {
            return res.status(400).json({ error: `Another receiver already exists for admin_id: ${admin_id}` });
          }

          // Update receiver
          db.query(
            `UPDATE report_receivers 
             SET admin_id = ?, receive_daily = ?, receive_monthly = ?, receive_yearly = ?, updated_at = NOW()
             WHERE id = ?`,
            [admin_id, receive_daily, receive_monthly, receive_yearly, id],
            (err, result) => {
              if (err) {
                console.error('Error updating receiver:', {
                  message: err.message,
                  code: err.code || 'N/A',
                  sqlMessage: err.sqlMessage || 'N/A'
                });
                return res.status(500).json({ error: 'Failed to update receiver', details: err.message });
              }
              if (result.affectedRows === 0) {
                return res.status(404).json({ error: `Receiver with id ${id} not found` });
              }
              console.log(`Updated receiver with id: ${id}`);
              res.json({ success: true, message: 'Receiver updated successfully' });
            }
          );
        }
      );
    });
  });
};

exports.deleteReportReceiver = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }

  // Check if receiver exists
  db.query('SELECT id FROM report_receivers WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error checking receiver:', {
        message: err.message,
        code: err.code || 'N/A',
        sqlMessage: err.sqlMessage || 'N/A'
      });
      return res.status(500).json({ error: 'Failed to check receiver', details: err.message });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: `Receiver with id ${id} not found` });
    }

    // Delete receiver
    db.query('DELETE FROM report_receivers WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting receiver:', {
          message: err.message,
          code: err.code || 'N/A',
          sqlMessage: err.sqlMessage || 'N/A'
        });
        return res.status(500).json({ error: 'Failed to delete receiver', details: err.message });
      }
      console.log(`Deleted receiver with id: ${id}`);
      res.json({ success: true, message: 'Receiver deleted successfully' });
    });
  });
};