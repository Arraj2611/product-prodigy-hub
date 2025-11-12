# Quick Start - Run Locally

> **Note:** This file has been moved to the `docs/` folder. All documentation is now organized there.

## What You Need

### 1. Gemini API Key (Free - 2 minutes)

- Go to: <https://aistudio.google.com/app/apikey>
- Sign in with Google
- Click "Create API Key"
- Copy the key

### 2. Install Dependencies

```bash
# Backend
cd backend && npm install

# AI Service
cd ai-service && pip install -r requirements.txt

# Frontend (from root)
npm install
```

### 3. Setup Environment Files

**Backend** (`backend/.env`):

```env
DATABASE_URL=postgresql://sourceflow_user:sourceflow_password@localhost:5432/sourceflow_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
CORS_ORIGIN=http://localhost:8080
AI_SERVICE_URL=http://localhost:8000
```

**AI Service** (`ai-service/.env`):

```env
GEMINI_API_KEY=your-gemini-api-key-here
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

### 4. Start Databases

```bash
cd backend
docker-compose up -d postgres redis
```

### 5. Setup Database

```bash
cd backend
npm run db:migrate
npm run db:generate
```

### 6. Start Services

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - AI Service:**

```bash
cd ai-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 - Frontend:**

```bash
npm run dev
```

## That's It

- Frontend: <http://localhost:8080>
- Backend: <http://localhost:3000>
- AI Service: <http://localhost:8000>

## Free Tier Limits (Gemini)

- ✅ 30 requests/minute
- ✅ 1,500 requests/day
- ✅ 1M tokens/month
- ✅ $0 cost
- ✅ No credit card needed

Perfect for development and testing!
