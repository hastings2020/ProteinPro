const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize DynamoDB Client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });
const ddb = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = process.env.USERS_TABLE;
const ENTRIES_TABLE = process.env.ENTRIES_TABLE;
const FAVORITES_TABLE = process.env.FAVORITES_TABLE;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ProteinPro API is running (Serverless)' });
});

// User endpoints
app.get('/api/user/:userId', async (req, res) => {
  try {
    const result = await ddb.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: req.params.userId }
    }));

    if (!result.Item) {
      // Create default user if doesn't exist
      const newUser = {
        id: req.params.userId,
        username: 'User',
        email: 'user@example.com',
        daily_protein_target: 150,
        weight: 70,
        created_at: new Date().toISOString()
      };

      await ddb.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: newUser
      }));

      return res.json(newUser);
    }

    res.json(result.Item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user/:userId', async (req, res) => {
  try {
    const { daily_protein_target, weight, username, email } = req.body;

    const result = await ddb.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: req.params.userId },
      UpdateExpression: 'set daily_protein_target = :target, weight = :weight, username = :username, email = :email',
      ExpressionAttributeValues: {
        ':target': daily_protein_target,
        ':weight': weight,
        ':username': username,
        ':email': email
      },
      ReturnValues: 'ALL_NEW'
    }));

    res.json(result.Attributes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Food entries endpoints
app.get('/api/entries/:userId', async (req, res) => {
  try {
    const result = await ddb.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      IndexName: 'user_id-entry_date-index',
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': req.params.userId
      }
    }));

    res.json(result.Items || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/entries/:userId/date/:date', async (req, res) => {
  try {
    const result = await ddb.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      IndexName: 'user_id-entry_date-index',
      KeyConditionExpression: 'user_id = :userId AND entry_date = :date',
      ExpressionAttributeValues: {
        ':userId': req.params.userId,
        ':date': req.params.date
      }
    }));

    res.json(result.Items || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/entries/:userId/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await ddb.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      IndexName: 'user_id-entry_date-index',
      KeyConditionExpression: 'user_id = :userId AND entry_date BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':userId': req.params.userId,
        ':startDate': startDate,
        ':endDate': endDate
      }
    }));

    res.json(result.Items || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/entries/:userId/daily-totals', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await ddb.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      IndexName: 'user_id-entry_date-index',
      KeyConditionExpression: 'user_id = :userId AND entry_date BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':userId': req.params.userId,
        ':startDate': startDate,
        ':endDate': endDate
      }
    }));

    // Group by date
    const dailyTotals = {};
    (result.Items || []).forEach(entry => {
      if (!dailyTotals[entry.entry_date]) {
        dailyTotals[entry.entry_date] = {
          date: entry.entry_date,
          total_protein: 0,
          total_calories: 0,
          total_carbs: 0,
          total_fat: 0,
          entry_count: 0
        };
      }
      dailyTotals[entry.entry_date].total_protein += parseFloat(entry.protein_grams) || 0;
      dailyTotals[entry.entry_date].total_calories += parseFloat(entry.calories) || 0;
      dailyTotals[entry.entry_date].total_carbs += parseFloat(entry.carbs) || 0;
      dailyTotals[entry.entry_date].total_fat += parseFloat(entry.fat) || 0;
      dailyTotals[entry.entry_date].entry_count += 1;
    });

    res.json(Object.values(dailyTotals));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/entries', async (req, res) => {
  try {
    const {
      user_id = '1',
      food_name,
      protein_grams,
      calories,
      carbs,
      fat,
      serving_size,
      meal_type,
      notes
    } = req.body;

    const entry_date = req.body.entry_date || new Date().toISOString().split('T')[0];

    if (!food_name || !protein_grams) {
      return res.status(400).json({ error: 'food_name and protein_grams are required' });
    }

    const entry = {
      id: uuidv4(),
      user_id,
      food_name,
      protein_grams: parseFloat(protein_grams),
      calories: calories ? parseFloat(calories) : null,
      carbs: carbs ? parseFloat(carbs) : null,
      fat: fat ? parseFloat(fat) : null,
      serving_size: serving_size || null,
      meal_type: meal_type || null,
      entry_date,
      entry_time: new Date().toISOString(),
      notes: notes || null
    };

    await ddb.send(new PutCommand({
      TableName: ENTRIES_TABLE,
      Item: entry
    }));

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
      notes
    } = req.body;

    const entry_date = req.body.entry_date || new Date().toISOString().split('T')[0];

    const result = await ddb.send(new UpdateCommand({
      TableName: ENTRIES_TABLE,
      Key: { id: req.params.id },
      UpdateExpression: 'set food_name = :name, protein_grams = :protein, calories = :cal, carbs = :carbs, fat = :fat, serving_size = :serving, meal_type = :meal, entry_date = :date, notes = :notes',
      ExpressionAttributeValues: {
        ':name': food_name,
        ':protein': parseFloat(protein_grams),
        ':cal': calories ? parseFloat(calories) : null,
        ':carbs': carbs ? parseFloat(carbs) : null,
        ':fat': fat ? parseFloat(fat) : null,
        ':serving': serving_size || null,
        ':meal': meal_type || null,
        ':date': entry_date,
        ':notes': notes || null
      },
      ReturnValues: 'ALL_NEW'
    }));

    res.json(result.Attributes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    await ddb.send(new DeleteCommand({
      TableName: ENTRIES_TABLE,
      Key: { id: req.params.id }
    }));

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics endpoint
app.get('/api/analytics/:userId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await ddb.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      IndexName: 'user_id-entry_date-index',
      KeyConditionExpression: 'user_id = :userId AND entry_date BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':userId': req.params.userId,
        ':startDate': startDate,
        ':endDate': endDate
      }
    }));

    const entries = result.Items || [];
    const totalProtein = entries.reduce((sum, e) => sum + (parseFloat(e.protein_grams) || 0), 0);
    const totalCalories = entries.reduce((sum, e) => sum + (parseFloat(e.calories) || 0), 0);
    const avgProtein = entries.length > 0 ? totalProtein / entries.length : 0;

    res.json({
      total_entries: entries.length,
      total_protein: totalProtein,
      total_calories: totalCalories,
      avg_protein_per_entry: avgProtein,
      entries
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Favorites endpoints
app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const result = await ddb.send(new QueryCommand({
      TableName: FAVORITES_TABLE,
      IndexName: 'user_id-index',
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': req.params.userId
      }
    }));

    res.json(result.Items || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/favorites', async (req, res) => {
  try {
    const { user_id, food_name, protein_grams, calories, serving_size } = req.body;

    const favorite = {
      id: uuidv4(),
      user_id,
      food_name,
      protein_grams: parseFloat(protein_grams),
      calories: calories ? parseFloat(calories) : null,
      serving_size: serving_size || null,
      created_at: new Date().toISOString()
    };

    await ddb.send(new PutCommand({
      TableName: FAVORITES_TABLE,
      Item: favorite
    }));

    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/favorites/:id', async (req, res) => {
  try {
    await ddb.send(new DeleteCommand({
      TableName: FAVORITES_TABLE,
      Key: { id: req.params.id }
    }));

    res.json({ message: 'Favorite deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Food search endpoint
app.get('/api/food/search', async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';

    const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
      params: {
        query,
        api_key: apiKey,
        pageSize: 10
      }
    });

    const foods = response.data.foods.map(food => {
      const protein = food.foodNutrients.find(n => n.nutrientName === 'Protein');
      const calories = food.foodNutrients.find(n => n.nutrientName === 'Energy');
      const carbs = food.foodNutrients.find(n => n.nutrientName === 'Carbohydrate, by difference');
      const fat = food.foodNutrients.find(n => n.nutrientName === 'Total lipid (fat)');

      return {
        description: food.description,
        protein: protein ? protein.value : 0,
        calories: calories ? calories.value : 0,
        carbs: carbs ? carbs.value : 0,
        fat: fat ? fat.value : 0,
        servingSize: food.servingSize || 100,
        servingUnit: food.servingSizeUnit || 'g'
      };
    });

    res.json(foods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export handler
module.exports.handler = serverless(app);
