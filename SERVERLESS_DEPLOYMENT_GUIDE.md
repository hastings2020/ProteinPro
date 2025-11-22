# Serverless Deployment Guide for ProteinPro

Deploy ProteinPro as a fully serverless application on AWS using Lambda, API Gateway, DynamoDB, S3, and CloudFront.

## Architecture

```
┌─────────────────┐
│   CloudFront    │  ← CDN for frontend
│   + S3 Bucket   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │  ← HTTPS endpoints
│  (HTTP API)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AWS Lambda     │  ← Serverless backend
│  (Node.js 18)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   DynamoDB      │  ← Serverless database
│  (3 tables)     │
└─────────────────┘
```

## Benefits of Serverless

✅ **Auto-scaling:** Handles traffic spikes automatically
✅ **Pay per use:** Only pay for actual requests
✅ **Zero maintenance:** No servers to manage
✅ **High availability:** Built-in redundancy
✅ **Global distribution:** CloudFront CDN
✅ **Cost-effective:** ~$1-5/month for small apps

## Prerequisites

- AWS Account with IAM permissions
- AWS CLI configured (`aws configure`)
- Node.js 18+
- Serverless Framework

## Step 1: Install Serverless Framework

```bash
npm install -g serverless
```

## Step 2: Configure AWS Credentials

```bash
# If not already done
aws configure

# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
```

## Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

This installs:
- `serverless-http` - Wraps Express for Lambda
- `@aws-sdk/client-dynamodb` - AWS DynamoDB client
- `uuid` - Generates unique IDs for DynamoDB
- `serverless-offline` - Local testing

## Step 4: Deploy Backend (Dev Environment)

```bash
cd backend

# Deploy to development environment
npm run deploy

# Or use serverless directly
serverless deploy --stage dev
```

This will:
1. Create DynamoDB tables (users, entries, favorites)
2. Create Lambda function
3. Create API Gateway endpoints
4. Set up IAM roles and permissions
5. Output your API endpoint URL

**Example output:**
```
✔ Service deployed to stack proteinpro-backend-dev

endpoint: https://abc123xyz.execute-api.us-east-1.amazonaws.com
functions:
  api: proteinpro-backend-dev-api
```

**Copy the endpoint URL** - you'll need it for the frontend!

## Step 5: Test Backend

```bash
# Test health endpoint
curl https://your-api-endpoint.execute-api.us-east-1.amazonaws.com/api/health

# Should return: {"status":"ok","message":"ProteinPro API is running (Serverless)"}
```

## Step 6: Deploy Frontend to S3 + CloudFront

### Option A: Automated Script

```bash
# Update with your API endpoint
cd frontend
echo "REACT_APP_API_URL=https://your-api-endpoint.execute-api.us-east-1.amazonaws.com/api" > .env.production

# Build
npm run build

# Deploy (creates S3 bucket + CloudFront)
cd ..
./deploy-serverless-frontend.sh proteinpro-app
```

### Option B: Manual S3 Deployment

```bash
cd frontend

# Create production env file
echo "REACT_APP_API_URL=https://your-api-endpoint.execute-api.us-east-1.amazonaws.com/api" > .env.production

# Build
npm run build

# Create S3 bucket (choose unique name)
aws s3 mb s3://proteinpro-app-yourname --region us-east-1

# Enable website hosting
aws s3 website s3://proteinpro-app-yourname \
  --index-document index.html \
  --error-document index.html

# Upload files
aws s3 sync build/ s3://proteinpro-app-yourname \
  --acl public-read \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "service-worker.js"

# Upload HTML with no cache
aws s3 sync build/ s3://proteinpro-app-yourname \
  --acl public-read \
  --cache-control "public, max-age=0, must-revalidate" \
  --exclude "*" \
  --include "*.html" \
  --include "service-worker.js"

# Get website URL
echo "http://proteinpro-app-yourname.s3-website-us-east-1.amazonaws.com"
```

## Step 7: (Optional) Set Up CloudFront for HTTPS

CloudFront provides:
- HTTPS/SSL encryption
- Global CDN (faster loading worldwide)
- Custom domain support
- Better caching

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name proteinpro-app-yourname.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html

# This takes 15-20 minutes to deploy
# You'll get a CloudFront URL like: https://d123abc.cloudfront.net
```

## Step 8: Update CORS (If Needed)

If using CloudFront or custom domain, update CORS in `backend/lambda.js`:

```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'https://d123abc.cloudfront.net',
    'https://your-domain.com'
  ],
  credentials: true
}));
```

Then redeploy backend:
```bash
cd backend
npm run deploy
```

## Deploying to Production

Once tested in dev, deploy to production:

```bash
# Backend
cd backend
npm run deploy:prod
# Note the new API endpoint URL

# Frontend
cd ../frontend
echo "REACT_APP_API_URL=https://your-prod-api-endpoint/api" > .env.production
npm run build

# Upload to production S3 bucket
aws s3 sync build/ s3://proteinpro-app-prod --acl public-read
```

## Environment Variables

Set environment variables in `serverless.yml` or via AWS Console:

```bash
# Via Serverless CLI
serverless deploy --param="USDA_API_KEY=your-actual-key"

# Or edit serverless.yml:
provider:
  environment:
    USDA_API_KEY: ${env:USDA_API_KEY, 'DEMO_KEY'}
```

## Monitoring and Logs

### View Logs

```bash
# Real-time logs
serverless logs -f api --tail

# Or specific time range
serverless logs -f api --startTime 1h
```

### AWS Console

1. Go to CloudWatch Logs
2. Find log group: `/aws/lambda/proteinpro-backend-dev-api`
3. View streams for requests/errors

### API Gateway Metrics

1. Go to API Gateway Console
2. Select your API
3. View Dashboard for metrics (requests, latency, errors)

## Cost Estimation

### Development/Low Traffic (< 1000 users/month)

| Service | Monthly Cost |
|---------|-------------|
| Lambda | $0-1 (1M free requests) |
| API Gateway | $0-1 (1M free requests) |
| DynamoDB | $0-2 (25GB free tier) |
| S3 | $0.50 (5GB free tier) |
| CloudFront | $0-1 (1TB free tier) |
| **Total** | **~$1-5/month** |

### Production/Medium Traffic (10K users/month)

| Service | Monthly Cost |
|---------|-------------|
| Lambda | $5-10 |
| API Gateway | $3-5 |
| DynamoDB | $5-15 |
| S3 | $1-2 |
| CloudFront | $5-10 |
| **Total** | **~$19-42/month** |

## Database Management

### Seed Initial Data

The first time a user accesses the API, they're automatically created in DynamoDB. No manual seeding needed!

### Backup DynamoDB

Enable point-in-time recovery:

```bash
aws dynamodb update-continuous-backups \
  --table-name proteinpro-backend-dev-entries \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### Query DynamoDB

```bash
# List all entries for a user
aws dynamodb query \
  --table-name proteinpro-backend-dev-entries \
  --index-name user_id-entry_date-index \
  --key-condition-expression "user_id = :uid" \
  --expression-attribute-values '{":uid":{"S":"1"}}'
```

## Updating the Application

### Update Backend

```bash
cd backend

# Make code changes to lambda.js or serverless.yml

# Redeploy
npm run deploy

# View logs to verify
npm run logs
```

### Update Frontend

```bash
cd frontend

# Make code changes

# Rebuild
npm run build

# Sync to S3
aws s3 sync build/ s3://your-bucket-name --acl public-read

# Invalidate CloudFront cache (if using CloudFront)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

## Rollback

### Rollback Backend

Serverless Framework keeps previous versions:

```bash
serverless rollback --timestamp TIMESTAMP
```

Find timestamp in deployment history:
```bash
serverless deploy list
```

### Rollback Frontend

Keep previous builds:
```bash
# Before deploying new version, backup current
aws s3 sync s3://your-bucket s3://your-bucket-backup

# To rollback
aws s3 sync s3://your-bucket-backup s3://your-bucket
```

## Removing/Destroying Everything

### Remove Backend

```bash
cd backend
serverless remove
```

This deletes:
- Lambda function
- API Gateway
- DynamoDB tables (⚠️ data loss!)
- IAM roles

### Remove Frontend

```bash
# Delete S3 bucket
aws s3 rb s3://your-bucket-name --force

# Delete CloudFront distribution (if created)
aws cloudfront delete-distribution --id YOUR_DIST_ID
```

## Troubleshooting

### Lambda Function Errors

```bash
# Check logs
serverless logs -f api --tail

# Common issues:
# - DynamoDB permissions: Check IAM role in serverless.yml
# - Cold start timeout: Increase timeout in serverless.yml
# - Package size: Ensure node_modules is optimized
```

### CORS Errors

Update `lambda.js`:
```javascript
app.use(cors({
  origin: '*',  // Or specific domains
  credentials: true
}));
```

### DynamoDB Throttling

Increase table capacity or use on-demand billing:
```yaml
# In serverless.yml
BillingMode: PAY_PER_REQUEST  # Already configured
```

### API Gateway 502 Errors

Usually means Lambda crashed:
```bash
# Check Lambda logs
serverless logs -f api --tail
```

### Frontend Not Loading

1. Check S3 bucket policy allows public read
2. Verify .env.production has correct API URL
3. Check browser console for errors
4. Verify CORS is configured correctly

## Security Best Practices

### 1. API Gateway Throttling

Add to `serverless.yml`:
```yaml
provider:
  apiGateway:
    throttle:
      rateLimit: 100
      burstLimit: 200
```

### 2. DynamoDB Encryption

Already enabled by default in serverless.yml.

### 3. Environment Variables

Use AWS Secrets Manager for sensitive data:
```bash
aws secretsmanager create-secret \
  --name proteinpro/usda-api-key \
  --secret-string "your-actual-key"
```

### 4. CloudFront Security Headers

Add Lambda@Edge function for security headers (optional).

## Custom Domain Setup

### 1. Register Domain (Route 53 or elsewhere)

### 2. Create SSL Certificate (ACM)

```bash
aws acm request-certificate \
  --domain-name api.yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

### 3. Configure Custom Domain in API Gateway

Use AWS Console or Serverless plugin:
```bash
npm install --save-dev serverless-domain-manager
```

Add to `serverless.yml`:
```yaml
plugins:
  - serverless-offline
  - serverless-domain-manager

custom:
  customDomain:
    domainName: api.yourdomain.com
    certificateName: api.yourdomain.com
    basePath: ''
    stage: ${self:provider.stage}
    createRoute53Record: true
```

### 4. Update Frontend

```bash
echo "REACT_APP_API_URL=https://api.yourdomain.com/api" > .env.production
```

## Performance Optimization

### 1. Lambda Provisioned Concurrency

For zero cold starts (costs more):
```yaml
functions:
  api:
    provisionedConcurrency: 2
```

### 2. DynamoDB Global Tables

For multi-region deployment (optional).

### 3. CloudFront Caching

Already configured in deployment script.

## CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Deploy Backend
        run: |
          cd backend
          npm install
          npm run deploy:prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Deploy Frontend
        run: |
          cd frontend
          npm install
          npm run build
          aws s3 sync build/ s3://your-bucket --delete
        env:
          REACT_APP_API_URL: https://your-api-endpoint/api
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Next Steps

1. ✅ Test all features (add entry, search, calendar)
2. ✅ Set up custom domain
3. ✅ Enable CloudWatch alarms
4. ✅ Get real USDA API key
5. ✅ Set up CI/CD pipeline
6. ✅ Enable DynamoDB backups
7. ✅ Add monitoring/alerting

---

**Questions?** Check the main documentation or AWS Console.

**Happy Serverless Deployment! 🚀**
