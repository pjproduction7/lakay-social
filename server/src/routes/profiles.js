
import { Router } from "express";
import { z } from "zod";
import validator from "validator";
import { query } from "../db.js";
import multer from "multer";
import cloudinary from "cloudinary";
import { requireAuth } from "../middleware/auth.js";
import path from "path";
import { promises as fs } from "fs";

const router = Router();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Ensure soft-delete columns exist for profile_photos
(async function ensurePhotoSoftDeleteColumns() {
  try {
    await query(`ALTER TABLE profile_photos ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE`);
    await query(`ALTER TABLE profile_photos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`);
    console.log('Ensured profile_photos soft-delete columns');
  } catch (err) {
    console.error('Failed to ensure soft-delete columns on profile_photos', err);
  }
})();

// Configure multer for file uploads (memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') && 
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  }
});

const profileSchema = z.object({
  displayName: z.string().min(1).max(80).transform(val => validator.escape(val)),
  bio: z.string().max(800).optional().transform(val => val ? validator.escape(val) : val),
  location: z.string().max(120).optional().transform(val => val ? validator.escape(val) : val),
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
    
    const profile = result.rows[0];
    
    // Get profile photos
    const photosResult = await query(
      `SELECT id, photo_url, filter_style, is_primary, created_at
       FROM profile_photos 
       WHERE username = $1 AND (is_deleted IS NULL OR is_deleted = false)
       ORDER BY is_primary DESC, created_at DESC`,
      [username]
    );
    
    profile.photos = photosResult.rows;
    
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// Photo upload routes
router.post("/photos", requireAuth, (req, res) => {
  upload.array('photos', 6)(req, res, async (err) => {
    if (err) {
      console.error('Upload middleware error:', err);
      const message = err.message || 'Upload failed';
      return res.status(400).json({ error: message });
    }

    try {
      console.log('Upload request received');
      console.log('Files received:', req.files ? req.files.length : 0);
      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          console.log('Upload file info', {
            index,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          });
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('Cloudinary credentials missing');
        return res.status(500).json({ error: "Image upload service not configured" });
      }

      const addToProfile = req.body.addToProfile !== 'false'; // default true

      const uploadedPhotos = [];

      for (const file of req.files) {
        console.log('Processing file:', file.originalname);

        // Upload to Cloudinary
        const cloudinaryResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.v2.uploader.upload_stream(
            {
              folder: process.env.CLOUDINARY_FOLDER || "lakay/profiles",
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error', {
                  message: error.message,
                  name: error.name,
                  http_code: error.http_code,
                  error,
                });
                reject(error);
              }
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        });

        const photoUrl = cloudinaryResult.secure_url;

        if (addToProfile) {
          const result = await query(
            `INSERT INTO profile_photos (user_id, username, photo_url, filter_style, is_primary)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, photo_url, filter_style, is_primary, created_at`,
            [req.user.id, req.user.username, photoUrl, 'original', false]
          );

          uploadedPhotos.push(result.rows[0]);
        } else {
          // For non-profile uploads, just return the URL
          uploadedPhotos.push({
            photo_url: photoUrl,
            filter_style: 'original',
            is_primary: false,
            created_at: new Date().toISOString()
          });
        }
      }

      if (addToProfile) {
        // Check if user has a primary photo, if not, set the first uploaded photo as primary
        const primaryCheck = await query(
          `SELECT id FROM profile_photos WHERE user_id = $1 AND is_primary = true AND (is_deleted IS NULL OR is_deleted = false)`,
          [req.user.id]
        );

        if (primaryCheck.rowCount === 0 && uploadedPhotos.length > 0) {
          const firstPhoto = uploadedPhotos[0];
          await query(
            `UPDATE profile_photos SET is_primary = true WHERE id = $1`,
            [firstPhoto.id]
          );

          // Update the profile's primary photo URL
          await query(
            `UPDATE profiles SET primary_photo_id = $1, photo_url = $2 WHERE user_id = $3`,
            [firstPhoto.id, firstPhoto.photo_url, req.user.id]
          );
        }
      }

      res.json({ photos: uploadedPhotos });
    } catch (uploadErr) {
      console.error(uploadErr);
      res.status(500).json({ error: "Failed to upload photos" });
    }
  });
});

router.post("/photos/:photoId/primary", requireAuth, async (req, res) => {
  try {
    const { photoId } = req.params;
    console.log(`Set primary photo request from ${req.user.username} (user_id=${req.user.id}) for photoId=${photoId}`);

    if (!photoId) {
      return res.status(400).json({ error: "photoId is required" });
    }

    // First, unset all primary photos for this user
    await query(
      `UPDATE profile_photos SET is_primary = false WHERE user_id = $1`,
      [req.user.id]
    );
    
    // Then set the specified photo as primary
    const result = await query(
      `UPDATE profile_photos SET is_primary = true WHERE id = $1 AND user_id = $2
       RETURNING id, photo_url, is_primary`,
      [photoId, req.user.id]
    );
    
    if (result.rowCount === 0) {
      console.warn(`Photo not found or does not belong to user: photoId=${photoId} user_id=${req.user.id}`);
      return res.status(404).json({ error: "Photo not found" });
    }
    
    // Update the profile's primary photo URL
    await query(
      `UPDATE profiles SET primary_photo_id = $1, photo_url = $2 WHERE user_id = $3`,
      [photoId, result.rows[0].photo_url, req.user.id]
    );
    
    res.json({ photo: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to set primary photo" });
  }
});

// Restore a soft-deleted photo
router.post("/photos/:photoId/restore", requireAuth, async (req, res) => {
  try {
    const { photoId } = req.params;
    console.log(`Restore photo request from ${req.user.username} (user_id=${req.user.id}) for photoId=${photoId}`);

    const result = await query(
      `UPDATE profile_photos SET is_deleted = false, deleted_at = NULL WHERE id = $1 AND user_id = $2 RETURNING id, photo_url, is_primary`,
      [photoId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Photo not found" });
    }

    res.json({ photo: result.rows[0] });
  } catch (err) {
    console.error('Failed to restore photo', err);
    res.status(500).json({ error: "Failed to restore photo" });
  }
});

router.delete("/photos/:photoId", requireAuth, async (req, res) => {
  try {
    const { photoId } = req.params;
    console.log(`Delete photo request from ${req.user.username} (user_id=${req.user.id}) for photoId=${photoId}`);

    if (!photoId) {
      return res.status(400).json({ error: "photoId is required" });
    }

    // Get the photo info first
    const photoResult = await query(
      `SELECT photo_url FROM profile_photos WHERE id = $1 AND user_id = $2`,
      [photoId, req.user.id]
    );
    
    if (photoResult.rowCount === 0) {
      console.warn(`Photo not found for deletion: photoId=${photoId} user_id=${req.user.id}`);
      return res.status(404).json({ error: "Photo not found" });
    }
    
    // Delete from database
    // Soft-delete the photo record (mark deleted, keep file for now)
    const delResult = await query(
      `UPDATE profile_photos SET is_deleted = true, deleted_at = NOW(), is_primary = false WHERE id = $1 AND user_id = $2 RETURNING id, photo_url`,
      [photoId, req.user.id]
    );
    if (delResult.rowCount === 0) {
      console.warn(`Failed to soft-delete photo id=${photoId} for user_id=${req.user.id}`);
      return res.status(404).json({ error: "Photo not found" });
    }
    console.log(`Soft-deleted photo id=${photoId} for user_id=${req.user.id}`);

    // Don't delete the file immediately; keep for possible restore or manual cleanup.
    res.json({ message: "Photo deleted successfully" });
  } catch (err) {
    console.error('Failed to delete photo', err);
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

export default router;
