#!/bin/bash
set -e
echo "🚀 Starting SourceFlow..."
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
command_exists() { command -v "$1" >/dev/null 2>&1; }
echo "📋 Checking prerequisites..."
if ! command_exists docker; then echo -e "${RED}❌ Docker not installed${NC}"; exit 1; fi
if ! command_exists node; then echo -e "${RED}❌ Node.js not installed${NC}"; exit 1; fi
if ! command_exists python3; then echo -e "${RED}❌ Python 3 not installed${NC}"; exit 1; fi
echo -e "${GREEN}✅ Prerequisites met${NC}"
echo "📝 Checking environment files..."
if [ ! -f "backend/.env" ]; then
  cat > backend/.env << 'ENVEOF'
NODE_ENV=development
PORT=3000
API_VERSION=v1
DATABASE_URL=postgresql://sourceflow_user:sourceflow_password@localhost:5433/sourceflow_db?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=development-jwt-secret-change-in-production-min-32-chars-long
JWT_REFRESH_SECRET=development-refresh-secret-change-in-production-min-32-chars-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:8080
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./uploads
AI_SERVICE_URL=http://localhost:8000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENVEOF
  echo -e "${GREEN}✅ Created backend/.env${NC}"
fi
if [ ! -f "ai-service/.env" ]; then
  cat > ai-service/.env << 'ENVEOF'
GROQ_API_KEY=your-groq-api-key-here
CORS_ORIGINS=http://localhost:8080,http://localhost:3000
ENVEOF
  echo -e "${YELLOW}⚠️  Please add GROQ_API_KEY to ai-service/.env${NC}"
  echo "   Get key at: https://console.groq.com/keys"
  read -p "Press Enter after adding your API key..."
fi
echo "🐳 Starting Docker..."
cd backend && docker-compose up -d postgres redis && cd ..
sleep 5
echo "🗄️  Setting up database..."
cd backend
[ ! -d "node_modules" ] && npm install
npm run db:generate
npm run db:migrate || true
cd ..
echo "🤖 Setting up AI service..."
cd ai-service
[ ! -d "venv" ] && python3 -m venv venv
source venv/bin/activate
[ ! -f "venv/.installed" ] && pip install -r requirements.txt && touch venv/.installed
cd ..
echo "🎯 Starting services..."
mkdir -p logs
cd backend && npm run dev > ../logs/backend.log 2>&1 & BACKEND_PID=$! && cd ..
cd ai-service && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/ai-service.log 2>&1 & AI_PID=$! && cd ..
sleep 3
npm run dev > logs/frontend.log 2>&1 & FRONTEND_PID=$!
echo -e "${GREEN}✅ All services started!${NC}"
echo "📍 Frontend: http://localhost:8080"
echo "📍 Backend: http://localhost:3000"
echo "📍 AI Service: http://localhost:8000"
echo "Press Ctrl+C to stop"
wait
