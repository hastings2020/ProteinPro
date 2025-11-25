# AWS Deployment Fix Guide

## Issues Fixed

### 1. Analytics Endpoint Data Structure Mismatch ✅
**Problem**: Lambda analytics endpoint returned incompatible data structure
**Fixed**: Updated `backend/lambda.js:284-360` to match server.js format
**Changes**:
- Now returns `{dailyData, statistics}` instead of `{total_entries, total_protein, ...}`
- Properly groups entries by date
- Calculates daily aggregates with quantity multiplication
- Computes streak, goal percentage, and other statistics

### 2. Quantity Multiplication Missing ✅
**Problem**: Daily totals and analytics didn't multiply by quantity
**Fixed**: Updated both `backend/lambda.js` and `backend/server.js`
**Changes**:
- Daily totals endpoint now multiplies protein/calories by quantity
- Analytics endpoint includes quantity in calculations
- Consistent behavior between local and AWS

### 3. Frontend API URL Configuration ⚠️
**Problem**: Frontend uses localhost by default, needs AWS API Gateway URL
**Status**: Requires deployment-time configuration

---

## Deployment Instructions

### Step 1: Deploy Backend to AWS

```bash
cd backend

# Install dependencies
npm install

# Deploy to AWS (creates Lambda, API Gateway, DynamoDB tables)
npx serverless deploy --stage prod

# Note the API endpoint URL from output (looks like):
# endpoints:
#   ANY - https://xxxxxxxxxx.execute-api.ap-southeast-2.amazonaws.com/{proxy+}
```

**Save the API Gateway URL** - you'll need it for the frontend build.

### Step 2: Configure Frontend for AWS

Create a `.env` file in the frontend directory with your API Gateway endpoint:

```bash
cd ../frontend

# Create .env file with your AWS API Gateway URL
cat > .env << 'EOF'
REACT_APP_API_URL=https://YOUR_API_ID.execute-api.ap-southeast-2.amazonaws.com/api
EOF
```

**Important**: Replace `YOUR_API_ID` with the actual API Gateway ID from Step 1.

Example:
```
REACT_APP_API_URL=https://abc123def4.execute-api.ap-southeast-2.amazonaws.com/api
```

### Step 3: Build and Deploy Frontend

```bash
# Install dependencies
npm install

# Build with the AWS API URL
npm run build

# The build folder now contains a production build that calls your AWS API
```

### Step 4: Deploy Frontend to S3/CloudFront

```bash
# Option A: Use deployment script
cd ..
./deploy-to-s3.sh

# Option B: Manual deployment
aws s3 sync frontend/build s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Verification Steps

### 1. Test Backend Endpoints

```bash
# Set your API URL
API_URL="https://YOUR_API_ID.execute-api.ap-southeast-2.amazonaws.com"

# Test health check
curl "$API_URL/api/health"
# Expected: {"status":"ok","message":"ProteinPro API is running (Serverless)"}

# Test user endpoint (creates default user if doesn't exist)
curl "$API_URL/api/user/1"
# Expected: User object with daily_protein_target

# Test adding an entry
curl -X POST "$API_URL/api/entries" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "1",
    "food_name": "Test Chicken",
    "protein_grams": 30,
    "calories": 150,
    "quantity": 2,
    "entry_date": "2025-11-25"
  }'

# Test daily totals
curl "$API_URL/api/entries/1/daily-totals?startDate=2025-11-01&endDate=2025-11-30"
# Expected: Array of daily totals (should show 60g protein for the test entry due to quantity=2)

# Test analytics
curl "$API_URL/api/analytics/1?startDate=2025-11-01&endDate=2025-11-30"
# Expected: {dailyData: [...], statistics: {...}}
```

### 2. Check Frontend Configuration

```bash
# Verify the built frontend contains correct API URL
grep -r "execute-api" frontend/build/static/js/*.js

# If this shows your AWS API Gateway URL, the build is correct
# If it shows "localhost:5001", rebuild after creating .env file
```

### 3. Test in Browser

1. Open your deployed frontend URL
2. Open browser DevTools > Network tab
3. Navigate to Calendar or Analytics
4. Check that API calls go to your AWS API Gateway URL (not localhost)
5. Verify data loads correctly

---

## Troubleshooting

### Calendar/Analytics Still Shows No Data

**Symptom**: Pages load but show "No data available"

**Possible Causes**:
1. **Empty database**: Add some test entries via the Home page or API
2. **CORS issues**: Check browser console for CORS errors
3. **Wrong API URL**: Verify frontend .env and rebuild
4. **Wrong user ID**: Frontend uses `user.id` - check it matches DynamoDB

**Solution**:
```bash
# Check browser console for errors
# Look for failed API calls or CORS errors

# Verify API endpoint is reachable
curl https://YOUR_API_ID.execute-api.ap-southeast-2.amazonaws.com/api/health

# Check what data exists in DynamoDB
aws dynamodb scan --table-name proteinpro-backend-prod-entries --max-items 10
```

### Frontend Shows Localhost Errors

**Symptom**: Network errors trying to reach `http://localhost:5001/api`

**Solution**: Frontend was built without .env file
```bash
cd frontend
# Create .env with AWS API URL
echo "REACT_APP_API_URL=https://YOUR_API_ID.execute-api.ap-southeast-2.amazonaws.com/api" > .env
# Rebuild
npm run build
# Redeploy
cd .. && ./deploy-to-s3.sh
```

### Analytics Shows Wrong Totals

**Symptom**: Protein totals don't match expectations

**Possible Cause**: Entries added before quantity fix

**Solution**:
- Old entries in DynamoDB might have quantity issues
- Try adding new entries to verify fix works
- Or update existing entries to ensure quantity field is set

---

## Key Files Modified

1. **backend/lambda.js**
   - Lines 141-177: Daily totals endpoint (now multiplies by quantity)
   - Lines 284-360: Analytics endpoint (complete rewrite to match server.js)

2. **backend/server.js**
   - Lines 163-173: Daily totals query (now multiplies by quantity)
   - Lines 190-200: Analytics query (now multiplies by quantity)

3. **frontend/.env** (needs to be created)
   - Sets `REACT_APP_API_URL` to AWS API Gateway endpoint

---

## Environment Variables Reference

### Backend (Lambda)
Set via `serverless.yml` or AWS Lambda console:
- `USERS_TABLE`: Auto-set by serverless
- `ENTRIES_TABLE`: Auto-set by serverless
- `FAVORITES_TABLE`: Auto-set by serverless
- `USDA_API_KEY`: Optional, defaults to DEMO_KEY
- `AWS_REGION`: Auto-set to ap-southeast-2

### Frontend (Build Time)
Set via `.env` file before `npm run build`:
- `REACT_APP_API_URL`: **REQUIRED** - Your AWS API Gateway URL

---

## Next Steps After Deployment

1. **Add Test Data**: Use the app to add several days of protein entries
2. **Verify Calendar**: Check that calendar shows colored tiles based on protein intake
3. **Verify Analytics**: Check that charts display and statistics calculate correctly
4. **Set Up Monitoring**: Enable CloudWatch logs for Lambda function
5. **Configure Custom Domain**: (Optional) Set up custom domain for API Gateway and CloudFront

---

## Support

If issues persist after following this guide:

1. Check CloudWatch Logs for Lambda errors
2. Verify DynamoDB tables exist and have correct indexes
3. Confirm API Gateway endpoint is publicly accessible
4. Test API endpoints directly with curl before debugging frontend
