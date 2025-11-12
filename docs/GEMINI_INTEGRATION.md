# Google Gemini API Integration

## Free Tier Details

The application uses **Google Gemini 2.0 Flash-Lite** model, which is available in the free tier.

### Free Tier Limits

- **Model**: `gemini-2.0-flash-lite`
- **Rate Limits**:
  - **30 requests per minute (RPM)**
  - **1,000,000 tokens per month (TPM)**
  - **1,500 requests per day (RPD)**
- **Cost**: $0 (completely free)
- **No credit card required**

### What We Use Gemini For

1. **Multimodal Image Analysis**
   - Analyze product images
   - Identify materials, textures, components
   - Extract visual properties (luster, opacity, texture)

2. **Material Classification**
   - Classify fabric types (cotton, denim, polyester, etc.)
   - Identify trims and hardware (buttons, zippers, rivets)
   - Determine material specifications

3. **Component Detection**
   - Detect visible components in images
   - Count buttons, zippers, pockets, etc.
   - Identify construction details

4. **BOM Generation**
   - Generate structured Bill of Materials
   - Calculate material quantities
   - Provide sourcing recommendations

## Getting Your API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Add it to `ai-service/.env`:

```env
GEMINI_API_KEY=your-api-key-here
```

## API Usage

The service automatically uses the free tier model. No configuration needed - just provide your API key.

### Rate Limiting

The free tier has these limits:
- **30 requests/minute**: Suitable for development and moderate usage
- **1.5K requests/day**: Enough for testing and small-scale production
- **1M tokens/month**: More than enough for BOM generation

### Handling Rate Limits

If you hit rate limits:
1. Wait 1 minute for RPM limit
2. Wait until next day for RPD limit
3. Check usage at [Google AI Studio](https://aistudio.google.com/app/apikey)

For production, consider:
- Implementing request queuing
- Caching results
- Upgrading to paid tier if needed (starts at $0.075 per 1M input tokens)

## Why Gemini Free Tier?

1. **No Infrastructure Costs**: No GPU, no model hosting, no cloud setup
2. **Easy Setup**: Just an API key - works locally immediately
3. **Multimodal**: Built-in image + text understanding
4. **High Quality**: Google's latest model with excellent accuracy
5. **Free Forever**: Free tier doesn't expire

## Alternative Models (If Needed)

If you need higher limits, you can switch to:
- `gemini-2.0-flash`: 15 RPM, 1M TPM, 1.5K RPD (free tier)
- `gemini-1.5-pro`: Paid tier, higher limits

To switch, just change the model name in `ai-service/app/services/gemini_service.py`:

```python
self.model = genai.GenerativeModel('gemini-2.0-flash')  # or gemini-1.5-pro
```

## Cost Comparison

**Current Setup (Free Tier)**:
- Cost: $0
- Limits: 30 RPM, 1.5K RPD
- Perfect for: Development, testing, small-scale production

**If You Need More**:
- Paid tier starts at $0.075 per 1M input tokens
- Still very affordable for production use
- No setup changes needed - just billing

## Security

- API keys are stored in `.env` files (not committed to git)
- Keys are passed via environment variables
- No sensitive data sent to Gemini (only product images and descriptions)

## Monitoring Usage

Check your usage at:
- [Google AI Studio Dashboard](https://aistudio.google.com/app/apikey)
- View API usage, rate limits, and billing (if applicable)

