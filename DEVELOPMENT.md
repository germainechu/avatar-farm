# Development Guide

## Running the Application Locally

### Option 1: Using Vercel Dev (Recommended)

For local development with API routes, use Vercel's development server:

```bash
npm run dev:vercel
```

This will:
- Start the Vite dev server for the frontend
- Handle API routes in `/api/` automatically
- Use your local `.env` file for environment variables

### Option 2: Using Vite Directly

If you want to use Vite directly (without API routes):

```bash
npm run dev
```

**Note:** API routes will not work with this approach. You'll need to either:
- Deploy to Vercel and use the production API URL
- Or use `vercel dev` instead

## Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your DeepSeek API key:
   ```
   DEEPSEEK_API_KEY=your-actual-api-key-here
   ```

3. For local development with `vercel dev`, the `.env` file is automatically loaded.

4. For production, set `DEEPSEEK_API_KEY` in Vercel Dashboard → Settings → Environment Variables.

## Troubleshooting

### 404 Error on `/api/generate-message`

**Problem:** Getting 404 errors when calling the API endpoint.

**Solutions:**
1. **Use `vercel dev`**: Run `npm run dev:vercel` instead of `npm run dev`
2. **Check API file location**: Ensure `api/generate-message.ts` exists in the root directory
3. **Check Vercel config**: Verify `vercel.json` has the correct function configuration
4. **Environment variables**: Make sure `DEEPSEEK_API_KEY` is set in your `.env` file

### API Not Responding

- Check that `vercel dev` is running (should show "Ready" message)
- Verify the API file exports a default handler function
- Check browser console and terminal for error messages
