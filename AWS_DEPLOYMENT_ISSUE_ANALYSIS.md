# AWS Deployment Issue Analysis

## Problem
Calendar and Analytics show data locally but not in AWS deployment.

## Root Causes Identified

### 1. Analytics Endpoint Data Structure Mismatch

**Local (server.js:223-233)** returns:
```json
{
  "dailyData": [...],
  "statistics": {
    "totalDays": 30,
    "avgProtein": 145.5,
    "daysMetGoal": 20,
    "goalPercentage": 67,
    "currentStreak": 5,
    "target": 150
  }
}
```

**AWS Lambda (lambda.js:305-311)** returns:
```json
{
  "total_entries": 90,
  "total_protein": 4365,
  "total_calories": 12000,
  "avg_protein_per_entry": 48.5,
  "entries": [...]
}
```

**Impact**: Analytics component expects `dailyData` and `statistics` objects, but AWS returns completely different structure causing data not to display.

### 2. Daily Totals Endpoint Field Name Mismatch

**Local (server.js:164-168)** SQL aggregates:
- `total_protein`
- `total_calories`
- `entry_count`
- Uses `DATE(entry_date)` for grouping

**AWS Lambda (lambda.js:169-173)** calculates manually:
- `total_protein`
- `total_calories`
- `total_carbs`
- `total_fat`
- `entry_count`

**Potential Issue**: The lambda.js code adds extra fields (carbs, fat) but the structure looks compatible.

### 3. Frontend API URL Configuration

**Status**: No `.env` file exists in frontend directory
**Default**: Uses `http://localhost:5001/api` (from api.js:3)
**AWS Need**: Must point to API Gateway endpoint

**Impact**: If frontend is built without proper REACT_APP_API_URL, it will try to call localhost which won't work in AWS.

## Solutions Required

1. ✅ Fix lambda.js analytics endpoint to match server.js format
2. ✅ Verify daily-totals endpoint compatibility
3. ✅ Ensure frontend build uses correct AWS API URL
4. ✅ Add quantity multiplication in lambda.js calculations (if needed)

## Files to Modify

- `/home/user/ProteinPro/backend/lambda.js` - Fix analytics endpoint
- `/home/user/ProteinPro/frontend/.env` - Create with AWS API URL (deployment time)
- Document proper deployment procedure
