import jwt from "jsonwebtoken";

const { JWT_SECRET = "change-me" } = process.env;

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Optional: Middleware for refresh token validation
export function requireRefreshToken(req, res, next) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
}

// Optional authentication middleware: if a valid token is present (Authorization header or cookie)
// it populates `req.user`. If no token or an invalid token is present, it does NOT fail the request.
export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    // No token: continue as anonymous
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Invalid token: ignore and continue as anonymous (do not reject)
  }
  return next();
}