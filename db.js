const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost', // Ensure this is the correct host
  user: 'interactivemap', // Ensure this is the correct user
  password: 'interactive1234', // Ensure this is the correct password
  database: 'map', // Ensure this is the correct database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 // Increase connection timeout to 10 seconds
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
  connection.release();
});

module.exports = pool;
