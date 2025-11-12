#!/bin/bash

echo "🔍 Verifying Local Testing Setup..."
echo ""

# Check prerequisites
echo "📦 Prerequisites:"
echo -n "  Node.js: "
node --version 2>/dev/null && echo "✅" || echo "❌ Not installed"

echo -n "  npm: "
npm --version 2>/dev/null && echo "✅" || echo "❌ Not installed"

echo -n "  Python: "
python --version 2>/dev/null && echo "✅" || echo "❌ Not installed"

echo -n "  pip: "
pip --version 2>/dev/null && echo "✅" || echo "❌ Not installed"

echo -n "  Docker: "
docker --version 2>/dev/null && echo "✅" || echo "❌ Not installed"

echo -n "  Docker Compose: "
docker-compose --version 2>/dev/null && echo "✅" || echo "❌ Not installed"

echo ""

# Check environment files
echo "📝 Environment Files:"
if [ -f "backend/.env" ]; then
    echo "  backend/.env: ✅"
else
    echo "  backend/.env: ❌ Missing"
fi

if [ -f "ai-service/.env" ]; then
    echo "  ai-service/.env: ✅"
    if grep -q "your-gemini-api-key-here" ai-service/.env 2>/dev/null; then
        echo "    ⚠️  WARNING: Gemini API key not set!"
    else
        echo "    ✅ Gemini API key configured"
    fi
else
    echo "  ai-service/.env: ❌ Missing"
fi

echo ""

# Check dependencies
echo "📚 Dependencies:"
if [ -d "node_modules" ]; then
    echo "  Frontend: ✅"
else
    echo "  Frontend: ❌ Run 'npm install'"
fi

if [ -d "backend/node_modules" ]; then
    echo "  Backend: ✅"
else
    echo "  Backend: ❌ Run 'cd backend && npm install'"
fi

if python -c "import fastapi" 2>/dev/null; then
    echo "  AI Service: ✅"
else
    echo "  AI Service: ❌ Run 'cd ai-service && pip install -r requirements.txt'"
fi

echo ""

# Check Docker services
echo "🐳 Docker Services:"
if docker ps | grep -q "sourceflow-postgres"; then
    echo "  PostgreSQL: ✅ Running"
else
    echo "  PostgreSQL: ⚠️  Not running (start with: cd backend && docker-compose up -d postgres)"
fi

if docker ps | grep -q "sourceflow-redis"; then
    echo "  Redis: ✅ Running"
else
    echo "  Redis: ⚠️  Not running (start with: cd backend && docker-compose up -d redis)"
fi

echo ""
echo "✅ Setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Add Gemini API key to ai-service/.env"
echo "2. Start databases: cd backend && docker-compose up -d postgres redis"
echo "3. Setup database: cd backend && npm run db:migrate && npm run db:generate"
echo "4. Start services (3 terminals):"
echo "   - Backend: cd backend && npm run dev"
echo "   - AI Service: cd ai-service && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo "   - Frontend: npm run dev"

