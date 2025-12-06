# Supabase Database Setup Guide

## Overview

This application uses Supabase for cloud storage of conversation logs. The implementation includes automatic fallback to localStorage if Supabase is not configured, making it easy to get started without database setup.

## Database Schema

### Table: `simulations`

Stores completed conversation simulations.

```sql
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Optional: For future account management
  scenario JSONB NOT NULL,
  messages JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_simulations_completed_at ON simulations(completed_at DESC);
CREATE INDEX idx_simulations_user_id ON simulations(user_id) WHERE user_id IS NOT NULL;
```

### Row Level Security (RLS)

For now, we'll use a simple policy that allows all operations. When you add authentication later, you can update this to restrict access by user_id.

```sql
-- Enable RLS
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for now - update when adding authentication)
CREATE POLICY "Allow all operations" ON simulations
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Environment Variables

Add these to your `.env` file (or Vercel environment variables):

### Frontend (Client-Side)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (Server-Side API Functions)
```env
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.byhrzvmdcnodmxjzaifg.supabase.co:5432/postgres
```

**Note**: `DATABASE_URL` is used by server-side API functions (via `db.js`) for direct Postgres connections. The frontend uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for client-side Supabase operations.

### Getting Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a new project (or use an existing one)
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** → This is your `VITE_SUPABASE_URL`
4. Copy the **anon/public** key → This is your `VITE_SUPABASE_ANON_KEY`

## Setup Steps

### 1. Create Supabase Project

1. Sign up/login at [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be provisioned (takes ~2 minutes)

### 2. Create the Table

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the SQL schema above to create the `simulations` table
3. Verify the table was created in **Table Editor**

### 3. Configure Environment Variables

#### For Local Development

Create a `.env` file in the project root:

```env
# Frontend Supabase client
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend direct Postgres connection (for API functions)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.byhrzvmdcnodmxjzaifg.supabase.co:5432/postgres
```

#### For Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the following variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key
   - `DATABASE_URL` - Direct Postgres connection string (for API functions)
4. Redeploy your application

### 4. Test the Integration

1. Start your development server: `npm run dev`
2. Create a scenario and run a simulation
3. Click "Save Conversation" after the simulation completes
4. Navigate to "Chat History" tab
5. Verify the conversation appears in the list

## How It Works

### Storage Strategy

The application uses a **hybrid approach**:

1. **Primary**: Supabase (if configured)
   - Cloud storage
   - Accessible across devices
   - Persistent and scalable

2. **Fallback**: localStorage (if Supabase not configured)
   - Works immediately without setup
   - Browser-local storage
   - Limited to ~5-10MB per domain

### Code Flow

1. When saving a simulation:
   - `saveSimulation()` in `storage.ts` checks if Supabase is configured
   - If yes: Saves to Supabase via `saveSimulationToSupabase()`
   - If no: Falls back to localStorage
   - Also saves to localStorage as backup even when using Supabase

2. When loading simulations:
   - `getSavedSimulations()` tries Supabase first
   - Falls back to localStorage if Supabase fails or isn't configured
   - Merges results from both sources

## Future Enhancements

### Account Management

When you're ready to add user accounts:

1. Enable Supabase Authentication
2. Update the `simulations` table to require `user_id`:
   ```sql
   ALTER TABLE simulations ALTER COLUMN user_id SET NOT NULL;
   ```

3. Update RLS policies:
   ```sql
   -- Users can only see their own simulations
   CREATE POLICY "Users can view own simulations" ON simulations
     FOR SELECT
     USING (auth.uid() = user_id);

   -- Users can only insert their own simulations
   CREATE POLICY "Users can insert own simulations" ON simulations
     FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

4. Update `supabase.ts` to get the current user:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   const user_id = user?.id;
   ```

### Additional Features

- **Search**: Add full-text search on scenario topics
- **Tags**: Add a tags column for categorizing conversations
- **Sharing**: Add a `public` boolean column for sharing conversations
- **Analytics**: Track views, exports, etc.

## Troubleshooting

### "Supabase not configured" warnings

This is normal if you haven't set up Supabase yet. The app will work with localStorage only.

### Data not syncing

- Check that environment variables are set correctly
- Verify the Supabase table exists and RLS policies allow access
- Check browser console for errors
- Verify network requests in browser DevTools → Network tab

### localStorage vs Supabase

- Data saved to localStorage won't automatically migrate to Supabase
- Users will need to re-save conversations after Supabase is configured
- Consider adding a migration script if needed

## Security Notes

- The `anon` key is safe to expose in client-side code (it's public)
- RLS policies protect your data at the database level
- Never commit your `.env` file to version control
- Use environment variables for all sensitive configuration

