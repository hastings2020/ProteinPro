const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'proteinpro.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // List all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error listing tables:', err);
    } else {
      console.log('\nExisting tables:');
      tables.forEach(table => console.log('  -', table.name));
    }

    // Check feedbacks table schema
    db.all("PRAGMA table_info(feedbacks)", (err, columns) => {
      if (err) {
        console.error('\nError getting feedbacks schema:', err);
      } else if (columns && columns.length > 0) {
        console.log('\nfeedbacks table schema:');
        columns.forEach(col => console.log(`  - ${col.name} (${col.type})`));

        // Try to count feedbacks
        db.get("SELECT COUNT(*) as count FROM feedbacks", (err, result) => {
          if (err) {
            console.error('\nError counting feedbacks:', err);
          } else {
            console.log(`\nTotal feedbacks: ${result.count}`);
          }
          db.close();
        });
      } else {
        console.log('\nfeedbacks table does not exist');
        db.close();
      }
    });
  });
});
