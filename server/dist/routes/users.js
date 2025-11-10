"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const db = database_1.Database.getInstance().getDb();
// Get user profile
router.get('/:id', (req, res) => {
    const userId = req.params.id;
    db.get('SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Get user's posts
        db.all('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, posts) => {
            res.json({ ...user, posts: posts || [] });
        });
    });
});
// Get current user
router.get('/me', auth_1.authenticate, (req, res) => {
    db.get('SELECT id, username, email, avatar, bio FROM users WHERE id = ?', [req.userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });
});
exports.default = router;
