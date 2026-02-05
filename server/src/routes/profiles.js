import multer from "multer";
import cloudinary from "../services/cloudinary.js";
import { requireAuth } from "../middleware/auth.js";
const upload = multer({ storage: multer.memoryStorage() });
// POST /profiles/photos - upload profile photos
router.post("/photos", requireAuth, upload.array("photos", 6), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  try {
    const uploadResults = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload_stream({
        folder: process.env.CLOUDINARY_FOLDER || "lakay/profiles",
        resource_type: "image",
      }, (error, result) => {
        if (error) throw error;
        uploadResults.push(result.secure_url);
      });
      result.end(file.buffer);
    }
    // Optionally: Save URLs to user's profile in DB here
    res.json({ uploaded: uploadResults });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload photos" });
  }
});
import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const profileSchema = z.object({
  displayName: z.string().min(1).max(80),
  bio: z.string().max(280).optional(),
  location: z.string().max(120).optional(),
});

router.get("/", async (_req, res) => {
  try {
    const result = await query(
      `SELECT username, display_name, bio, location, photo_url
       FROM profiles
       ORDER BY username ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load profiles" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT username, display_name, bio, location, photo_url
       FROM profiles WHERE username = $1`,
      [req.user.username]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

router.put("/me", requireAuth, async (req, res) => {
  const parse = profileSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors });
  }

  const { displayName, bio, location } = parse.data;
  try {
    const result = await query(
      `INSERT INTO profiles (user_id, username, display_name, bio, location)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id)
       DO UPDATE SET display_name = $3, bio = $4, location = $5, updated_at = NOW()
       RETURNING username, display_name, bio, location`,
      [req.user.id, req.user.username, displayName, bio || "", location || ""]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const result = await query(
      `SELECT username, display_name, bio, location, photo_url
       FROM profiles WHERE username = $1`,
      [username]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

export default router;
