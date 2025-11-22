# 🥩 ProteinPro - Daily Protein Tracker

A full-stack web application for tracking your daily protein intake with advanced features including OCR nutrition label scanning, food search, analytics, and calendar visualization.

![ProteinPro](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### Core Functionality
- 📸 **Photo Upload & OCR**: Scan nutrition labels with Tesseract.js for automatic data extraction
- 🔍 **Food Search**: Search from thousands of foods using USDA FoodData Central API
- 📊 **Daily Tracking**: Monitor your daily protein intake with visual progress indicators
- 📅 **Calendar View**: Color-coded calendar showing goal achievement over time
- 📈 **Analytics Dashboard**: Weekly, monthly, and yearly protein intake visualizations
- ⭐ **Favorites**: Quick-add your frequently eaten foods
- 📝 **History**: Searchable and filterable list of all logged entries
- 💾 **Export Data**: Download your data as CSV for external analysis

### User Experience
- 📱 **Mobile-Responsive**: Optimized for mobile devices with intuitive touch navigation
- 🎨 **Modern UI**: Clean interface with gradient themes and smooth animations
- ⚙️ **Customizable**: Set daily protein targets based on your goals
- 🎯 **Goal Tracking**: Visual indicators showing progress toward daily targets
- 🔔 **Notifications**: Real-time feedback for actions

## 🏗️ Architecture

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Chart.js** - Data visualization
- **Tesseract.js** - Client-side OCR
- **React Calendar** - Calendar component
- **Axios** - HTTP client

### Backend
- **Node.js & Express** - RESTful API server
- **SQLite** - Embedded database
- **USDA FoodData Central API** - Food nutrition data
- **Multer** - File upload handling

## 📋 Prerequisites

- Node.js 14+ and npm
- Git
- AWS CLI (for deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ProteinPro.git
cd ProteinPro
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Initialize database with sample data
npm run init-db

# Start the server
npm run dev
```

The backend will run on `http://localhost:5001`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start the development server
npm start
```

The frontend will run on `http://localhost:3000`

## 🔧 Configuration

### Backend Configuration (backend/.env)

```env
PORT=5001
USDA_API_KEY=DEMO_KEY
```

To get a free USDA API key:
1. Visit https://fdc.nal.usda.gov/api-key-signup.html
2. Sign up for a free API key
3. Replace `DEMO_KEY` with your actual key

### Frontend Configuration (frontend/.env)

```env
REACT_APP_API_URL=http://localhost:5001/api
```

For production, update this to your deployed backend URL.

## 📊 Database Schema

### Users Table
```sql
- id: INTEGER PRIMARY KEY
- username: TEXT
- email: TEXT
- daily_protein_target: INTEGER (default: 150g)
- weight: REAL
- created_at: DATETIME
```

### Food Entries Table
```sql
- id: INTEGER PRIMARY KEY
- user_id: INTEGER
- food_name: TEXT
- protein_grams: REAL
- calories: INTEGER
- carbs: REAL
- fat: REAL
- serving_size: TEXT
- meal_type: TEXT (breakfast/lunch/dinner/snack)
- entry_date: DATE
- entry_time: TIME
- notes: TEXT
- is_favorite: INTEGER
```

### Favorite Foods Table
```sql
- id: INTEGER PRIMARY KEY
- user_id: INTEGER
- food_name: TEXT
- protein_grams: REAL
- calories: INTEGER
- serving_size: TEXT
```

## 🌐 API Endpoints

### User Endpoints
- `GET /api/user/:userId` - Get user profile
- `PUT /api/user/:userId` - Update user profile

### Food Entry Endpoints
- `GET /api/entries/:userId` - Get all entries for user
- `GET /api/entries/:userId/date/:date` - Get entries for specific date
- `GET /api/entries/:userId/range?startDate&endDate` - Get entries in date range
- `GET /api/entries/:userId/daily-totals?startDate&endDate` - Get daily totals
- `POST /api/entries` - Create new entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

### Analytics Endpoints
- `GET /api/analytics/:userId?startDate&endDate` - Get analytics data

### Favorites Endpoints
- `GET /api/favorites/:userId` - Get favorite foods
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites/:id` - Delete favorite

### Food Search Endpoints
- `GET /api/food/search?query` - Search USDA food database

### Export Endpoints
- `GET /api/export/:userId` - Export data as CSV

## 🎨 Component Structure

```
src/
├── components/
│   ├── Home.js              # Daily dashboard
│   ├── History.js           # Food history with filters
│   ├── Calendar.js          # Calendar view
│   ├── Analytics.js         # Charts and statistics
│   ├── Settings.js          # User settings
│   ├── Navbar.js            # Bottom navigation
│   ├── AddEntryModal.js     # Add/edit food modal
│   ├── OCRScanner.js        # OCR scanning component
│   └── Notification.js      # Toast notifications
├── services/
│   └── api.js               # API client
├── App.js
├── App.css
├── index.js
└── index.css
```

## 📱 Mobile Optimization

The app is fully responsive and optimized for mobile devices:
- Touch-friendly UI elements
- Bottom navigation for easy thumb access
- Optimized image sizes
- Swipe gestures support
- Progressive Web App (PWA) ready

## 🚀 Deployment

### Deploy to AWS S3 + CloudFront

#### Prerequisites
- AWS Account
- AWS CLI configured with credentials

#### Step 1: Deploy Frontend to S3

```bash
# Make script executable (if not already)
chmod +x deploy-to-s3.sh

# Deploy to S3
./deploy-to-s3.sh your-bucket-name us-east-1 your-aws-profile

# Example:
./deploy-to-s3.sh proteinpro-app us-east-1 default
```

This script will:
1. Build the React application
2. Create an S3 bucket (if it doesn't exist)
3. Configure static website hosting
4. Upload all files
5. Set proper caching headers

#### Step 2: (Optional) Set up CloudFront for HTTPS

```bash
# Make script executable (if not already)
chmod +x setup-cloudfront.sh

# Create CloudFront distribution
./setup-cloudfront.sh your-bucket-name your-aws-profile

# Example:
./setup-cloudfront.sh proteinpro-app default
```

This will:
1. Create a CloudFront distribution
2. Enable HTTPS
3. Configure caching
4. Set up error pages for SPA routing

**Note**: CloudFront deployment takes 15-20 minutes to complete.

#### Step 3: Deploy Backend

For the backend, you have several options:

**Option A: AWS EC2**
1. Launch an EC2 instance
2. Install Node.js
3. Clone repository and install dependencies
4. Use PM2 to run the server
5. Configure security groups to allow port 5000

**Option B: AWS Elastic Beanstalk**
1. Install EB CLI: `pip install awsebcli`
2. Initialize: `eb init`
3. Create environment: `eb create proteinpro-api`
4. Deploy: `eb deploy`

**Option C: AWS Lambda + API Gateway**
1. Use serverless framework
2. Package backend as Lambda function
3. Deploy with `serverless deploy`

**Option D: Heroku (Easiest)**
```bash
cd backend
heroku create proteinpro-api
git push heroku main
```

After deploying the backend, update `frontend/.env`:
```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

Then rebuild and redeploy the frontend.

## 🧪 Testing

### Manual Testing Checklist

- [ ] Add food entry manually
- [ ] Search for food using USDA API
- [ ] Scan nutrition label with OCR
- [ ] Add food from favorites
- [ ] Edit existing entry
- [ ] Delete entry
- [ ] View calendar with color-coded days
- [ ] Check analytics charts (week/month/year)
- [ ] Update settings and protein target
- [ ] Export data as CSV
- [ ] Test on mobile device
- [ ] Test offline fallback

## 🐛 Troubleshooting

### Backend Issues

**Database not found**
```bash
cd backend
npm run init-db
```

**CORS errors**
- Ensure backend is running on port 5001
- Check frontend .env has correct API URL

**USDA API rate limiting**
- Get your own API key
- DEMO_KEY has limited requests

### Frontend Issues

**Blank page**
- Check browser console for errors
- Ensure backend is running
- Check API URL in .env

**OCR not working**
- Ensure good lighting for photos
- Use clear images of nutrition labels
- Try manual entry as fallback

**Charts not displaying**
- Ensure you have data for the selected period
- Check browser console for errors

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **USDA FoodData Central** - Food nutrition database
- **Tesseract.js** - OCR engine
- **Chart.js** - Charting library
- **React Icons** - Icon library

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: support@proteinpro.com (replace with your email)

## 🗺️ Roadmap

Future enhancements:
- [ ] Barcode scanner integration
- [ ] Meal planning features
- [ ] Social sharing
- [ ] Mobile apps (React Native)
- [ ] Macro tracking (carbs, fats)
- [ ] Recipes with protein calculation
- [ ] Integration with fitness trackers
- [ ] Multi-user support with authentication
- [ ] Progressive Web App (PWA) features
- [ ] Dark mode

## 📸 Screenshots

### Home Dashboard
Clean interface showing daily protein progress with circular indicator.

### Calendar View
Color-coded calendar showing protein goal achievement over time.

### Analytics Dashboard
Interactive charts displaying weekly, monthly, and yearly trends.

### OCR Scanning
Scan nutrition labels to automatically extract protein information.

---

**Built with ❤️ for fitness enthusiasts**

Happy tracking! 💪
