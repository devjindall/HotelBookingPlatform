const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, error: { message: 'Server authentication is not configured.', code: 'AUTH_CONFIG_ERROR' } });
    }

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

    const passwordHash = await bcrypt.hash(password, 10);

    const [insertResult] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [trimmedName, normalizedEmail, passwordHash]
    );

    const newUserId = insertResult.insertId;

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

    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, error: { message: 'Server authentication is not configured.', code: 'AUTH_CONFIG_ERROR' } });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required.', code: 'MISSING_CREDENTIALS' }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

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
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' }
      });
    }

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
