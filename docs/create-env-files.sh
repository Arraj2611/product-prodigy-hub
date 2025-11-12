#!/bin/bash

# Script to create .env files for local development

echo "Creating .env files..."

# Backend .env
cat > backend/.env << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database Configuration
# Using Docker Compose defaults - update if using local PostgreSQL
DATABASE_URL=postgresql://sourceflow_user:sourceflow_password@localhost:5432/sourceflow_db?schema=public

# Redis Configuration
# Using Docker Compose defaults - update if using local Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
# IMPORTANT: Generate strong random secrets for production (min 32 characters)
# You can generate with: openssl rand -base64 32
JWT_SECRET=development-jwt-secret-key-change-in-production-min-32-characters-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=development-refresh-secret-key-change-in-production-min-32-characters-long
JWT_REFRESH_EXPIRES_IN=30d

# OAuth Configuration (Optional - for Phase 2)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# File Storage Configuration
# For local development, you can use local file storage or set up S3/R2
STORAGE_TYPE=r2
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=

# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_API_KEY=

# External API Keys (Optional - for Phase 2)
# Get FRED API key from: https://fred.stlouisfed.org/docs/api/api_key.html
FRED_API_KEY=
TEXTILE_EXCHANGE_API_KEY=

# CORS Configuration
CORS_ORIGIN=http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
EOF

# AI Service .env
cat > ai-service/.env << 'EOF'
# AI Service Configuration
# CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Google Gemini API Configuration (REQUIRED)
# Get your API key from: https://aistudio.google.com/app/apikey
# Free tier limits: 30 RPM, 1M TPM, 1.5K RPD
GEMINI_API_KEY=your-gemini-api-key-here

# Performance Settings
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT=5
EOF

echo "✅ Created backend/.env"
echo "✅ Created ai-service/.env"
echo ""
echo "⚠️  IMPORTANT: Update ai-service/.env with your Gemini API key!"
echo "   Get it from: https://aistudio.google.com/app/apikey"
echo ""
echo "⚠️  For production, update JWT_SECRET and JWT_REFRESH_SECRET in backend/.env"
echo "   Generate with: openssl rand -base64 32"

