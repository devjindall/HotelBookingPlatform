const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'hotel_booking_jwt_super_secret_key_2026_placement_ready';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // 1. Input Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name is required.', code: 'INVALID_NAME' }
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email is required.', code: 'INVALID_EMAIL' }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide a valid email address.', code: 'INVALID_EMAIL_FORMAT' }
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters long.', code: 'INVALID_PASSWORD_LENGTH' }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    // 2. Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'An account with this email address already exists.', code: 'EMAIL_ALREADY_EXISTS' }
      });
    }

    // 3. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Insert into database
    const [insertResult] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [trimmedName, normalizedEmail, passwordHash]
    );

    const newUserId = insertResult.insertId;

    // 5. Generate JWT token
    const token = jwt.sign(
      { id: newUserId, email: normalizedEmail, name: trimmedName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUserId,
        name: trimmedName,
        email: normalizedEmail
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login existing user
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required.', code: 'MISSING_CREDENTIALS' }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Fetch user from database
    const [users] = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' }
      });
    }

    const user = users[0];

    // 2. Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' }
      });
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get currently authenticated user profile
 * GET /api/auth/me (Protected)
 */
async function getMe(req, res, next) {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User account not found.', code: 'USER_NOT_FOUND' }
      });
    }

    res.status(200).json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe
};
