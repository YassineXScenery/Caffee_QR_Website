const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',     // Your database host
  user: 'root',          // Your database username
  password: '123456789ya', // Your database password
  database: 'menu_db'   // Your database name
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to database as id ' + connection.threadId);
});

module.exports = connection;