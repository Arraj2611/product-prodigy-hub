# SourceFlow - AI-Powered Creation-to-Commerce Platform

An intelligent platform that transforms product ideas into actionable manufacturing plans. Upload product images, and SourceFlow automatically generates Bills of Materials (BOMs), finds suppliers, analyzes markets, and creates marketing campaigns.

## 🚀 Getting Started

**New to SourceFlow?** 👉 **[Start here: Complete Setup Guide](NEW_USER_STEPS.md)**

This guide walks you through everything step-by-step, from installing prerequisites to running your first product analysis.

## ⚡ Quick Start

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Groq API Key** (Free) - [Get it here](https://console.groq.com/keys)

> 📖 **For detailed installation instructions, see [NEW_USER_STEPS.md](NEW_USER_STEPS.md)**

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

> 📖 **For detailed setup instructions and troubleshooting, see [NEW_USER_STEPS.md](NEW_USER_STEPS.md)**

**Manual Start:** See [NEW_USER_STEPS.md](NEW_USER_STEPS.md) for manual service startup instructions.

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

> 📖 **For detailed first-time usage guide, see [NEW_USER_STEPS.md](NEW_USER_STEPS.md)**

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

> 📖 **For comprehensive troubleshooting guide with solutions to common issues, see [NEW_USER_STEPS.md](NEW_USER_STEPS.md#-troubleshooting)**

**Quick fixes:**

- **Database issues:** `cd backend && docker-compose down && docker-compose up -d postgres redis`
- **API key not set:** Add your Groq API key to `ai-service/.env`
- **Port conflicts:** See [NEW_USER_STEPS.md](NEW_USER_STEPS.md#problem-port-already-in-use)
- **Service health checks:**
  ```bash
  curl http://localhost:3000/health  # Backend
  curl http://localhost:8000/health  # AI Service
  ```

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

1. **First-time setup?** Check [NEW_USER_STEPS.md](NEW_USER_STEPS.md) for detailed instructions
2. **Having issues?** See the [Troubleshooting section](NEW_USER_STEPS.md#-troubleshooting) in NEW_USER_STEPS.md
3. **Verify services:**
   - Backend: <http://localhost:3000/health>
   - AI Service: <http://localhost:8000/health>
   - Frontend: <http://localhost:8080>
4. **Check logs:** Review terminal output where services are running

## 📝 License

ISC

---

**Ready to build? Run the startup script and start creating! 🎉**
