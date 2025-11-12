@echo off
REM Script to create .env files for local development (Windows)

echo Creating .env files...

REM Backend .env
(
echo # Server Configuration
echo NODE_ENV=development
echo PORT=3000
echo API_VERSION=v1
echo.
echo # Database Configuration
echo # Using Docker Compose defaults - update if using local PostgreSQL
echo DATABASE_URL=postgresql://sourceflow_user:sourceflow_password@localhost:5432/sourceflow_db?schema=public
echo.
echo # Redis Configuration
echo # Using Docker Compose defaults - update if using local Redis
echo REDIS_HOST=localhost
echo REDIS_PORT=6379
echo REDIS_PASSWORD=
echo.
echo # JWT Configuration
echo # IMPORTANT: Generate strong random secrets for production ^(min 32 characters^)
echo # You can generate with: openssl rand -base64 32
echo JWT_SECRET=development-jwt-secret-key-change-in-production-min-32-characters-long
echo JWT_EXPIRES_IN=7d
echo JWT_REFRESH_SECRET=development-refresh-secret-key-change-in-production-min-32-characters-long
echo JWT_REFRESH_EXPIRES_IN=30d
echo.
echo # OAuth Configuration ^(Optional - for Phase 2^)
echo GOOGLE_CLIENT_ID=
echo GOOGLE_CLIENT_SECRET=
echo GITHUB_CLIENT_ID=
echo GITHUB_CLIENT_SECRET=
echo.
echo # File Storage Configuration
echo # For local development, you can use local file storage or set up S3/R2
echo STORAGE_TYPE=r2
echo AWS_REGION=us-east-1
echo AWS_ACCESS_KEY_ID=
echo AWS_SECRET_ACCESS_KEY=
echo AWS_S3_BUCKET=
echo CLOUDFLARE_R2_ACCOUNT_ID=
echo CLOUDFLARE_R2_ACCESS_KEY_ID=
echo CLOUDFLARE_R2_SECRET_ACCESS_KEY=
echo CLOUDFLARE_R2_BUCKET_NAME=
echo.
echo # AI Service Configuration
echo AI_SERVICE_URL=http://localhost:8000
echo AI_SERVICE_API_KEY=
echo.
echo # External API Keys ^(Optional - for Phase 2^)
echo # Get FRED API key from: https://fred.stlouisfed.org/docs/api/api_key.html
echo FRED_API_KEY=
echo TEXTILE_EXCHANGE_API_KEY=
echo.
echo # CORS Configuration
echo CORS_ORIGIN=http://localhost:8080
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo.
echo # Logging
echo LOG_LEVEL=info
echo LOG_FILE=logs/app.log
) > backend\.env

REM AI Service .env
(
echo # AI Service Configuration
echo # CORS origins ^(comma-separated^)
echo CORS_ORIGINS=http://localhost:3000,http://localhost:8080
echo.
echo # Google Gemini API Configuration ^(REQUIRED^)
echo # Get your API key from: https://aistudio.google.com/app/apikey
echo # Free tier limits: 30 RPM, 1M TPM, 1.5K RPD
echo GEMINI_API_KEY=your-gemini-api-key-here
echo.
echo # Performance Settings
echo MAX_CONCURRENT_REQUESTS=10
echo REQUEST_TIMEOUT=5
) > ai-service\.env

echo.
echo ✅ Created backend\.env
echo ✅ Created ai-service\.env
echo.
echo ⚠️  IMPORTANT: Update ai-service\.env with your Gemini API key!
echo    Get it from: https://aistudio.google.com/app/apikey
echo.
echo ⚠️  For production, update JWT_SECRET and JWT_REFRESH_SECRET in backend\.env
echo    Generate with: openssl rand -base64 32
echo.
pause

