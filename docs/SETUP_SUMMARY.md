# Local Testing Setup - Quick Summary

> **Note:** This file has been moved to the `docs/` folder. All documentation is now organized there.

## What You Need (Already Have ✅)

Based on your system check:
- ✅ Node.js v22.14.0
- ✅ npm 10.8.2
- ✅ Python 3.12.3
- ✅ Docker 28.0.4
- ✅ Docker Compose v2.34.0

## What You Need to Do

### 1. Get Gemini API Key (2 minutes - FREE)

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key

### 2. Add API Key to Environment

Edit `ai-service/.env` and replace:
```
GEMINI_API_KEY=your-gemini-api-key-here
```

With your actual key.

### 3. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend && npm install && cd ..

# AI Service
cd ai-service && pip install -r requirements.txt && cd ..
```

### 4. Start Databases

```bash
cd backend
docker-compose up -d postgres redis
```

Wait 10 seconds for them to start.

### 5. Setup Database

```bash
cd backend
npm run db:migrate
npm run db:generate
```

### 6. Start Services (3 Terminals)

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

## Verify Everything Works

1. **Backend**: http://localhost:3000/health → Should show `{"status":"ok"}`
2. **AI Service**: http://localhost:8000/health → Should show `{"status":"ok"}`
3. **Frontend**: http://localhost:8080 → Should show the application

## Quick Verification Script

Run:
```bash
# Windows
verify-setup.bat

# Mac/Linux
bash verify-setup.sh
```

## That's It!

You're ready to test. The only thing you need is:
- ✅ **Gemini API Key** (free, 2 minutes to get)

Everything else is already set up or can be installed with the commands above.

## Full Documentation

- **Detailed Setup**: See `LOCAL_TESTING_SETUP.md`
- **Quick Start**: See `QUICK_START.md`
- **Troubleshooting**: See `LOCAL_TESTING_SETUP.md` (Troubleshooting section)

