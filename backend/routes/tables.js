const express = require('express');
const router = express.Router();
const db = require('../databasemenu');
const adminController = require('../controllers/adminController');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Promisify db.query for async/await
const query = util.promisify(db.query).bind(db);

// Helper function to generate QR code for a table
async function generateQRCodeForTable(tableNumber) {
  const url = `http://localhost:3001/?table=${tableNumber}`; // Updated URL
  const filename = `table_${tableNumber}.png`;
  const dir = path.join(__dirname, '../uploads/qrcodes');
  const filepath = path.join(dir, filename);
  const relativePath = `/uploads/qrcodes/${filename}`; // Lowercase 'uploads'

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Skip if file already exists
  if (fs.existsSync(filepath)) {
    return relativePath;
  }

  try {
    await qrcode.toFile(filepath, url, { errorCorrectionLevel: 'H' });
    return relativePath;
  } catch (err) {
    console.error(`Error generating QR code for table ${tableNumber}:`, err);
    throw new Error('Failed to generate QR code');
  }
}

// Get all tables
router.get('/', async (req, res) => {
  try {
    const results = await query('SELECT * FROM tables');
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Create new tables
router.post('/', adminController.verifyToken, async (req, res) => {
  try {
    const { numberOfTables } = req.body;
    if (!numberOfTables || isNaN(numberOfTables) || numberOfTables < 1 || numberOfTables > 100) {
      return res.status(400).json({ error: 'Invalid number of tables. Must be between 1 and 100.' });
    }

    // Get the current highest table number
    const [result] = await query('SELECT MAX(table_number) as maxTable FROM tables');
    const maxTable = result.maxTable || 0;
    const newTables = [];
    for (let i = maxTable + 1; i <= maxTable + numberOfTables; i++) {
      newTables.push([i]);
    }

    // Insert new tables
    await query('INSERT INTO tables (table_number) VALUES ?', [newTables]);

    // Generate QR codes and update database
    const qrPromises = newTables.map(async ([tableNumber]) => {
      const qrPath = await generateQRCodeForTable(tableNumber);
      await query('UPDATE tables SET qr_code_path = ? WHERE table_number = ?', [qrPath, tableNumber]);
    });
    await Promise.all(qrPromises);

    res.status(201).json({ message: `${numberOfTables} table(s) created successfully` });
  } catch (err) {
    console.error('Error creating tables or generating QR codes:', err);
    res.status(500).json({ error: 'Failed to create tables' });
  }
});

// Generate QR codes for existing tables
router.post('/generate-qr-codes', adminController.verifyToken, async (req, res) => {
  try {
    const tables = await query('SELECT table_number FROM tables WHERE qr_code_path IS NULL OR qr_code_path LIKE "%yourrestaurant.com%"');
    if (tables.length === 0) {
      return res.status(200).json({ message: 'No tables need QR code generation' });
    }

    const qrPromises = tables.map(async ({ table_number }) => {
      const qrPath = await generateQRCodeForTable(table_number);
      await query('UPDATE tables SET qr_code_path = ? WHERE table_number = ?', [qrPath, table_number]);
    });
    await Promise.all(qrPromises);

    res.status(200).json({ message: `QR codes generated for ${tables.length} table(s)` });
  } catch (err) {
    console.error('Error generating QR codes for existing tables:', err);
    res.status(500).json({ error: 'Failed to generate QR codes' });
  }
});

// Delete a table
router.delete('/:tableNumber', adminController.verifyToken, async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.tableNumber);
    const result = await query('DELETE FROM tables WHERE table_number = ?', [tableNumber]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    // Delete the QR code file
    const qrPath = path.join(__dirname, '../uploads/qrcodes', `table_${tableNumber}.png`);
    if (fs.existsSync(qrPath)) {
      fs.unlinkSync(qrPath);
    }
    res.status(200).json({ message: 'Table deleted successfully' });
  } catch (err) {
    console.error('Error deleting table:', err);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

// Delete all tables
router.delete('/', adminController.verifyToken, async (req, res) => {
  try {
    // Delete all QR code files
    const dir = path.join(__dirname, '../uploads/qrcodes');
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => fs.unlinkSync(path.join(dir, file)));
    }
    await query('DELETE FROM tables');
    res.status(200).json({ message: 'All tables deleted successfully' });
  } catch (err) {
    console.error('Error deleting all tables:', err);
    res.status(500).json({ error: 'Failed to delete all tables' });
  }
});

module.exports = router;