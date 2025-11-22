#!/bin/bash

# ProteinPro Railway Deployment Script

echo "🚀 ProteinPro Railway Deployment"
echo "=================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI installed"
echo ""

# Login to Railway
echo "📝 Please login to Railway..."
railway login

echo ""
echo "📦 Deploying Backend..."
echo ""

# Deploy backend
cd backend
railway init --name proteinpro-backend
railway up

echo ""
echo "🌐 Getting backend URL..."
BACKEND_URL=$(railway domain)

if [ -z "$BACKEND_URL" ]; then
    echo "⚠️  No domain found. Creating one..."
    railway domain
    BACKEND_URL=$(railway domain)
fi

echo "✅ Backend deployed to: $BACKEND_URL"
echo ""

# Update frontend environment
cd ../frontend
echo "⚙️  Updating frontend configuration..."
echo "REACT_APP_API_URL=https://$BACKEND_URL/api" > .env.production

echo ""
echo "🎨 Building frontend..."
npm run build

echo ""
echo "📦 Deploying Frontend..."
railway init --name proteinpro-frontend
railway up

echo ""
echo "🌐 Getting frontend URL..."
FRONTEND_URL=$(railway domain)

if [ -z "$FRONTEND_URL" ]; then
    echo "⚠️  No domain found. Creating one..."
    railway domain
    FRONTEND_URL=$(railway domain)
fi

echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo ""
echo "🔗 Your app is live at:"
echo "   Frontend: https://$FRONTEND_URL"
echo "   Backend:  https://$BACKEND_URL"
echo ""
echo "📝 Next steps:"
echo "   1. Visit your frontend URL to test the app"
echo "   2. Check Railway dashboard for logs and settings"
echo "   3. Set up your own USDA API key in Railway environment variables"
echo ""
echo "Happy tracking! 💪"
