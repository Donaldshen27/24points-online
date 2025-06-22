# Troubleshooting Production Database Issues

## Problem
Puzzle records are saved to Supabase when playing on localhost, but not in production.

## Diagnostic Steps

### 1. Check Server Environment Variables
On your Render dashboard:
1. Go to your service → Environment
2. Verify these variables are set:
   - `SUPABASE_URL` - Should match your local .env
   - `SUPABASE_ANON_KEY` - Should match your local .env
   - `NODE_ENV` - Should be "production"

### 2. Test Database Connection
Visit: `https://your-server-url.onrender.com/api/debug/health`

This will show:
- Environment configuration
- Database connection status
- Any error messages

### 3. Check Server Logs
Look for these messages in Render logs:
- ✅ "Supabase database configured" - Database is set up correctly
- ❌ "Supabase database not configured - using in-memory storage" - Missing env vars
- ❌ "Database error, falling back to in-memory" - RLS policy or connection issue

### 4. Verify RLS Policies
In Supabase SQL Editor, run:
```sql
-- Check if anonymous write policies exist
SELECT * FROM pg_policies 
WHERE tablename IN ('puzzles', 'solve_records')
AND policyname LIKE '%anonymous%';
```

If no results, run the migration:
```sql
-- Allow anonymous users to insert solve records
CREATE POLICY "Allow anonymous insert to solve_records" ON solve_records
  FOR INSERT WITH CHECK (true);

-- Allow anonymous users to update puzzles table
CREATE POLICY "Allow anonymous update to puzzles" ON puzzles
  FOR UPDATE USING (true);

-- Allow anonymous users to insert new puzzles
CREATE POLICY "Allow anonymous insert to puzzles" ON puzzles
  FOR INSERT WITH CHECK (true);
```

### 5. Test Direct Database Access
In Supabase SQL Editor:
```sql
-- Check if tables have any data
SELECT COUNT(*) as puzzle_count FROM puzzles;
SELECT COUNT(*) as record_count FROM solve_records;

-- Try manual insert to test permissions
INSERT INTO puzzles (cards, occurrence_count, created_at)
VALUES (ARRAY[1,2,3,4], 1, NOW())
ON CONFLICT (cards) DO UPDATE SET occurrence_count = puzzles.occurrence_count + 1;
```

## Common Issues and Solutions

### Issue 1: Missing Environment Variables
**Symptom**: Server logs show "Supabase database not configured"
**Solution**: Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to Render environment variables

### Issue 2: RLS Policies Not Applied
**Symptom**: Server logs show "new row violates row-level security policy"
**Solution**: Run the migration script in Supabase SQL Editor

### Issue 3: Wrong Database URL
**Symptom**: Connection errors or data mismatch
**Solution**: Ensure production uses the same Supabase project as development

### Issue 4: CORS Issues
**Symptom**: Network errors in browser console
**Solution**: Check that your production domain is in ALLOWED_ORIGINS

## Quick Fix Checklist
1. ✅ Environment variables set on Render
2. ✅ RLS policies applied in Supabase
3. ✅ Server shows "Supabase database configured" in logs
4. ✅ /api/debug/health shows database: "connected"
5. ✅ No CORS errors in browser console

## Testing After Fix
1. Play a game in production
2. Check Supabase dashboard → Table Editor → solve_records
3. New records should appear with your solve times