const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const adminController = require('./controllers/adminController');
const adminRoutes = require('./routes/admin');

const app = express();

// Enable CORS for requests from the frontend
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to parse JSON and form-data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure the uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created uploads directory at:', uploadsDir);
}

// Serve static files from the uploads folder with additional logging
app.use('/uploads', (req, res, next) => {
  console.log(`Requesting file: ${req.path} from directory: ${uploadsDir}`);
  next();
}, express.static(uploadsDir));
console.log('Serving static files from:', uploadsDir);

// Routes
app.use('/api/items', require('./routes/items'));
app.use('/api/menu', require('./routes/menu'));

// Define the login route separately without verifyToken
app.post('/api/admins/login', adminController.loginAdmin);

// Apply verifyToken middleware to other admin routes
app.use('/api/admins', adminController.verifyToken, adminRoutes);

// Fallback for 404 errors
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});