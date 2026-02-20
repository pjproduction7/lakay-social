import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import messageRoutes from "./routes/messages.js";
import postRoutes from "./routes/posts.js";
import adminRoutes from "./routes/admin.js";
import notificationsRoutes from "./routes/notifications.js";
import pushRoutes from "./routes/push.js";
import subscriptionsRoutes from "./routes/subscriptions.js";
import { query } from "./db.js";
// Redis client setup (optional)
import { createClient } from 'redis';
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.connect()
    .then(() => console.log('Connected to Redis'))
    .catch((err) => console.error('Failed to connect to Redis:', err.message));
} else {
  console.warn('REDIS_URL not set. Redis will be disabled.');
}

// Docker secret usage example
import fs from 'fs';
const secretPath = '/run/secrets/lakay_secret';
let lakaySecret = null;
if (fs.existsSync(secretPath)) {
  lakaySecret = fs.readFileSync(secretPath, 'utf8').trim();
  console.log('Loaded Docker secret: lakay_secret');
}


dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;

// Trust Railway/hosting proxy so rate limiting uses correct client IPs
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', env: process.env.NODE_ENV || 'development', uptime: Math.round(process.uptime()) });
});

// Example: Use Redis in a route (optional)
app.get('/redis-test', async (req, res) => {
  if (!redisClient) {
    return res.status(503).json({ error: 'Redis not configured' });
  }
  try {
    await redisClient.set('test-key', 'Hello from Redis!');
    const value = await redisClient.get('test-key');
    res.json({ redisValue: value });
  } catch (err) {
    res.status(500).json({ error: 'Redis error', details: err.message });
  }
});

// Example: Use Docker secret in a route
app.get('/secret-test', (req, res) => {
  if (lakaySecret) {
    res.json({ secret: lakaySecret });
  } else {
    res.status(404).json({ error: 'Secret not found' });
  }
});

const rawAdminUsername = process.env.ADMIN_USERNAME || "admin";
const ADMIN_USERNAME = rawAdminUsername.trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Configure Helmet: disable CSP in development so DevTools and websocket probes work freely
const helmetOptions = process.env.NODE_ENV === 'production' ? {
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
} : { contentSecurityPolicy: false };
app.use(helmet(helmetOptions));

// Optional: enable permissive CORS for quick debugging in production by setting
// ENABLE_PERMISSIVE_CORS=true (DO NOT leave enabled in production long-term).
const PERMISSIVE_CORS = process.env.ENABLE_PERMISSIVE_CORS === 'true';

const normalizeOrigin = (origin) =>
  typeof origin === "string" ? origin.trim().toLowerCase().replace(/\/$/, "") : "";

const defaultAllowedOrigins = [
  "https://lakaysocial.com",
  "https://www.lakaysocial.com",
  "https://lakay-social-production-361d.up.railway.app"
];

const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...envAllowedOrigins].map(normalizeOrigin))
);

const allowedOriginsSet = new Set(allowedOrigins);

function isOriginAllowed(origin) {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (allowedOriginsSet.has(normalized)) return true;
  if (normalized.endsWith(".lakaysocial.com")) return true;
  return false;
}

let corsOptions;
if (PERMISSIVE_CORS) {
  console.log('[CORS] PERMISSIVE mode enabled — allowing all origins (temporary debug)');
  corsOptions = { origin: true, credentials: true };
} else if (process.env.NODE_ENV === 'production') {
  corsOptions = {
    origin: function(origin, callback) {
      console.log('[CORS] Production branch. Origin:', origin);
      if (isOriginAllowed(origin)) {
        console.log('[CORS] Allowed origin (production):', origin);
        return callback(null, true);
      }
      console.log('[CORS] Blocked origin (production):', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  };
} else {
  // Allow any localhost origin during development (Vite may pick different ports)
  corsOptions = {
    origin: function(origin, callback) {
      console.log('[CORS] Development branch. Origin:', origin);
      if (!origin || origin.startsWith('http://localhost')) {
        console.log('[CORS] Allowed origin (dev, localhost):', origin);
        return callback(null, true);
      }
      if (isOriginAllowed(origin)) {
        console.log('[CORS] Allowed origin (dev, allowedOrigins):', origin);
        return callback(null, true);
      }
      console.log('[CORS] Blocked origin (dev):', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  };
}
console.log('CORS config:', process.env.NODE_ENV, allowedOrigins, 'permissive=', PERMISSIVE_CORS);
app.use(cors(corsOptions));
// Improved fallback CORS middleware: always set headers for allowed origins (including errors/404s)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (PERMISSIVE_CORS) {
    // Reflect the request origin (or allow all) while permissive mode is enabled
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  } else if (origin && isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  }
  if (req.method === 'OPTIONS') {
    // Always respond to preflight with correct headers
    return res.status(204).end();
  }
  next();
});
// Add preflight CORS support for all routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (PERMISSIVE_CORS) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  } else if (origin && isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  }
  res.status(204).end();
});

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Log incoming requests early to diagnose large payloads
app.use((req, res, next) => {
  try {
    const cl = req.headers['content-length'] || '-';
    const ct = req.headers['content-type'] || '-';
    console.log(`INCOMING ${req.method} ${req.path} content-length=${cl} content-type=${ct} from=${req.ip}`);
  } catch (e) {
    // ignore
  }
  next();
});

// Increase JSON/urlencoded body size limits to allow larger payloads (images/base64 etc.)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(cookieParser());
console.log('? Body parser limits set: json=1mb, urlencoded=1mb');

// Serve uploads with CORS headers
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  const allowed = [
    'http://localhost:5176',
    'https://lakaysocial.com',
    'https://www.lakaysocial.com',
    'https://lakay-social-production-361d.up.railway.app'
  ];
  if (origin && allowed.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // default to allowing the main frontend host so images load in production
    res.header('Access-Control-Allow-Origin', 'https://lakaysocial.com');
  }
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  // Permit cross-origin resource policy for images so browser won't block them
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  // Cache images for 1 hour
  res.header('Cache-Control', 'public, max-age=3600');
  express.static('public/uploads')(req, res, next);
});

// Serve static files from public directory
app.use(express.static('public'));

app.get("/health", function(_req, res) {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Version endpoint for deployment verification
app.get('/version', (_req, res) => {
  try {
    const pkg = JSON.parse(require('fs').readFileSync(new URL('../package.json', import.meta.url)));
    return res.json({ version: pkg.version, commit: process.env.COMMIT_SHA || null });
  } catch (err) {
    return res.json({ version: null, commit: process.env.COMMIT_SHA || null });
  }
});

app.use("/auth", authRoutes);
app.use("/profiles", profileRoutes);
app.use("/messages", messageRoutes);
app.use("/posts", postRoutes);
app.use("/admin", adminRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/push", pushRoutes);
app.use("/subscriptions", subscriptionsRoutes);

app.use(function(err, _req, res, _next) {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});


const server = http.createServer(app);

// Diagnostic: log HTTP upgrade attempts (shows if proxy forwards websocket Upgrade/Connection headers)
server.on('upgrade', (req, socket, head) => {
  try {
    console.log('HTTP upgrade request', {
      upgrade: req.headers.upgrade,
      host: req.headers.host,
      origin: req.headers.origin,
      url: req.url,
    });
  } catch (err) {
    console.error('Error logging upgrade request', err);
  }
});

// Initialize Socket.IO (services/socket.js) and attach realtime handlers
import { initSocket } from './services/socket.js';
import { initRealtime } from './realtime.js';
try {
  const io = initSocket(server, PERMISSIVE_CORS ? true : allowedOrigins);
  initRealtime(io);
  console.log('? Socket.IO initialized');
} catch (err) {
  console.error('Failed to initialize Socket.IO:', err && err.message ? err.message : err);
}

(async function startServer() {
  try {
    // Run DB migrations on startup (safe / idempotent)
    const migrations = await import('../scripts/run-migrations.mjs');
    console.log('? Running DB migrations on startup');
    await migrations.run();
    console.log('? DB migrations completed');
  } catch (err) {
    console.error('Warning: migrations failed or skipped on startup:', err && err.message ? err.message : err);
    // Do not crash the entire server for migration issues — deployment can still be healthy.
  }

  server.listen(PORT, function() {
    console.log("?? Lakay API running on port " + PORT);
  });
})();

async function ensureAdminUser() {
  var normalizedUsername = ADMIN_USERNAME.trim().toLowerCase();
  if (!normalizedUsername || !ADMIN_PASSWORD) {
    return;
  }
  var existing = await query(
    "SELECT id, password_hash FROM users WHERE LOWER(username) = $1",
    [normalizedUsername]
  );
  if (existing.rowCount > 0) {
    var user = existing.rows[0];
    var passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await query("UPDATE users SET password_hash = $2 WHERE id = $1", [user.id, passwordHash]);
    var verify = await bcrypt.compare(ADMIN_PASSWORD, passwordHash);
    console.log("? Synced admin password for " + normalizedUsername + " (" + (verify ? "verified" : "mismatch") + ")");
    return;
  }
  var passwordHash2 = await bcrypt.hash(ADMIN_PASSWORD, 12);
  var email = normalizedUsername + "@lakay.social";
  var inserted = await query(
    "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username",
    [normalizedUsername, email, passwordHash2]
  );
  await query(
    "INSERT INTO profiles (user_id, username, display_name, bio, location) VALUES ($1, $2, $2, '', '') ON CONFLICT (user_id) DO NOTHING",
    [inserted.rows[0].id, normalizedUsername]
  );
  console.log("? Seeded admin user " + normalizedUsername);
}

ensureAdminUser().catch(function(err) {
  console.error("Failed to bootstrap admin user", err);
});
