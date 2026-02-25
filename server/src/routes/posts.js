import { Router } from "express";
import express from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();
// Allow larger JSON payloads for posts that may include big imageUrl strings
router.use(express.json({ limit: '1mb' }));

// Helper function to check if user is admin
async function checkIsAdmin(userId) {
  try {
    const result = await query("SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin'", [userId]);
    return result.rowCount > 0;
  } catch (err) {
    console.error("Error checking admin status:", err);
    return false;
  }
}


const createPostSchema = z.object({
  content: z.string().min(1).max(10000), // Increased for long memorials
  imageUrl: z
    .string()
    .max(200000)
    .nullable()
    .optional(),
  textColor: z.string().max(32).nullable().optional(),
  fontFamily: z.string().max(80).nullable().optional(),
});

const reactionSchema = z.object({
  type: z.enum(["like", "love", "haha", "fire"]),
});

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

let cachedPostsColumns = null;
let postsColumnsCheckedAt = 0;
const POSTS_COLUMNS_TTL_MS = 60 * 1000;

async function getPostsColumns() {
  const now = Date.now();
  if (cachedPostsColumns && now - postsColumnsCheckedAt < POSTS_COLUMNS_TTL_MS) {
    return cachedPostsColumns;
  }

  try {
  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'posts'
       AND column_name IN ('approved', 'post_type', 'text_color', 'font_family')`
  );
  const cols = new Set(result.rows.map((row) => row.column_name));
  cachedPostsColumns = {
    hasApproved: cols.has('approved'),
    hasPostType: cols.has('post_type'),
    hasTextColor: cols.has('text_color'),
    hasFontFamily: cols.has('font_family'),
  };
  } catch (err) {
    console.error("Failed to read posts columns; falling back to legacy schema", err);
    cachedPostsColumns = { hasApproved: false, hasPostType: false };
  }

  postsColumnsCheckedAt = now;
  return cachedPostsColumns;
}

async function fetchPosts({ ids, limit = 100, user = null } = {}) {
  const { hasApproved, hasPostType, hasTextColor, hasFontFamily } = await getPostsColumns();
  const hasIds = Array.isArray(ids) && ids.length > 0;
  const params = [];
  let postsQuery = `
    SELECT
      p.id,
      p.username,
      p.content,
      p.image_url,
      p.reaction_like,
      p.reaction_love,
      p.reaction_haha,
      p.reaction_fire,
      ${hasApproved ? "p.approved" : "NULL::boolean as approved"},
      ${hasPostType ? "p.post_type" : "'post'::varchar as post_type"},
      ${hasTextColor ? "p.text_color" : "NULL::varchar as text_color"},
      ${hasFontFamily ? "p.font_family" : "NULL::varchar as font_family"},
      p.created_at
    FROM posts p
  `;

  if (hasIds) {
    params.push(ids);
    postsQuery += `WHERE p.id = ANY($1::int[])`;
  } else {
    // For general feed, only show approved posts unless user is admin
    if (hasApproved && (!user || !user.isAdmin)) {
      if (user && user.username) {
        if (hasPostType) {
          postsQuery += `WHERE (p.approved = true OR (p.username = $1 AND p.post_type = 'memorial'))`;
          params.push(user.username);
        } else {
          postsQuery += `WHERE (p.approved = true OR p.username = $1)`;
          params.push(user.username);
        }
      } else {
        postsQuery += `WHERE p.approved = true`;
      }
    }
  }

  postsQuery += ` ORDER BY p.created_at DESC`;

  if (!hasIds) {
    params.push(limit);
    postsQuery += ` LIMIT $${params.length}`;
  }

  const postsResult = await query(postsQuery, params);
  const posts = postsResult.rows;

  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((p) => p.id);
  let likesRows = [];
  let commentsRows = [];

  try {
    const likesResult = await query(
      `SELECT post_id, username FROM post_likes WHERE post_id = ANY($1::int[])`,
      [postIds]
    );
    likesRows = likesResult.rows;
  } catch (err) {
    console.error("Failed to load post likes:", {
      code: err && err.code ? err.code : undefined,
      message: err && err.message ? err.message : err,
    });
  }

  try {
    const commentsResult = await query(
      `SELECT id, post_id, username, content, created_at
       FROM post_comments
       WHERE post_id = ANY($1::int[])
       ORDER BY created_at ASC`,
      [postIds]
    );
    commentsRows = commentsResult.rows;
  } catch (err) {
    console.error("Failed to load post comments:", {
      code: err && err.code ? err.code : undefined,
      message: err && err.message ? err.message : err,
    });
  }

  const likesMap = postIds.reduce((acc, id) => {
    acc[id] = [];
    return acc;
  }, {});

  likesRows.forEach((row) => {
    likesMap[row.post_id]?.push(row.username);
  });

  const commentsMap = postIds.reduce((acc, id) => {
    acc[id] = [];
    return acc;
  }, {});

  commentsRows.forEach((row) => {
    commentsMap[row.post_id]?.push({
      id: row.id,
      user: row.username,
      text: row.content,
      timestamp: row.created_at,
    });
  });

  return posts.map((post) => ({
    id: post.id,
    user: post.username,
    content: post.content,
    image: post.image_url,
    likes: likesMap[post.id] || [],
    reactions: {
      like: Number(post.reaction_like) || 0,
      love: Number(post.reaction_love) || 0,
      haha: Number(post.reaction_haha) || 0,
      fire: Number(post.reaction_fire) || 0,
    },
    comments: commentsMap[post.id] || [],
    textColor: post.text_color || null,
    fontFamily: post.font_family || null,
    timestamp: post.created_at,
  }));
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    let isAdmin = false;
    if (req.user && req.user.id) {
      try {
        isAdmin = await checkIsAdmin(req.user.id);
      } catch (e) {
        console.error('Failed to verify admin status', e);
      }
    }
    const posts = await fetchPosts({ user: { isAdmin, username: req.user?.username } });
    res.json(posts);
  } catch (err) {
    console.error("Failed to load posts:", {
      code: err && err.code ? err.code : undefined,
      message: err && err.message ? err.message : err,
      stack: err && err.stack ? err.stack : undefined,
    });
    res.status(500).json({ error: "Failed to load posts" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    console.log('POST /posts request', {
      user: req.user ? { id: req.user.id, username: req.user.username } : null,
      contentLength: typeof body.content === 'string' ? body.content.length : 0,
      imageUrlLength: typeof body.imageUrl === 'string' ? body.imageUrl.length : 0,
      textColor: body.textColor || null,
      fontFamily: body.fontFamily || null,
    });
  } catch (logErr) {
    console.error('POST /posts debug log failed', logErr);
  }
  const parse = createPostSchema.safeParse(req.body);
  console.log('Parse result:', parse);
  if (!parse.success) {
    console.log('Validation errors:', parse.error.flatten().fieldErrors);
    return res.status(400).json({ error: parse.error.flatten().fieldErrors });
  }

  const { content, imageUrl = null, textColor = null, fontFamily = null } = parse.data;
  
  // Check if this is a memorial (content contains double newline indicating name/tribute format)
  const isMemorial = content.includes('\n\n');
  const postType = isMemorial ? 'memorial' : 'post';
  const approved = true;
  
  try {
    const { hasApproved, hasPostType, hasTextColor, hasFontFamily } = await getPostsColumns();
    const hasStyle = hasTextColor || hasFontFamily;
    let insert;
    if (hasApproved || hasPostType || hasStyle) {
      const columns = ["user_id", "username", "content", "image_url"];
      const values = [req.user.id, req.user.username, content, imageUrl];
      if (hasPostType) {
        columns.push("post_type");
        values.push(postType);
      }
      if (hasApproved) {
        columns.push("approved");
        values.push(approved);
      }
      if (hasTextColor) {
        columns.push("text_color");
        values.push(textColor);
      }
      if (hasFontFamily) {
        columns.push("font_family");
        values.push(fontFamily);
      }
      const params = values.map((_, idx) => `$${idx + 1}`).join(", ");
      insert = await query(
        `INSERT INTO posts (${columns.join(", ")})
         VALUES (${params})
         RETURNING id`,
        values
      );
    } else {
      insert = await query(
        `INSERT INTO posts (user_id, username, content, image_url)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [req.user.id, req.user.username, content, imageUrl]
      );
    }

    const [post] = await fetchPosts({ ids: [insert.rows[0].id] });
    res.status(201).json(post);
  } catch (err) {
    console.error('Failed to create post', {
      message: err?.message || err,
      code: err?.code,
      detail: err?.detail,
      constraint: err?.constraint,
      table: err?.table,
      stack: err?.stack,
    });
    res.status(500).json({ error: "Failed to create post" });
  }
});

router.post("/:postId/like", requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  try {
    const existing = await query(
      `SELECT 1 FROM post_likes WHERE post_id = $1 AND username = $2`,
      [postId, req.user.username]
    );

    if (existing.rowCount > 0) {
      await query(`DELETE FROM post_likes WHERE post_id = $1 AND username = $2`, [postId, req.user.username]);
    } else {
      await query(`INSERT INTO post_likes (post_id, username) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
        postId,
        req.user.username,
      ]);
    }

    const [post] = await fetchPosts({ ids: [postId] });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

router.post("/:postId/react", requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  const parse = reactionSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid reaction type" });
  }

  const columnMap = {
    like: "reaction_like",
    love: "reaction_love",
    haha: "reaction_haha",
    fire: "reaction_fire",
  };

  const column = columnMap[parse.data.type];

  try {
    const updated = await query(
      `UPDATE posts SET ${column} = ${column} + 1 WHERE id = $1 RETURNING id`,
      [postId]
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const [post] = await fetchPosts({ ids: [postId] });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to react" });
  }
});

router.post("/:postId/comments", requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  const parse = commentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors });
  }

  try {
    await query(
      `INSERT INTO post_comments (post_id, username, content)
       VALUES ($1, $2, $3)`,
      [postId, req.user.username, parse.data.content]
    );

    const [post] = await fetchPosts({ ids: [postId] });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// PUT /posts/:postId - Edit post (owner or admin only)
router.put("/:postId", requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  const parse = createPostSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors });
  }

  const { content, imageUrl = null } = parse.data;

  try {
    // Check ownership or admin
    const { hasPostType } = await getPostsColumns();
    const postResult = await query(
      `SELECT user_id, username${hasPostType ? ", post_type" : ""} FROM posts WHERE id = $1`,
      [postId]
    );
    if (postResult.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    const post = postResult.rows[0];
    const isOwner = req.user.id === post.user_id;
    const isAdmin = req.user.username.toLowerCase() === (process.env.ADMIN_USERNAME || "admin").toLowerCase();
    const isMemorial = (post.post_type || "post") === "memorial";

    if (!isOwner && (!isAdmin || isMemorial)) {
      return res.status(403).json({ error: "You can only edit your own posts" });
    }

    await query(
      `UPDATE posts SET content = $1, image_url = $2 WHERE id = $3`,
      [content, imageUrl, postId]
    );

    const [updatedPost] = await fetchPosts({ ids: [postId] });
    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update post" });
  }
});

// DELETE /posts/:postId - Delete post (owner or admin only)
router.delete("/:postId", requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  try {
    // Check ownership or admin
    const { hasPostType } = await getPostsColumns();
    const postResult = await query(
      `SELECT user_id, username${hasPostType ? ", post_type" : ""} FROM posts WHERE id = $1`,
      [postId]
    );
    if (postResult.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    const post = postResult.rows[0];
    const isOwner = req.user.id === post.user_id;
    const isAdmin = req.user.username.toLowerCase() === (process.env.ADMIN_USERNAME || "admin").toLowerCase();
    const isMemorial = (post.post_type || "post") === "memorial";

    if (!isOwner && (!isAdmin || isMemorial)) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    await query(`DELETE FROM posts WHERE id = $1`, [postId]);
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;

