# Local Testing Setup Guide

Complete guide to set up the application for local testing.

## Prerequisites Checklist

### Required Software

1. **Node.js 20+** and npm
   - Download: https://nodejs.org/
   - Verify: `node --version` (should be 20.x or higher)
   - Verify: `npm --version`

2. **Python 3.11+** and pip
   - Download: https://www.python.org/downloads/
   - Verify: `python --version` (should be 3.11 or higher)
   - Verify: `pip --version`

3. **Docker Desktop** (for PostgreSQL and Redis)
   - Download: https://www.docker.com/products/docker-desktop/
   - Verify: `docker --version`
   - Verify: `docker-compose --version`
   - **Alternative**: Install PostgreSQL 16+ and Redis 7+ locally

4. **Git** (already installed if you have the repo)
   - Verify: `git --version`

### Required API Keys (Free)

5. **Google Gemini API Key** (FREE - Required)
   - Get from: https://aistudio.google.com/app/apikey
   - Sign in with Google account
   - Click "Create API Key"
   - Copy the key
   - **Free tier**: 30 RPM, 1.5K RPD, 1M TPM

### Optional (For Full Features)

6. **FRED API Key** (Optional - for commodity prices)
   - Get from: https://fred.stlouisfed.org/docs/api/api_key.html
   - Free, no credit card required

7. **File Storage** (Optional - for production)
   - AWS S3 or Cloudflare R2 credentials
   - Not needed for local testing (can use local storage)

## Step-by-Step Setup

### Step 1: Verify Prerequisites

```bash
# Check Node.js
node --version  # Should be 20.x or higher
npm --version

# Check Python
python --version  # Should be 3.11 or higher
pip --version

# Check Docker
docker --version
docker-compose --version
```

### Step 2: Install Dependencies

#### Frontend Dependencies
```bash
# From project root
npm install
```

#### Backend Dependencies
```bash
cd backend
npm install
cd ..
```

#### AI Service Dependencies
```bash
cd ai-service
pip install -r requirements.txt
cd ..
```

### Step 3: Configure Environment Variables

#### Backend Environment (`backend/.env`)

The file should already exist. Verify it has:

```env
# Database (Docker Compose defaults)
DATABASE_URL=postgresql://sourceflow_user:sourceflow_password@localhost:5432/sourceflow_db?schema=public

# Redis (Docker Compose defaults)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (development values)
JWT_SECRET=development-jwt-secret-key-change-in-production-min-32-characters-long
JWT_REFRESH_SECRET=development-refresh-secret-key-change-in-production-min-32-characters-long

# CORS
CORS_ORIGIN=http://localhost:8080

# AI Service
AI_SERVICE_URL=http://localhost:8000
```

#### AI Service Environment (`ai-service/.env`)

**IMPORTANT**: Edit this file and add your Gemini API key:

```env
# REQUIRED: Add your Gemini API key here
GEMINI_API_KEY=your-actual-gemini-api-key-here

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Step 4: Start Databases

```bash
cd backend
docker-compose up -d postgres redis
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

**Verify they're running:**
```bash
docker-compose ps
```

You should see `postgres` and `redis` with status "Up".

**Alternative (if not using Docker):**
- Install PostgreSQL 16+ locally
- Install Redis 7+ locally
- Update `DATABASE_URL` and `REDIS_HOST` in `backend/.env`

### Step 5: Setup Database Schema

```bash
cd backend
npm run db:migrate
npm run db:generate
```

This creates all database tables.

**Verify:**
```bash
npm run db:studio
```
Opens Prisma Studio in browser to view database.

### Step 6: Start All Services

You need **3 terminal windows**:

#### Terminal 1: Backend API
```bash
cd backend
npm run dev
```

**Expected output:**
```
🚀 Server running on port 3000
📝 Environment: development
🔗 API Version: v1
```

**Test:** http://localhost:3000/health

#### Terminal 2: AI Service
```bash
cd ai-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Test:** http://localhost:8000/health

#### Terminal 3: Frontend
```bash
# From project root
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

**Test:** http://localhost:8080

## Verification Checklist

### ✅ Services Running

- [ ] Backend: http://localhost:3000/health → `{"status":"ok"}`
- [ ] AI Service: http://localhost:8000/health → `{"status":"ok"}`
- [ ] Frontend: http://localhost:8080 → Shows application

### ✅ Database Connected

- [ ] Backend starts without database errors
- [ ] Can run `npm run db:studio` and see tables

### ✅ Gemini API Working

- [ ] AI Service starts without "GEMINI_API_KEY not set" error
- [ ] Can make a test BOM generation request

## Testing the Application

### 1. Create Account

1. Open http://localhost:8080
2. Navigate to registration (if implemented) or use API directly
3. Create a test user

### 2. Upload Product

1. Go to Upload page
2. Upload a product image (JPEG, PNG)
3. Add product name and description
4. Submit

### 3. Generate BOM

1. After upload, navigate to BOM page
2. Click "Generate BOM"
3. Wait for AI processing (<5 seconds)
4. Review generated BOM

### 4. Test Sourcing

1. Navigate to Sourcing page
2. Search for suppliers
3. View commodity prices (if FRED API key is set)

## Troubleshooting

### Database Connection Errors

**Error:** `ECONNREFUSED` or `Connection refused`

**Solution:**
```bash
# Check if Docker containers are running
docker-compose ps

# Start them if not running
docker-compose up -d postgres redis

# Wait 10 seconds for startup
# Then try again
```

### Redis Connection Errors

**Error:** `Redis connection failed`

**Solution:**
```bash
# Check Redis container
docker-compose ps redis

# Restart if needed
docker-compose restart redis
```

### Gemini API Errors

**Error:** `GEMINI_API_KEY not set`

**Solution:**
1. Check `ai-service/.env` exists
2. Verify `GEMINI_API_KEY` is set (not "your-gemini-api-key-here")
3. Restart AI service after adding key

**Error:** `API key not valid` or rate limit errors

**Solution:**
1. Verify API key at https://aistudio.google.com/app/apikey
2. Check you haven't exceeded free tier limits (30 RPM, 1.5K RPD)
3. Wait 1 minute if you hit rate limits

### Port Already in Use

**Error:** `Port 3000/8000/8080 already in use`

**Solution:**
- Find process using port: `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (Mac/Linux)
- Kill process or change port in `.env` files

### Module Not Found Errors

**Backend:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**AI Service:**
```bash
cd ai-service
pip install -r requirements.txt --upgrade
```

**Frontend:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Quick Test Script

Run this to verify everything is set up:

```bash
# Check services
curl http://localhost:3000/health
curl http://localhost:8000/health

# Check database
cd backend
npm run db:studio  # Opens in browser
```

## What You Can Test Locally

### ✅ Fully Functional

1. **User Authentication**
   - Register/Login
   - JWT token management
   - Session handling

2. **Product Management**
   - Create products
   - Upload images
   - View products

3. **BOM Generation**
   - Upload product images
   - Generate BOM with Gemini AI
   - Edit BOM
   - Version history

4. **Database Operations**
   - All CRUD operations
   - Relationships
   - Queries

### ⚠️ Limited (Without External APIs)

1. **File Storage**
   - Upload works but files stored locally
   - For production, need S3/R2 credentials

2. **Commodity Prices**
   - Works if FRED API key is set
   - Otherwise uses cached/mock data

3. **Supplier Data**
   - Basic supplier search works
   - Real supplier data requires external APIs

## Next Steps After Setup

1. **Test BOM Generation**
   - Upload a product image
   - Generate BOM
   - Verify AI analysis works

2. **Test API Endpoints**
   - Use Postman or curl
   - Test authentication
   - Test BOM generation

3. **Explore Frontend**
   - Navigate all pages
   - Test file uploads
   - View generated BOMs

## Summary

**Minimum Requirements for Local Testing:**
- ✅ Node.js 20+
- ✅ Python 3.11+
- ✅ Docker Desktop
- ✅ Gemini API Key (free)

**That's it!** Everything else is optional or can be added later.

