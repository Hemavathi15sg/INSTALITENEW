import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Database } from './database';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import userRoutes from './routes/users';

// IMPORTANT: Load environment variables FIRST before any other code
dotenv.config();

console.log('Environment check:');
console.log('- PORT:', process.env.PORT);
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
Database.getInstance();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Instagram Lite API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});