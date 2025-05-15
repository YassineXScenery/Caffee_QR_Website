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

const app = express();
const server = http.createServer(app);

// Configure CORS for Express - Allow all origins for debugging
app.use(cors({
  origin: '*',
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
const UPLOADS_DIR = path.join(__dirname, 'Uploads');

app.use(express.json());
app.use('/Uploads', express.static(UPLOADS_DIR));
console.log(`Serving static files from: ${UPLOADS_DIR}`);

app.use('/api/tables', tableRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/menu', categoryRoutes);
app.use('/api/call-waiter', callWaiterRoutes);
app.use('/api/feedback', feedbackRoutes); // Mount feedback routes
app.use('/api/footer', footerRoutes); // Mount footer routes

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

app.get('/', (req, res) => {
  res.send('Cafe Menu API');
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});