@echo off
echo 🔍 Verifying Local Testing Setup...
echo.

echo 📦 Prerequisites:
node --version >nul 2>&1 && echo   Node.js: ✅ || echo   Node.js: ❌ Not installed
npm --version >nul 2>&1 && echo   npm: ✅ || echo   npm: ❌ Not installed
python --version >nul 2>&1 && echo   Python: ✅ || echo   Python: ❌ Not installed
pip --version >nul 2>&1 && echo   pip: ✅ || echo   pip: ❌ Not installed
docker --version >nul 2>&1 && echo   Docker: ✅ || echo   Docker: ❌ Not installed
docker-compose --version >nul 2>&1 && echo   Docker Compose: ✅ || echo   Docker Compose: ❌ Not installed

echo.
echo 📝 Environment Files:
if exist "backend\.env" (
    echo   backend\.env: ✅
) else (
    echo   backend\.env: ❌ Missing
)

if exist "ai-service\.env" (
    echo   ai-service\.env: ✅
    findstr /C:"your-gemini-api-key-here" ai-service\.env >nul 2>&1 && (
        echo     ⚠️  WARNING: Gemini API key not set!
    ) || (
        echo     ✅ Gemini API key configured
    )
) else (
    echo   ai-service\.env: ❌ Missing
)

echo.
echo 📚 Dependencies:
if exist "node_modules" (
    echo   Frontend: ✅
) else (
    echo   Frontend: ❌ Run 'npm install'
)

if exist "backend\node_modules" (
    echo   Backend: ✅
) else (
    echo   Backend: ❌ Run 'cd backend && npm install'
)

python -c "import fastapi" >nul 2>&1 && (
    echo   AI Service: ✅
) || (
    echo   AI Service: ❌ Run 'cd ai-service && pip install -r requirements.txt'
)

echo.
echo 🐳 Docker Services:
docker ps | findstr "sourceflow-postgres" >nul 2>&1 && (
    echo   PostgreSQL: ✅ Running
) || (
    echo   PostgreSQL: ⚠️  Not running ^(start with: cd backend && docker-compose up -d postgres^)
)

docker ps | findstr "sourceflow-redis" >nul 2>&1 && (
    echo   Redis: ✅ Running
) || (
    echo   Redis: ⚠️  Not running ^(start with: cd backend && docker-compose up -d redis^)
)

echo.
echo ✅ Setup verification complete!
echo.
echo Next steps:
echo 1. Add Gemini API key to ai-service\.env
echo 2. Start databases: cd backend && docker-compose up -d postgres redis
echo 3. Setup database: cd backend && npm run db:migrate && npm run db:generate
echo 4. Start services ^(3 terminals^):
echo    - Backend: cd backend && npm run dev
echo    - AI Service: cd ai-service && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
echo    - Frontend: npm run dev
echo.
pause

