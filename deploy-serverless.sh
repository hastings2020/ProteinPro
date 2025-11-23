#!/bin/bash

# ProteinPro Serverless Deployment Script
# Deploys backend to Lambda + API Gateway + DynamoDB
# Deploys frontend to S3 + CloudFront

set -e  # Exit on error

echo "🚀 ProteinPro Serverless Deployment"
echo "====================================="
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Check if Serverless Framework is installed
if ! command -v serverless &> /dev/null; then
    echo "📦 Installing Serverless Framework..."
    npm install -g serverless
fi

echo "✅ Serverless Framework installed"
echo ""

# Get stage (dev or prod)
STAGE="${1:-dev}"
echo "📝 Deploying to stage: $STAGE"
echo ""

# Deploy Backend
echo "================================"
echo "📦 Deploying Backend (Lambda)"
echo "================================"
echo ""

cd backend

# Install dependencies
echo "📥 Installing backend dependencies..."
npm install

# Deploy to AWS
echo "🚀 Deploying to AWS Lambda..."
if [ "$STAGE" = "prod" ]; then
    npm run deploy:prod
else
    npm run deploy
fi

# Extract API endpoint from serverless output
echo ""
echo "📋 Getting API endpoint..."
API_ENDPOINT=$(serverless info --stage $STAGE | grep "endpoint:" | awk '{print $2}')

if [ -z "$API_ENDPOINT" ]; then
    echo "⚠️  Could not automatically detect API endpoint."
    echo "Please check 'serverless info --stage $STAGE' and note the endpoint URL."
    read -p "Enter your API endpoint URL: " API_ENDPOINT
fi

echo "✅ Backend deployed!"
echo "   API Endpoint: $API_ENDPOINT"
echo ""

# Deploy Frontend
echo "================================"
echo "🎨 Deploying Frontend (S3)"
echo "================================"
echo ""

cd ../frontend

# Install dependencies
echo "📥 Installing frontend dependencies..."
npm install

# Create production environment file
echo "⚙️  Creating production environment..."
cat > .env.production << EOF
REACT_APP_API_URL=${API_ENDPOINT}/api
EOF

echo "   API URL: ${API_ENDPOINT}/api"
echo ""

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Create S3 bucket name
BUCKET_NAME="proteinpro-app-${STAGE}-$(date +%s)"
REGION="ap-southeast-2"

echo "📦 Creating S3 bucket: $BUCKET_NAME"

# Create bucket
aws s3 mb s3://${BUCKET_NAME} --region ${REGION} 2>/dev/null || echo "Bucket may already exist"

# Configure bucket for static website hosting
aws s3 website s3://${BUCKET_NAME} \
    --index-document index.html \
    --error-document index.html

# Create bucket policy for public read access
cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket ${BUCKET_NAME} \
    --policy file:///tmp/bucket-policy.json

# Upload files with caching
echo "📤 Uploading files to S3..."

# Upload all files except HTML with long cache
aws s3 sync build/ s3://${BUCKET_NAME} \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "service-worker.js" \
    --exclude "manifest.json"

# Upload HTML files with no cache
aws s3 sync build/ s3://${BUCKET_NAME} \
    --cache-control "public, max-age=0, must-revalidate" \
    --exclude "*" \
    --include "*.html" \
    --include "service-worker.js" \
    --include "manifest.json"

# Get S3 website URL
WEBSITE_URL="http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"

echo "✅ Frontend deployed!"
echo "   S3 Bucket: $BUCKET_NAME"
echo "   Website URL: $WEBSITE_URL"
echo ""

# Optional: Create CloudFront distribution
read -p "🌐 Do you want to create CloudFront distribution for HTTPS? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Creating CloudFront distribution..."
    echo "   (This takes 15-20 minutes)"

    # Create CloudFront distribution
    DISTRIBUTION_ID=$(aws cloudfront create-distribution \
        --origin-domain-name ${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com \
        --default-root-object index.html \
        --query 'Distribution.Id' \
        --output text 2>/dev/null)

    if [ ! -z "$DISTRIBUTION_ID" ]; then
        CLOUDFRONT_URL=$(aws cloudfront get-distribution \
            --id $DISTRIBUTION_ID \
            --query 'Distribution.DomainName' \
            --output text)

        echo "✅ CloudFront distribution created!"
        echo "   Distribution ID: $DISTRIBUTION_ID"
        echo "   CloudFront URL: https://$CLOUDFRONT_URL"
        echo "   Status: Deploying (check AWS Console)"
    else
        echo "⚠️  Could not create CloudFront distribution automatically."
        echo "   You can create it manually in AWS Console."
    fi
fi

# Summary
echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "📊 Deployment Summary:"
echo "   Stage: $STAGE"
echo "   Backend API: $API_ENDPOINT"
echo "   Frontend URL: $WEBSITE_URL"
[ ! -z "$CLOUDFRONT_URL" ] && echo "   CloudFront: https://$CLOUDFRONT_URL"
echo ""
echo "📝 Next Steps:"
echo "   1. Visit your frontend URL to test the app"
echo "   2. Test adding entries, searching foods, etc."
echo "   3. Check AWS Console for logs and monitoring"
echo "   4. (Optional) Set up custom domain"
echo "   5. (Optional) Get USDA API key and update environment"
echo ""
echo "🔍 Useful Commands:"
echo "   View backend logs: cd backend && npm run logs"
echo "   Redeploy backend: cd backend && npm run deploy"
echo "   Update frontend: cd frontend && npm run build && aws s3 sync build/ s3://${BUCKET_NAME}"
echo "   Remove deployment: cd backend && serverless remove"
echo ""
echo "💰 Estimated Cost: ~\$1-5/month for low traffic"
echo ""
echo "Happy tracking! 💪"
