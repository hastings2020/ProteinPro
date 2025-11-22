# 🔧 Troubleshooting Guide

Common issues and solutions for ProteinPro.

## Quick Verification

Run the setup verification script:
```bash
./verify-setup.sh
```

This will check all requirements and give you specific instructions for any missing components.

---

## Common Issues

### 1. "Failed to add entry" Error

**Problem:** Getting error when trying to add food entries.

**Solutions:**

✅ **Check if backend is running:**
```bash
# Test if backend is responding
curl http://localhost:5001/api/health
```

If you get a connection error, the backend isn't running.

✅ **Start the backend:**
```bash
cd backend
npm run dev
```

✅ **Check database exists:**
```bash
ls -la backend/proteinpro.db
```

If it doesn't exist:
```bash
cd backend
npm run init-db
```

✅ **Check for port conflicts:**
```bash
# Check if something else is using port 5000
lsof -i :5001
```

If another process is using it, kill it or change the backend port in `backend/.env`.

---

### 2. Food Search Not Working

**Problem:** USDA food search returns errors or no results.

**Solutions:**

✅ **Verify backend is running:**
The food search requires the backend to be active.

✅ **Check API key:**
Edit `backend/.env`:
```env
USDA_API_KEY=DEMO_KEY
```

The DEMO_KEY has limited requests. For unlimited searches:
1. Get a free API key: https://fdc.nal.usda.gov/api-key-signup.html
2. Replace `DEMO_KEY` with your actual key
3. Restart the backend server

✅ **Test the API directly:**
```bash
curl "http://localhost:5001/api/food/search?query=chicken"
```

✅ **Check error messages:**
- **403 Error:** API rate limit reached. Get your own API key.
- **Network Error:** Backend not running or wrong URL.
- **500 Error:** Backend issue - check backend logs.

---

### 3. Backend Won't Start

**Problem:** Error when running `npm run dev` in backend.

**Solutions:**

✅ **Install dependencies:**
```bash
cd backend
rm -rf node_modules
npm install
```

✅ **Check Node.js version:**
```bash
node --version  # Should be 14+
```

✅ **Check for syntax errors:**
```bash
cd backend
node server.js
```

✅ **Port already in use:**
```bash
# Find process using port 5000
lsof -i :5001
kill -9 <PID>

# Or change port in backend/.env
PORT=5001
```

---

### 4. Frontend Won't Start

**Problem:** Error when running `npm start` in frontend.

**Solutions:**

✅ **Install dependencies:**
```bash
cd frontend
rm -rf node_modules
npm install
```

✅ **Clear cache:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

✅ **Port 3000 in use:**
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

Or set a different port:
```bash
PORT=3001 npm start
```

---

### 5. Database Issues

**Problem:** Errors related to database operations.

**Solutions:**

✅ **Reset database:**
```bash
cd backend
rm proteinpro.db
npm run init-db
```

✅ **Check database file permissions:**
```bash
ls -la backend/proteinpro.db
chmod 644 backend/proteinpro.db
```

✅ **Verify SQLite is working:**
```bash
cd backend
sqlite3 proteinpro.db "SELECT * FROM users;"
```

---

### 6. "No entries" or Empty Data

**Problem:** App shows no data even after adding entries.

**Solutions:**

✅ **Check browser console:**
Open Developer Tools (F12) and look for errors in the Console tab.

✅ **Verify API connection:**
```bash
# Check if user exists
curl http://localhost:5001/api/user/1

# Check if entries exist
curl http://localhost:5001/api/entries/1
```

✅ **Check correct date format:**
Entries might be logged with wrong date. Check in database:
```bash
cd backend
sqlite3 proteinpro.db
SELECT * FROM food_entries ORDER BY entry_date DESC LIMIT 10;
.quit
```

---

### 7. CORS Errors in Browser Console

**Problem:** Browser shows CORS policy errors.

**Solutions:**

✅ **Verify backend CORS is enabled:**
Check `backend/server.js` has:
```javascript
app.use(cors());
```

✅ **Check frontend API URL:**
In `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5001/api
```

✅ **Restart both servers** after changing environment variables.

---

### 8. OCR Not Working

**Problem:** Nutrition label scanning doesn't extract data.

**Solutions:**

✅ **Use high-quality images:**
- Good lighting
- Clear focus
- Flat label (no wrinkles)
- Capture entire nutrition facts panel

✅ **Try different images:**
OCR accuracy varies. Some labels work better than others.

✅ **Check browser console:**
Look for Tesseract.js errors.

✅ **Fallback to manual entry:**
OCR is a convenience feature. You can always enter data manually.

---

### 9. Charts Not Displaying

**Problem:** Analytics charts are blank or showing errors.

**Solutions:**

✅ **Add data first:**
Charts require entries. Add some food entries and wait a moment.

✅ **Check date range:**
Switch between Week/Month/Year views.

✅ **Browser console errors:**
Check for Chart.js errors in console.

✅ **Clear browser cache:**
```bash
# Hard refresh
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

---

### 10. Dependencies Won't Install

**Problem:** `npm install` fails.

**Solutions:**

✅ **Clear npm cache:**
```bash
npm cache clean --force
```

✅ **Delete lock files:**
```bash
rm package-lock.json
rm -rf node_modules
npm install
```

✅ **Update npm:**
```bash
npm install -g npm@latest
```

✅ **Check Node version:**
```bash
node --version  # Needs to be 14+
```

If too old, download latest from https://nodejs.org/

---

## Environment Setup Issues

### Missing .env Files

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### Wrong API URL

Frontend `.env` should have:
```env
REACT_APP_API_URL=http://localhost:5001/api
```

NOT:
- `http://localhost:5001` (missing /api)
- `https://...` (should be http for local)
- Different port than backend

---

## Platform-Specific Issues

### Windows

**PowerShell Script Execution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Path Issues:**
Use forward slashes or escape backslashes in paths.

### Mac/Linux

**Permission Denied on Scripts:**
```bash
chmod +x start.sh
chmod +x deploy-to-s3.sh
chmod +x verify-setup.sh
```

**Port Binding Issues:**
```bash
# Check what's using ports
sudo lsof -i :5001
sudo lsof -i :3000
```

---

## Still Having Issues?

### 1. Check Logs

**Backend logs:**
```bash
cd backend
npm run dev
# Watch for error messages
```

**Frontend logs:**
Browser console (F12 → Console tab)

### 2. Verify Complete Setup

```bash
./verify-setup.sh
```

### 3. Fresh Install

```bash
# Backup any custom data first!
rm -rf backend/node_modules frontend/node_modules
rm backend/proteinpro.db
npm run install-all
npm run init-db
```

### 4. Check GitHub Issues

Visit the repository issues page for known problems and solutions.

### 5. Get Help

- Read README.md thoroughly
- Check QUICKSTART.md for setup steps
- Review DEPLOYMENT.md for advanced setup
- Open an issue on GitHub with:
  - Error messages
  - Steps to reproduce
  - Your OS and Node version
  - Output of `./verify-setup.sh`

---

## Success Indicators

When everything is working correctly:

✅ Backend responds at http://localhost:5001/api/health
✅ Frontend loads at http://localhost:3000
✅ Can add food entries
✅ Can search foods (with backend running)
✅ Can view calendar and analytics
✅ No errors in browser console
✅ Database file exists at `backend/proteinpro.db`

---

**Last Updated:** 2024
**Version:** 1.0.0
