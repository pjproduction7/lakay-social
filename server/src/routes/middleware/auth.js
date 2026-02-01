// Basic authentication middleware example (ES module)
export function requireAuth(req, res, next) {
  // Example: check for a token in headers
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // You can add token verification logic here
  next();
}
