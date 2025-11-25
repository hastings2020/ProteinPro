const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'proteinpro.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Check if feedbacks table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='feedbacks'", (err, row) => {
    if (err) {
      console.error('Error checking for table:', err);
      db.close();
      return;
    }

    if (!row) {
      console.log('feedbacks table does not exist. Creating it now...');

      // Create feedbacks table
      db.run(`
        CREATE TABLE feedbacks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT DEFAULT 'Anonymous',
          email TEXT,
          category TEXT DEFAULT 'general',
          message TEXT NOT NULL,
          screenshot_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating feedbacks table:', err);
        } else {
          console.log('✓ feedbacks table created successfully!');
        }
        db.close();
      });
    } else {
      console.log('✓ feedbacks table already exists');
      db.close();
    }
  });
});
