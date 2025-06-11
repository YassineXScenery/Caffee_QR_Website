// Admin authentication middleware for Express routes
const { verifyToken } = require('../controllers/adminController');

module.exports = verifyToken;
