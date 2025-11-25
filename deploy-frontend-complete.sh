#!/bin/bash

# ProteinPro Complete Frontend Deployment Script
# This script handles the full deployment workflow:
# 1. Gets backend API URL
# 2. Creates .env file
# 3. Builds frontend
# 4. Deploys to S3

set -e

echo "🚀 ProteinPro Complete Frontend Deployment"
echo "=========================================="
echo ""

# Configuration
BUCKET_NAME=${1:-"proteinpro-app"}
REGION=${2:-"ap-southeast-2"}
PROFILE=${3:-"default"}
STAGE=${4:-"prod"}

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is not installed. Install for better experience:"
    echo "   sudo apt-get install jq (Linux) or brew install jq (Mac)"
fi

echo "Configuration:"
echo "  Bucket Name: $BUCKET_NAME"
echo "  Region: $REGION"
echo "  AWS Profile: $PROFILE"
echo "  Backend Stage: $STAGE"
echo ""

# Step 1: Get Backend API URL
echo "🔍 Step 1: Getting Backend API URL..."
echo ""

# Try to get serverless info
cd backend

if [ -f "serverless.yml" ] && command -v serverless &> /dev/null; then
    echo "Checking Serverless deployment..."

    # Get the API endpoint from serverless info
    API_ENDPOINT=$(npx serverless info --stage $STAGE 2>/dev/null | grep -A 1 "endpoints:" | tail -n 1 | awk '{print $3}' | sed 's/{proxy+}$//')

    if [ -n "$API_ENDPOINT" ]; then
        API_URL="${API_ENDPOINT}api"
        echo "✅ Found Serverless API endpoint: $API_URL"
    else
        echo "⚠️  Could not auto-detect API endpoint"
        echo ""
        echo "Please enter your API Gateway URL (without /api suffix):"
        echo "Example: https://abc123xyz.execute-api.ap-southeast-2.amazonaws.com"
        read -p "API Gateway URL: " API_BASE
        API_URL="${API_BASE}/api"
    fi
else
    echo "⚠️  Serverless not configured or not installed"
    echo ""
    echo "Please enter your backend API URL:"
    echo "Examples:"
    echo "  Lambda: https://abc123xyz.execute-api.ap-southeast-2.amazonaws.com/api"
    echo "  EC2: http://ec2-xx-xx-xx-xx.compute.amazonaws.com/api"
    read -p "API URL: " API_URL
fi

cd ..

echo ""
echo "Using API URL: $API_URL"
echo ""

# Verify API is reachable
echo "🔍 Verifying API connectivity..."
if curl -f -s "${API_URL}/health" > /dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s "${API_URL}/health")
    echo "✅ API is reachable: $HEALTH_RESPONSE"
else
    echo "⚠️  Warning: Could not reach API endpoint"
    echo "   This might be normal if backend is not yet deployed"
    read -p "Continue anyway? (y/N): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

echo ""

# Step 2: Configure Frontend Environment
echo "📝 Step 2: Creating frontend .env file..."
cd frontend

cat > .env <<EOF
REACT_APP_API_URL=$API_URL
EOF

echo "✅ Created .env file with API URL: $API_URL"
echo ""

# Step 3: Build Frontend
echo "📦 Step 3: Building React application..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build
npm run build

if [ ! -d "build" ]; then
    echo "❌ Build failed - no build directory created"
    exit 1
fi

echo ""
echo "✅ Build complete!"
echo ""

# Verify build contains correct API URL
if grep -r "$API_URL" build/static/js/*.js > /dev/null 2>&1; then
    echo "✅ Verified: Build contains correct API URL"
else
    echo "⚠️  Warning: Could not verify API URL in build files"
fi

cd ..

echo ""

# Step 4: Deploy to S3
echo "🪣 Step 4: Deploying to S3..."
echo ""

# Create bucket if it doesn't exist
if aws s3 ls "s3://$BUCKET_NAME" --profile "$PROFILE" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating S3 bucket: $BUCKET_NAME"
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION" --profile "$PROFILE"
    echo "✅ Bucket created"
else
    echo "✅ Bucket exists: $BUCKET_NAME"
fi

echo ""

# Configure bucket for static website hosting
echo "Configuring static website hosting..."
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html \
    --profile "$PROFILE"

echo ""

# Set bucket policy for public access
echo "Setting bucket policy for public access..."
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

aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/bucket-policy.json \
    --profile "$PROFILE" 2>/dev/null || echo "Note: Bucket policy may need manual update"

echo ""

# Upload files
echo "Uploading files to S3..."
aws s3 sync frontend/build/ "s3://$BUCKET_NAME" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --profile "$PROFILE"

# Upload index.html with no-cache
aws s3 cp frontend/build/index.html "s3://$BUCKET_NAME/index.html" \
    --cache-control "no-cache" \
    --profile "$PROFILE"

echo ""
echo "✅ Upload complete!"
echo ""

# Get the website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "Your frontend is now live at:"
echo "  📍 $WEBSITE_URL"
echo ""
echo "API Configuration:"
echo "  🔗 Backend API: $API_URL"
echo ""
echo "📋 Next Steps:"
echo "  1. Open the URL above in your browser"
echo "  2. Check browser DevTools to verify API calls work"
echo "  3. Test Calendar and Analytics features"
echo "  4. Add some protein entries to verify data persistence"
echo ""
echo "🔒 Optional: Set up CloudFront for HTTPS"
echo "  Run: ./setup-cloudfront.sh $BUCKET_NAME $PROFILE"
echo ""
echo "🔄 To update after code changes:"
echo "  Run: ./deploy-frontend-complete.sh $BUCKET_NAME $REGION $PROFILE"
echo ""

# Optional: Ask if user wants to setup CloudFront
read -p "Would you like to set up CloudFront now for HTTPS? (y/N): " SETUP_CF
if [[ $SETUP_CF =~ ^[Yy]$ ]]; then
    if [ -f "./setup-cloudfront.sh" ]; then
        chmod +x ./setup-cloudfront.sh
        ./setup-cloudfront.sh "$BUCKET_NAME" "$PROFILE" "$REGION"
    else
        echo "⚠️  setup-cloudfront.sh not found"
    fi
fi

echo ""
echo "✅ All done! Happy tracking! 💪"
echo ""
