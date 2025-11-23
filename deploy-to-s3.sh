#!/bin/bash

# ProteinPro AWS S3 Deployment Script
# This script deploys the frontend to S3 and sets up CloudFront distribution

set -e

echo "🚀 ProteinPro Deployment Script"
echo "================================"

# Configuration
BUCKET_NAME=${1:-"proteinpro-app"}
REGION=${2:-"ap-southeast-2"}
PROFILE=${3:-"default"}

echo ""
echo "Configuration:"
echo "  Bucket Name: $BUCKET_NAME"
echo "  Region: $REGION"
echo "  AWS Profile: $PROFILE"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "   Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if jq is installed (for JSON parsing)
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is not installed. Some features may not work."
    echo "   You can install it with: sudo apt-get install jq (Linux) or brew install jq (Mac)"
fi

echo "📦 Step 1: Building React application..."
cd frontend
npm run build
cd ..

echo ""
echo "✅ Build complete!"
echo ""

echo "🪣 Step 2: Creating S3 bucket (if it doesn't exist)..."
if aws s3 ls "s3://$BUCKET_NAME" --profile "$PROFILE" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION" --profile "$PROFILE"
    echo "✅ Bucket created: $BUCKET_NAME"
else
    echo "✅ Bucket already exists: $BUCKET_NAME"
fi

echo ""
echo "🔧 Step 3: Configuring bucket for static website hosting..."
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html \
    --profile "$PROFILE"

echo ""
echo "🔓 Step 4: Setting bucket policy for public access..."
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
    --profile "$PROFILE"

echo ""
echo "📤 Step 5: Uploading files to S3..."
aws s3 sync frontend/build/ "s3://$BUCKET_NAME" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --profile "$PROFILE"

# Upload index.html with no-cache to ensure updates are reflected
aws s3 cp frontend/build/index.html "s3://$BUCKET_NAME/index.html" \
    --cache-control "no-cache" \
    --profile "$PROFILE"

echo ""
echo "✅ Upload complete!"
echo ""

# Get the website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo "🎉 Deployment Complete!"
echo "========================"
echo ""
echo "Your application is now live at:"
echo "  $WEBSITE_URL"
echo ""
echo "📝 Next Steps:"
echo "  1. Update your backend API URL in the frontend .env file"
echo "  2. Deploy your backend to EC2, Elastic Beanstalk, or Lambda"
echo "  3. (Optional) Set up CloudFront for HTTPS and better performance"
echo "  4. (Optional) Configure a custom domain"
echo ""
echo "CloudFront Setup (optional):"
echo "  Run: ./setup-cloudfront.sh $BUCKET_NAME $PROFILE"
echo ""
