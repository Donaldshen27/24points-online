# ELO Foreign Key Constraint Fix

## Problem
Error: `insert or update on table "player_ratings" violates foreign key constraint "player_ratings_user_id_fkey"`

This error occurs because:
1. The ELO system tables reference `auth.users` (Supabase's auth system)
2. The player trying to join ranked doesn't exist in `auth.users`
3. The app appears to use a custom authentication system or guest IDs

## Root Cause
The ELO migration files were written assuming Supabase Auth would be used, creating foreign key constraints to `auth.users(id)`. However, the application is using user IDs that don't exist in Supabase's auth system.

## Solutions

### Quick Fix (Temporary)
Run `012_fix_elo_foreign_keys_simple.sql` to remove the foreign key constraints:
```sql
-- This removes all user-related foreign key constraints
-- Allows any UUID to be used as a user_id
```

**WARNING**: This reduces data integrity. Only use for development/testing.

### Proper Solutions

#### Option 1: Use Supabase Auth (Recommended)
1. Implement Supabase Auth for user registration/login
2. Ensure all users are created in `auth.users`
3. Keep the foreign key constraints for data integrity

#### Option 2: Use Custom Users Table
1. Modify the foreign keys to reference your `users` table instead of `auth.users`
2. Ensure all players have entries in your custom `users` table
3. Update the migration to use the correct table reference

#### Option 3: Hybrid Approach
1. Create a mapping table between your user system and Supabase auth
2. Automatically create auth.users entries when players join
3. Maintain data integrity while supporting your custom auth

## Implementation Steps

### For Quick Fix:
1. Run the migration in Supabase SQL editor
2. Restart your server
3. Ranked play should now work with any user ID

### For Proper Auth:
1. Choose an authentication strategy
2. Update user registration/login flows
3. Migrate existing users if needed
4. Re-add foreign key constraints

## Code Changes Needed

If using custom auth, update the socket handler to ensure user exists:
```typescript
// In rankedHandler.ts
const userExists = await checkUserExists(userId);
if (!userExists) {
  await createUser(userId, username);
}
```

## Related Files
- `server/migrations/012_fix_elo_foreign_keys_simple.sql`
- `server/src/services/RatingService.ts`
- `server/src/socket/rankedHandler.ts`
- `server/migrations/003_auth_system.sql`