import sqlite3 from 'sqlite3';
import path from 'path';

export class Database {
  private static instance: Database;
  private db: sqlite3.Database;

  private constructor() {
    const dbPath = path.join(__dirname, '../instagram-lite.db');
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
    this.runMigrations();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private initializeTables(): void {
    this.db.serialize(() => {
      // Users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          avatar TEXT DEFAULT '/default-avatar.png',
          bio TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Posts table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          caption TEXT DEFAULT '',
          likes_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Likes table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          post_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, post_id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (post_id) REFERENCES posts(id)
        )
      `);

      // Comments table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          post_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (post_id) REFERENCES posts(id)
        )
      `);
    });
  }

  /**
   * Run database migrations to add new columns or modify schema
   * Executes safely without breaking existing data
   */
  private runMigrations(): void {
    this.db.serialize(() => {
      // Check if ai_caption column exists in posts table
      this.db.all(`PRAGMA table_info(posts)`, [], (err, columns: any[]) => {
        if (err) {
          console.error('Error checking posts table schema:', err);
          return;
        }

        // Check if ai_caption column already exists
        const aiCaptionExists = columns.some(col => col.name === 'ai_caption');

        if (!aiCaptionExists) {
          // Add ai_caption column if it doesn't exist
          this.db.run(
            `ALTER TABLE posts ADD COLUMN ai_caption TEXT DEFAULT NULL`,
            (err) => {
              if (err) {
                console.error('Error adding ai_caption column:', err);
              } else {
                console.log('Successfully added ai_caption column to posts table');
              }
            }
          );
        } else {
          console.log('ai_caption column already exists in posts table');
        }
      });
    });
  }

  public getDb(): sqlite3.Database {
    return this.db;
  }
}