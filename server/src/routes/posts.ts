import express from 'express';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { Database } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import captionService from '../services/captionService';

const router = express.Router();
const db = Database.getInstance().getDb();

// Rate limiter for AI caption generation (5 requests per minute per user)
const captionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many caption generation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Get all posts
router.get('/', (req, res) => {
  const query = `
    SELECT posts.*, users.username, users.avatar,
           (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as likes_count
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
  `;

  db.all(query, [], (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(posts);
  });
});

// Create post
router.post('/', authenticate, upload.single('image'), (req: AuthRequest, res) => {
  const { caption } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

  db.run(
    'INSERT INTO posts (user_id, image_url, caption) VALUES (?, ?, ?)',
    [req.userId, imageUrl, caption],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create post' });
      }
      res.status(201).json({ id: this.lastID, imageUrl, caption });
    }
  );
});

// Generate AI caption for an image
router.post('/generate-caption', captionRateLimiter, authenticate, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Check if service is configured
    if (!captionService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Caption generation service not configured. Please set HUGGINGFACE_API_KEY environment variable.' 
      });
    }

    // Generate caption
    const caption = await captionService.generateCaption(req.file.path);
    
    res.json({ caption });
  } catch (error) {
    console.error('Caption generation error:', error);
    res.status(500).json({ error: 'Failed to generate caption' });
  }
});

// Delete post - MUST come BEFORE /:id/like and /:id/comments routes
router.delete('/:id', authenticate, (req: AuthRequest, res) => {
  const postId = req.params.id;

  // Check if user owns the post
  db.get(
    'SELECT * FROM posts WHERE id = ? AND user_id = ?',
    [postId, req.userId],
    (err, post) => {
      if (err || !post) {
        return res.status(404).json({ error: 'Post not found or unauthorized' });
      }

      // Delete related likes and comments first
      db.run('DELETE FROM likes WHERE post_id = ?', [postId]);
      db.run('DELETE FROM comments WHERE post_id = ?', [postId]);
      
      // Delete the post
      db.run('DELETE FROM posts WHERE id = ?', [postId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete post' });
        }
        res.json({ message: 'Post deleted successfully' });
      });
    }
  );
});

// Like/Unlike post
router.post('/:id/like', authenticate, (req: AuthRequest, res) => {
  const postId = req.params.id;

  // Check if already liked
  db.get(
    'SELECT * FROM likes WHERE user_id = ? AND post_id = ?',
    [req.userId, postId],
    (err, like) => {
      if (like) {
        // Unlike
        db.run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.userId, postId]);
        res.json({ liked: false });
      } else {
        // Like
        db.run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.userId, postId]);
        res.json({ liked: true });
      }
    }
  );
});

// Get comments for a post
router.get('/:id/comments', (req, res) => {
  const postId = req.params.id;

  db.all(
    `SELECT comments.*, users.username, users.avatar
     FROM comments
     JOIN users ON comments.user_id = users.id
     WHERE comments.post_id = ?
     ORDER BY comments.created_at ASC`,
    [postId],
    (err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      res.json(comments);
    }
  );
});

// Add comment
router.post('/:id/comments', authenticate, (req: AuthRequest, res) => {
  const postId = req.params.id;
  const { content } = req.body;

  db.run(
    'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
    [req.userId, postId, content],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add comment' });
      }
      res.status(201).json({ id: this.lastID, content });
    }
  );
});

export default router;