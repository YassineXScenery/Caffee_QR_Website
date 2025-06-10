const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../uploadMiddleware');
const path = require('path');
const fs = require('fs');
const { UPLOADS_DIR } = require('../config/paths');

// Admin management routes (protected by verifyToken)
router.get('/', adminController.verifyToken, adminController.getAllAdmins);
router.post('/', adminController.verifyToken, adminController.addAdmin);
router.put('/:id', adminController.verifyToken, adminController.modifyAdmin);
router.delete('/:id', adminController.verifyToken, adminController.removeAdmin);
router.post('/login', adminController.loginAdmin);

// Route for uploading admin photo
router.post('/upload-photo', adminController.verifyToken, upload.single('photo'), (req, res) => {
  console.log('Upload photo request received:', {
    file: req.file,
    body: req.body,
    headers: req.headers,
  });

  if (!req.file) {
    console.error('No file in request');
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    // Store the relative path for the image
    const photoUrl = `uploads/${req.file.filename}`;
    console.log('Generated photo URL:', photoUrl);

    // Verify the file exists and is readable
    const fullPath = path.join(UPLOADS_DIR, req.file.filename);
    console.log('Checking uploaded file:', {
      filename: req.file.filename,
      fullPath,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    const stats = fs.statSync(fullPath);
    if (!stats.isFile() || stats.size === 0) {
      throw new Error('Invalid file');
    }
    console.log('File successfully saved and verified:', {
      path: fullPath,
      size: stats.size,
    });

    // Return the photo URL
    res.json({ filename: photoUrl });
  } catch (error) {
    console.error('Error during upload processing:', error);
    res.status(500).json({ error: 'File upload processing failed' });
  }
});

module.exports = router;