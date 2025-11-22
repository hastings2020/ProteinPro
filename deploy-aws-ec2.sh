#!/bin/bash

# ProteinPro AWS EC2/Lightsail Deployment Script
# Run this script ON your EC2/Lightsail instance after SSH'ing in

echo "🚀 ProteinPro AWS EC2 Deployment"
echo "=================================="
echo ""

# Update system
echo "📦 Updating system..."
sudo apt-get update

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Clone repository (update with your repo URL)
echo "📥 Cloning repository..."
cd ~
git clone https://github.com/your-username/ProteinPro.git
cd ProteinPro

# Setup backend
echo "⚙️  Setting up backend..."
cd backend
npm install

# Create .env file
cat > .env << EOF
PORT=5001
USDA_API_KEY=DEMO_KEY
EOF

# Initialize database
npm run init-db

# Start backend with PM2
echo "🚀 Starting backend..."
pm2 start server.js --name proteinpro-backend
pm2 startup
pm2 save

# Build frontend
echo "🎨 Building frontend..."
cd ../frontend

# Create production env file with EC2 public IP
# Replace with your actual EC2 public DNS or IP
cat > .env.production << EOF
REACT_APP_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)/api
EOF

npm install
npm run build

# Setup Nginx
echo "⚙️  Configuring Nginx..."
sudo mkdir -p /var/www/proteinpro
sudo cp -r build/* /var/www/proteinpro/

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/proteinpro > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # API proxy
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend static files
    location / {
        root /var/www/proteinpro;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Error pages
    error_page 404 /index.html;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/proteinpro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# Get public URL
PUBLIC_DNS=$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)

echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo ""
echo "🔗 Your app is live at:"
echo "   http://$PUBLIC_DNS"
echo ""
echo "📊 Backend running on PM2"
echo "   View logs: pm2 logs proteinpro-backend"
echo "   Restart: pm2 restart proteinpro-backend"
echo ""
echo "🔧 Next steps:"
echo "   1. Update Security Group to allow HTTP (port 80)"
echo "   2. Visit your app at the URL above"
echo "   3. (Optional) Set up SSL with Let's Encrypt"
echo "   4. (Optional) Get USDA API key and update .env"
echo ""
echo "Happy tracking! 💪"
