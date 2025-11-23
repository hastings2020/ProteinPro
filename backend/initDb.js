const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'proteinpro.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      daily_protein_target INTEGER DEFAULT 150,
      weight REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create food_entries table
  db.run(`
    CREATE TABLE IF NOT EXISTS food_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      food_name TEXT NOT NULL,
      protein_grams REAL NOT NULL,
      calories INTEGER,
      carbs REAL,
      fat REAL,
      serving_size TEXT,
      meal_type TEXT,
      quantity INTEGER DEFAULT 1,
      entry_date DATE NOT NULL,
      entry_time TIME DEFAULT CURRENT_TIME,
      notes TEXT,
      is_favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create user_settings table for day-specific targets
  db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      setting_key TEXT NOT NULL,
      setting_value TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create favorites table
  db.run(`
    CREATE TABLE IF NOT EXISTS favorite_foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      food_name TEXT NOT NULL,
      protein_grams REAL NOT NULL,
      calories INTEGER,
      serving_size TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Insert default user
  db.run(`
    INSERT OR IGNORE INTO users (id, username, email, daily_protein_target, weight)
    VALUES (1, 'demo_user', 'demo@proteinpro.com', 150, 70.0)
  `);

  // Insert sample data for testing
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

  const sampleEntries = [
    // Today's entries
    [1, 'Grilled Chicken Breast', 31, 165, 0, 3.6, '100g', 'lunch', 1, today, '12:30:00', 'Delicious!', 1],
    [1, 'Greek Yogurt', 17, 100, 6, 0.4, '170g', 'breakfast', 1, today, '08:00:00', 'With berries', 1],
    [1, 'Protein Shake', 25, 120, 3, 1.5, '1 scoop', 'snack', 1, today, '15:00:00', 'Post-workout', 1],
    [1, 'Salmon Fillet', 22, 206, 0, 13, '100g', 'dinner', 1, today, '19:00:00', 'Baked with herbs', 0],

    // Yesterday's entries
    [1, 'Eggs (2 large)', 13, 140, 1, 10, '2 eggs', 'breakfast', 2, yesterday, '08:30:00', 'Scrambled', 1],
    [1, 'Tuna Salad', 26, 180, 5, 7, '150g', 'lunch', 1, yesterday, '13:00:00', 'With olive oil', 0],
    [1, 'Cottage Cheese', 14, 110, 6, 2.5, '113g', 'snack', 1, yesterday, '16:00:00', 'Low fat', 1],
    [1, 'Beef Steak', 26, 250, 0, 17, '100g', 'dinner', 1, yesterday, '20:00:00', 'Medium rare', 0],
    [1, 'Almonds', 6, 170, 6, 15, '28g', 'snack', 1, yesterday, '10:00:00', 'Roasted', 0],

    // Two days ago
    [1, 'Protein Pancakes', 20, 220, 24, 8, '2 pancakes', 'breakfast', 2, twoDaysAgo, '09:00:00', 'Homemade', 0],
    [1, 'Chicken Salad', 28, 200, 8, 9, '200g', 'lunch', 1, twoDaysAgo, '12:00:00', 'Caesar style', 0],
    [1, 'Protein Bar', 20, 200, 22, 7, '1 bar', 'snack', 1, twoDaysAgo, '15:30:00', 'Chocolate flavor', 1],
    [1, 'Turkey Breast', 29, 135, 0, 1, '100g', 'dinner', 1, twoDaysAgo, '18:30:00', 'Oven roasted', 0]
  ];

  const insertStmt = db.prepare(`
    INSERT INTO food_entries
    (user_id, food_name, protein_grams, calories, carbs, fat, serving_size, meal_type, quantity, entry_date, entry_time, notes, is_favorite)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sampleEntries.forEach(entry => {
    insertStmt.run(entry);
  });

  insertStmt.finalize();

  // Add more historical data for analytics (past 30 days)
  const historicalStmt = db.prepare(`
    INSERT INTO food_entries
    (user_id, food_name, protein_grams, calories, entry_date, meal_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (let i = 3; i < 30; i++) {
    const date = new Date(Date.now() - (i * 86400000)).toISOString().split('T')[0];
    const proteinVariation = Math.floor(Math.random() * 40) + 80; // Random protein between 80-120g per day

    // Add 3-5 entries per day
    const entriesCount = Math.floor(Math.random() * 3) + 3;
    for (let j = 0; j < entriesCount; j++) {
      const protein = Math.floor(proteinVariation / entriesCount) + Math.floor(Math.random() * 10);
      const calories = protein * 4 + Math.floor(Math.random() * 100);
      const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
      const mealType = meals[j % meals.length];

      historicalStmt.run([1, `Food Item ${j + 1}`, protein, calories, date, mealType]);
    }
  }

  historicalStmt.finalize();

  // Insert favorite foods
  const favoriteFoods = [
    [1, 'Grilled Chicken Breast', 31, 165, '100g'],
    [1, 'Greek Yogurt', 17, 100, '170g'],
    [1, 'Protein Shake', 25, 120, '1 scoop'],
    [1, 'Eggs (2 large)', 13, 140, '2 eggs'],
    [1, 'Cottage Cheese', 14, 110, '113g']
  ];

  const favStmt = db.prepare(`
    INSERT INTO favorite_foods (user_id, food_name, protein_grams, calories, serving_size)
    VALUES (?, ?, ?, ?, ?)
  `);

  favoriteFoods.forEach(fav => {
    favStmt.run(fav);
  });

  favStmt.finalize();

  console.log('Database initialized successfully with sample data!');
  console.log('Location:', dbPath);
});

db.close();
