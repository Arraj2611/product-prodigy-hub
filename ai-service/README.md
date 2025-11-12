# SourceFlow AI Service

Python FastAPI service for AI-powered BOM generation using **Google Gemini API (Free Tier)**.

## Features

- **Google Gemini 2.0 Flash-Lite** for multimodal analysis (images + text)
- **Free Tier**: 30 requests per minute, 1M tokens per month, 1.5K requests per day
- Material classification from product images
- Dimensional analysis and quantity calculation
- Multi-level BOM generation
- Target: <5 seconds processing time

## Setup

### 1. Get Gemini API Key (Free)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```
GEMINI_API_KEY=your-api-key-here
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

### 4. Run the Service

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Or with auto-reload for development:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The service will be available at `http://localhost:8000`

## API Endpoints

- `GET /health` - Health check
- `POST /api/v1/ai/generate-bom` - Generate BOM from images

### Generate BOM Example

```bash
curl -X POST "http://localhost:8000/api/v1/ai/generate-bom" \
  -F "images=@product1.jpg" \
  -F "images=@product2.jpg" \
  -F "description=Premium denim jacket with metal buttons" \
  -F "yield_buffer=10.0"
```

## Free Tier Limits

- **Model**: `gemini-2.0-flash-lite`
- **Rate Limits**:
  - 30 requests per minute (RPM)
  - 1,000,000 tokens per month (TPM)
  - 1,500 requests per day (RPD)

The service automatically uses the free tier model. No credit card required!

## Docker

```bash
docker build -t sourceflow-ai-service .
docker run -p 8000:8000 --env-file .env sourceflow-ai-service
```

## Local Development Requirements

To run locally, you only need:

1. **Python 3.11+**
2. **Gemini API Key** (free from Google AI Studio)
3. **Environment file** (`.env`) with your API key

That's it! No GPU, no heavy ML models, no cloud setup required.

## Troubleshooting

### "GEMINI_API_KEY not set"
- Make sure you've created a `.env` file
- Verify the API key is correct
- Check that the `.env` file is in the `ai-service` directory

### Rate Limit Errors
- Free tier has limits: 30 RPM, 1.5K RPD
- Wait a minute if you hit rate limits
- Consider implementing request queuing for production

### API Errors
- Verify your API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Check that you haven't exceeded free tier limits
- Ensure images are in supported formats (JPEG, PNG, WebP)

## Performance

Target latency: <5 seconds per BOM generation
Target accuracy: 90%+ material classification accuracy

The Gemini API typically responds in 1-3 seconds, well within our target.
