# Setup Guide: DeepSeek API Integration

## ✅ API Key Configuration

Your DeepSeek API key has been configured for local development.

### Local Development Setup

1. **API Key is already in `.env`** (not committed to git)
   - The file `.env` contains your API key for local development
   - This file is in `.gitignore` and will not be committed

2. **Run with Vercel CLI** (recommended for testing API routes):
   ```bash
   npm install -g vercel  # If not already installed
   npm run dev:vercel
   ```
   This will:
   - Start the Vite dev server for the frontend
   - Start the Vercel API routes (including `/api/generate-message`)
   - Use the `.env` file for environment variables

3. **Or run with Vite only** (frontend only, API won't work locally):
   ```bash
   npm run dev
   ```
   Note: API routes only work when deployed to Vercel or when using `vercel dev`

### Production Setup (Vercel)

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add Environment Variable:**
   - **Name**: `DEEPSEEK_API_KEY`
   - **Value**: `sk-18ac69c3dc2d42f291c2117e430d4b37`
   - **Environment**: Production, Preview, Development (select all)

3. **Deploy:**
   ```bash
   vercel --prod
   ```
   Or push to your main branch if auto-deploy is enabled.

## 📁 Files Created

- ✅ `api/generate-message.ts` - Vercel Edge Function for LLM message generation
- ✅ `.env` - Local environment variables (gitignored)
- ✅ `.env.example` - Template for environment variables
- ✅ `vercel.json` - Vercel configuration
- ✅ Updated `.gitignore` - Ensures `.env` is not committed

## 🔒 Security Notes

- ✅ API key is stored in `.env` (not committed)
- ✅ API key will be in Vercel environment variables (server-side only)
- ✅ Frontend never directly accesses the API key
- ✅ All API calls go through the Vercel Edge Function

## 🧪 Testing the API

Once you have the frontend integration ready, you can test the API endpoint:

```bash
curl -X POST http://localhost:3000/api/generate-message \
  -H "Content-Type: application/json" \
  -d '{
    "avatar": { ... },
    "scenario": { ... },
    "history": [],
    "round": 1
  }'
```

## 📝 Next Steps

1. ✅ API key configured
2. ✅ API route created (`/api/generate-message`)
3. 🔄 Integrate API call into `simulationEngine.ts`
4. 🔄 Add "Enhanced Mode" toggle in UI
5. 🔄 Test end-to-end flow
6. 🔄 Deploy to Vercel

---

**Last Updated**: 2025-01-XX  
**Status**: API key configured, ready for integration
