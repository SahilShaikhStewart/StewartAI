# GCP Setup Guide — Stewart AI Platform

> **Time needed**: ~5 minutes
> **Cost**: FREE (Gemini API has a generous free tier)

---

## Step 1: Get a Gemini API Key (2 minutes)

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account (personal or Stewart if allowed)
3. Click **"Create API Key"**
4. Select **"Create API key in new project"** (or pick an existing GCP project)
5. **Copy the API key** — it looks like `AIzaSy...` (39 characters)

> ⚠️ **That's it.** You do NOT need to:
> - Set up billing (free tier covers everything for dev/testing)
> - Create a Cloud SQL instance (we use SQLite locally)
> - Set up Cloud Run (that's for final deployment only)
> - Enable any APIs manually (the key creation does it)

---

## Step 2: Add the Key to the Project (30 seconds)

Open this file in VS Code:
```
C:\Users\SShaikh2\source\repos\StewartAI\StewartAI.Api\appsettings.Development.json
```

Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "GCP": {
    "ApiKey": "AIzaSy_YOUR_ACTUAL_KEY_HERE"
  }
}
```

> 🔒 **IMPORTANT**: This file is in `.gitignore` — your key won't be committed to git.

---

## Step 3: Run the Backend (30 seconds)

Open a terminal and run:
```bash
cd C:\Users\SShaikh2\source\repos\StewartAI
dotnet run --project StewartAI.Api
```

You should see:
```
info: Stewart AI Platform starting...
info: Swagger UI: http://localhost:5264/swagger
```

---

## Step 4: Test It (2 minutes)

### Test 1: Basic Health Check (no API key needed)
Open browser: **http://localhost:5264/api/health**

Expected:
```json
{
  "status": "healthy",
  "service": "Stewart AI Platform",
  "version": "1.0.0"
}
```

### Test 2: Gemini Connectivity
Open browser: **http://localhost:5264/api/health/gemini**

Expected:
```json
{
  "status": "connected",
  "geminiResponse": "Stewart AI is online and ready."
}
```

If you see `"status": "disconnected"` — check your API key.

### Test 3: Embedding API
Open browser: **http://localhost:5264/api/health/embedding**

Expected:
```json
{
  "status": "connected",
  "dimensions": 768
}
```

### Test 4: Seed Risk Data + Query
Use Swagger UI at **http://localhost:5264/swagger** or curl:

```bash
# Seed 2000 synthetic records
curl -X POST http://localhost:5264/api/risk/seed

# Get summary
curl http://localhost:5264/api/risk/summary

# Get state-level data (for heatmap)
curl http://localhost:5264/api/risk/by-state
```

### Test 5: AI Risk Assessment
```bash
curl -X POST http://localhost:5264/api/risk/assess ^
  -H "Content-Type: application/json" ^
  -d "{\"state\":\"Florida\",\"county\":\"Miami-Dade\",\"propertyType\":\"Single Family\",\"transactionType\":\"Purchase\",\"purchasePrice\":450000,\"loanAmount\":360000}"
```

### Test 6: Chat with Stewart AI
```bash
curl -X POST http://localhost:5264/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"What is title insurance and why do I need it?\"}"
```

---

## Gemini API Free Tier Limits

| Feature | Free Limit | Our Usage |
|---------|-----------|-----------|
| Gemini 1.5 Flash | 15 requests/minute, 1M tokens/day | More than enough |
| Text Embeddings | 1500 requests/minute | More than enough |
| Cost | $0 for free tier | $0 during development |

You only pay if you exceed free tier limits, which won't happen during development.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `GCP:ApiKey is not configured` | Check appsettings.Development.json has the key |
| `403 Forbidden` from Gemini | API key may be restricted — regenerate at aistudio.google.com/apikey |
| `429 Too Many Requests` | Hit rate limit — wait 60 seconds and retry |
| `ASPNETCORE_ENVIRONMENT` not set | Make sure you're running with `dotnet run` (not `dotnet StewartAI.Api.dll`) |
| SQLite locked error | Close any SQLite viewer that has the .db file open |

---

## Later: GCP Deployment (Week 4)

When ready to deploy for the demo, you'll need:
1. **GCP Project** with billing enabled (use the $100 credits)
2. **Cloud Run** — deploy the Docker container
3. **Cloud SQL PostgreSQL** (optional — can keep SQLite for demo)

But that's Week 4 stuff. For now, just the API key is all you need.
