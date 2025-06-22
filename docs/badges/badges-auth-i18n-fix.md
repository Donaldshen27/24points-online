# Badge Auth Required Translation Fix

## Issue
When viewing the badges page without being logged in, the auth required message was showing:
- Translation keys instead of actual text: "badges.authRequired.title", "badges.authRequired.message"
- Error for sign in button: "key 'auth.signIn (en)' returned an object instead of string"

## Root Cause
1. The Suspense boundary fix from the previous issue resolved most translation loading issues
2. The sign in button was using the wrong translation key path (`auth.signIn` instead of `auth.tabs.signIn`)

## Solution

### Fixed Translation Key Path
In `App.tsx`, line 354:
```tsx
// Before:
{t('auth.signIn')}

// After:
{t('auth.tabs.signIn')}
```

The correct translation structure in `en.json` is:
```json
"auth": {
  "tabs": {
    "signIn": "Sign In",
    "signUp": "Sign Up"
  }
}
```

### Verified Auth Required Translations
The `badges.authRequired` translations were already present in `en.json`:
```json
"authRequired": {
  "title": "Sign In Required",
  "message": "You need to sign in to view and track your badge collection. Create an account to start earning badges!"
}
```

## Result
After the fix:
- The auth required message now shows:
  - Title: "Sign In Required"
  - Message: "You need to sign in to view and track your badge collection. Create an account to start earning badges!"
  - Button: "Sign In"

## Why the Error Occurred
The error "returned an object instead of string" happened because:
1. `t('auth.signIn')` was trying to access a non-existent key
2. Since `auth` exists but `auth.signIn` doesn't, it returned the `auth` object
3. React-i18next detected this and showed an error message

## Lesson Learned
Always verify the exact path of translation keys in the locale files. The translation key structure must match exactly what's defined in the JSON files.