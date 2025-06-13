const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const socketIo = require('socket.io');
const http = require('http');
const schedule = require('node-schedule');
const db = require('./databasemenu');
const tableRoutes = require('./routes/tables');
const adminRoutes = require('./routes/admin');
const itemRoutes = require('./routes/items');
const categoryRoutes = require('./routes/menu');
const callWaiterRoutes = require('./routes/call-waiter');
const feedbackRoutes = require('./routes/feedback'); // Import feedback routes
const footerRoutes = require('./routes/footer'); // Import footer routes
const stockRoutes = require('./routes/stock');
const expensesRoutes = require('./routes/expenses');
const analyticsRoutes = require('./routes/analytics');
const sendReportRoute = require('./routes/sendReport');
const reportReceiverRoutes = require('./routes/reportReceiverRoutes');
console.log('sendReport route imported');
require('dotenv').config();
require('./controllers/autoSendReports');




const app = express();
const server = http.createServer(app);

// Configure CORS for Express with more specific options
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? '*' : ['http://localhost:3001', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true
}));

// Configure Socket.IO with CORS and connection stability options
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  maxHttpBufferSize: 1e6,
  pingTimeout: 20000,
  pingInterval: 25000,
});

// Attach io to the app so routes can access it
app.set('io', io);

const PORT = 3000;
const JWT_SECRET = 'your_jwt_secret_key';
const fs = require('fs');
const { UPLOADS_DIR } = require('./config/paths');

// Set up and validate uploads directory
const { validateUploadsDir } = require('./config/paths');
const uploadsPath = validateUploadsDir();
console.log('Uploads directory validated at:', uploadsPath);

// Log all requests to /uploads for debugging
app.use('/uploads', (req, res, next) => {
  console.log('Static file request:', {
    originalUrl: req.originalUrl,
    path: req.path,
    method: req.method,
    url: req.url,
    filepath: path.join(UPLOADS_DIR, req.path)
  });
  next();
});

// Serve uploads folder statically with error handling
app.use('/uploads', express.static(UPLOADS_DIR, {
  fallthrough: false // Return 404 if file doesn't exist
}));

// Add cache-busting headers for static files
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Serve the public directory for static files
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.use(express.json());
console.log(`Serving static files from: ${UPLOADS_DIR}`);

app.use('/api/tables', tableRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/menu', categoryRoutes);
app.use('/api/call-waiter', callWaiterRoutes);
app.use('/api/feedback', feedbackRoutes); // Mount feedback routes
app.use('/api/footer', footerRoutes); // Mount footer routes
app.use('/api/stock', stockRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/send-report', sendReportRoute);
app.use('/api', reportReceiverRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Schedule cleanup of old call waiter requests (daily at midnight)
schedule.scheduleJob('0 0 * * *', () => {
  db.query('DELETE FROM call_waiter_requests WHERE created_at < NOW() - INTERVAL 1 DAY', (err) => {
    if (err) {
      console.error('Error cleaning up old requests:', err);
    } else {
      console.log('Old call waiter requests cleaned up');
    }
  });
});

// Schedule processing of recurring expenses (daily at 1:00 AM)
schedule.scheduleJob('0 1 * * *', async () => {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  db.query(
    `SELECT * FROM expenses WHERE is_recurring = 1 AND active = 1 AND recurring_next_due_date IS NOT NULL AND recurring_next_due_date <= ?`,
    [todayStr],
    (err, recs) => {
      if (err) {
        console.error('Error fetching recurring expenses:', err);
        return;
      }
      if (!recs.length) return;
      recs.forEach(rec => {
        // Insert a new expense instance (not recurring, just a record)
        db.query(
          'INSERT INTO expenses (type, amount, description, expense_date, is_recurring) VALUES (?, ?, ?, ?, 0)',
          [rec.type, rec.amount, rec.description || '', rec.recurring_next_due_date],
          (err) => {
            if (err) console.error('Error inserting recurring expense instance:', rec.id, err);
          }
        );
        // Calculate next due date
        let nextDue = new Date(rec.recurring_next_due_date);
        switch (rec.recurring_frequency) {
          case 'daily':
            nextDue.setDate(nextDue.getDate() + 1);
            break;
          case 'weekly':
            nextDue.setDate(nextDue.getDate() + 7);
            break;
          case 'monthly':
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
          case 'yearly':
            nextDue.setFullYear(nextDue.getFullYear() + 1);
            break;
        }
        // If recurring_end_date exists and nextDue > recurring_end_date, deactivate
        let deactivate = false;
        if (rec.recurring_end_date && nextDue > new Date(rec.recurring_end_date)) {
          deactivate = true;
        }
        db.query(
          'UPDATE expenses SET recurring_next_due_date = ?, active = ? WHERE id = ?',
          [nextDue.toISOString().slice(0, 10), deactivate ? 0 : 1, rec.id],
          (err) => {
            if (err) console.error('Error updating recurring expense:', rec.id, err);
          }
        );
      });
    }
  );
});

app.get('/', (req, res) => {
  res.send('Cafe Menu API');
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});