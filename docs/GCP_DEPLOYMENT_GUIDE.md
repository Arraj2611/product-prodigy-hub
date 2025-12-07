# SourceFlow - GCP Deployment Guide

Complete step-by-step guide for deploying SourceFlow to Google Cloud Platform (GCP).

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Initial Setup](#initial-setup)
5. [Database Setup](#database-setup)
6. [Cache Setup](#cache-setup)
7. [Storage Setup](#storage-setup)
8. [Secrets Management](#secrets-management)
9. [Docker Configuration](#docker-configuration)
10. [Building & Pushing Images](#building--pushing-images)
11. [Deploying Services](#deploying-services)
12. [Frontend Deployment](#frontend-deployment)
13. [Database Migrations](#database-migrations)
14. [CI/CD Pipeline](#cicd-pipeline)
15. [Environment Variables](#environment-variables)
16. [Networking & Security](#networking--security)
17. [Monitoring & Logging](#monitoring--logging)
18. [Cost Optimization](#cost-optimization)
19. [Troubleshooting](#troubleshooting)
20. [Maintenance](#maintenance)

---

## 🎯 Overview

SourceFlow is a multi-service application consisting of:
- **Frontend**: React/Vite static application
- **Backend API**: Node.js/Express REST API
- **AI Service**: Python/FastAPI service for AI-powered BOM generation
- **Database**: PostgreSQL (Cloud SQL)
- **Cache**: Redis (Memorystore)
- **Storage**: Cloud Storage for file uploads

This guide covers deploying all components to GCP using managed services.

---

## 🏗️ Architecture

### Recommended GCP Services

| Component | GCP Service | Rationale |
|-----------|-------------|-----------|
| Frontend | Cloud Storage + Cloud CDN | Cost-effective static hosting with global CDN |
| Backend API | Cloud Run | Serverless, auto-scaling, pay-per-use |
| AI Service | Cloud Run | Serverless, auto-scaling, pay-per-use |
| PostgreSQL | Cloud SQL (PostgreSQL 16) | Managed database with backups |
| Redis | Memorystore (Redis 7) | Managed cache with high availability |
| File Storage | Cloud Storage | Scalable object storage |
| Secrets | Secret Manager | Secure credential management |
| CI/CD | Cloud Build | Automated builds and deployments |
| Monitoring | Cloud Monitoring | Application performance monitoring |
| Logging | Cloud Logging | Centralized log management |

### Network Architecture

```
Internet
  ↓
Cloud CDN (Frontend)
  ↓
Cloud Storage (Static Files)
  ↓
Cloud Run (Backend API) ←→ Cloud SQL (PostgreSQL)
  ↓                          ↑
Cloud Run (AI Service)       Memorystore (Redis)
  ↓                          ↑
Secret Manager ─────────────┘
```

---

## 📦 Prerequisites

### 1. GCP Account Setup

1. Create a GCP account at [cloud.google.com](https://cloud.google.com)
2. Create a new project or select an existing one
3. Enable billing (required for Cloud SQL, Memorystore, etc.)

### 2. Install GCP CLI

**macOS:**
```bash
brew install google-cloud-sdk
```

**Windows:**
Download from [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 3. Authenticate and Configure

```bash
# Login to GCP
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Verify configuration
gcloud config list
```

### 4. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  storage-component.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com \
  vpcaccess.googleapis.com
```

### 5. Install Docker (for local testing)

Ensure Docker is installed for building images locally (optional):
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## 🗄️ Database Setup

### Step 1: Create Cloud SQL Instance

```bash
# Create PostgreSQL 16 instance
gcloud sql instances create sourceflow-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_ROOT_PASSWORD \
  --storage-type=SSD \
  --storage-size=20GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --maintenance-release-channel=production \
  --deletion-protection
```

**Note:** For production, use a higher tier:
- `db-f1-micro`: Development/Testing (~$7/month)
- `db-g1-small`: Small production (~$25/month)
- `db-n1-standard-1`: Medium production (~$50/month)

### Step 2: Create Database and User

```bash
# Create database
gcloud sql databases create sourceflow_db \
  --instance=sourceflow-db

# Create application user
gcloud sql users create sourceflow_user \
  --instance=sourceflow-db \
  --password=YOUR_SECURE_PASSWORD
```

### Step 3: Get Connection Details

```bash
# Get connection name (needed for Cloud Run)
gcloud sql instances describe sourceflow-db \
  --format="value(connectionName)"

# Output format: PROJECT_ID:REGION:sourceflow-db
# Save this value for later use

# Get public IP (if needed)
gcloud sql instances describe sourceflow-db \
  --format="value(ipAddresses[0].ipAddress)"
```

### Step 4: Configure Private IP (Recommended for Production)

```bash
# Allocate IP range for private services
gcloud compute addresses create google-managed-services-sourceflow \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network=default

# Create VPC peering
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-sourceflow \
  --network=default

# Update instance to use private IP
gcloud sql instances patch sourceflow-db \
  --network=default \
  --no-assign-ip
```

---

## 🔴 Cache Setup (Memorystore Redis)

### Step 1: Create Redis Instance

```bash
# Create Redis instance
gcloud redis instances create sourceflow-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0 \
  --tier=basic \
  --network=default
```

**Tier Options:**
- `basic`: Single node, lower cost (~$30/month for 1GB)
- `standard_ha`: High availability, replication (~$60/month for 1GB)

### Step 2: Get Redis Connection Details

```bash
# Get Redis host IP
gcloud redis instances describe sourceflow-redis \
  --region=us-central1 \
  --format="value(host)"

# Get Redis port (usually 6379)
gcloud redis instances describe sourceflow-redis \
  --region=us-central1 \
  --format="value(port)"
```

**Note:** For Cloud Run to access Memorystore, you'll need a VPC connector (see Networking section).

---

## 📦 Storage Setup

### Step 1: Create Storage Buckets

```bash
# Create bucket for file uploads
gsutil mb -l us-central1 -c STANDARD \
  gs://sourceflow-uploads-YOUR_PROJECT_ID

# Create bucket for frontend static files
gsutil mb -l us-central1 -c STANDARD \
  gs://sourceflow-frontend-YOUR_PROJECT_ID

# Enable versioning (optional, for backup)
gsutil versioning set on gs://sourceflow-uploads-YOUR_PROJECT_ID
```

### Step 2: Configure CORS (for direct uploads)

Create `cors.json`:
```json
[
  {
    "origin": ["https://your-frontend-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS:
```bash
gsutil cors set cors.json gs://sourceflow-uploads-YOUR_PROJECT_ID
```

### Step 3: Set Up IAM Permissions

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create sourceflow-storage \
  --display-name="SourceFlow Storage Service Account"

# Grant storage access
gsutil iam ch serviceAccount:sourceflow-storage@YOUR_PROJECT_ID.iam.gserviceaccount.com:objectAdmin \
  gs://sourceflow-uploads-YOUR_PROJECT_ID
```

---

## 🔐 Secrets Management

### Step 1: Store Secrets in Secret Manager

```bash
# JWT Secret
echo -n "your-super-secret-jwt-key-minimum-32-characters-long" | \
  gcloud secrets create jwt-secret --data-file=-

# JWT Refresh Secret
echo -n "your-super-secret-refresh-key-minimum-32-characters-long" | \
  gcloud secrets create jwt-refresh-secret --data-file=-

# Groq API Key
echo -n "your-groq-api-key" | \
  gcloud secrets create groq-api-key --data-file=-

# Database Password
echo -n "your-database-password" | \
  gcloud secrets create db-password --data-file=-
```

### Step 2: Grant Cloud Run Access to Secrets

```bash
# Get Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant secret accessor role
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jwt-refresh-secret \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding groq-api-key \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 3: Update Secrets (if needed)

```bash
# Update a secret
echo -n "new-secret-value" | \
  gcloud secrets versions add jwt-secret --data-file=-
```

---

## 🐳 Docker Configuration

### Backend Dockerfile Updates

The backend Dockerfile needs to include `prisma.config.ts`:

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./  # Required for Prisma 7

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts  # Required for Prisma 7

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/server.js"]
```

### AI Service Dockerfile

The AI service Dockerfile is already configured correctly:

```dockerfile
# ai-service/Dockerfile (already correct)
FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile (Optional - for Cloud Run)

If deploying frontend to Cloud Run instead of Cloud Storage:

```dockerfile
# Dockerfile (root directory)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 🏗️ Building & Pushing Images

### Option 1: Using Cloud Build (Recommended)

```bash
# Build and push backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/sourceflow-backend ./backend

# Build and push AI service
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/sourceflow-ai-service ./ai-service

# Build and push frontend (if using Cloud Run)
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/sourceflow-frontend .
```

### Option 2: Using Docker + gcloud

```bash
# Authenticate Docker
gcloud auth configure-docker

# Build locally
cd backend
docker build -t gcr.io/YOUR_PROJECT_ID/sourceflow-backend .
docker push gcr.io/YOUR_PROJECT_ID/sourceflow-backend

cd ../ai-service
docker build -t gcr.io/YOUR_PROJECT_ID/sourceflow-ai-service .
docker push gcr.io/YOUR_PROJECT_ID/sourceflow-ai-service
```

### Verify Images

```bash
# List images
gcloud container images list

# View image details
gcloud container images describe gcr.io/YOUR_PROJECT_ID/sourceflow-backend
```

---

## 🚀 Deploying Services

### Deploy Backend API

```bash
# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe sourceflow-db \
  --format="value(connectionName)")

# Get Redis host
REDIS_HOST=$(gcloud redis instances describe sourceflow-redis \
  --region=us-central1 \
  --format="value(host)")

# Deploy backend
gcloud run deploy sourceflow-backend \
  --image gcr.io/YOUR_PROJECT_ID/sourceflow-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances ${CONNECTION_NAME} \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="PORT=3000" \
  --set-env-vars="DATABASE_URL=postgresql://sourceflow_user:PASSWORD@/sourceflow_db?host=/cloudsql/${CONNECTION_NAME}" \
  --set-env-vars="REDIS_HOST=${REDIS_HOST}" \
  --set-env-vars="REDIS_PORT=6379" \
  --set-secrets="JWT_SECRET=jwt-secret:latest,JWT_REFRESH_SECRET=jwt-refresh-secret:latest" \
  --set-env-vars="CORS_ORIGIN=https://your-frontend-domain.com" \
  --set-env-vars="AI_SERVICE_URL=https://sourceflow-ai-service-xxx.run.app" \
  --set-env-vars="STORAGE_TYPE=s3" \
  --set-env-vars="AWS_S3_BUCKET=sourceflow-uploads-YOUR_PROJECT_ID" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 80 \
  --max-instances 10
```

**Note:** Replace `PASSWORD` with your actual database password or use Secret Manager.

### Deploy AI Service

```bash
# Get backend URL (after deploying backend)
BACKEND_URL=$(gcloud run services describe sourceflow-backend \
  --region us-central1 \
  --format="value(status.url)")

# Deploy AI service
gcloud run deploy sourceflow-ai-service \
  --image gcr.io/YOUR_PROJECT_ID/sourceflow-ai-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GROQ_API_KEY=groq-api-key:latest" \
  --set-env-vars="CORS_ORIGINS=https://your-frontend-domain.com,${BACKEND_URL}" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 80
```

### Get Service URLs

```bash
# Backend URL
gcloud run services describe sourceflow-backend \
  --region us-central1 \
  --format="value(status.url)"

# AI Service URL
gcloud run services describe sourceflow-ai-service \
  --region us-central1 \
  --format="value(status.url)"
```

---

## 🌐 Frontend Deployment

### Option 1: Cloud Storage + Cloud CDN (Recommended)

#### Step 1: Build Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output will be in ./dist directory
```

#### Step 2: Upload to Cloud Storage

```bash
# Upload files
gsutil -m rsync -r -d dist/ gs://sourceflow-frontend-YOUR_PROJECT_ID/

# Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://sourceflow-frontend-YOUR_PROJECT_ID

# Set default index file
gsutil web set -m index.html -e 404.html \
  gs://sourceflow-frontend-YOUR_PROJECT_ID
```

#### Step 3: Configure Custom Domain (Optional)

```bash
# Create load balancer
gcloud compute backend-buckets create sourceflow-frontend-backend \
  --gcs-bucket-name=sourceflow-frontend-YOUR_PROJECT_ID

# Create URL map
gcloud compute url-maps create sourceflow-frontend-map \
  --default-backend-bucket=sourceflow-frontend-backend

# Create HTTPS proxy
gcloud compute target-https-proxies create sourceflow-frontend-proxy \
  --url-map=sourceflow-frontend-map \
  --ssl-certificates=YOUR_SSL_CERT_NAME

# Create forwarding rule
gcloud compute forwarding-rules create sourceflow-frontend-https \
  --global \
  --target-https-proxy=sourceflow-frontend-proxy \
  --ports=443
```

### Option 2: Cloud Run (Alternative)

```bash
# Deploy frontend to Cloud Run
gcloud run deploy sourceflow-frontend \
  --image gcr.io/YOUR_PROJECT_ID/sourceflow-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="VITE_API_URL=https://sourceflow-backend-xxx.run.app" \
  --memory 256Mi \
  --cpu 1
```

### Update Frontend Environment Variables

Before building, create `.env.production`:

```env
VITE_API_URL=https://sourceflow-backend-xxx.run.app
VITE_AI_SERVICE_URL=https://sourceflow-ai-service-xxx.run.app
```

---

## 🗄️ Database Migrations

### Option 1: Using Cloud Run Job (Recommended)

```bash
# Create migration job
gcloud run jobs create sourceflow-migrate \
  --image gcr.io/YOUR_PROJECT_ID/sourceflow-backend \
  --region us-central1 \
  --add-cloudsql-instances ${CONNECTION_NAME} \
  --set-env-vars="DATABASE_URL=postgresql://sourceflow_user:PASSWORD@/sourceflow_db?host=/cloudsql/${CONNECTION_NAME}" \
  --set-env-vars="NODE_ENV=production" \
  --command="npm,run,db:push" \
  --max-retries 3 \
  --task-timeout 600

# Execute migration
gcloud run jobs execute sourceflow-migrate --region us-central1

# Check logs
gcloud run jobs executions describe sourceflow-migrate-xxx \
  --region us-central1
```

### Option 2: Using Cloud SQL Proxy (Local)

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.windows.amd64

# Run proxy
./cloud-sql-proxy ${CONNECTION_NAME}

# In another terminal, run migrations
cd backend
export DATABASE_URL="postgresql://sourceflow_user:PASSWORD@localhost:5432/sourceflow_db"
npm run db:push
```

### Option 3: Using Cloud Shell

```bash
# Open Cloud Shell
# Clone repository
git clone YOUR_REPO_URL
cd product-prodigy-hub/backend

# Install dependencies
npm install

# Set DATABASE_URL
export DATABASE_URL="postgresql://sourceflow_user:PASSWORD@/sourceflow_db?host=/cloudsql/${CONNECTION_NAME}"

# Run migrations
npm run db:push
```

---

## 🔄 CI/CD Pipeline

### Create cloudbuild.yaml

Create `cloudbuild.yaml` in the root directory:

```yaml
steps:
  # Build backend image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/sourceflow-backend:$SHORT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/sourceflow-backend:latest'
      - './backend'
    id: 'build-backend'

  # Build AI service image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/sourceflow-ai-service:$SHORT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/sourceflow-ai-service:latest'
      - './ai-service'
    id: 'build-ai-service'

  # Push backend image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/sourceflow-backend:$SHORT_SHA']
    waitFor: ['build-backend']

  # Push backend latest
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/sourceflow-backend:latest']
    waitFor: ['build-backend']

  # Push AI service image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/sourceflow-ai-service:$SHORT_SHA']
    waitFor: ['build-ai-service']

  # Push AI service latest
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/sourceflow-ai-service:latest']
    waitFor: ['build-ai-service']

  # Deploy backend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'sourceflow-backend'
      - '--image=gcr.io/$PROJECT_ID/sourceflow-backend:$SHORT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
    waitFor: ['build-backend']

  # Deploy AI service
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'sourceflow-ai-service'
      - '--image=gcr.io/$PROJECT_ID/sourceflow-ai-service:$SHORT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
    waitFor: ['build-ai-service']

images:
  - 'gcr.io/$PROJECT_ID/sourceflow-backend:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/sourceflow-backend:latest'
  - 'gcr.io/$PROJECT_ID/sourceflow-ai-service:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/sourceflow-ai-service:latest'

options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY

timeout: '1200s'
```

### Set Up GitHub Actions Trigger

1. Connect repository to Cloud Build:
```bash
gcloud builds triggers create github \
  --name="sourceflow-deploy" \
  --repo-name="YOUR_REPO_NAME" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

2. Or use manual trigger:
```bash
gcloud builds submit --config=cloudbuild.yaml
```

---

## 🔧 Environment Variables

### Backend Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database (Cloud SQL)
DATABASE_URL=postgresql://sourceflow_user:PASSWORD@/sourceflow_db?host=/cloudsql/PROJECT_ID:REGION:sourceflow-db

# Redis (Memorystore)
REDIS_HOST=10.x.x.x  # Internal IP from Memorystore
REDIS_PORT=6379

# JWT (from Secret Manager)
JWT_SECRET=...  # From Secret Manager
JWT_REFRESH_SECRET=...  # From Secret Manager
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# AI Service
AI_SERVICE_URL=https://sourceflow-ai-service-xxx.run.app

# Storage
STORAGE_TYPE=s3  # Use Cloud Storage
AWS_REGION=us-central1
AWS_ACCESS_KEY_ID=...  # Service account key
AWS_SECRET_ACCESS_KEY=...  # Service account secret
AWS_S3_BUCKET=sourceflow-uploads-YOUR_PROJECT_ID

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### AI Service Environment Variables

```env
# Groq API (from Secret Manager)
GROQ_API_KEY=...  # From Secret Manager

# CORS
CORS_ORIGINS=https://your-frontend-domain.com,https://sourceflow-backend-xxx.run.app

# Environment
ENV=production
DEBUG=false
```

---

## 🔒 Networking & Security

### VPC Connector for Memorystore Access

```bash
# Create VPC connector
gcloud compute networks vpc-access connectors create sourceflow-connector \
  --region=us-central1 \
  --subnet=default \
  --subnet-project=YOUR_PROJECT_ID \
  --min-instances=2 \
  --max-instances=3 \
  --machine-type=e2-micro

# Update Cloud Run services to use connector
gcloud run services update sourceflow-backend \
  --region=us-central1 \
  --vpc-connector=sourceflow-connector \
  --vpc-egress=private-ranges-only
```

### Enable Cloud Run Authentication (Optional)

```bash
# Remove public access
gcloud run services update sourceflow-backend \
  --region=us-central1 \
  --no-allow-unauthenticated

# Grant access to specific service account
gcloud run services add-iam-policy-binding sourceflow-backend \
  --region=us-central1 \
  --member="serviceAccount:frontend-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
```

### Cloud Armor (DDoS Protection)

```bash
# Create security policy
gcloud compute security-policies create sourceflow-policy \
  --description="SourceFlow security policy"

# Add rate limiting rule
gcloud compute security-policies rules create 1000 \
  --security-policy=sourceflow-policy \
  --expression="true" \
  --action=rate-based-ban \
  --rate-limit-threshold-count=100 \
  --rate-limit-threshold-interval-sec=60 \
  --ban-duration-sec=600 \
  --conform-action=allow \
  --exceed-action=deny-403 \
  --enforce-on-key=IP
```

### SSL/TLS Certificates

```bash
# Create managed SSL certificate
gcloud compute ssl-certificates create sourceflow-ssl-cert \
  --domains=your-domain.com,www.your-domain.com

# Use with load balancer (see Frontend Deployment section)
```

---

## 📊 Monitoring & Logging

### Cloud Monitoring Setup

```bash
# Enable monitoring API
gcloud services enable monitoring.googleapis.com

# View metrics in Console
# https://console.cloud.google.com/monitoring
```

### Key Metrics to Monitor

1. **Cloud Run:**
   - Request count
   - Request latency
   - Error rate
   - Instance count
   - CPU/Memory utilization

2. **Cloud SQL:**
   - CPU utilization
   - Memory usage
   - Disk I/O
   - Connection count
   - Query performance

3. **Memorystore:**
   - Memory usage
   - Hit rate
   - Evictions
   - Connections

### Set Up Alerts

```bash
# Create notification channel (email)
gcloud alpha monitoring channels create \
  --display-name="SourceFlow Alerts" \
  --type=email \
  --channel-labels=email_address=your-email@example.com

# Create alert policy (example: high error rate)
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

### View Logs

```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=sourceflow-backend" \
  --limit 50 \
  --format json

# AI service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=sourceflow-ai-service" \
  --limit 50 \
  --format json
```

---

## 💰 Cost Optimization

### Estimated Monthly Costs

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Cloud Run (Backend) | Pay-per-use | $10-50 |
| Cloud Run (AI Service) | Pay-per-use | $10-50 |
| Cloud SQL | db-f1-micro | ~$7 |
| Memorystore | 1GB basic | ~$30 |
| Cloud Storage | 10GB | ~$0.20 |
| Cloud CDN | 50GB transfer | ~$5 |
| **Total (Low Traffic)** | | **~$62-142** |
| **Total (Medium Traffic)** | | **~$150-300** |

### Cost Optimization Tips

1. **Cloud Run:**
   - Set `min-instances=0` for non-critical services
   - Use appropriate memory/CPU allocation
   - Enable request-based scaling

2. **Cloud SQL:**
   - Use `db-f1-micro` for development
   - Enable automatic storage increase
   - Schedule backups during off-peak hours

3. **Memorystore:**
   - Start with 1GB, scale as needed
   - Use `basic` tier for non-critical workloads

4. **Cloud Storage:**
   - Use lifecycle policies to move old files to cheaper storage classes
   - Enable object versioning only if needed

### Budget Alerts

```bash
# Create budget
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="SourceFlow Budget" \
  --budget-amount=200USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Cloud Run Can't Connect to Cloud SQL

**Problem:** Connection timeout or permission denied

**Solution:**
```bash
# Verify Cloud SQL connection name
gcloud sql instances describe sourceflow-db --format="value(connectionName)"

# Ensure --add-cloudsql-instances is set correctly
gcloud run services describe sourceflow-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"

# Check Cloud SQL proxy is enabled
gcloud sql instances describe sourceflow-db \
  --format="value(settings.ipConfiguration.authorizedNetworks)"
```

#### 2. Memorystore Connection Issues

**Problem:** Can't connect to Redis from Cloud Run

**Solution:**
```bash
# Verify VPC connector is attached
gcloud run services describe sourceflow-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"

# Check VPC connector status
gcloud compute networks vpc-access connectors describe sourceflow-connector \
  --region=us-central1

# Verify Redis host IP
gcloud redis instances describe sourceflow-redis \
  --region=us-central1 \
  --format="value(host)"
```

#### 3. Secret Manager Access Denied

**Problem:** Cloud Run can't access secrets

**Solution:**
```bash
# Grant secret accessor role
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

#### 4. Prisma Migration Failures

**Problem:** Database migrations fail in Cloud Run job

**Solution:**
```bash
# Check job logs
gcloud run jobs executions describe JOB_EXECUTION_NAME \
  --region=us-central1

# Verify DATABASE_URL format
# Should be: postgresql://user:pass@/db?host=/cloudsql/CONNECTION_NAME

# Test connection locally with Cloud SQL Proxy
```

#### 5. High Latency

**Problem:** Slow response times

**Solution:**
- Check Cloud Run region matches database region
- Verify VPC connector is in same region
- Review Cloud SQL performance metrics
- Consider increasing Cloud Run memory/CPU
- Enable Cloud CDN for static assets

### Debug Commands

```bash
# View service details
gcloud run services describe sourceflow-backend --region=us-central1

# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=sourceflow-backend" \
  --limit 100 \
  --format="table(timestamp,textPayload)"

# Test service health
curl https://sourceflow-backend-xxx.run.app/health

# Check service status
gcloud run services list --region=us-central1
```

---

## 🔧 Maintenance

### Regular Tasks

#### Weekly
- Review Cloud Run logs for errors
- Check Cloud SQL performance metrics
- Monitor costs and usage

#### Monthly
- Review and rotate secrets
- Update dependencies
- Review and optimize Cloud SQL queries
- Check storage usage and clean up old files

#### Quarterly
- Review and update security policies
- Audit IAM permissions
- Review and optimize costs
- Update GCP services to latest versions

### Backup Strategy

#### Cloud SQL Backups
```bash
# Automatic backups are enabled by default
# Manual backup
gcloud sql backups create --instance=sourceflow-db

# List backups
gcloud sql backups list --instance=sourceflow-db

# Restore from backup
gcloud sql backups restore BACKUP_ID --backup-instance=sourceflow-db
```

#### Cloud Storage Backups
```bash
# Enable versioning (already done)
# Set lifecycle policy for old versions
gsutil lifecycle set lifecycle.json gs://sourceflow-uploads-YOUR_PROJECT_ID
```

### Updates and Upgrades

```bash
# Update Cloud Run service
gcloud run services update sourceflow-backend \
  --region=us-central1 \
  --image=gcr.io/YOUR_PROJECT_ID/sourceflow-backend:NEW_TAG

# Update Cloud SQL (maintenance window)
gcloud sql instances patch sourceflow-db \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04
```

---

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Memorystore Documentation](https://cloud.google.com/memorystore/docs)
- [Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)

---

## ✅ Deployment Checklist

- [ ] GCP project created and billing enabled
- [ ] Required APIs enabled
- [ ] Cloud SQL instance created and configured
- [ ] Memorystore Redis instance created
- [ ] Cloud Storage buckets created
- [ ] Secrets stored in Secret Manager
- [ ] IAM permissions configured
- [ ] Docker images built and pushed
- [ ] Backend deployed to Cloud Run
- [ ] AI service deployed to Cloud Run
- [ ] Frontend deployed to Cloud Storage/CDN
- [ ] Database migrations executed
- [ ] Environment variables configured
- [ ] VPC connector created (if using Memorystore)
- [ ] Custom domain configured (optional)
- [ ] SSL certificates configured (optional)
- [ ] Monitoring and alerts set up
- [ ] CI/CD pipeline configured
- [ ] Documentation updated with production URLs

---

## 🎉 Next Steps

After deployment:

1. **Test all endpoints** - Verify API functionality
2. **Monitor performance** - Set up dashboards
3. **Set up alerts** - Configure error and performance alerts
4. **Optimize costs** - Review and adjust resource allocation
5. **Document URLs** - Update README with production URLs
6. **Set up staging** - Create separate staging environment
7. **Enable monitoring** - Set up comprehensive monitoring
8. **Security audit** - Review security settings and permissions

---

**Need Help?** Check the [Troubleshooting](#-troubleshooting) section or review GCP documentation.

**Last Updated:** 2025-01-07

