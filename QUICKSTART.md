# 🚀 ProteinPro Quick Start Guide

Get up and running with ProteinPro in under 5 minutes!

## Prerequisites

- Node.js 14+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)

## One-Command Setup

The easiest way to get started:

```bash
./start.sh
```

This script will:
1. Install all dependencies
2. Initialize the database with sample data
3. Set up environment files
4. Start both backend and frontend servers

## Manual Setup

If you prefer to set things up manually:

### 1. Install Dependencies

```bash
# Install everything at once
npm run install-all

# OR install separately
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Initialize Database

```bash
npm run init-db
```

This creates a SQLite database with sample data for testing.

### 3. Set Up Environment Files

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 4. Start the Application

**Option A: Two Terminals**

```bash
# Terminal 1 - Backend
npm run dev-backend

# Terminal 2 - Frontend
npm run dev-frontend
```

**Option B: Using the start script**

```bash
./start.sh
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Sample Data

The database is pre-populated with:
- 1 demo user
- 30 days of food entries
- 5 favorite foods
- Various meal types (breakfast, lunch, dinner, snacks)

## First Steps

1. **Explore the Dashboard** - View today's protein progress
2. **Check the Calendar** - See color-coded days based on goal achievement
3. **View Analytics** - Explore weekly, monthly, and yearly charts
4. **Add a Food Entry** - Try the "Add Food" button
5. **Test OCR** - Upload a nutrition label image
6. **Search Foods** - Use the USDA food database
7. **Export Data** - Download your data as CSV

## Common Issues

### Port Already in Use

If port 5000 or 3000 is already in use:

```bash
# Find and kill the process
lsof -i :5000  # or :3000
kill -9 <PID>
```

Or change the port in `.env` files.

### Database Not Found

```bash
cd backend
npm run init-db
```

### Dependencies Installation Failed

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf backend/node_modules frontend/node_modules
npm run install-all
```

### CORS Errors

Ensure:
- Backend is running on port 5000
- Frontend `.env` has `REACT_APP_API_URL=http://localhost:5000/api`

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Changes automatically refresh the browser
- Backend: Uses nodemon to restart on file changes

### Database Reset

To reset the database to fresh sample data:

```bash
cd backend
rm proteinpro.db
npm run init-db
```

### View Database

To inspect the SQLite database:

```bash
cd backend
sqlite3 proteinpro.db
```

Common queries:
```sql
-- View all entries
SELECT * FROM food_entries;

-- View user info
SELECT * FROM users;

-- Check daily totals
SELECT entry_date, SUM(protein_grams) as total
FROM food_entries
GROUP BY entry_date
ORDER BY entry_date DESC;
```

## API Testing

### Using curl

```bash
# Health check
curl http://localhost:5000/api/health

# Get user
curl http://localhost:5000/api/user/1

# Get today's entries
curl http://localhost:5000/api/entries/1/date/2024-01-15

# Search foods
curl "http://localhost:5000/api/food/search?query=chicken"
```

### Using Postman or Insomnia

Import the API endpoints:
- Base URL: http://localhost:5000/api
- See README.md for full API documentation

## Next Steps

- Read the [full README](README.md) for detailed documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Customize the app for your needs
- Get a [USDA API key](https://fdc.nal.usda.gov/api-key-signup.html) for unlimited food searches

## Need Help?

- Check the [README](README.md)
- Review [Troubleshooting](#common-issues) section
- Open an issue on GitHub

---

**Happy tracking! 💪**
