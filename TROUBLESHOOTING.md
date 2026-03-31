# Troubleshooting Guide - Stewart AI Platform

## 🚨 Common Issues and Solutions

---

## Issue 1: Embedding API 403 Forbidden Error

**Error Message:**
```json
{
  "error": "External service error: Embedding API returned Forbidden",
  "code": 403,
  "message": "Method doesn't allow unregistered callers (callers without established identity). Please use API Key or other form of API consumer identity to call this API.",
  "status": "PERMISSION_DENIED"
}
```

**Root Cause:**
The API key is not enabled for the Embedding API (`generativelanguage.googleapis.com`).

**Solution:**

### Step 1: Enable the Generative Language API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `gen-lang-client-0091163233`
3. Navigate to **APIs & Services** → **Library**
4. Search for "Generative Language API"
5. Click **Enable** (if not already enabled)

### Step 2: Verify API Key Restrictions
1. Go to **APIs & Services** → **Credentials**
2. Find your API key: `AIzaSyD5TPhAAkRsE5yucHwWiCW25KY4wc7Q5-s`
3. Click **Edit** (pencil icon)
4. Under **API restrictions**, ensure these are selected:
   - ✅ Generative Language API
   - ✅ (No other restrictions needed)
5. Click **Save**

### Step 3: Wait for Propagation
- API key changes can take 5-10 minutes to propagate
- Try the knowledge base seeding again after waiting

### Step 4: Test the Fix
```bash
# In GCP Cloud Shell or local terminal
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":{"parts":[{"text":"test"}]}}'
```

**Expected Response:** JSON with embedding values (not a 403 error)

---

## Issue 2: Knowledge Base Seeding Fails

**Symptoms:**
- "Seed Knowledge Base" button shows error
- Chat responses say "I don't have information"

**Solutions:**

### Option A: Use Gemini API Only (No Embeddings)
If you can't enable the Embedding API, modify the code to use Gemini for semantic search instead:

1. Update `KnowledgeBaseService.cs` to use Gemini's text generation for similarity
2. This is slower but doesn't require the Embedding API

### Option B: Skip Knowledge Base for Demo
1. Focus demo on Document Analysis and Risk Dashboard
2. Explain that Chat feature requires additional API setup
3. Show the architecture and explain how RAG would work

---

## Issue 3: Container Scaled to Zero (Data Lost)

**Symptoms:**
- After overnight, dashboard shows no data
- Knowledge base is empty
- Need to re-seed everything

**Root Cause:**
- Cloud Run min-instances=0 means container stops when idle
- SQLite database is in-memory/ephemeral filesystem
- Data is lost when container restarts

**Solutions:**

### For Demo:
1. **Before presenting**, seed both:
   - Knowledge base (Chat page → "Seed Knowledge Base")
   - Risk data (Dashboard page → "Seed Demo Data")
2. Keep a browser tab open to prevent scale-to-zero
3. Refresh every 10 minutes to keep container warm

### For Production:
1. Set `--min-instances 1` in deployment
2. Migrate to Cloud SQL (PostgreSQL)
3. Use persistent volume for SQLite

---

## Issue 4: Slow Response Times

**Symptoms:**
- Chat responses take 10+ seconds
- Document analysis times out

**Solutions:**

1. **Increase timeout:**
```bash
gcloud run deploy stewart-ai \
  --timeout 300 \
  --memory 1Gi
```

2. **Warm up the container:**
- Visit the health endpoint: `/api/health`
- This initializes the Gemini client

3. **Check Gemini API quotas:**
- Go to Cloud Console → APIs & Services → Quotas
- Ensure you haven't hit rate limits

---

## Issue 5: CORS Errors in Browser

**Symptoms:**
- Frontend can't connect to backend
- Console shows CORS policy errors

**Solution:**
The backend already has CORS configured in `Program.cs`. If you still see errors:

1. Check the API URL in `client.ts`
2. Ensure it matches the deployed URL
3. Clear browser cache
4. Try incognito mode

---

## Issue 6: Deployment Fails

**Common Errors:**

### "No space left on device"
```bash
# Clean up Cloud Build cache
gcloud builds list --limit=10
gcloud builds cancel <BUILD_ID>
```

### "Permission denied"
```bash
# Ensure you're authenticated
gcloud auth login
gcloud config set project gen-lang-client-0091163233
```

### "Dockerfile not found"
```bash
# Ensure you're in the correct directory
cd StewartAI
ls -la Dockerfile  # Should exist
```

---

## Issue 7: Frontend Build Fails

**Error:** "Module not found" or "Type errors"

**Solutions:**

1. **Clean install:**
```bash
cd StewartAI.Web
rm -rf node_modules package-lock.json
npm install
```

2. **Check Node version:**
```bash
node --version  # Should be 18.x or higher
```

3. **Fix TypeScript errors:**
```bash
npm run type-check
```

---

## Issue 8: API Key Exposed in Logs

**Prevention:**
- Never commit API keys to Git
- Use environment variables
- Rotate keys if exposed

**If Exposed:**
1. Go to Cloud Console → Credentials
2. Delete the exposed key
3. Create a new key
4. Update deployment with new key
5. Redeploy

---

## Quick Fixes Checklist

Before demo, verify:
- [ ] Platform is accessible at https://stewart-ai-219046022543.us-central1.run.app
- [ ] Health endpoint responds: `/api/health`
- [ ] Knowledge base is seeded (10 documents)
- [ ] Risk data is seeded (2000 records)
- [ ] Demo documents are available (3 files)
- [ ] All pages load without errors
- [ ] Internet connection is stable

---

## Emergency Demo Backup Plan

If live demo fails completely:

1. **Have screenshots ready** of:
   - Landing page
   - Chat with sample Q&A
   - Document analysis results
   - Risk dashboard with data
   - Metrics page

2. **Have a video recording** (30-60 seconds) showing:
   - Quick walkthrough of all features
   - Key functionality working

3. **Explain the issue honestly:**
   - "Due to API rate limits / network issues, let me show you screenshots"
   - Judges appreciate honesty and preparation

4. **Focus on architecture:**
   - Show the code structure
   - Explain the technical decisions
   - Demonstrate your understanding

---

## Getting Help

**During Demo:**
- Stay calm
- Have backup plan ready
- Explain what should happen
- Show code/architecture instead

**After Demo:**
- Check Cloud Run logs: `gcloud run logs read stewart-ai`
- Check Gemini API status: https://status.cloud.google.com/
- Review error messages carefully
- Test locally if possible

---

## Prevention Tips

1. **Test 24 hours before:** Full end-to-end demo
2. **Test 1 hour before:** Quick verification
3. **Keep container warm:** Visit site every 10 minutes
4. **Have backup:** Screenshots, video, code walkthrough
5. **Know your limits:** API quotas, timeouts, memory

---

## Success Indicators

✅ **Platform is working if:**
- Health endpoint returns 200 OK
- Landing page loads in < 2 seconds
- Chat can answer basic questions
- Document analysis completes in < 10 seconds
- Risk dashboard shows data
- No console errors in browser

---

**Remember:** Even if something breaks, you've built a real, working platform. The judges care about your problem-solving, technical skills, and business understanding - not just a perfect demo.

**You've got this! 🚀**
