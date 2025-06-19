# Database Row-Level Security (RLS) Policies

## Overview

The 24 Points game uses Supabase (PostgreSQL) to store puzzle records and solve times. Row-Level Security (RLS) is enabled on all tables to control access.

## Current Issue

When players solve puzzles, their records are not being saved to the database due to missing INSERT policies for anonymous users. The error appears as:

```
Database error, falling back to in-memory: {
  code: '42501',
  message: 'new row violates row-level security policy for table "solve_records"'
}
```

## Solution

The game allows anonymous play without authentication, so we need to add appropriate RLS policies for anonymous users to write data.

### Required Policies

1. **solve_records table**:
   - ✅ SELECT: Anonymous users can read records (existing)
   - ❌ INSERT: Anonymous users need to insert new solve times (missing)

2. **puzzles table**:
   - ✅ SELECT: Anonymous users can read puzzle stats (existing)
   - ❌ INSERT: Anonymous users need to insert new puzzles (missing)
   - ❌ UPDATE: Anonymous users need to update occurrence_count (missing)

### Migration

Run the migration file `002_add_anonymous_write_policies.sql` to add the missing policies:

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

## How to Apply

1. Access your Supabase dashboard
2. Go to SQL Editor
3. Run the migration script `002_add_anonymous_write_policies.sql`
4. Verify the policies are created in Authentication > Policies

## Security Considerations

These policies allow any anonymous user to:
- Record their solve times
- Update puzzle occurrence counts
- Add new puzzle configurations

This is appropriate for a public game where:
- No user authentication is required
- All gameplay data is public
- There's no sensitive user information

## Alternative Approaches

1. **Service Role Key**: Use `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_ANON_KEY` to bypass RLS entirely (less secure)
2. **Disable RLS**: Turn off RLS on these tables (not recommended)
3. **Add Authentication**: Implement user accounts and modify policies to check authenticated users (more complex)