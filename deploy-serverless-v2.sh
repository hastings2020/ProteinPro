#!/bin/bash

# ProteinPro Serverless Deployment Script v2
# Uses CloudFront with OAC (no public bucket needed)

set -e  # Exit on error

echo "🚀 ProteinPro Serverless Deployment (CloudFront + OAC)"
echo "========================================================"
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
echo "🎨 Deploying Frontend (S3 + CloudFront)"
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

# Block public access (security best practice)
echo "🔒 Enabling S3 Block Public Access..."
aws s3api put-public-access-block \
    --bucket ${BUCKET_NAME} \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Upload files (not public - CloudFront will access them)
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

echo "✅ Files uploaded to S3"
echo ""

# Create CloudFront distribution with OAC
echo "🌐 Creating CloudFront distribution..."
echo "   (This takes 15-20 minutes)"
echo ""

# Create Origin Access Control
OAC_CONFIG='{
    "Name": "proteinpro-oac-'${STAGE}'",
    "Description": "OAC for ProteinPro S3 origin",
    "SigningProtocol": "sigv4",
    "SigningBehavior": "always",
    "OriginAccessControlOriginType": "s3"
}'

OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config "${OAC_CONFIG}" \
    --query 'OriginAccessControl.Id' \
    --output text 2>/dev/null || echo "")

if [ -z "$OAC_ID" ]; then
    echo "⚠️  Could not create OAC automatically. Using existing or fallback method."
    # Try to find existing OAC
    OAC_ID=$(aws cloudfront list-origin-access-controls \
        --query "OriginAccessControlList.Items[?Name=='proteinpro-oac-${STAGE}'].Id | [0]" \
        --output text)
fi

# Create CloudFront distribution
DIST_CONFIG='{
    "CallerReference": "'$(date +%s)'",
    "Comment": "ProteinPro '${STAGE}' distribution",
    "Enabled": true,
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-'${BUCKET_NAME}'",
                "DomainName": "'${BUCKET_NAME}'.s3.'${REGION}'.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "OriginAccessControlId": "'${OAC_ID}'"
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-'${BUCKET_NAME}'",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {"Forward": "none"}
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "PriceClass": "PriceClass_100"
}'

echo "$DIST_CONFIG" > /tmp/cloudfront-config.json

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config file:///tmp/cloudfront-config.json \
    --query 'Distribution.Id' \
    --output text 2>/dev/null)

if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo "✅ CloudFront distribution created!"
    echo "   Distribution ID: $DISTRIBUTION_ID"

    # Get CloudFront domain
    CLOUDFRONT_URL=$(aws cloudfront get-distribution \
        --id $DISTRIBUTION_ID \
        --query 'Distribution.DomainName' \
        --output text)

    echo "   CloudFront URL: https://$CLOUDFRONT_URL"
    echo "   Status: Deploying (15-20 minutes)"
    echo ""

    # Update S3 bucket policy to allow CloudFront OAC access
    echo "🔐 Updating S3 bucket policy for CloudFront OAC..."

    BUCKET_POLICY='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AllowCloudFrontServicePrincipal",
                "Effect": "Allow",
                "Principal": {
                    "Service": "cloudfront.amazonaws.com"
                },
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::'${BUCKET_NAME}'/*",
                "Condition": {
                    "StringEquals": {
                        "AWS:SourceArn": "arn:aws:cloudfront::'$(aws sts get-caller-identity --query Account --output text)':distribution/'${DISTRIBUTION_ID}'"
                    }
                }
            }
        ]
    }'

    echo "$BUCKET_POLICY" | aws s3api put-bucket-policy \
        --bucket ${BUCKET_NAME} \
        --policy file:///dev/stdin

    echo "✅ Bucket policy updated"
else
    echo "⚠️  Could not create CloudFront distribution automatically."
    echo "   You can create it manually in AWS Console or use the S3 website URL."
    echo ""

    # Fallback: Enable S3 static website hosting
    echo "📋 Enabling S3 static website hosting as fallback..."

    aws s3 website s3://${BUCKET_NAME} \
        --index-document index.html \
        --error-document index.html

    WEBSITE_URL="http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"
    echo "   S3 Website URL: $WEBSITE_URL"
    echo "   (Note: This requires disabling Block Public Access)"
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
echo "   S3 Bucket: $BUCKET_NAME"
[ ! -z "$CLOUDFRONT_URL" ] && echo "   Frontend: https://$CLOUDFRONT_URL"
[ ! -z "$DISTRIBUTION_ID" ] && echo "   Distribution ID: $DISTRIBUTION_ID"
echo ""
echo "📝 Next Steps:"
if [ ! -z "$CLOUDFRONT_URL" ]; then
    echo "   1. Wait 15-20 minutes for CloudFront to deploy"
    echo "   2. Visit https://$CLOUDFRONT_URL to test"
    echo "   3. Check distribution status:"
    echo "      aws cloudfront get-distribution --id $DISTRIBUTION_ID"
else
    echo "   1. Create CloudFront distribution manually in AWS Console"
    echo "   2. Point it to S3 bucket: $BUCKET_NAME"
    echo "   3. Use Origin Access Control for security"
fi
echo "   4. Test all features (add entry, search, calendar)"
echo "   5. (Optional) Set up custom domain"
echo ""
echo "🔍 Useful Commands:"
echo "   View backend logs: cd backend && npm run logs"
echo "   Redeploy backend: cd backend && npm run deploy"
echo "   Update frontend: cd frontend && npm run build && aws s3 sync build/ s3://${BUCKET_NAME}"
if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo "   Invalidate CloudFront cache: aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/*'"
fi
echo "   Remove deployment: cd backend && serverless remove"
echo ""
echo "💰 Estimated Cost: ~\$1-5/month for low traffic"
echo ""
echo "Happy tracking! 💪"
