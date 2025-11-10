import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Database } from '../database';

const router = express.Router();
const db = Database.getInstance().getDb();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }

        const token = jwt.sign({ userId: this.lastID }, process.env.JWT_SECRET || 'secret');
        res.status(201).json({ 
          token, 
          user: { id: this.lastID, username, email }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user: any) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        avatar: user.avatar
      }
    });
  });
});

export default router;