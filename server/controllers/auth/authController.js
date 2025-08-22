const jwt = require('jsonwebtoken');
const User = require('../../models/User');

/**
 * Generate a JWT token for user authentication
 * @param {string} userId - The user's ID to include in the token
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'skillsync-api',
      audience: 'skillsync-client'
    }
  );
};

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Registration failed',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      name: name || email.split('@')[0] // Use email prefix as default name
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Send response (password excluded by toJSON override)
    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Registration failed',
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error'
    });
  }
};

/**
 * Login a user and return JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Update user activity
    user.stats.lastActivity = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user,
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error'
    });
  }
};

/**
 * Refresh JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const refreshToken = async (req, res) => {
  try {
    // Generate new token
    const token = generateToken(req.user._id);

    res.json({
      message: 'Token refreshed successfully',
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  generateToken
};
