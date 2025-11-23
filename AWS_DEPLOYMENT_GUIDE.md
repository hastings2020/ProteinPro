# AWS Deployment Guide for ProteinPro

This guide provides step-by-step instructions for deploying ProteinPro to AWS using methods that work with your current IAM permissions.

## Prerequisites

- AWS Account
- AWS CLI configured (`aws configure`)
- SSH client
- Git repository (push your code to GitHub)

---

## Method 1: AWS Elastic Beanstalk (Recommended) ⭐

Elastic Beanstalk handles infrastructure automatically and doesn't require manual IAM role creation.

### Step 1: Install EB CLI

```bash
pip install awsebcli --upgrade --user
```

### Step 2: Deploy Backend

```bash
cd backend

# Initialize Elastic Beanstalk application
eb init -p node.js-18 proteinpro-backend --region ap-southeast-2

# Create environment and deploy
eb create proteinpro-backend-prod

# Set environment variables
eb setenv PORT=5001 USDA_API_KEY=DEMO_KEY NODE_ENV=production

# Get the URL
eb status
# Copy the CNAME (e.g., proteinpro-backend-prod.ap-southeast-2.elasticbeanstalk.com)
```

### Step 3: Deploy Frontend to S3

```bash
cd ../frontend

# Create production environment file with your EB backend URL
echo "REACT_APP_API_URL=http://your-eb-url.elasticbeanstalk.com/api" > .env.production

# Build the app
npm run build

# Create S3 bucket (choose unique name)
aws s3 mb s3://proteinpro-app-yourname

# Enable static website hosting
aws s3 website s3://proteinpro-app-yourname --index-document index.html --error-document index.html

# Upload files
aws s3 sync build/ s3://proteinpro-app-yourname

# Get the website URL
echo "http://proteinpro-app-yourname.s3-website-ap-southeast-2.amazonaws.com"
```

### Step 4: Update CORS on Backend

After deployment, update `backend/server.js` to allow your S3 frontend:

```javascript
const cors = require('cors');
app.use(cors({
  origin: ['http://proteinpro-app-yourname.s3-website-ap-southeast-2.amazonaws.com'],
  credentials: true
}));
```

Then redeploy:
```bash
cd backend
eb deploy
```

### Costs
- Elastic Beanstalk: Free tier eligible (t2.micro)
- S3: ~$0.50/month for hosting
- Data transfer: ~$1-2/month

---

## Method 2: AWS EC2 (Full Control)

### Step 1: Launch EC2 Instance

1. Go to AWS EC2 Console
2. Click "Launch Instance"
3. Configure:
   - **Name:** proteinpro-server
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Instance type:** t2.micro (free tier)
   - **Key pair:** Create new or use existing
   - **Security Group:** Allow HTTP (80), HTTPS (443), SSH (22)
4. Launch instance
5. Note the public IP address

### Step 2: Connect to EC2

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 3: Automated Deployment

```bash
# On your EC2 instance
wget https://raw.githubusercontent.com/your-repo/ProteinPro/main/deploy-aws-ec2.sh
chmod +x deploy-aws-ec2.sh
./deploy-aws-ec2.sh
```

Or manually follow these steps:

```bash
# Update system
sudo apt-get update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 and Nginx
sudo npm install -g pm2
sudo apt-get install -y nginx git

# Clone repository
git clone https://github.com/your-username/ProteinPro.git
cd ProteinPro

# Setup backend
cd backend
npm install
echo "PORT=5001" > .env
echo "USDA_API_KEY=DEMO_KEY" >> .env
npm run init-db
pm2 start server.js --name proteinpro-backend
pm2 startup
pm2 save

# Build frontend
cd ../frontend
echo "REACT_APP_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-hostname)/api" > .env.production
npm install
npm run build

# Setup Nginx
sudo mkdir -p /var/www/proteinpro
sudo cp -r build/* /var/www/proteinpro/
```

### Step 4: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/proteinpro
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name _;

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/proteinpro;
        try_files $uri /index.html;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/proteinpro /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Access Your App

Visit: `http://your-ec2-public-ip`

### Costs
- EC2 t2.micro: Free tier eligible (750 hours/month)
- After free tier: ~$8-10/month

---

## Method 3: AWS Lightsail (Easiest)

Lightsail is AWS's simplified offering - perfect for this app.

### Step 1: Create Instance

1. Go to AWS Lightsail Console
2. Click "Create Instance"
3. Select:
   - **Platform:** Linux/Unix
   - **Blueprint:** Node.js
   - **Plan:** $5/month (or $3.50/month)
4. Name it "proteinpro"
5. Create instance

### Step 2: Connect and Deploy

1. Click "Connect using SSH" in Lightsail console
2. Run the deployment script:

```bash
cd ~
git clone https://github.com/your-username/ProteinPro.git
cd ProteinPro
chmod +x deploy-aws-ec2.sh
./deploy-aws-ec2.sh
```

### Step 3: Get Static IP

1. In Lightsail console, go to "Networking"
2. Create static IP
3. Attach to your instance
4. Update frontend .env.production with this IP
5. Rebuild and redeploy frontend

### Costs
- $3.50-$5/month (fixed price, includes everything)

---

## Adding SSL (HTTPS) with Let's Encrypt

After deploying to EC2 or Lightsail:

### Step 1: Get Domain Name

1. Register domain (e.g., on Route 53, Namecheap, etc.)
2. Point A record to your EC2/Lightsail IP

### Step 2: Install Certbot

```bash
sudo apt-get install certbot python3-certbot-nginx
```

### Step 3: Get Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

Follow prompts. Certbot will automatically:
- Get SSL certificate
- Update Nginx config
- Set up auto-renewal

Your app will now be accessible at `https://your-domain.com`

---

## Database Considerations

Currently using SQLite. For production:

### Option 1: Keep SQLite (Simple)
- Works fine for single-instance deployments
- Data persists on EC2/Lightsail disk
- Make sure to backup regularly:
  ```bash
  # Backup script
  pm2 install pm2-logrotate
  crontab -e
  # Add: 0 2 * * * cp ~/ProteinPro/backend/proteinpro.db ~/backups/proteinpro-$(date +\%Y\%m\%d).db
  ```

### Option 2: AWS RDS (PostgreSQL/MySQL)
For multiple instances or high traffic:
1. Create RDS instance
2. Update backend to use PostgreSQL:
   ```bash
   npm install pg
   ```
3. Modify database connection in server.js

---

## Monitoring and Maintenance

### View Backend Logs
```bash
pm2 logs proteinpro-backend
```

### Restart Backend
```bash
pm2 restart proteinpro-backend
```

### Update Application
```bash
cd ~/ProteinPro
git pull
cd backend
npm install
pm2 restart proteinpro-backend
cd ../frontend
npm install
npm run build
sudo cp -r build/* /var/www/proteinpro/
```

### Monitor Resources
```bash
pm2 monit
htop
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check PM2 logs
pm2 logs proteinpro-backend

# Check if port is in use
sudo lsof -i :5001

# Restart PM2
pm2 restart all
```

### Nginx Errors
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Database Issues
```bash
# Check database file exists
ls -la ~/ProteinPro/backend/proteinpro.db

# Reinitialize if needed
cd ~/ProteinPro/backend
npm run init-db
```

### CORS Errors
Update backend CORS settings in `server.js`:
```javascript
app.use(cors({
  origin: ['http://your-domain.com', 'https://your-domain.com'],
  credentials: true
}));
```

---

## Cost Summary

| Method | Monthly Cost | Best For |
|--------|-------------|----------|
| Elastic Beanstalk + S3 | $0-2 (free tier) | Auto-scaling, managed |
| EC2 t2.micro | $0-10 (free tier) | Full control |
| Lightsail | $3.50-5 | Simplicity, fixed price |

---

## Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt-get update && sudo apt-get upgrade
   ```

2. **Enable firewall:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Use environment variables:**
   - Never commit .env files
   - Use AWS Secrets Manager for sensitive data

4. **Regular backups:**
   - Set up automated database backups
   - Use AWS S3 for backup storage

5. **Use SSL/HTTPS:**
   - Follow Let's Encrypt guide above
   - Force HTTPS redirects

---

## Next Steps After Deployment

1. ✅ Test all features (add entry, search, calendar, etc.)
2. ✅ Set up custom domain
3. ✅ Enable HTTPS/SSL
4. ✅ Get USDA API key (not DEMO_KEY)
5. ✅ Set up monitoring/alerts
6. ✅ Configure backups
7. ✅ Add analytics (optional)

---

**Questions?** Check TROUBLESHOOTING.md or open an issue.

**Happy Deploying! 🚀**
