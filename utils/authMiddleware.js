const crypto = require('crypto');
const UserStore = require('./userStore');

/**
 * Enhanced session-based authentication for analytics dashboard
 * Now supports user accounts with role-based access
 */
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours for regular users
    this.ADMIN_SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours for admin
    this.CLEANUP_INTERVAL = 60 * 1000; // 1 minute
    this.startCleanupInterval();
  }

  /**
   * Generate a secure session ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new session with user info
   */
  createSession(userId, email, firstName, role = 'manager') {
    const sessionId = this.generateSessionId();
    const isAdmin = role === 'admin';
    const sessionDuration = isAdmin ? this.ADMIN_SESSION_DURATION : this.SESSION_DURATION;
    const expiresAt = Date.now() + sessionDuration;

    this.sessions.set(sessionId, {
      userId,
      email,
      firstName,
      role,
      createdAt: Date.now(),
      expiresAt,
      lastActivity: Date.now()
    });

    return sessionId;
  }

  /**
   * Validate a session
   */
  isValidSession(sessionId) {
    if (!sessionId || !this.sessions.has(sessionId)) {
      return false;
    }

    const session = this.sessions.get(sessionId);
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return false;
    }

    // Update last activity
    session.lastActivity = Date.now();
    return true;
  }

  /**
   * Get session data
   */
  getSession(sessionId) {
    if (this.isValidSession(sessionId)) {
      return this.sessions.get(sessionId);
    }
    return null;
  }

  /**
   * Invalidate a session
   */
  invalidateSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Auth] Cleaned up ${cleaned} expired sessions`);
    }
  }

  /**
   * Start automatic cleanup
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop cleanup
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global session manager
const sessionManager = new SessionManager();

/**
 * Middleware to check authentication
 */
function authMiddleware(req, res, next) {
  const sessionId = req.headers['x-session-id'];

  if (!sessionId || !sessionManager.isValidSession(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = sessionManager.getSession(sessionId);
  req.sessionId = sessionId;
  req.user = {
    userId: session.userId,
    email: session.email,
    firstName: session.firstName,
    role: session.role
  };

  next();
}

/**
 * Middleware to check admin access
 */
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  next();
}

/**
 * Login handler - uses email and password
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const userStore = new UserStore();

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user by email
    const user = await userStore.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is approved
    if (user.status !== 'approved') {
      return res.status(401).json({ error: 'Account pending approval. Please contact administrator.' });
    }

    // Verify password
    const isPasswordValid = await userStore.verifyPassword(user.id, password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await userStore.updateLastLogin(user.id);

    // Create session
    const sessionId = sessionManager.createSession(user.id, user.email, user.firstName, user.role);

    return res.json({
      success: true,
      sessionId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      expiresIn: (user.role === 'admin'
        ? sessionManager.ADMIN_SESSION_DURATION
        : sessionManager.SESSION_DURATION) / 1000 // In seconds
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Registration handler
 */
async function register(req, res) {
  try {
    const { email, firstName, lastName, dateOfBirth, password, confirmPassword } = req.body;
    const userStore = new UserStore();

    // Validate input
    if (!email || !firstName || !lastName || !dateOfBirth || !password) {
      return res.status(400).json({ error: 'Email, first name, last name, date of birth, and password required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Create user
    const user = await userStore.createUser(email, firstName, lastName, dateOfBirth, password);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending admin approval.',
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific error cases
    if (error.message.includes('already exists') || error.message.includes('already registered')) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes('must be') || error.message.includes('must be a valid')) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Registration failed' });
  }
}

/**
 * Logout handler
 */
function logout(req, res) {
  if (req.sessionId) {
    sessionManager.invalidateSession(req.sessionId);
  }

  return res.json({ success: true });
}

module.exports = {
  sessionManager,
  UserStore,
  authMiddleware,
  adminMiddleware,
  login,
  register,
  logout
};
