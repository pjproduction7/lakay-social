import { Router } from "express";
import express from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
// Allow larger JSON payloads for posts that may include big imageUrl strings
router.use(express.json({ limit: '1mb' }));


const createPostSchema = z.object({
  content: z.string().min(1).max(10000), // Increased for long memorials
  imageUrl: z
    .string()
    .max(200000)
    .nullable()
    .optional(),
});

const reactionSchema = z.object({
  type: z.enum(["like", "love", "haha", "fire"]),
});

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

async function fetchPosts({ ids, limit = 100 } = {}) {
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
      p.created_at
    FROM posts p
  `;

  if (hasIds) {
    params.push(ids);
    postsQuery += `WHERE p.id = ANY($1::int[])`;
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
  const likesResult = await query(
    `SELECT post_id, username FROM post_likes WHERE post_id = ANY($1::int[])`,
    [postIds]
  );
  const commentsResult = await query(
    `SELECT id, post_id, username, content, created_at
     FROM post_comments
     WHERE post_id = ANY($1::int[])
     ORDER BY created_at ASC`,
    [postIds]
  );

  const likesMap = postIds.reduce((acc, id) => {
    acc[id] = [];
    return acc;
  }, {});

  likesResult.rows.forEach((row) => {
    likesMap[row.post_id]?.push(row.username);
  });

  const commentsMap = postIds.reduce((acc, id) => {
    acc[id] = [];
    return acc;
  }, {});

  commentsResult.rows.forEach((row) => {
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
    timestamp: post.created_at,
  }));
}

router.get("/", async (_req, res) => {
  try {
    const posts = await fetchPosts();
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load posts" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  console.log('POST /posts request body:', req.body);
  const parse = createPostSchema.safeParse(req.body);
  console.log('Parse result:', parse);
  if (!parse.success) {
    console.log('Validation errors:', parse.error.flatten().fieldErrors);
    return res.status(400).json({ error: parse.error.flatten().fieldErrors });
  }

  const { content, imageUrl = null } = parse.data;
  try {
    const insert = await query(
      `INSERT INTO posts (user_id, username, content, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [req.user.id, req.user.username, content, imageUrl]
    );

    const [post] = await fetchPosts({ ids: [insert.rows[0].id] });
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
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

export default router;

