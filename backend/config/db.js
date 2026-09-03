const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool with promise wrapper
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hotel_booking_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true, // Parse DECIMAL columns as numbers rather than strings
  timezone: '+00:00'
});

/**
 * Tests database connectivity on server startup
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL database: ${process.env.DB_NAME || 'hotel_booking_db'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[Database] Connection Error:', error.message);
    console.error('Please verify that MySQL Server is running and credentials in backend/.env are correct.');
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
