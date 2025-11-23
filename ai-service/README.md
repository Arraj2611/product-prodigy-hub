# SourceFlow AI Service

Python FastAPI service for AI-powered BOM generation using **Groq API (Free Tier)**.

## Features

- **Groq Vision Models** for multimodal analysis (images + text)
  - Vision: `meta-llama/llama-4-scout-17b-16e-instruct` (750 tps, supports images, JSON mode)
  - Text: `llama-3.3-70b-versatile` (280 tps, production model for forecasts)
- **Free Tier**: Generous rate limits (250K-300K TPM, 1K RPM)
- Material classification from product images
- Dimensional analysis and quantity calculation
- Multi-level BOM generation
- Market demand forecasting
- Material price forecasting
- Supplier recommendations
- Target: <5 seconds processing time

## Setup

### 1. Get Groq API Key (Free)

1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign in with your account
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

Edit `.env` and add your Groq API key:

```
GROQ_API_KEY=your-api-key-here
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

## Free Tier Models & Limits

- **Vision Model**: `meta-llama/llama-4-scout-17b-16e-instruct`
  - Speed: ~750 tokens/second
  - Supports: Images, JSON mode, tool use
  - Rate Limits: 300K TPM, 1K RPM
  
- **Text Model**: `llama-3.3-70b-versatile`
  - Speed: ~280 tokens/second
  - Production model for high-quality text generation
  - Rate Limits: 300K TPM, 1K RPM

The service automatically uses free tier models. No credit card required!

## Docker

```bash
docker build -t sourceflow-ai-service .
docker run -p 8000:8000 --env-file .env sourceflow-ai-service
```

## Local Development Requirements

To run locally, you only need:

1. **Python 3.11+**
2. **Groq API Key** (free from Groq Console)
3. **Environment file** (`.env`) with your API key

That's it! No GPU, no heavy ML models, no cloud setup required.

## Troubleshooting

### "GROQ_API_KEY not set"
- Make sure you've created a `.env` file
- Verify the API key is correct
- Check that the `.env` file is in the `ai-service` directory

### Rate Limit Errors
- Free tier has generous limits: 250K-300K TPM, 1K RPM
- Wait a minute if you hit rate limits
- Consider implementing request queuing for production

### API Errors
- Verify your API key is valid at [Groq Console](https://console.groq.com/keys)
- Check that you haven't exceeded free tier limits
- Ensure images are in supported formats (JPEG, PNG, WebP)
- Maximum image size: 20MB (URL) or 4MB (base64)
- Maximum resolution: 33 megapixels per image
- Maximum images per request: 5

## Performance

Target latency: <5 seconds per BOM generation
Target accuracy: 90%+ material classification accuracy

The Groq API typically responds in 1-3 seconds, well within our target. Groq's fast inference speeds make it ideal for real-time applications.
