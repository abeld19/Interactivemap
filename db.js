const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'interactivemap',
  password: 'interactive1234',
  database: 'map',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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
