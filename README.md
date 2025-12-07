# SourceFlow - AI-Powered Creation-to-Commerce Platform

An intelligent platform that transforms product ideas into actionable manufacturing plans. Upload product images, and SourceFlow automatically generates Bills of Materials (BOMs), finds suppliers, analyzes markets, and creates marketing campaigns.

## 🚀 Getting Started

## ⚡ Quick Start

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Groq API Key** (Free) - [Get it here](https://console.groq.com/keys)

### Running the Application

**Recommended: Use the automated startup scripts**

**Windows:**
```bash
start-local.bat
```

**macOS/Linux:**
```bash
chmod +x start-local.sh
./start-local.sh
```

The scripts automatically:
- ✅ Check prerequisites
- ✅ Create environment files
- ✅ Start Docker containers (PostgreSQL & Redis)
- ✅ Set up the database
- ✅ Install dependencies (if needed)
- ✅ Start all services


### Access the Application

Once all services are running:

- **Frontend (Main App):** <http://localhost:8080>
- **Backend API:** <http://localhost:3000>
- **AI Service:** <http://localhost:8000>

## 📖 First Steps

Once the application is running:

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

## 🎯 New User Setup Guide

Complete step-by-step guide for setting up SourceFlow on your local machine for the first time.

### 📋 Prerequisites (Install These First)

Before you begin, make sure you have these installed:

1. **Node.js 20+** - [Download here](https://nodejs.org/)
   - Choose the LTS version
   - Verify installation: Open terminal and run `node --version` (should show v20.x.x or higher)

2. **Python 3.11+** - [Download here](https://www.python.org/downloads/)
   - Make sure to check "Add Python to PATH" during installation
   - Verify installation: Open terminal and run `python --version` (Windows) or `python3 --version` (macOS/Linux)

3. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
   - Install and start Docker Desktop
   - Verify installation: Open terminal and run `docker --version`
   - **Important:** Docker Desktop must be running before you start the application

4. **Groq API Key (Free)** - [Get it here](https://console.groq.com/keys)
   - Sign in or create a free account (takes 2 minutes)
   - Click "Create API Key"
   - Copy the key (you'll need it in Step 4)
   - **No credit card required!**

### 🎯 Setup Steps

#### Step 1: Get the Project

**If using Git:**
```bash
git clone https://github.com/Arraj2611/product-prodigy-hub.git
cd product-prodigy-hub
```

**If you received the project as a zip file:**
- Extract the folder
- Open terminal/command prompt in the extracted folder

#### Step 2: Get Your Groq API Key

1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign in or create a free account
3. Click "Create API Key"
4. Copy the key (you'll use it in Step 4)

#### Step 3: Run the Startup Script

The startup script will automatically:
- ✅ Check all prerequisites
- ✅ Create environment files
- ✅ Start Docker containers
- ✅ Set up the database
- ✅ Install dependencies (if needed)
- ✅ Start all services

**Windows Users:**
```bash
# Option 1: Double-click start-local.bat
# Option 2: Open Command Prompt/PowerShell in the project folder and run:
start-local.bat
```

**macOS/Linux Users:**
```bash
# Make the script executable (first time only)
chmod +x start-local.sh

# Run the script
./start-local.sh
```

#### Step 4: Add Your Groq API Key

When the script prompts you (or if it stops), you need to add your API key:

1. Open `ai-service/.env` in a text editor (Notepad, VS Code, etc.)
2. Find the line: `GROQ_API_KEY=your-groq-api-key-here`
3. Replace `your-groq-api-key-here` with your actual API key from Step 2
4. Save the file
5. If the script paused, press Enter to continue

**Example:**
```
Before: GROQ_API_KEY=your-groq-api-key-here
After:  GROQ_API_KEY=gsk_abc123xyz789...
```

#### Step 5: Wait for Services to Start

The script will:
- Start Docker containers (PostgreSQL & Redis) - takes ~30 seconds
- Set up the database schema - takes ~10 seconds
- Install dependencies (first time only) - takes 5-10 minutes
- Start Backend API (port 3000)
- Start AI Service (port 8000)
- Start Frontend (port 8080)

**First time setup:** This may take 5-10 minutes as it downloads and installs all dependencies.

**Subsequent runs:** Usually takes 1-2 minutes.

You'll know it's ready when you see:
```
✅ All services started!

📍 Service URLs:
   Frontend:  http://localhost:8080
   Backend:   http://localhost:3000
   AI Service: http://localhost:8000
```

#### Step 6: Access the Application

Once you see "✅ All services started!":

1. Open your web browser (Chrome, Firefox, Edge, etc.)
2. Navigate to: **http://localhost:8080**
3. You should see the SourceFlow login page! 🎉

### 🎮 First Time Using the App

#### 1. Create Your Account

1. Click **"Sign In"** in the top right
2. Click **"Sign Up"** tab
3. Enter your details:
   - Email address
   - Password (min 8 characters)
   - Name
4. Click **"Create Account"**

#### 2. Upload Your First Product

1. Click **"Upload Product"** or **"New Product"** button
2. Fill in product details:
   - Product name (e.g., "Wireless Headphones")
   - Description (e.g., "Premium noise-cancelling wireless headphones")
3. Upload product images:
   - Click "Upload Images"
   - Select JPEG, PNG, or WebP files
   - You can upload multiple images
4. Click **"Generate BOM with AI"**
5. Wait 30-60 seconds for AI to analyze and generate results

#### 3. Explore the Results

Once BOM generation is complete, explore different tabs:

- **📋 BOM Tab:** View materials breakdown, quantities, and costs
- **🏭 Sourcing Tab:** See supplier recommendations with prices, MOQ, and lead times
- **📊 Markets Tab:** Check market demand forecasts and trends
- **📢 Marketing Tab:** Get AI-generated marketing campaign suggestions
- **📈 Dashboard:** View analytics, charts, and product performance

### ⚠️ Important Notes

**Windows Users:**
- The script opens **3 separate command windows** (one for each service)
- **Keep all 3 windows open** while using the app
- To stop the app, close all 3 windows or press Ctrl+C in each

**macOS/Linux Users:**
- All services run in the **same terminal window**
- To stop the app, press **Ctrl+C** in the terminal
- This will gracefully shut down all services

**First Time Setup:**
- Installing dependencies may take **5-10 minutes**
- Make sure you have a stable internet connection
- Don't close the terminal/command windows during setup

**Docker Desktop:**
- **Docker Desktop must be running** before you start the application
- If Docker isn't running, the script will show an error
- Start Docker Desktop first, then run the startup script again

### 🛠️ Troubleshooting

#### Problem: "Docker is not installed" or "Docker not running"

**Solution:**
1. Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Start Docker Desktop (wait for it to fully start - icon in system tray)
3. Run the startup script again

#### Problem: "GROQ_API_KEY not set"

**Solution:**
1. Open `ai-service/.env` in a text editor
2. Make sure the line looks like: `GROQ_API_KEY=gsk_your_actual_key_here`
3. Save the file
4. Restart the services (run the startup script again)

#### Problem: "Cannot connect to database"

**Solution:**
1. Make sure Docker Desktop is running
2. Open terminal in the project folder
3. Run:
   ```bash
   cd backend
   docker-compose down
   docker-compose up -d postgres redis
   ```
4. Wait 5 seconds, then run the startup script again

#### Problem: Port already in use

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

#### Problem: Services start but app doesn't work

**Check service health:**

```bash
# Backend health check
curl http://localhost:3000/health

# AI service health check
curl http://localhost:8000/health
```

Both should return `{"status":"ok"}`. If not, check the terminal logs for errors.

#### Problem: "Module not found" or "npm install failed"

**Solution:**
1. Make sure you have Node.js 20+ installed: `node --version`
2. Delete `node_modules` folders and try again:
   ```bash
   # Windows
   rmdir /s /q node_modules
   rmdir /s /q backend\node_modules
   
   # macOS/Linux
   rm -rf node_modules backend/node_modules
   ```
3. Run the startup script again

#### Still Having Issues?

1. **Check service logs:**
   - Backend: Check the terminal where `npm run dev` is running
   - AI Service: Check the terminal where `uvicorn` is running
   - Frontend: Check browser console (F12 → Console tab)

2. **Verify all services are running:**
   - Backend: http://localhost:3000/health
   - AI Service: http://localhost:8000/health
   - Frontend: http://localhost:8080

3. **Common checks:**
   - ✅ Docker Desktop is running
   - ✅ All `.env` files are configured correctly
   - ✅ Ports 3000, 8000, 8080, 5433, and 6379 are available
   - ✅ Groq API key is valid and set correctly

### 📍 Quick Reference

**Service URLs:**
- **Frontend (Main App):** http://localhost:8080
- **Backend API:** http://localhost:3000
- **AI Service:** http://localhost:8000

**Ports Used:**
- **3000** - Backend API
- **8000** - AI Service
- **8080** - Frontend
- **5433** - PostgreSQL Database
- **6379** - Redis Cache

**Important Files:**
- `start-local.bat` - Windows startup script
- `start-local.sh` - macOS/Linux startup script
- `backend/.env` - Backend configuration (auto-created)
- `ai-service/.env` - AI service configuration (you need to add API key here)

**Stopping the Application:**

**Windows:**
- Close all 3 command windows, OR
- Press Ctrl+C in each window

**macOS/Linux:**
- Press Ctrl+C in the terminal where the script is running
- This will gracefully shut down all services

### ✅ Success Checklist

Before you start using the app, make sure:

- [ ] Node.js 20+ is installed
- [ ] Python 3.11+ is installed
- [ ] Docker Desktop is installed and running
- [ ] Groq API key is obtained and added to `ai-service/.env`
- [ ] Startup script has completed successfully
- [ ] All services show "✅" in the terminal
- [ ] You can access http://localhost:8080 in your browser
- [ ] You can create an account and log in

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

## 🔧 Quick Troubleshooting

**Quick fixes:**

- **Database issues:** `cd backend && docker-compose down && docker-compose up -d postgres redis`
- **API key not set:** Add your Groq API key to `ai-service/.env`
- **Service health checks:**
  ```bash
  curl http://localhost:3000/health  # Backend
  curl http://localhost:8000/health  # AI Service
  ```

> 📖 **For comprehensive troubleshooting guide, see the [Troubleshooting section](#-troubleshooting) in the New User Setup Guide above.**

## ☁️ Deployment

### Google Cloud Platform (GCP)

For production deployment to GCP, see the comprehensive deployment guide:

👉 **[Complete GCP Deployment Guide](docs/GCP_DEPLOYMENT_GUIDE.md)**

The guide covers:
- Step-by-step deployment instructions
- Cloud Run, Cloud SQL, and Memorystore setup
- Secrets management and security
- CI/CD pipeline configuration
- Monitoring, logging, and cost optimization
- Troubleshooting and maintenance

### Quick Deployment Overview

**Recommended GCP Services:**
- **Frontend**: Cloud Storage + Cloud CDN
- **Backend API**: Cloud Run
- **AI Service**: Cloud Run
- **Database**: Cloud SQL (PostgreSQL)
- **Cache**: Memorystore (Redis)
- **Storage**: Cloud Storage

**Estimated Monthly Cost:** ~$62-142 (low traffic)

For detailed instructions, see the [GCP Deployment Guide](docs/GCP_DEPLOYMENT_GUIDE.md).

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

1. **First-time setup?** See the [New User Setup Guide](#-new-user-setup-guide) above
2. **Having issues?** Check the [Troubleshooting section](#-troubleshooting) in the setup guide
3. **Verify services:**
   - Backend: <http://localhost:3000/health>
   - AI Service: <http://localhost:8000/health>
   - Frontend: <http://localhost:8080>
4. **Check logs:** Review terminal output where services are running

## 📝 License

ISC

---

**Ready to build? Run the startup script and start creating! 🎉**
