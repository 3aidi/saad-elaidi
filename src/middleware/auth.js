const jwt = require('jsonwebtoken');

const isProd = process.env.NODE_ENV === 'production';
if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production')) {
  throw new Error('JWT_SECRET must be set in production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

function authenticateToken(req, res, next) {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function generateToken(adminId, username) {
  return jwt.sign(
    { id: adminId, username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

module.exports = {
  authenticateToken,
  generateToken,
  JWT_SECRET,
  JWT_EXPIRY
};
