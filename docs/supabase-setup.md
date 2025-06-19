# Supabase Setup Guide for Puzzle Records

This guide will help you set up Supabase for persistent puzzle records storage in under 30 minutes.

## Quick Setup Steps

### 1. Create Supabase Account & Project (5 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account (GitHub login recommended)
3. Click "New project"
4. Fill in:
   - Project name: `twentyfourpoints` (or any name)
   - Database Password: (save this, but we won't need it for this setup)
   - Region: Choose closest to your server location
5. Click "Create new project" and wait ~2 minutes for setup

### 2. Run Database Schema (2 minutes)

1. In your Supabase project dashboard, click "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy and paste the entire contents of `server/schema.sql`
4. Click "Run" (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

### 3. Get Connection Credentials (1 minute)

1. In Supabase dashboard, click "Settings" (gear icon) in the left sidebar
2. Click "API" under Configuration
3. Copy these values:
   - **Project URL**: This is your `SUPABASE_URL`
   - **anon public**: This is your `SUPABASE_ANON_KEY`

### 4. Configure Environment Variables (2 minutes)

1. Create `.env` file in the server directory:
   ```bash
   cp server/.env.example server/.env
   ```

2. Edit `server/.env` and add your Supabase credentials:
   ```env
   # Existing configuration...
   
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

   **Note**: You only need these 2 environment variables. Supabase provides many others (like `POSTGRES_URL`, `SERVICE_ROLE_KEY`, etc.) but they're not needed for the puzzle records feature.

### 5. Deploy and Test (5 minutes)

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Add Supabase database for puzzle records"
   git push
   ```

2. Deploy to your server (Render, Railway, etc.)
3. Add environment variables in your hosting platform
4. The server will automatically use Supabase if configured, or fall back to in-memory storage

## Features

- **Automatic Fallback**: If database is not configured or unavailable, the system uses in-memory storage
- **Top 10 Records**: Automatically maintains only the top 10 fastest solves per puzzle
- **Zero Downtime**: Can be added to production without any disruption
- **Free Tier**: 500MB storage is more than enough for thousands of puzzles

## Testing

1. Play a few rounds of the game
2. Check Supabase Table Editor to see puzzle records being saved
3. Restart your server - records should persist!

## Optional: Direct Database Access

You can query the database directly from Supabase dashboard:

```sql
-- View all puzzles sorted by popularity
SELECT * FROM puzzles ORDER BY occurrence_count DESC;

-- View fastest solves for a specific puzzle
SELECT * FROM solve_records 
WHERE puzzle_key = '1,2,3,4' 
ORDER BY solve_time_ms ASC;

-- Get statistics
SELECT COUNT(*) as total_puzzles FROM puzzles;
SELECT COUNT(*) as total_solves FROM solve_records;
```

## Troubleshooting

- **"Database not configured" message**: Check your environment variables
- **No data appearing**: Ensure Row Level Security policies are created (included in schema.sql)
- **Connection errors**: Verify your Supabase project is active (free tier pauses after 1 week of inactivity)