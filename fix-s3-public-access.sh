#!/bin/bash

# Quick Fix: Disable Block Public Access for ProteinPro bucket

BUCKET_NAME=$1

if [ -z "$BUCKET_NAME" ]; then
    echo "Usage: ./fix-s3-public-access.sh <bucket-name>"
    echo ""
    echo "Example: ./fix-s3-public-access.sh proteinpro-app-dev-1763857438"
    exit 1
fi

echo "🔓 Disabling S3 Block Public Access for bucket: $BUCKET_NAME"
echo ""

# Disable Block Public Access
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

if [ $? -eq 0 ]; then
    echo "✅ Block Public Access disabled for bucket: $BUCKET_NAME"
    echo ""
    echo "You can now run the deployment script again:"
    echo "   ./deploy-serverless.sh"
    echo ""
    echo "⚠️  Security Note:"
    echo "   Your bucket can now have public policies."
    echo "   For better security, consider using CloudFront with OAC:"
    echo "   ./deploy-serverless-v2.sh"
else
    echo "❌ Failed to disable Block Public Access"
    echo ""
    echo "You may need to disable it account-wide:"
    echo "1. Go to AWS S3 Console"
    echo "2. Click 'Block Public Access settings for this account'"
    echo "3. Edit and uncheck all boxes"
    echo "4. Save changes"
fi
