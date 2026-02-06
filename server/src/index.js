import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import messageRoutes from "./routes/messages.js";
import postRoutes from "./routes/posts.js";
import adminRoutes from "./routes/admin.js";
import notificationsRoutes from "./routes/notifications.js";
import pushRoutes from "./routes/push.js";
import subscriptionsRoutes from "./routes/subscriptions.js";
import { query } from "./db.js";
import { initRealtime } from "./realtime.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const rawAdminUsername = process.env.ADMIN_USERNAME || "admin";
const ADMIN_USERNAME = rawAdminUsername.trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

app.use(helmet());
app.use(cors({
  origin: [
    "https://lakaysocial.com",
    "https://www.lakaysocial.com",
    "http://localhost:5173",
    "http://localhost:5176",
    "https://lakay-social-production-361d.up.railway.app"
  ],
  credentials: true
}));
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
console.log('? Body parser limits set: json=1mb, urlencoded=1mb');

// Serve uploads with CORS headers
app.use('/uploads', (req, res, next) => {
  // Allow cross-origin image fetching and CORS
  res.header('Access-Control-Allow-Origin', 'http://localhost:5176');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  // Permit cross-origin resource policy for images so browser won't block them
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  express.static('public/uploads')(req, res, next);
});

// Serve static files from public directory
app.use(express.static('public'));

app.get("/health", function(_req, res) {
  res.json({ status: "ok", uptime: process.uptime() });
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
initRealtime(server);

server.listen(PORT, function() {
  console.log("?? Lakay API running on port " + PORT);
});

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
