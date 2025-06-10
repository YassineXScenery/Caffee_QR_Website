const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../databasemenu');
const path = require('path');
const fs = require('fs');
const { UPLOADS_DIR } = require('../config/paths');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  console.log('Verifying token for request:', req.method, req.url);
  console.log('Token received:', token);

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Admin login
exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt with username:', username);

  if (!username || !password) {
    console.log('Missing username or password:', { username, password });
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    db.query("SELECT * FROM admins WHERE username = ?", [username], async (err, results) => {
      if (err) {
        console.error('Error finding admin:', err);
        return res.status(500).json({ error: 'Login failed' });
      }

      console.log('Database query results:', results);
      
      if (results.length === 0) {
        console.log('No admin found for username:', username);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const admin = results[0];
      console.log('Admin found:', { id: admin.id, username: admin.username, password: admin.password });

      const passwordMatch = await bcrypt.compare(password, admin.password);
      console.log('Password match result:', passwordMatch);
      
      if (!passwordMatch) {
        console.log('Password does not match for username:', username);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Login successful
      console.log('Login successful for username:', username);
      res.status(200).json({ 
        message: 'Login successful',
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          photo: admin.photo ? `uploads/${path.basename(admin.photo)}` : null
        }
      });
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error' });
  }
};

// Get all admins
exports.getAllAdmins = async (req, res) => {
  try {
    db.query("SELECT id, username, photo FROM admins", (err, results) => {
      if (err) {
        console.error('Error fetching admins:', err);
        return res.status(500).json({ error: 'Failed to fetch admins' });
      }
      // Map results to ensure photo URLs are correct
      const adminsWithPhotos = results.map(admin => {
        let photoPath = null;
        if (admin.photo) {
          photoPath = `uploads/${path.basename(admin.photo)}`;
          // Verify file exists
          const fullPath = path.join(UPLOADS_DIR, path.basename(photoPath));
          if (!fs.existsSync(fullPath)) {
            console.warn(`Photo file not found for admin ${admin.username}:`, fullPath);
            photoPath = null;
          }
        }
        console.log(`Processing admin ${admin.username} with photo path:`, photoPath);
        return {
          ...admin,
          photo: photoPath
        };
      });
      
      console.log('Returning admins with photos:', adminsWithPhotos);
      res.json(adminsWithPhotos);
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error' });
  }
};

// Add a new admin
exports.addAdmin = async (req, res) => {
  const { username, password, photo } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Validate photo path if provided
    let photoPath = null;
    if (photo) {
      const normalizedPhoto = `uploads/${path.basename(photo)}`;
      const fullPath = path.join(UPLOADS_DIR, path.basename(normalizedPhoto));
      if (!fs.existsSync(fullPath)) {
        return res.status(400).json({ error: 'Photo file not found' });
      }
      photoPath = normalizedPhoto;
    }

    db.query(
      "INSERT INTO admins (username, password, photo) VALUES (?, ?, ?)",
      [username, hashedPassword, photoPath],
      (err, result) => {
        if (err) {
          console.error('Error adding admin:', err);
          return res.status(500).json({ error: 'Failed to add admin' });
        }
        res.status(201).json({ message: `Admin '${username}' added successfully`, id: result.insertId });
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error' });
  }
};

// Modify an admin
exports.modifyAdmin = async (req, res) => {
  const { id } = req.params;
  const { username, password, photo } = req.body;

  console.log('Update request received:', { id, username, photo });

  try {
    db.query("SELECT * FROM admins WHERE id = ?", [id], async (err, results) => {
      if (err) {
        console.error('Error finding admin:', err);
        return res.status(500).json({ error: 'Failed to find admin' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const admin = results[0];
      const updates = {};
      if (username) updates.username = username;
      if (password) updates.password = await bcrypt.hash(password, 10);

      // Handle photo updates
      if (typeof photo !== 'undefined') {
        if (photo === null) {
          // Remove existing photo
          if (admin.photo) {
            const oldPhotoPath = path.join(UPLOADS_DIR, path.basename(admin.photo));
            try {
              if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
                console.log('Deleted old photo:', oldPhotoPath);
              }
            } catch (err) {
              console.error('Error deleting old photo:', err);
            }
          }
          updates.photo = null;
        } else {
          // Validate new photo path
          const normalizedPhoto = `uploads/${path.basename(photo)}`;
          const fullPath = path.join(UPLOADS_DIR, path.basename(normalizedPhoto));
          if (fs.existsSync(fullPath)) {
            // Delete old photo if it exists and is different
            if (admin.photo && admin.photo !== normalizedPhoto) {
              const oldPhotoPath = path.join(UPLOADS_DIR, path.basename(admin.photo));
              try {
                if (fs.existsSync(oldPhotoPath)) {
                  fs.unlinkSync(oldPhotoPath);
                  console.log('Deleted old photo:', oldPhotoPath);
                }
              } catch (err) {
                console.error('Error deleting old photo:', err);
              }
            }
            updates.photo = normalizedPhoto;
          } else {
            return res.status(400).json({ error: 'Photo file not found' });
          }
        }
      }

      console.log('Photo field being processed for update:', updates.photo);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      db.query(
        "UPDATE admins SET ? WHERE id = ?",
        [updates, id],
        (err, result) => {
          if (err) {
            console.error('Error updating admin:', err);
            return res.status(500).json({ error: 'Failed to update admin' });
          }
          res.status(200).json({ message: `Admin ID ${id} updated successfully` });
        }
      );
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error' });
  }
};

// Remove an admin
exports.removeAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    db.query("SELECT * FROM admins WHERE id = ?", [id], (err, results) => {
      if (err) {
        console.error('Error finding admin:', err);
        return res.status(500).json({ error: 'Failed to find admin' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      db.query("DELETE FROM admins WHERE id = ?", [id], (err, result) => {
        if (err) {
          console.error('Error removing admin:', err);
          return res.status(500).json({ error: 'Failed to remove admin' });
        }
        res.status(200).json({ message: `Admin ID ${id} removed successfully` });
      });
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error' });
  }
};