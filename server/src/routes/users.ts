import express from 'express';
import { Database } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const db = Database.getInstance().getDb();

// Get user profile
router.get('/:id', (req, res) => {
  const userId = req.params.id;

  db.get(
    'SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's posts
      db.all(
        'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, posts) => {
          res.json({ ...user, posts: posts || [] });
        }
      );
    }
  );
});

// Get current user
router.get('/me', authenticate, (req: AuthRequest, res) => {
  db.get(
    'SELECT id, username, email, avatar, bio FROM users WHERE id = ?',
    [req.userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

export default router;