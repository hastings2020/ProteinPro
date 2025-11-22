# ProteinPro Deployment Guide

This guide provides detailed instructions for deploying ProteinPro to various platforms.

## Table of Contents
1. [Local Development](#local-development)
2. [AWS S3 + CloudFront (Frontend)](#aws-s3--cloudfront-frontend)
3. [Backend Deployment Options](#backend-deployment-options)
4. [Environment Configuration](#environment-configuration)
5. [SSL/HTTPS Setup](#sslhttps-setup)

---

## Local Development

### Prerequisites
- Node.js 14+ and npm
- Git

### Setup Steps

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/ProteinPro.git
   cd ProteinPro
   npm run install-all
   ```

2. **Initialize Database**
   ```bash
   npm run init-db
   ```

3. **Configure Environment**
   ```bash
   # Backend
   cp backend/.env.example backend/.env

   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Start Services**
   ```bash
   # Terminal 1 - Backend
   npm run dev-backend

   # Terminal 2 - Frontend
   npm run dev-frontend
   ```

5. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

---

## AWS S3 + CloudFront (Frontend)

### Prerequisites
- AWS Account
- AWS CLI installed and configured
- Domain name (optional, for custom domain)

### Step 1: Build the Application

```bash
cd frontend
npm run build
```

### Step 2: Deploy to S3

#### Option A: Using the Deployment Script (Recommended)

```bash
# From project root
./deploy-to-s3.sh your-bucket-name us-east-1 your-aws-profile

# Example:
./deploy-to-s3.sh proteinpro-app us-east-1 default
```

#### Option B: Manual Deployment

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://your-bucket-name --region us-east-1
   ```

2. **Enable Static Website Hosting**
   ```bash
   aws s3 website s3://your-bucket-name \
     --index-document index.html \
     --error-document index.html
   ```

3. **Set Bucket Policy**
   ```bash
   cat > bucket-policy.json <<EOF
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicReadGetObject",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::your-bucket-name/*"
     }]
   }
   EOF

   aws s3api put-bucket-policy \
     --bucket your-bucket-name \
     --policy file://bucket-policy.json
   ```

4. **Upload Files**
   ```bash
   aws s3 sync build/ s3://your-bucket-name --delete
   ```

### Step 3: Set Up CloudFront (Optional but Recommended)

#### Using the Script

```bash
./setup-cloudfront.sh your-bucket-name your-aws-profile
```

#### Manual Setup

1. Go to AWS CloudFront Console
2. Create a new distribution
3. Configure:
   - **Origin Domain**: your-bucket-name.s3-website-us-east-1.amazonaws.com
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Price Class**: Choose based on your needs
   - **Custom Error Response**: 404 → /index.html (200)
4. Wait 15-20 minutes for deployment
5. Note the CloudFront domain name

### Step 4: Update Frontend Configuration

Update `frontend/.env.production`:
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

Rebuild and redeploy:
```bash
cd frontend
npm run build
aws s3 sync build/ s3://your-bucket-name --delete
```

---

## Backend Deployment Options

### Option 1: AWS Elastic Beanstalk (Recommended)

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**
   ```bash
   cd backend
   eb init -p node.js-14 proteinpro-api
   ```

3. **Create Environment**
   ```bash
   eb create proteinpro-api-env
   ```

4. **Configure Environment Variables**
   ```bash
   eb setenv USDA_API_KEY=your-api-key PORT=8080
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

6. **Get URL**
   ```bash
   eb status
   ```

### Option 2: AWS EC2

1. **Launch EC2 Instance**
   - AMI: Amazon Linux 2 or Ubuntu
   - Instance Type: t2.micro (free tier)
   - Security Group: Allow ports 22, 80, 5000

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
   sudo yum install -y nodejs
   ```

4. **Clone and Setup**
   ```bash
   git clone https://github.com/yourusername/ProteinPro.git
   cd ProteinPro/backend
   npm install
   npm run init-db
   ```

5. **Install PM2**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name proteinpro-api
   pm2 startup
   pm2 save
   ```

6. **Configure Nginx (Optional)**
   ```bash
   sudo yum install nginx
   ```

   Create `/etc/nginx/conf.d/proteinpro.conf`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location /api {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

### Option 3: Heroku (Easiest)

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   cd backend
   heroku create proteinpro-api
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set USDA_API_KEY=your-api-key
   ```

5. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

6. **Open App**
   ```bash
   heroku open
   ```

### Option 4: DigitalOcean App Platform

1. Go to DigitalOcean Dashboard
2. Create New App
3. Connect GitHub repository
4. Select backend directory
5. Set environment variables
6. Deploy

### Option 5: Docker + Any Cloud Provider

1. **Create Dockerfile** (backend/Dockerfile)
   ```dockerfile
   FROM node:16-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm install --production

   COPY . .

   RUN npm run init-db

   EXPOSE 5000

   CMD ["node", "server.js"]
   ```

2. **Build Image**
   ```bash
   docker build -t proteinpro-api .
   ```

3. **Run Container**
   ```bash
   docker run -p 5000:5001 -e USDA_API_KEY=your-key proteinpro-api
   ```

4. **Deploy to Cloud**
   - Push to Docker Hub
   - Deploy to AWS ECS, Google Cloud Run, or Azure Container Instances

---

## Environment Configuration

### Production Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
USDA_API_KEY=your-actual-api-key
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

---

## SSL/HTTPS Setup

### For CloudFront

1. **Request Certificate in ACM**
   - Go to AWS Certificate Manager
   - Request a public certificate
   - Add your domain name
   - Validate via DNS or email

2. **Add Certificate to CloudFront**
   - Edit CloudFront distribution
   - Add custom SSL certificate
   - Update CNAMEs

3. **Update DNS**
   - Add CNAME record pointing to CloudFront domain

### For EC2 with Let's Encrypt

1. **Install Certbot**
   ```bash
   sudo yum install certbot python3-certbot-nginx
   ```

2. **Get Certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo systemctl enable certbot-renew.timer
   ```

---

## Post-Deployment Checklist

- [ ] Frontend deployed to S3
- [ ] CloudFront distribution created (optional)
- [ ] Backend deployed and running
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] HTTPS/SSL configured
- [ ] DNS records updated
- [ ] CORS properly configured
- [ ] Test all features work
- [ ] Monitor logs for errors
- [ ] Set up backup strategy
- [ ] Configure monitoring/alerts

---

## Monitoring and Maintenance

### AWS CloudWatch
- Set up alarms for API errors
- Monitor S3 storage usage
- Track CloudFront cache hit ratio

### Application Monitoring
```bash
# View backend logs
pm2 logs proteinpro-api

# Monitor resource usage
pm2 monit
```

### Database Backup
```bash
# Backup SQLite database
cp backend/proteinpro.db backend/backups/proteinpro-$(date +%Y%m%d).db

# Automate with cron
0 2 * * * cp /path/to/proteinpro.db /path/to/backups/proteinpro-$(date +\%Y\%m\%d).db
```

---

## Troubleshooting Deployment

### Frontend Not Loading
- Check S3 bucket policy
- Verify CloudFront distribution status
- Check browser console for CORS errors
- Ensure API URL is correct in .env.production

### Backend API Errors
- Check logs: `pm2 logs` or `heroku logs --tail`
- Verify environment variables are set
- Check database file exists
- Ensure correct Node.js version

### CORS Issues
- Update backend CORS configuration
- Add frontend domain to allowed origins
- Rebuild and redeploy

### Database Issues
- Ensure database file has proper permissions
- Run `npm run init-db` on server
- Check disk space

---

## Cost Estimation (AWS)

### Minimal Traffic (< 1000 users/month)
- S3: $1-2/month
- CloudFront: $1-5/month
- EC2 t2.micro: Free tier or ~$8/month
- **Total: ~$10-15/month**

### Moderate Traffic (< 10,000 users/month)
- S3: $5/month
- CloudFront: $10-20/month
- EC2 t2.small: ~$17/month
- **Total: ~$32-42/month**

### Alternative (Heroku)
- Free tier: $0 (limited hours)
- Hobby: $7/month (backend) + S3/CloudFront
- **Total: ~$10-20/month**

---

## Support

For deployment issues:
- Check AWS documentation
- Review CloudWatch logs
- Open GitHub issue
- Contact support@proteinpro.com

---

**Last Updated**: 2024
**Author**: ProteinPro Team
