# Badge Internationalization Implementation

## Overview
This document describes the implementation of internationalization (i18n) support for the badge system in the 24 Points game, supporting both English and Chinese languages.

## Implementation Details

### 1. Translation Structure
Badge translations are stored in the i18n locale files:
- `/client/src/i18n/locales/en.json` - English translations
- `/client/src/i18n/locales/zh.json` - Chinese translations

Translations are organized under `badges.definitions` with keys matching badge IDs:
```json
{
  "badges": {
    "definitions": {
      "speed_demon_bronze": {
        "name": "Speed Demon Bronze",
        "description": "Solve a puzzle in under 10 seconds"
      },
      // ... more badges
    }
  }
}
```

### 2. Translation Helper Utility
Created a utility module at `/client/src/utils/badgeTranslations.ts` that provides:
- `getTranslatedBadge()` - Function to get translated badge name and description
- `useBadgeTranslations()` - React hook for component use

### 3. Updated Components
The following components were updated to use translations:

#### BadgeCard.tsx
- Uses `useBadgeTranslations` hook
- Displays translated badge name and description

#### BadgeDetailModal.tsx  
- Uses `useBadgeTranslations` hook
- Shows translated badge details in the modal

#### BadgeUnlockNotification.tsx
- Uses `useBadgeTranslations` hook
- Shows translated badge info in unlock notifications

#### BadgeShowcase.tsx
- Uses inline translation for enriched badge data from server
- Translates badge names using badge ID

### 4. Translation Coverage
All 50+ badge definitions have been translated including:
- Speed badges (Speed Demon tiers)
- Reflex badges (Lightning Reflexes tiers)
- Progression badges (Veteran, Champion, etc.)
- Game mode badges (Classic Master, Super Mode Champion, etc.)
- Social badges (Friendly Rival, Spectator Sport, etc.)
- Unique achievement badges (Comeback King, Night Owl, etc.)
- Seasonal/event badges

### 5. Language Switching
The game automatically uses the appropriate language based on:
- User's browser language preference
- Manual language selection in the game UI
- The language toggle in the top navigation bar

## Testing
To test the badge translations:
1. Switch language using the language toggle in the navigation
2. Visit the Badge Gallery page to see all badges
3. Click on badges to see detailed translations
4. Unlock badges to see translated notifications
5. Check profile badge showcase for translated names

## Future Enhancements
- Add more languages (Spanish, French, etc.)
- Support for dynamic badge descriptions with variables
- Translation management system for easier updates
- Badge description formatting for complex requirements