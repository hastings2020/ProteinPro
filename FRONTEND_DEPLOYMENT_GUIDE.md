# Frontend Deployment Guide - S3 & CloudFront

This guide walks you through deploying the ProteinPro frontend to AWS S3 and CloudFront with the correct API configuration.

## Prerequisites

Before you begin, ensure you have:

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Node.js and npm installed
- [ ] Backend deployed (Lambda or EC2) with API Gateway URL
- [ ] AWS account with appropriate permissions (S3, CloudFront, IAM)

---

## Step 1: Get Your Backend API URL

### If using Serverless (Lambda):

```bash
cd backend

# Deploy backend first (if not already deployed)
npx serverless deploy --stage prod

# The output will show your API endpoint, example:
# endpoints:
#   ANY - https://abc123xyz.execute-api.ap-southeast-2.amazonaws.com/{proxy+}
```

**Save this URL!** Your API URL is the base URL **with `/api` appended**:
```
https://abc123xyz.execute-api.ap-southeast-2.amazonaws.com/api
```

### If using EC2/Elastic Beanstalk:

Your API URL will be something like:
```
http://your-ec2-public-dns.compute.amazonaws.com/api
# or
http://your-app.elasticbeanstalk.com/api
```

### Verify your API is working:

```bash
# Replace with your actual API URL
API_URL="https://abc123xyz.execute-api.ap-southeast-2.amazonaws.com/api"

# Test health endpoint
curl "$API_URL/health"
# Should return: {"status":"ok","message":"ProteinPro API is running (Serverless)"}
```

---

## Step 2: Configure Frontend Environment

Create a `.env` file in the frontend directory with your AWS API URL:

```bash
cd frontend

# Create .env file
cat > .env << 'EOF'
REACT_APP_API_URL=https://YOUR_API_GATEWAY_ID.execute-api.ap-southeast-2.amazonaws.com/api
EOF

# Or use your favorite text editor
nano .env
```

**Example `.env` file:**
```
REACT_APP_API_URL=https://abc123xyz.execute-api.ap-southeast-2.amazonaws.com/api
```

⚠️ **Important**: Replace `YOUR_API_GATEWAY_ID` with your actual API Gateway ID from Step 1!

---

## Step 3: Build the Frontend

```bash
# Make sure you're in the frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Build for production
npm run build
```

This creates an optimized production build in the `frontend/build` folder.

### Verify the build contains correct API URL:

```bash
# Check that the build contains your AWS API URL
grep -r "execute-api" build/static/js/*.js

# Should show your API Gateway URL
# If it shows "localhost:5001", you need to create .env and rebuild
```

---

## Step 4: Deploy to S3

### Option A: Using the Deployment Script (Recommended)

```bash
cd ..  # Return to project root

# Make script executable
chmod +x deploy-to-s3.sh

# Deploy with custom bucket name
./deploy-to-s3.sh my-proteinpro-app ap-southeast-2 default

# Or use default bucket name "proteinpro-app"
./deploy-to-s3.sh
```

**Script Parameters:**
- Param 1: Bucket name (default: `proteinpro-app`)
- Param 2: AWS region (default: `ap-southeast-2`)
- Param 3: AWS profile (default: `default`)

### Option B: Manual Deployment

```bash
# Set variables
BUCKET_NAME="my-proteinpro-app"
REGION="ap-southeast-2"

# Create S3 bucket (if it doesn't exist)
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Configure bucket for static website hosting
aws s3 website s3://$BUCKET_NAME \
    --index-document index.html \
    --error-document index.html

# Create bucket policy for public access
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

# Apply bucket policy
aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file:///tmp/bucket-policy.json

# Upload files
aws s3 sync frontend/build/ s3://$BUCKET_NAME \
    --delete \
    --cache-control "public, max-age=31536000"

# Upload index.html with no-cache
aws s3 cp frontend/build/index.html s3://$BUCKET_NAME/index.html \
    --cache-control "no-cache"

# Get website URL
echo "Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
```

---

## Step 5: Test Your Deployment

```bash
# Your S3 website URL format:
WEBSITE_URL="http://your-bucket-name.s3-website-ap-southeast-2.amazonaws.com"

# Open in browser
echo "Visit: $WEBSITE_URL"

# Or use curl to check
curl -I $WEBSITE_URL
```

### Verify in Browser:

1. Open the S3 website URL in your browser
2. Open **DevTools** (F12) → **Network** tab
3. Navigate to Calendar or Analytics
4. Check that API calls go to your AWS API Gateway (not localhost)
5. Verify data loads correctly

---

## Step 6: Set Up CloudFront (Optional but Recommended)

CloudFront provides:
- ✅ HTTPS support
- ✅ Better performance with CDN caching
- ✅ Custom domain support
- ✅ Lower latency globally

### Using the CloudFront Script:

```bash
# Make script executable
chmod +x setup-cloudfront.sh

# Create CloudFront distribution
./setup-cloudfront.sh my-proteinpro-app default ap-southeast-2

# Save the CloudFront Distribution ID and Domain Name from output
```

### Manual CloudFront Setup:

1. **Go to AWS Console** → CloudFront → Create Distribution

2. **Origin Settings:**
   - Origin Domain: `your-bucket-name.s3-website-ap-southeast-2.amazonaws.com`
   - Protocol: HTTP only
   - Name: S3-your-bucket-name

3. **Default Cache Behavior:**
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD
   - Cache Policy: CachingOptimized

4. **Distribution Settings:**
   - Price Class: Use Only US, Canada and Europe (or All Edge Locations)
   - Default Root Object: `index.html`
   - Custom Error Responses:
     - Error Code: 404
     - Response Page Path: `/index.html`
     - HTTP Response Code: 200

5. **Create Distribution** (takes 15-20 minutes to deploy)

### Get CloudFront URL:

```bash
# List your distributions
aws cloudfront list-distributions \
    --query 'DistributionList.Items[*].[Id,DomainName,Comment]' \
    --output table

# Your app will be at: https://d123abc456xyz.cloudfront.net
```

---

## Step 7: Update After Changes

When you make frontend code changes:

```bash
# 1. Build with latest changes
cd frontend
npm run build

# 2. Sync to S3
cd ..
aws s3 sync frontend/build/ s3://your-bucket-name --delete

# 3. Upload index.html with no-cache
aws s3 cp frontend/build/index.html s3://your-bucket-name/index.html \
    --cache-control "no-cache"

# 4. Invalidate CloudFront cache (if using CloudFront)
aws cloudfront create-invalidation \
    --distribution-id YOUR_DISTRIBUTION_ID \
    --paths "/*"
```

---

## Troubleshooting

### Issue: Frontend shows "localhost" errors

**Cause**: Frontend built without `.env` file

**Solution:**
```bash
cd frontend
echo "REACT_APP_API_URL=https://YOUR_API.execute-api.ap-southeast-2.amazonaws.com/api" > .env
npm run build
cd ..
./deploy-to-s3.sh
```

### Issue: Calendar/Analytics show no data

**Possible causes:**

1. **Wrong API URL**: Check browser console for 404/CORS errors
   ```bash
   # Verify API URL in build
   grep -r "execute-api" frontend/build/static/js/*.js
   ```

2. **Empty database**: Add test entries via the app
   ```bash
   # Check backend health
   curl https://YOUR_API.execute-api.ap-southeast-2.amazonaws.com/api/health
   ```

3. **CORS issues**: Check backend CORS configuration in lambda.js or server.js

### Issue: Bucket policy error

**Error**: "Access Denied" when accessing S3 website

**Solution:**
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name

# Re-apply public policy (see Step 4)
```

### Issue: CloudFront shows old version

**Cause**: CDN cache not invalidated

**Solution:**
```bash
# Invalidate all cached files
aws cloudfront create-invalidation \
    --distribution-id YOUR_DIST_ID \
    --paths "/*"

# Wait 1-2 minutes, then refresh browser with Ctrl+Shift+R
```

### Issue: Build fails with "out of memory"

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

---

## Cost Considerations

### S3 Pricing (Sydney region):
- Storage: ~$0.025 per GB/month
- Requests: $0.004 per 10,000 GET requests
- Data Transfer Out: $0.114 per GB (first 10 TB/month)

**Typical React app**: ~2MB = **~$0.05/month** for storage

### CloudFront Pricing:
- First 1 TB/month: $0.114 per GB
- 10 million HTTP requests: $1.20

**Low traffic app** (<100 visitors/day): **~$1-5/month**

### Free Tier:
- S3: 5 GB storage, 20,000 GET requests/month (12 months)
- CloudFront: 1 TB data transfer out, 10M HTTP requests/month (12 months)

---

## Security Best Practices

1. **Enable CloudFront** for HTTPS
2. **Use AWS WAF** (optional) for DDoS protection
3. **Restrict S3 bucket** to CloudFront only (using OAC)
4. **Set up monitoring** with CloudWatch
5. **Enable access logging** for S3 and CloudFront

### Restrict S3 to CloudFront Only (Advanced):

```bash
# 1. Create Origin Access Control in CloudFront
aws cloudfront create-origin-access-control \
    --origin-access-control-config file://oac-config.json

# 2. Update S3 bucket policy to allow only CloudFront
# (Remove public access policy)
```

---

## Quick Reference

### Environment Variables:
```bash
# Frontend (.env)
REACT_APP_API_URL=https://YOUR_API.execute-api.ap-southeast-2.amazonaws.com/api
```

### Useful Commands:
```bash
# Build frontend
cd frontend && npm run build

# Deploy to S3
./deploy-to-s3.sh my-bucket-name ap-southeast-2

# Setup CloudFront
./setup-cloudfront.sh my-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id ID --paths "/*"

# Check S3 website
curl -I http://bucket-name.s3-website-ap-southeast-2.amazonaws.com

# List CloudFront distributions
aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName]'
```

---

## Next Steps

After successful deployment:

1. ✅ Test all features (Calendar, Analytics, Entry creation)
2. ✅ Add test data and verify display
3. ✅ Set up custom domain (optional)
4. ✅ Configure SSL certificate in ACM (for custom domain)
5. ✅ Enable CloudWatch monitoring
6. ✅ Set up automated deployments (GitHub Actions, etc.)

---

## Support Resources

- **AWS S3 Static Hosting**: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html
- **CloudFront Setup**: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.html
- **React Deployment**: https://create-react-app.dev/docs/deployment/

---

**Need help?** Check the troubleshooting section or review the AWS deployment logs in CloudWatch.
