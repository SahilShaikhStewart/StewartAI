# 🚀 GCP Cloud Run Deployment Guide

## Prerequisites

1. **Google Cloud SDK** installed: https://cloud.google.com/sdk/docs/install
2. **Docker** installed locally (for testing)
3. **GCP Project** with billing enabled
4. **Gemini API Key** from Google AI Studio

## Quick Deploy (5 commands)

```bash
# 1. Set your GCP project
gcloud config set project YOUR_PROJECT_ID

# 2. Enable required APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# 3. Build and push using Cloud Build (no local Docker needed)
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/stewart-ai

# 4. Deploy to Cloud Run with your Gemini API key
gcloud run deploy stewart-ai \
  --image gcr.io/YOUR_PROJECT_ID/stewart-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "GCP__ApiKey=YOUR_GEMINI_API_KEY,ASPNETCORE_ENVIRONMENT=Production"

# 5. Get the URL
gcloud run services describe stewart-ai --region us-central1 --format="value(status.url)"
```

## Detailed Steps

### Step 1: Authenticate with GCP

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Step 2: Enable APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

### Step 3: Build the Docker Image

**Option A: Cloud Build (recommended — no local Docker needed)**
```bash
cd /path/to/StewartAI
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/stewart-ai
```

**Option B: Local Docker Build + Push**
```bash
cd /path/to/StewartAI

# Build locally
docker build -t stewart-ai .

# Tag for GCR
docker tag stewart-ai gcr.io/YOUR_PROJECT_ID/stewart-ai

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/stewart-ai
```

### Step 4: Deploy to Cloud Run

```bash
gcloud run deploy stewart-ai \
  --image gcr.io/YOUR_PROJECT_ID/stewart-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --timeout 300 \
  --set-env-vars "GCP__ApiKey=YOUR_GEMINI_API_KEY,ASPNETCORE_ENVIRONMENT=Production"
```

> **Note:** The `GCP__ApiKey` uses double underscores (`__`) because ASP.NET Core maps
> environment variables with `__` to the `:` separator in configuration (i.e., `GCP:ApiKey`).

### Step 5: Verify Deployment

```bash
# Get the deployed URL
URL=$(gcloud run services describe stewart-ai --region us-central1 --format="value(status.url)")

# Test health endpoint
curl $URL/api/health

# Test Gemini connectivity
curl $URL/api/health/gemini

# Open in browser
echo "Open: $URL"
```

## Local Docker Testing

```bash
cd /path/to/StewartAI

# Build
docker build -t stewart-ai .

# Run locally (replace with your actual API key)
docker run -p 8080:8080 \
  -e GCP__ApiKey=YOUR_GEMINI_API_KEY \
  -e ASPNETCORE_ENVIRONMENT=Production \
  stewart-ai

# Open http://localhost:8080
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GCP__ApiKey` | Google Gemini API key | ✅ Yes |
| `ASPNETCORE_ENVIRONMENT` | `Production` or `Development` | ✅ Yes |
| `GCP__Model` | Gemini model (default: `gemini-2.5-flash`) | No |
| `GCP__EmbeddingModel` | Embedding model (default: `gemini-embedding-001`) | No |

## Cost Estimate

- **Cloud Run**: ~$0 with min-instances=0 (pay per request)
- **Gemini API**: Free tier covers ~1500 requests/day
- **Cloud Build**: 120 free build-minutes/day
- **Total for demo**: **$0-5** for the ideathon period

## Troubleshooting

### Container won't start
```bash
gcloud run services logs read stewart-ai --region us-central1 --limit 50
```

### API key not working
Make sure you're using double underscores: `GCP__ApiKey` (not `GCP:ApiKey`)

### CORS issues
The production build serves everything from the same origin (no CORS needed).
The React SPA and API are both served from the same Cloud Run URL.

### Database resets on redeploy
SQLite runs in-memory on Cloud Run (ephemeral filesystem). The knowledge base
auto-seeds on every startup, so this is fine for the demo. For production,
you'd switch to Cloud SQL.
