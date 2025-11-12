# Local Testing Checklist

Quick checklist to verify your setup is ready for testing.

## ✅ Prerequisites Installed

- [ ] **Node.js 20+** - `node --version`
- [ ] **npm** - `npm --version`
- [ ] **Python 3.11+** - `python --version`
- [ ] **pip** - `pip --version`
- [ ] **Docker Desktop** - `docker --version`
- [ ] **Docker Compose** - `docker-compose --version`

## ✅ API Keys Configured

- [ ] **Gemini API Key** - Added to `ai-service/.env`
  - Get from: https://aistudio.google.com/app/apikey
  - Free tier: 30 RPM, 1.5K RPD

## ✅ Dependencies Installed

- [ ] **Frontend** - `npm install` (from root)
- [ ] **Backend** - `cd backend && npm install`
- [ ] **AI Service** - `cd ai-service && pip install -r requirements.txt`

## ✅ Environment Files Created

- [ ] **backend/.env** - Created and configured
- [ ] **ai-service/.env** - Created with Gemini API key

## ✅ Databases Running

- [ ] **PostgreSQL** - `docker-compose up -d postgres` (from backend/)
- [ ] **Redis** - `docker-compose up -d redis` (from backend/)
- [ ] **Database Schema** - `npm run db:migrate` (from backend/)

## ✅ Services Running

- [ ] **Backend** - Running on http://localhost:3000
  - Test: `curl http://localhost:3000/health`
- [ ] **AI Service** - Running on http://localhost:8000
  - Test: `curl http://localhost:8000/health`
- [ ] **Frontend** - Running on http://localhost:8080
  - Test: Open in browser

## ✅ Quick Verification

Run the verification script:

**Windows:**
```bash
verify-setup.bat
```

**Mac/Linux:**
```bash
bash verify-setup.sh
```

## Common Issues

### "Cannot find module"
→ Run `npm install` or `pip install -r requirements.txt`

### "Port already in use"
→ Kill the process using the port or change port in `.env`

### "Database connection refused"
→ Start Docker containers: `docker-compose up -d postgres redis`

### "GEMINI_API_KEY not set"
→ Add your API key to `ai-service/.env`

## Ready to Test!

Once all checkboxes are ✅, you're ready to test the application!

