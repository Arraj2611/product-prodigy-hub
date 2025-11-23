# SourceFlow - AI-Powered Creation-to-Commerce Platform

An intelligent platform that transforms product ideas into actionable manufacturing plans. Upload product images, and SourceFlow automatically generates Bills of Materials (BOMs), finds suppliers, analyzes markets, and creates marketing campaigns.

## 🚀 Quick Start

### Prerequisites

Before you begin, make sure you have:

- **Node.js 20+** - [Download](https://nodejs.org/)
- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Groq API Key** (Free) - [Get it here](https://console.groq.com/keys) (takes 2 minutes)

### Installation (One-Time Setup)

#### Step 1: Get Your Groq API Key

1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign in or create a free account
3. Click "Create API Key"
4. Copy the key (you'll need it in Step 3)

#### Step 2: Install Dependencies

Open a terminal in the project folder and run:

**Windows:**

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install AI service dependencies
cd ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

**macOS/Linux:**

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install AI service dependencies
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

#### Step 3: Configure Environment

The startup scripts will automatically create `.env` files if they don't exist, but you **must** add your Groq API key:

1. Open `ai-service/.env` in a text editor
2. Replace `your-groq-api-key-here` with your actual API key from Step 1
3. Save the file

### Running the Application

#### Option 1: Automated Scripts (Recommended)

**Windows:**

```bash
start-local.bat
```

**macOS/Linux:**

```bash
chmod +x start-local.sh
./start-local.sh
```

The scripts will:

- ✅ Check all prerequisites
- ✅ Start Docker containers (PostgreSQL & Redis)
- ✅ Set up the database
- ✅ Start all three services (Backend, AI Service, Frontend)

**Note:** On Windows, the script opens 3 separate command windows - one for each service. Keep them open while using the app.

#### Option 2: Manual Start (3 Terminal Windows)

If you prefer to start services manually:

**Terminal 1 - Backend:**

```bash
cd backend
docker-compose up -d postgres redis
npm run db:generate
npm run db:migrate
npm run dev
```

**Terminal 2 - AI Service:**

```bash
cd ai-service
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 - Frontend:**

```bash
npm run dev
```

### Access the Application

Once all services are running:

- **Frontend (Main App):** <http://localhost:8080>
- **Backend API:** <http://localhost:3000>
- **AI Service:** <http://localhost:8000>

## 📖 First Steps

1. **Open the app:** Navigate to <http://localhost:8080> in your browser
2. **Create an account:** Click "Sign In" → "Sign Up" → Enter your details
3. **Upload a product:**
   - Click "Upload Product" or "New Product"
   - Enter product name and description
   - Upload product images (JPEG, PNG, or WebP)
   - Click "Generate BOM with AI"
4. **Explore results:**
   - **BOM Tab:** View materials breakdown and costs
   - **Sourcing Tab:** See supplier recommendations
   - **Markets Tab:** Check market demand forecasts
   - **Marketing Tab:** Get campaign suggestions
   - **Dashboard:** View analytics and charts

## 🏗️ Project Structure

```
product-prodigy-hub/
├── src/              # Frontend React application
├── backend/          # Node.js/Express API server
├── ai-service/       # Python FastAPI AI service
├── docs/             # Documentation
│   └── requirements/ # Project requirements (BRD, FRD, Use Cases)
└── README.md         # This file
```

## 🛠️ Technologies

**Frontend:**

- React 18 + TypeScript
- Vite 7
- shadcn-ui + Tailwind CSS
- TanStack Query

**Backend:**

- Node.js + Express
- PostgreSQL + Prisma ORM
- Redis caching
- JWT authentication

**AI Service:**

- Python FastAPI
- Groq API (Free Tier - No credit card required!)

## 🔧 Troubleshooting

### Database Connection Issues

**Problem:** "Cannot connect to database" or "Authentication failed"

**Solution:**

```bash
cd backend
docker-compose down
docker-compose up -d postgres redis
# Wait 5 seconds, then:
npm run db:generate
npm run db:migrate
```

### AI Service Not Starting

**Problem:** "GROQ_API_KEY not set" or "Module not found"

**Solution:**

1. Verify `ai-service/.env` exists and contains your Groq API key
2. Make sure you activated the virtual environment:

   ```bash
   cd ai-service
   # Windows: venv\Scripts\activate
   # macOS/Linux: source venv/bin/activate
   ```

3. Reinstall dependencies if needed:

   ```bash
   pip install -r requirements.txt
   ```

### Frontend Can't Connect to Backend

**Problem:** CORS errors or "Failed to fetch"

**Solution:**

1. Verify backend is running on port 3000
2. Check `backend/.env` has: `CORS_ORIGIN=http://localhost:8080`
3. Restart the backend server

### Port Already in Use

**Problem:** "EADDRINUSE: address already in use"

**Solution:**

**Windows:**

```bash
# Find process using port 3000
netstat -ano | findstr :3000
# Kill the process (replace <PID> with actual number)
taskkill /PID <PID> /F
```

**macOS/Linux:**

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Docker Containers Not Starting

**Problem:** Docker errors or containers won't start

**Solution:**

1. Make sure Docker Desktop is running
2. Check Docker has enough resources (Settings → Resources)
3. Try restarting Docker Desktop
4. Check if port 5433 is available (PostgreSQL uses this port)

### Services Start But App Doesn't Work

**Check service health:**

```bash
# Backend health check
curl http://localhost:3000/health

# AI service health check
curl http://localhost:8000/health
```

Both should return `{"status":"ok"}`. If not, check the terminal logs for errors.

## 📚 Development

### Database Management

```bash
cd backend

# View database in Prisma Studio
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:reset

# Create new migration
npm run db:migrate
```

### Environment Variables

**Backend (`backend/.env`):**

- `DATABASE_URL` - PostgreSQL connection (default: port 5433)
- `JWT_SECRET` - JWT signing secret (min 32 characters)
- `AI_SERVICE_URL` - AI service endpoint (default: <http://localhost:8000>)
- `CORS_ORIGIN` - Frontend URL (default: <http://localhost:8080>)

**AI Service (`ai-service/.env`):**

- `GROQ_API_KEY` - Your Groq API key (required)
- `CORS_ORIGINS` - Allowed origins (default: <http://localhost:8080,http://localhost:3000>)

### Hot Reload

All services support automatic reloading:

- **Frontend:** Automatic via Vite
- **Backend:** Automatic via `tsx watch`
- **AI Service:** Automatic via `--reload` flag

## 🆘 Getting Help

1. **Check service logs:**
   - Backend: Check the terminal where `npm run dev` is running
   - AI Service: Check the terminal where `uvicorn` is running
   - Frontend: Check browser console (F12)

2. **Verify all services are running:**
   - Backend: <http://localhost:3000/health>
   - AI Service: <http://localhost:8000/health>
   - Frontend: <http://localhost:8080>

3. **Common issues:**
   - Make sure Docker Desktop is running
   - Verify all `.env` files are configured
   - Check that ports 3000, 8000, 8080, 5433, and 6379 are available
   - Ensure Groq API key is valid

## 📝 License

ISC

---

**Ready to build? Run the startup script and start creating! 🎉**
