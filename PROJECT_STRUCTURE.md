# ProteinPro Project Structure

Complete file and folder organization of the ProteinPro application.

```
ProteinPro/
│
├── backend/                          # Backend API Server
│   ├── node_modules/                 # Backend dependencies (gitignored)
│   ├── uploads/                      # Uploaded images (gitignored)
│   ├── .env                          # Environment variables (gitignored)
│   ├── .env.example                  # Environment variables template
│   ├── .gitignore                    # Backend gitignore rules
│   ├── package.json                  # Backend dependencies and scripts
│   ├── initDb.js                     # Database initialization script
│   ├── server.js                     # Express server and API routes
│   └── proteinpro.db                 # SQLite database (created after init)
│
├── frontend/                         # React Frontend Application
│   ├── node_modules/                 # Frontend dependencies (gitignored)
│   ├── build/                        # Production build (gitignored)
│   ├── public/                       # Public static files
│   │   └── index.html                # HTML template
│   │
│   ├── src/                          # Source code
│   │   ├── components/               # React components
│   │   │   ├── Home.js               # Dashboard/home page
│   │   │   ├── Home.css              # Home page styles
│   │   │   ├── History.js            # Food history page
│   │   │   ├── History.css           # History page styles
│   │   │   ├── Calendar.js           # Calendar view page
│   │   │   ├── Calendar.css          # Calendar page styles
│   │   │   ├── Analytics.js          # Analytics/charts page
│   │   │   ├── Analytics.css         # Analytics page styles
│   │   │   ├── Settings.js           # Settings page
│   │   │   ├── Settings.css          # Settings page styles
│   │   │   ├── Navbar.js             # Bottom navigation bar
│   │   │   ├── Navbar.css            # Navbar styles
│   │   │   ├── AddEntryModal.js      # Add/edit entry modal
│   │   │   ├── AddEntryModal.css     # Modal styles
│   │   │   ├── OCRScanner.js         # OCR scanning component
│   │   │   ├── OCRScanner.css        # Scanner styles
│   │   │   └── Notification.js       # Toast notification component
│   │   │
│   │   ├── services/                 # API and services
│   │   │   └── api.js                # API client with all endpoints
│   │   │
│   │   ├── App.js                    # Main app component with routing
│   │   ├── App.css                   # App-level styles
│   │   ├── index.js                  # React entry point
│   │   └── index.css                 # Global styles
│   │
│   ├── .env                          # Frontend environment variables (gitignored)
│   ├── .env.example                  # Frontend env template
│   ├── .gitignore                    # Frontend gitignore rules
│   └── package.json                  # Frontend dependencies and scripts
│
├── .gitignore                        # Root gitignore rules
├── LICENSE                           # MIT License
├── README.md                         # Main documentation
├── QUICKSTART.md                     # Quick start guide
├── DEPLOYMENT.md                     # Deployment guide
├── PROJECT_STRUCTURE.md              # This file
├── package.json                      # Root package.json with convenience scripts
├── start.sh                          # Quick start script (executable)
├── deploy-to-s3.sh                   # AWS S3 deployment script (executable)
└── setup-cloudfront.sh               # CloudFront setup script (executable)
```

## File Descriptions

### Root Level

- **README.md** - Main documentation with features, setup, and usage
- **QUICKSTART.md** - Get started in under 5 minutes
- **DEPLOYMENT.md** - Comprehensive deployment guide for various platforms
- **PROJECT_STRUCTURE.md** - This file, describing the project organization
- **LICENSE** - MIT License
- **package.json** - Root-level package with convenience scripts
- **.gitignore** - Git ignore rules for the entire project

### Scripts

- **start.sh** - One-command setup and start script
- **deploy-to-s3.sh** - Deploy frontend to AWS S3
- **setup-cloudfront.sh** - Configure CloudFront CDN

### Backend (`/backend`)

#### Configuration
- **package.json** - Dependencies: express, cors, sqlite3, axios, multer, dotenv
- **.env** - Environment variables (PORT, USDA_API_KEY)
- **initDb.js** - Creates database schema and populates sample data

#### Core Files
- **server.js** - Main server file with:
  - Express setup and middleware
  - Database connection
  - All API routes (user, entries, analytics, favorites, food search, export)
  - File upload handling
  - CORS configuration

#### Database
- **proteinpro.db** - SQLite database with tables:
  - `users` - User profiles
  - `food_entries` - All food logs
  - `favorite_foods` - Quick-add favorites
  - `user_settings` - User preferences

### Frontend (`/frontend`)

#### Public
- **index.html** - Single-page app entry point

#### Components

**Pages:**
- **Home.js/css** - Daily dashboard with:
  - Circular progress indicator
  - Today's protein total
  - Quick add button
  - List of today's foods

- **History.js/css** - Food history with:
  - Search functionality
  - Meal type filter
  - Date range filter
  - Grouped by date
  - Edit/delete actions

- **Calendar.js/css** - Calendar view with:
  - Color-coded days
  - Monthly navigation
  - Daily details panel
  - Goal achievement indicators

- **Analytics.js/css** - Analytics dashboard with:
  - Period selector (week/month/year)
  - Bar charts with Chart.js
  - Statistics cards
  - Export to CSV

- **Settings.js/css** - Settings page with:
  - Profile information
  - Protein goal setting
  - Weight tracking
  - Protein recommendations

**Shared Components:**
- **Navbar.js/css** - Bottom navigation with icons
- **AddEntryModal.js/css** - Multi-tab modal:
  - Manual entry form
  - Food search (USDA API)
  - OCR scanning
  - Favorites list
- **OCRScanner.js/css** - Image upload and OCR processing
- **Notification.js** - Toast notifications

#### Services
- **api.js** - Centralized API client:
  - All HTTP requests
  - Error handling
  - Base URL configuration

#### Styling
- **App.css** - App-level styles and common classes
- **index.css** - Global styles and resets

## Technology Stack

### Frontend
- **React 18** - UI library
- **React Router 6** - Client-side routing
- **Chart.js 4** - Data visualization
- **React Chart.js 2** - React wrapper for Chart.js
- **Tesseract.js** - OCR processing
- **React Calendar** - Calendar component
- **date-fns** - Date utilities
- **React Icons** - Icon library
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database
- **Axios** - HTTP client for external APIs
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

## Data Flow

```
User Action
    ↓
React Component
    ↓
API Service (api.js)
    ↓
HTTP Request
    ↓
Express Route (server.js)
    ↓
Database Query (SQLite)
    ↓
Response
    ↓
React State Update
    ↓
UI Re-render
```

## Key Features Implementation

### 1. Photo Upload & OCR
- **Frontend**: OCRScanner.js uses Tesseract.js
- **Process**: Image → OCR → Extract nutrients → Populate form

### 2. Food Search
- **API**: USDA FoodData Central
- **Frontend**: AddEntryModal.js search tab
- **Backend**: `/api/food/search` endpoint

### 3. Daily Tracking
- **Component**: Home.js
- **API**: `/api/entries/:userId/date/:date`
- **Features**: Circular progress, entry list, quick add

### 4. Calendar View
- **Component**: Calendar.js
- **Library**: react-calendar
- **API**: `/api/entries/:userId/daily-totals`
- **Features**: Color coding, date selection, daily details

### 5. Analytics
- **Component**: Analytics.js
- **Library**: Chart.js
- **API**: `/api/analytics/:userId`
- **Features**: Multiple time periods, statistics, export

## Development Workflow

1. **Local Development**
   ```bash
   ./start.sh
   ```

2. **Make Changes**
   - Frontend: Auto-reload on save
   - Backend: Nodemon auto-restart

3. **Test Features**
   - Add/edit/delete entries
   - Search foods
   - Scan labels
   - View analytics

4. **Build for Production**
   ```bash
   cd frontend
   npm run build
   ```

5. **Deploy**
   ```bash
   ./deploy-to-s3.sh bucket-name
   ```

## Database Schema

### Users
- id, username, email, daily_protein_target, weight, created_at

### Food Entries
- id, user_id, food_name, protein_grams, calories, carbs, fat
- serving_size, meal_type, entry_date, entry_time, notes, is_favorite

### Favorite Foods
- id, user_id, food_name, protein_grams, calories, serving_size

## API Endpoints Summary

- **User**: GET/PUT `/api/user/:userId`
- **Entries**: CRUD operations on `/api/entries`
- **Analytics**: GET `/api/analytics/:userId`
- **Favorites**: CRUD on `/api/favorites`
- **Food Search**: GET `/api/food/search`
- **Export**: GET `/api/export/:userId`

## Environment Variables

### Backend
```
PORT=5000
USDA_API_KEY=your_key
```

### Frontend
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Scripts Reference

### Root Level
- `npm run install-all` - Install all dependencies
- `npm run init-db` - Initialize database
- `npm run dev-backend` - Start backend dev server
- `npm run dev-frontend` - Start frontend dev server
- `npm run build-frontend` - Build production frontend

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Customization Points

1. **Branding**: Update colors in CSS files
2. **Features**: Add new components and routes
3. **Database**: Extend schema in initDb.js
4. **API**: Add new endpoints in server.js
5. **Styling**: Modify component CSS files

---

**Last Updated**: 2024
**Version**: 1.0.0
