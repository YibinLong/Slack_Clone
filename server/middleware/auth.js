/**
 * Authentication middleware
 * This checks if users are logged in before allowing access to protected routes
 */

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Get the token from the Authorization header
  // Format: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token after "Bearer "

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Add user information to the request object
    // This way, other parts of our app can access the logged-in user's info
    req.user = user;
    next(); // Continue to the next middleware or route handler
  });
};

module.exports = { authenticateToken };
