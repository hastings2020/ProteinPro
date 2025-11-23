# ProteinPro Deployment Options - Quick Reference

Choose the deployment method that best fits your needs.

## Quick Comparison

| Option | Cost | Setup Time | Complexity | Scalability | Best For |
|--------|------|------------|------------|-------------|----------|
| **Serverless (AWS)** | $1-5/mo | 15 min | Medium | Excellent | Production, auto-scaling |
| **Railway** | Free-$5/mo | 10 min | Easy | Good | Quick deploy, testing |
| **EC2/Lightsail** | $3.50-10/mo | 30 min | Medium | Manual | Full control |
| **Elastic Beanstalk** | Free-$10/mo | 20 min | Easy | Excellent | AWS managed, simple |

---

## Option 1: Serverless (AWS Lambda + DynamoDB) ⭐ RECOMMENDED

**Best for:** Production apps with variable traffic

### Architecture
- Frontend: S3 + CloudFront
- Backend: Lambda + API Gateway
- Database: DynamoDB

### Pros
- ✅ Auto-scales infinitely
- ✅ Pay only for what you use
- ✅ Zero server maintenance
- ✅ High availability built-in
- ✅ Very cost-effective at low traffic

### Cons
- ⚠️ Cold start latency (~1s first request)
- ⚠️ Learning curve for DynamoDB
- ⚠️ More AWS services to manage

### Deploy
```bash
# One command deployment
./deploy-serverless.sh

# Or manually
cd backend
npm install
npm run deploy
# Copy API endpoint

cd ../frontend
echo "REACT_APP_API_URL=https://your-api.execute-api.ap-southeast-2.amazonaws.com/api" > .env.production
npm run build
aws s3 sync build/ s3://your-bucket
```

### Cost
- **Low traffic (< 1K users):** ~$1-5/month
- **Medium traffic (10K users):** ~$20-40/month

📚 **Full Guide:** [SERVERLESS_DEPLOYMENT_GUIDE.md](./SERVERLESS_DEPLOYMENT_GUIDE.md)

---

## Option 2: Railway 🚂

**Best for:** Fastest deployment, testing, demos

### Pros
- ✅ Extremely easy setup
- ✅ Free tier available
- ✅ Auto-deploys from Git
- ✅ Manages both frontend & backend
- ✅ Built-in database

### Cons
- ⚠️ Free tier has usage limits
- ⚠️ Not AWS (if AWS required)

### Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy (automated)
./deploy-railway.sh
```

### Cost
- **Free tier:** Good for development
- **Paid:** $5/month for hobby projects

📚 **Full Guide:** [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md#option-1-railway-easiest-recommended)

---

## Option 3: AWS Elastic Beanstalk

**Best for:** Easy AWS deployment with managed infrastructure

### Pros
- ✅ AWS-managed (no server maintenance)
- ✅ Easy scaling configuration
- ✅ Free tier eligible
- ✅ Good for production

### Cons
- ⚠️ More expensive than serverless
- ⚠️ Requires EB CLI

### Deploy
```bash
# Install EB CLI
pip install awsebcli

# Deploy backend
cd backend
eb init -p node.js proteinpro-backend
eb create proteinpro-backend-prod
eb setenv PORT=5001 USDA_API_KEY=DEMO_KEY

# Deploy frontend to S3
cd ../frontend
echo "REACT_APP_API_URL=http://your-eb-url.elasticbeanstalk.com/api" > .env.production
npm run build
aws s3 sync build/ s3://your-bucket
```

### Cost
- **Free tier:** $0-2/month
- **After free tier:** $8-15/month

📚 **Full Guide:** [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md#method-1-aws-elastic-beanstalk-recommended)

---

## Option 4: AWS EC2 / Lightsail

**Best for:** Full control, custom configurations

### Pros
- ✅ Complete control over server
- ✅ SSH access
- ✅ Can run any software
- ✅ Predictable pricing (Lightsail)

### Cons
- ⚠️ Manual server maintenance
- ⚠️ Need to manage security updates
- ⚠️ Manual scaling

### Deploy
```bash
# 1. Launch EC2/Lightsail instance
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Run deployment script
wget https://raw.githubusercontent.com/your-repo/ProteinPro/main/deploy-aws-ec2.sh
chmod +x deploy-aws-ec2.sh
./deploy-aws-ec2.sh
```

### Cost
- **Lightsail:** $3.50-5/month (fixed price)
- **EC2 Free Tier:** $0-2/month
- **EC2 Paid:** $8-15/month

📚 **Full Guide:** [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md#method-2-aws-ec2-full-control)

---

## Decision Tree

```
Start Here
    ↓
Do you NEED AWS?
    ├─ No → Use Railway (easiest)
    │
    └─ Yes
        ↓
    Do you have variable traffic?
        ├─ Yes → Use Serverless (most cost-effective)
        │
        └─ No
            ↓
        Want managed infrastructure?
            ├─ Yes → Use Elastic Beanstalk
            │
            └─ No → Use EC2/Lightsail
```

---

## Deployment Scripts Available

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy-serverless.sh` | Deploy to AWS Lambda/DynamoDB | `./deploy-serverless.sh` |
| `deploy-railway.sh` | Deploy to Railway | `./deploy-railway.sh` |
| `deploy-aws-ec2.sh` | Setup on EC2/Lightsail | Run on EC2 instance |
| `deploy-to-s3.sh` | Frontend only to S3 | `./deploy-to-s3.sh bucket-name` |

---

## Feature Comparison

### Serverless (Lambda)
- ✅ Auto-scaling
- ✅ Pay-per-request
- ✅ Global CDN (CloudFront)
- ✅ DynamoDB (NoSQL)
- ⚠️ Cold starts
- ⚠️ No SQLite (uses DynamoDB)

### Railway
- ✅ Git-based deployment
- ✅ Free tier
- ✅ Easy database setup
- ✅ Works with SQLite
- ⚠️ Not AWS
- ⚠️ Usage limits on free tier

### Elastic Beanstalk
- ✅ AWS-managed
- ✅ Easy scaling
- ✅ Works with SQLite
- ✅ Load balancing
- ⚠️ More expensive
- ⚠️ Always running (not pay-per-use)

### EC2/Lightsail
- ✅ Full control
- ✅ SSH access
- ✅ Works with SQLite
- ✅ Fixed pricing (Lightsail)
- ⚠️ Manual updates
- ⚠️ Manual scaling

---

## My Recommendations

### For Development/Testing
→ **Use Railway**
- Fastest to set up
- Free tier
- Easy to tear down

### For Production (Small Scale)
→ **Use Serverless**
- Most cost-effective
- Auto-scaling
- Highly available

### For Production (Enterprise)
→ **Use Elastic Beanstalk**
- Managed infrastructure
- Enterprise features
- Good AWS integration

### For Custom Requirements
→ **Use EC2**
- Full control
- Custom configurations
- SSH access for debugging

---

## Common Post-Deployment Tasks

### Set up Custom Domain
1. Register domain (Route 53, Namecheap, etc.)
2. Create SSL certificate (ACM for AWS)
3. Point domain to deployment
4. Update CORS settings

### Enable HTTPS
- **Serverless:** CloudFront (automatic)
- **EC2:** Let's Encrypt + Nginx
- **Beanstalk:** Load Balancer + ACM
- **Railway:** Automatic

### Monitoring
- **Serverless:** CloudWatch Logs/Metrics
- **EC2:** CloudWatch + Custom logs
- **Beanstalk:** Elastic Beanstalk Console
- **Railway:** Railway Dashboard

### Backups
- **DynamoDB:** Point-in-time recovery
- **SQLite on EC2:** Cron job backups
- **Railway:** Database backups

---

## Getting Help

- **Serverless Issues:** See [SERVERLESS_DEPLOYMENT_GUIDE.md](./SERVERLESS_DEPLOYMENT_GUIDE.md)
- **AWS EC2 Issues:** See [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)
- **General Issues:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **GitHub Issues:** Open an issue with deployment logs

---

## Quick Start Commands

```bash
# Serverless (AWS Lambda)
./deploy-serverless.sh

# Railway
./deploy-railway.sh

# Elastic Beanstalk
cd backend && eb init && eb create

# EC2/Lightsail
# (SSH to instance first)
./deploy-aws-ec2.sh
```

---

**Choose your deployment method and follow the corresponding guide!**

Happy deploying! 🚀
