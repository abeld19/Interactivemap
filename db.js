// Import the MySQL2 library for database connection pooling
const mysql = require('mysql2');

// Create a connection pool to manage multiple database connections efficiently
const pool = mysql.createPool({
  host: 'localhost',
  user: 'interactivemap',
  password: 'interactive1234',
  database: 'map',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
});

// Test the database connection when the application starts
pool.getConnection((err, connection) => {
  if (err) {
    // Log an error message if the connection fails
    console.error('Error connecting to MySQL:', err);
    return;
  }
  // Log a success message if the connection is successful
  console.log('Connected to MySQL');
  // Release the connection back to the pool
  connection.release();
});

// Export the connection pool for use in other parts of the application
module.exports = pool;
