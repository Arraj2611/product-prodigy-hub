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

# Validate Groq API key
if grep -q "your-groq-api-key-here" ai-service/.env 2>/dev/null; then
  echo -e "${RED}❌ GROQ_API_KEY not set in ai-service/.env${NC}"
  echo "   Please add your API key before continuing"
  exit 1
fi
echo "🐳 Starting Docker..."
cd backend && docker-compose up -d postgres redis && cd ..
echo "⏳ Waiting for database to be ready..."
sleep 5
until docker exec sourceflow-postgres pg_isready -U sourceflow_user > /dev/null 2>&1; do
  echo "   Waiting for PostgreSQL..."
  sleep 2
done
echo -e "${GREEN}✅ Database is ready${NC}"
echo "🗄️  Setting up database..."
cd backend
[ ! -d "node_modules" ] && echo "   Installing dependencies..." && npm install
npm run db:generate
npm run db:migrate || echo "   Migrations may have already been applied"
cd ..
echo "🤖 Setting up AI service..."
cd ai-service
[ ! -d "venv" ] && python3 -m venv venv
source venv/bin/activate
[ ! -f "venv/.installed" ] && pip install -r requirements.txt && touch venv/.installed
cd ..
echo "🎯 Starting services..."
mkdir -p logs

# Check frontend dependencies
if [ ! -d "node_modules" ]; then
  echo "   Installing frontend dependencies..."
  npm install
fi

# Start backend
echo "📦 Starting Backend API..."
cd backend && npm run dev > ../logs/backend.log 2>&1 & BACKEND_PID=$! && cd ..

# Start AI service
echo "🤖 Starting AI Service..."
cd ai-service && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/ai-service.log 2>&1 & AI_PID=$! && cd ..

# Wait a bit for services to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend..."
npm run dev > logs/frontend.log 2>&1 & FRONTEND_PID=$!

# Cleanup function
cleanup() {
  echo ""
  echo "🛑 Shutting down services..."
  kill $BACKEND_PID $AI_PID $FRONTEND_PID 2>/dev/null || true
  exit
}
trap cleanup SIGINT SIGTERM

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📍 Service URLs:"
echo "   Frontend:  http://localhost:8080"
echo "   Backend:   http://localhost:3000"
echo "   AI Service: http://localhost:8000"
echo ""
echo "📖 Next Steps:"
echo "   1. Open http://localhost:8080 in your browser"
echo "   2. Create an account and start using SourceFlow!"
echo ""
echo "Press Ctrl+C to stop all services"
wait
