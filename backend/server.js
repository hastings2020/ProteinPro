const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Database connection
const dbPath = path.join(__dirname, 'proteinpro.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Helper function to run database queries with promises
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ================== API ROUTES ==================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ProteinPro API is running' });
});

// ================== USER ROUTES ==================

// Get user profile
app.get('/api/user/:userId', async (req, res) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.params.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put('/api/user/:userId', async (req, res) => {
  try {
    const { daily_protein_target, weight, email } = req.body;
    await dbRun(
      'UPDATE users SET daily_protein_target = ?, weight = ?, email = ? WHERE id = ?',
      [daily_protein_target, weight, email, req.params.userId]
    );
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.params.userId]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== FOOD ENTRY ROUTES ==================

// Get all food entries for a user
app.get('/api/entries/:userId', async (req, res) => {
  try {
    const entries = await dbAll(
      'SELECT * FROM food_entries WHERE user_id = ? ORDER BY entry_date DESC, entry_time DESC',
      [req.params.userId]
    );
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get food entries for a specific date
app.get('/api/entries/:userId/date/:date', async (req, res) => {
  try {
    const entries = await dbAll(
      'SELECT * FROM food_entries WHERE user_id = ? AND entry_date = ? ORDER BY entry_time DESC',
      [req.params.userId, req.params.date]
    );
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get food entries for a date range
app.get('/api/entries/:userId/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const entries = await dbAll(
      'SELECT * FROM food_entries WHERE user_id = ? AND entry_date BETWEEN ? AND ? ORDER BY entry_date DESC, entry_time DESC',
      [req.params.userId, startDate, endDate]
    );
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily totals for calendar view
app.get('/api/entries/:userId/daily-totals', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = `
      SELECT
        entry_date,
        SUM(protein_grams) as total_protein,
        SUM(calories) as total_calories,
        COUNT(*) as entry_count
      FROM food_entries
      WHERE user_id = ? AND entry_date BETWEEN ? AND ?
      GROUP BY entry_date
      ORDER BY entry_date DESC
    `;
    const dailyTotals = await dbAll(query, [req.params.userId, startDate, endDate]);
    res.json(dailyTotals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics data
app.get('/api/analytics/:userId', async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    // Get daily totals
    const dailyQuery = `
      SELECT
        entry_date,
        SUM(protein_grams) as total_protein,
        SUM(calories) as total_calories,
        COUNT(*) as entry_count
      FROM food_entries
      WHERE user_id = ? AND entry_date BETWEEN ? AND ?
      GROUP BY entry_date
      ORDER BY entry_date ASC
    `;
    const dailyData = await dbAll(dailyQuery, [req.params.userId, startDate, endDate]);

    // Get user's target
    const user = await dbGet('SELECT daily_protein_target FROM users WHERE id = ?', [req.params.userId]);

    // Calculate statistics
    const totalDays = dailyData.length;
    const totalProtein = dailyData.reduce((sum, day) => sum + day.total_protein, 0);
    const avgProtein = totalDays > 0 ? totalProtein / totalDays : 0;
    const daysMetGoal = dailyData.filter(day => day.total_protein >= user.daily_protein_target).length;

    // Calculate streak
    let currentStreak = 0;
    const sortedDays = [...dailyData].reverse();
    for (let day of sortedDays) {
      if (day.total_protein >= user.daily_protein_target) {
        currentStreak++;
      } else {
        break;
      }
    }

    res.json({
      dailyData,
      statistics: {
        totalDays,
        avgProtein: Math.round(avgProtein * 10) / 10,
        daysMetGoal,
        goalPercentage: totalDays > 0 ? Math.round((daysMetGoal / totalDays) * 100) : 0,
        currentStreak,
        target: user.daily_protein_target
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new food entry
app.post('/api/entries', async (req, res) => {
  try {
    const {
      user_id = 1,
      food_name,
      protein_grams,
      calories,
      carbs,
      fat,
      serving_size,
      meal_type,
      notes,
      quantity = 1
    } = req.body;

    // Get entry_date from request or use today's date as fallback
    const entry_date = req.body.entry_date || new Date().toISOString().split('T')[0];

    // Validate required fields
    if (!food_name || !protein_grams) {
      return res.status(400).json({ error: 'food_name and protein_grams are required' });
    }

    const result = await dbRun(
      `INSERT INTO food_entries
      (user_id, food_name, protein_grams, calories, carbs, fat, serving_size, meal_type, quantity, entry_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, food_name, protein_grams, calories, carbs, fat, serving_size, meal_type, quantity, entry_date, notes]
    );

    const entry = await dbGet('SELECT * FROM food_entries WHERE id = ?', [result.id]);
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update food entry
app.put('/api/entries/:id', async (req, res) => {
  try {
    const {
      food_name,
      protein_grams,
      calories,
      carbs,
      fat,
      serving_size,
      meal_type,
      notes,
      quantity = 1
    } = req.body;

    // Get entry_date from request or use today's date as fallback
    const entry_date = req.body.entry_date || new Date().toISOString().split('T')[0];

    await dbRun(
      `UPDATE food_entries
      SET food_name = ?, protein_grams = ?, calories = ?, carbs = ?, fat = ?,
          serving_size = ?, meal_type = ?, quantity = ?, entry_date = ?, notes = ?
      WHERE id = ?`,
      [food_name, protein_grams, calories, carbs, fat, serving_size, meal_type, quantity, entry_date, notes, req.params.id]
    );

    const entry = await dbGet('SELECT * FROM food_entries WHERE id = ?', [req.params.id]);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete food entry
app.delete('/api/entries/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM food_entries WHERE id = ?', [req.params.id]);
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== FAVORITES ROUTES ==================

// Get favorite foods
app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const favorites = await dbAll(
      'SELECT * FROM favorite_foods WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add favorite food
app.post('/api/favorites', async (req, res) => {
  try {
    const { user_id = 1, food_name, protein_grams, calories, serving_size } = req.body;
    const result = await dbRun(
      'INSERT INTO favorite_foods (user_id, food_name, protein_grams, calories, serving_size) VALUES (?, ?, ?, ?, ?)',
      [user_id, food_name, protein_grams, calories, serving_size]
    );
    const favorite = await dbGet('SELECT * FROM favorite_foods WHERE id = ?', [result.id]);
    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete favorite food
app.delete('/api/favorites/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM favorite_foods WHERE id = ?', [req.params.id]);
    res.json({ message: 'Favorite deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== FOOD SEARCH API (USDA) ==================

// Search USDA FoodData Central
app.get('/api/food/search', async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';

    const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
      params: {
        query,
        api_key: apiKey,
        pageSize: 10,
        dataType: ['Survey (FNDDS)', 'Foundation', 'SR Legacy']
      }
    });

    const foods = response.data.foods.map(food => {
      const proteinNutrient = food.foodNutrients.find(n => n.nutrientName === 'Protein');
      const caloriesNutrient = food.foodNutrients.find(n => n.nutrientName === 'Energy');
      const carbsNutrient = food.foodNutrients.find(n => n.nutrientName === 'Carbohydrate, by difference');
      const fatNutrient = food.foodNutrients.find(n => n.nutrientName === 'Total lipid (fat)');

      return {
        fdcId: food.fdcId,
        description: food.description,
        protein: proteinNutrient ? proteinNutrient.value : 0,
        calories: caloriesNutrient ? caloriesNutrient.value : 0,
        carbs: carbsNutrient ? carbsNutrient.value : 0,
        fat: fatNutrient ? fatNutrient.value : 0,
        servingSize: food.servingSize || 100,
        servingUnit: food.servingSizeUnit || 'g'
      };
    });

    res.json(foods);
  } catch (error) {
    console.error('USDA API Error:', error.message);
    res.status(500).json({ error: 'Failed to search foods', message: error.message });
  }
});

// ================== EXPORT DATA ==================

// Export all entries as CSV
app.get('/api/export/:userId', async (req, res) => {
  try {
    const entries = await dbAll(
      'SELECT * FROM food_entries WHERE user_id = ? ORDER BY entry_date DESC',
      [req.params.userId]
    );

    // Create CSV
    const headers = ['Date', 'Time', 'Food Name', 'Protein (g)', 'Calories', 'Carbs (g)', 'Fat (g)', 'Serving Size', 'Meal Type', 'Notes'];
    const csv = [
      headers.join(','),
      ...entries.map(e => [
        e.entry_date,
        e.entry_time,
        `"${e.food_name}"`,
        e.protein_grams,
        e.calories || '',
        e.carbs || '',
        e.fat || '',
        `"${e.serving_size || ''}"`,
        e.meal_type || '',
        `"${e.notes || ''}"`
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=proteinpro-data.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== START SERVER ==================

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.listen(PORT, () => {
  console.log(`ProteinPro API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
