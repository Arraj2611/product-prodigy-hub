@echo off
REM SourceFlow Local Development Startup Script for Windows
REM This script starts all required services for local development

echo 🚀 Starting SourceFlow Local Development Environment...
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop.
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 20+.
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.11+.
    exit /b 1
)

echo ✅ All prerequisites met
echo.

REM Check for .env files
echo 📝 Checking environment files...

if not exist "backend\.env" (
    echo ⚠️  backend\.env not found. Creating from template...
    (
        echo NODE_ENV=development
        echo PORT=3000
        echo API_VERSION=v1
        echo DATABASE_URL=postgresql://sourceflow_user:sourceflow_password@localhost:5433/sourceflow_db?schema=public
        echo REDIS_HOST=localhost
        echo REDIS_PORT=6379
        echo JWT_SECRET=development-jwt-secret-change-in-production-min-32-chars-long
        echo JWT_REFRESH_SECRET=development-refresh-secret-change-in-production-min-32-chars-long
        echo JWT_EXPIRES_IN=7d
        echo JWT_REFRESH_EXPIRES_IN=30d
        echo CORS_ORIGIN=http://localhost:8080
        echo STORAGE_TYPE=local
        echo STORAGE_LOCAL_PATH=./uploads
        echo AI_SERVICE_URL=http://localhost:8000
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
    ) > backend\.env
    echo ✅ Created backend\.env
)

if not exist "ai-service\.env" (
    echo ⚠️  ai-service\.env not found. Creating template...
    (
        echo GROQ_API_KEY=your-groq-api-key-here
        echo CORS_ORIGINS=http://localhost:8080,http://localhost:3000
    ) > ai-service\.env
    echo ⚠️  IMPORTANT: Please add your GROQ_API_KEY to ai-service\.env
    echo    Get your free API key at: https://console.groq.com/keys
    echo    Open ai-service\.env in a text editor and replace "your-groq-api-key-here"
    echo.
    pause
)

REM Validate Groq API key
findstr /C:"your-groq-api-key-here" ai-service\.env >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ GROQ_API_KEY not set in ai-service\.env
    echo    Please add your API key before continuing
    pause
    exit /b 1
)

echo.

REM Start Docker services
echo 🐳 Starting Docker services (PostgreSQL ^& Redis)...
cd backend
docker-compose up -d postgres redis
cd ..

REM Wait for database
echo ⏳ Waiting for database to be ready...
timeout /t 5 /nobreak >nul

REM Check if database is ready
:wait_db
docker exec sourceflow-postgres pg_isready -U sourceflow_user >nul 2>&1
if %errorlevel% neq 0 (
    echo    Waiting for PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto wait_db
)

echo ✅ Database is ready
echo.

REM Setup backend
echo 🗄️  Setting up database schema...
cd backend
if not exist "node_modules" (
    echo    Installing backend dependencies...
    call npm install
)

echo    Generating Prisma client...
call npm run db:generate

echo    Syncing database schema...
call npm run db:push
if %errorlevel% neq 0 (
    echo ⚠️  Database push failed. This might be a connection issue.
    echo    Please check that Docker is running and database is accessible.
)
cd ..

echo ✅ Database setup complete
echo.

REM Setup AI service
echo 🤖 Setting up AI service...
cd ai-service

REM Check for virtual environment
if not exist "venv" (
    echo    Creating Python virtual environment...
    python -m venv venv
)

REM Install dependencies
if not exist "venv\.installed" (
    echo    Installing Python dependencies...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    echo. > venv\.installed
)

cd ..

echo.

REM Create logs directory
if not exist "logs" mkdir logs

REM Check frontend dependencies
if not exist "node_modules" (
    echo    Installing frontend dependencies...
    call npm install
)

REM Start services in separate windows
echo 🎯 Starting services...
echo.

echo 📦 Starting Backend API (port 3000)...
start "SourceFlow Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo 🤖 Starting AI Service (port 8000)...
start "SourceFlow AI Service" cmd /k "cd ai-service && venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo 🎨 Starting Frontend (port 5173)...
start "SourceFlow Frontend" cmd /k "npm run dev"

echo.
echo ✅ All services started!
echo.
echo 📍 Service URLs:
echo    Frontend:  http://localhost:8080
echo    Backend:   http://localhost:3000
echo    AI Service: http://localhost:8000
echo.
echo 📊 Health Checks:
echo    Backend:   curl http://localhost:3000/health
echo    AI Service: curl http://localhost:8000/health
echo.
echo ⚠️  Each service is running in a separate window.
echo    Close the windows or press Ctrl+C in each to stop.
echo.
echo 📖 Next Steps:
echo    1. Open http://localhost:8080 in your browser
echo    2. Create an account and start using SourceFlow!
echo.
pause

