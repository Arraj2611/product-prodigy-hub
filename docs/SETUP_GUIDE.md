# Local Setup Guide

## Quick Start - Get Running in 5 Minutes

### Prerequisites

1. **Node.js 20+** and npm
2. **Python 3.11+** and pip
3. **Docker & Docker Compose** (optional, for databases)
4. **Gemini API Key** (free from Google AI Studio)

### Step 1: Get Gemini API Key (Free)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (you'll need it in Step 3)

**Free Tier Limits:**
- 30 requests per minute
- 1,000,000 tokens per month
- 1,500 requests per day

### Step 2: Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### AI Service
```bash
cd ai-service
pip install -r requirements.txt
```

#### Frontend (if not already done)
```bash
# From project root
npm install
```

### Step 3: Configure Environment Variables

#### Backend Environment

Create `backend/.env`:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set:

```env
# Database (use Docker Compose or local PostgreSQL)
DATABASE_URL=postgresql://sourceflow_user:sourceflow_password@localhost:5432/sourceflow_db?schema=public

# Redis (use Docker Compose or local Redis)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long

# CORS
CORS_ORIGIN=http://localhost:8080

# AI Service
AI_SERVICE_URL=http://localhost:8000
```

#### AI Service Environment

Create `ai-service/.env`:

```bash
cd ai-service
cp .env.example .env
```

Edit `ai-service/.env` and add your Gemini API key:

```env
# REQUIRED: Your Gemini API Key from Google AI Studio
GEMINI_API_KEY=your-gemini-api-key-here

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Step 4: Start Databases (Docker Compose)

From the `backend` directory:

```bash
cd backend
docker-compose up -d postgres redis
```

This starts PostgreSQL and Redis in the background.

**Alternative:** If you have PostgreSQL and Redis installed locally, skip this step and update the connection strings in `backend/.env`.

### Step 5: Setup Database

```bash
cd backend
npm run db:migrate
npm run db:generate
```

### Step 6: Start Services

#### Terminal 1: Backend API
```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3000`

#### Terminal 2: AI Service
```bash
cd ai-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

AI Service will run on `http://localhost:8000`

#### Terminal 3: Frontend
```bash
# From project root
npm run dev
```

Frontend will run on `http://localhost:8080`

### Step 7: Verify Setup

1. **Backend Health**: http://localhost:3000/health
2. **AI Service Health**: http://localhost:8000/health
3. **Frontend**: http://localhost:8080

## What You Need to Provide

### Required (Free)

1. ✅ **Gemini API Key** - Free from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - No credit card required
   - Free tier is sufficient for development

### Optional (Can use Docker)

2. **PostgreSQL** - Use Docker Compose (included) or install locally
3. **Redis** - Use Docker Compose (included) or install locally

### Optional (For Production)

4. **File Storage** - AWS S3 or Cloudflare R2 credentials (for production)
5. **External APIs** - FRED API key (for commodity prices)

## Troubleshooting

### "GEMINI_API_KEY not set"
- Make sure `ai-service/.env` exists
- Verify the API key is correct
- Restart the AI service after adding the key

### Database Connection Errors
- Make sure PostgreSQL is running: `docker-compose ps`
- Check `DATABASE_URL` in `backend/.env`
- Verify database exists: `docker-compose exec postgres psql -U sourceflow_user -d sourceflow_db`

### Redis Connection Errors
- Make sure Redis is running: `docker-compose ps`
- Check `REDIS_HOST` and `REDIS_PORT` in `backend/.env`

### Port Already in Use
- Backend: Change `PORT` in `backend/.env` (default: 3000)
- AI Service: Change port in uvicorn command (default: 8000)
- Frontend: Change in `vite.config.ts` (default: 8080)

### Rate Limit Errors (Gemini)
- Free tier: 30 requests/minute, 1.5K requests/day
- Wait a minute if you hit limits
- Check usage at [Google AI Studio](https://aistudio.google.com/app/apikey)

## Next Steps

1. Create an account via the frontend
2. Upload a product image
3. Generate a BOM
4. Explore sourcing options

## Production Deployment

For production, you'll need:

1. Production database (managed PostgreSQL)
2. Production Redis (managed service)
3. File storage (S3/R2)
4. Environment variables configured
5. SSL certificates
6. Domain name

See `IMPLEMENTATION_STATUS.md` for more details.

