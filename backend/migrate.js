const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'proteinpro.db');
const db = new sqlite3.Database(dbPath);

console.log('Running database migrations...');

db.serialize(() => {
  // Check if quantity column exists
  db.all("PRAGMA table_info(food_entries)", (err, columns) => {
    if (err) {
      console.error('Error checking table schema:', err);
      return;
    }

    const hasQuantityColumn = columns.some(col => col.name === 'quantity');

    if (!hasQuantityColumn) {
      console.log('Adding quantity column to food_entries table...');
      db.run('ALTER TABLE food_entries ADD COLUMN quantity INTEGER DEFAULT 1', (err) => {
        if (err) {
          console.error('Error adding quantity column:', err);
        } else {
          console.log('✓ Successfully added quantity column');
        }
        db.close();
      });
    } else {
      console.log('✓ Quantity column already exists');
      db.close();
    }
  });
});
