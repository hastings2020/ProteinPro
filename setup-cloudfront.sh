#!/bin/bash

# ProteinPro CloudFront Setup Script
# This script creates a CloudFront distribution for HTTPS and better performance

set -e

echo "☁️  ProteinPro CloudFront Setup"
echo "=============================="

# Configuration
BUCKET_NAME=${1:-"proteinpro-app"}
PROFILE=${2:-"default"}
REGION=${3:-"ap-southeast-2"}

echo ""
echo "Configuration:"
echo "  Bucket Name: $BUCKET_NAME"
echo "  AWS Profile: $PROFILE"
echo "  Region: $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

echo "📋 Creating CloudFront distribution..."
echo ""

WEBSITE_ENDPOINT="$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

cat > /tmp/cloudfront-config.json <<EOF
{
  "CallerReference": "proteinpro-$(date +%s)",
  "Comment": "ProteinPro CloudFront Distribution",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET_NAME",
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
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BUCKET_NAME",
        "DomainName": "$WEBSITE_ENDPOINT",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
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
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
EOF

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config file:///tmp/cloudfront-config.json \
    --profile "$PROFILE" \
    --query 'Distribution.Id' \
    --output text)

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "❌ Failed to create CloudFront distribution"
    exit 1
fi

echo "✅ CloudFront distribution created: $DISTRIBUTION_ID"
echo ""

# Get the distribution domain name
DOMAIN_NAME=$(aws cloudfront get-distribution \
    --id "$DISTRIBUTION_ID" \
    --profile "$PROFILE" \
    --query 'Distribution.DomainName' \
    --output text)

echo "⏳ CloudFront distribution is being deployed..."
echo "   This can take 15-20 minutes to complete."
echo ""
echo "🎉 Setup Complete!"
echo "================="
echo ""
echo "CloudFront Distribution:"
echo "  ID: $DISTRIBUTION_ID"
echo "  Domain: $DOMAIN_NAME"
echo ""
echo "Your application will be available at:"
echo "  https://$DOMAIN_NAME"
echo ""
echo "📝 Next Steps:"
echo "  1. Wait for the distribution to deploy (15-20 minutes)"
echo "  2. Check status: aws cloudfront get-distribution --id $DISTRIBUTION_ID --profile $PROFILE"
echo "  3. Update your DNS if using a custom domain"
echo "  4. Enable HTTPS by adding an SSL certificate in ACM"
echo ""
echo "To invalidate the cache after updates:"
echo "  aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/*' --profile $PROFILE"
echo ""
