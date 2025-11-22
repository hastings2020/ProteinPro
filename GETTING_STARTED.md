# 🚀 Getting Started - Step by Step

Having trouble? Follow these exact steps:

## 📋 Prerequisites

1. **Node.js 14+** installed
   ```bash
   node --version  # Should show v14 or higher
   ```
   If not installed: Download from https://nodejs.org/

## 🔧 One-Command Setup

Run this single command from the ProteinPro directory:

```bash
./setup.sh
```

This will:
- ✅ Install all dependencies
- ✅ Create environment files
- ✅ Initialize database with sample data
- ✅ Tell you exactly what to do next

## 🎯 Starting the Application

### Option 1: Automatic (Recommended)

```bash
./start.sh
```

This starts both backend and frontend automatically.

### Option 2: Manual (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
Connected to SQLite database
ProteinPro API server running on port 5001
Health check: http://localhost:5001/api/health
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Browser will automatically open to http://localhost:3000

## ✅ Verify It's Working

1. Backend running: http://localhost:5001/api/health
   - Should show: `{"status":"ok","message":"ProteinPro API is running"}`

2. Frontend loaded: http://localhost:3000
   - Should show the ProteinPro dashboard

## 🎯 Quick Test

1. Click **"⚡ Quick Add"**
2. Enter:
   - Food: "Test Chicken"
   - Protein: "30"
3. Click "Add Now"
4. You should see a success message!

## ❌ If You Get Errors

### "Cannot read properties of null"
- **Wait a moment** - The app is loading user data
- **Refresh the page** if it persists

### "Failed to load entries"
- **Backend not running!**
- Open a terminal and run:
  ```bash
  cd backend
  npm run dev
  ```

### "Cannot connect to backend"
1. Check backend is running: `curl http://localhost:5001/api/health`
2. If not running: `cd backend && npm run dev`
3. Check the terminal for error messages

### Database Errors
```bash
cd backend
rm proteinpro.db  # Remove old database
npm run init-db   # Create fresh database
npm run dev       # Start server
```

### Port Already in Use
```bash
# Kill process on port 5001
lsof -i :5001
kill -9 <PID>

# Or kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

## 📊 Expected Workflow

```
1. Run ./setup.sh (first time only)
   ↓
2. Run ./start.sh
   ↓
3. Wait for both servers to start
   ↓
4. Browser opens to http://localhost:3000
   ↓
5. Dashboard loads with sample data
   ↓
6. Click "Quick Add" to add food
   ✓ Success!
```

## 🆘 Still Having Issues?

Run the verification script:
```bash
./verify-setup.sh
```

This will check everything and tell you exactly what's wrong.

For detailed troubleshooting: See **TROUBLESHOOTING.md**

## 💡 Pro Tips

1. **Always start backend first** before frontend
2. **Keep both terminals open** while using the app
3. **Check terminal output** if something doesn't work
4. **Use Quick Add** for fast entries
5. **Use Full Entry** for detailed logging with search

---

**Need more help?** Check:
- README.md - Full documentation
- TROUBLESHOOTING.md - Common issues and fixes
- QUICKSTART.md - Alternative setup guide
