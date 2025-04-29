const express = require('express');
const router = express.Router();
const connection = require('../databasemenu');
const sanitizeHtml = require('sanitize-html');
const rateLimit = require('express-rate-limit');
const adminController = require('../controllers/adminController');
require('dotenv').config();

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many feedback submissions, please try again later.',
});

router.post('/', feedbackLimiter, (req, res) => {
  console.log('Received feedback request:', req.body);
  const { message } = req.body;

  if (!message || !message.trim()) {
    console.log('Validation failed: message is empty');
    return res.status(400).json({ error: 'Feedback message is required' });
  }
  if (message.trim().length > 500) {
    return res.status(400).json({ error: 'Feedback cannot exceed 500 characters' });
  }

  const sanitizedMessage = sanitizeHtml(message.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });

  const query = 'INSERT INTO feedback (message) VALUES (?)';
  connection.query(query, [sanitizedMessage], (error, results) => {
    if (error) {
      console.error('Error saving feedback:', error);
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }
    res.status(201).json({ message: 'Feedback submitted successfully' });
  });
});

router.get('/', adminController.verifyToken, (req, res) => {
  const query = 'SELECT id, message, created_at FROM feedback ORDER BY created_at DESC';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching feedback:', error);
      return res.status(500).json({ error: 'Failed to fetch feedback' });
    }
    res.json(results);
  });
});

// Delete a single feedback by ID
router.delete('/:id', adminController.verifyToken, (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM feedback WHERE id = ?';
  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Error deleting feedback:', error);
      return res.status(500).json({ error: 'Failed to delete feedback' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  });
});

// Delete all feedbacks
router.delete('/', adminController.verifyToken, (req, res) => {
  const query = 'DELETE FROM feedback';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error deleting all feedbacks:', error);
      return res.status(500).json({ error: 'Failed to delete all feedbacks' });
    }
    res.json({ message: 'All feedbacks deleted successfully' });
  });
});

module.exports = router;