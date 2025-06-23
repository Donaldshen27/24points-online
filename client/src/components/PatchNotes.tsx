import React from 'react'
import { useTranslation } from 'react-i18next'
import './PatchNotes.css'

interface PatchNote {
  date: string
  version: string
  changes: {
    type: 'feature' | 'fix' | 'performance'
    description: string
  }[]
}

const patchNotes: PatchNote[] = [
  {
    date: '2025-06-22',
    version: '3.0.0',
    changes: [
      { type: 'feature', description: '🎯 NEW: ELO Ranking System - Climb from Iron to Grandmaster with skill-based matchmaking!' },
      { type: 'feature', description: 'Automated Ranked Matchmaking - Find opponents at your skill level automatically' },
      { type: 'feature', description: '8 Competitive Tiers: Iron → Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster' },
      { type: 'feature', description: 'Global and Regional Leaderboards - See how you rank against players worldwide' },
      { type: 'feature', description: 'Match History & Replay System - Review and learn from your ranked games' },
      { type: 'feature', description: 'Badge Tooltips - View badge requirements by hovering in waiting room' },
      { type: 'feature', description: 'Hidden Test Mode - Access developer tools at /testmode URL' },
      { type: 'fix', description: 'Fixed connection status display synchronization issues' },
      { type: 'fix', description: 'Resolved ranked matchmaking authentication problems' },
      { type: 'fix', description: 'Fixed React StrictMode compatibility for better stability' },
      { type: 'fix', description: 'Fixed ELO database schema foreign key constraints' },
      { type: 'fix', description: 'Socket reconnection after login now properly updates auth state' },
      { type: 'performance', description: 'Optimized matchmaking algorithm with progressive search expansion' },
      { type: 'performance', description: 'Improved badge system performance with local implementations' }
    ]
  },
  {
    date: '2025-01-23',
    version: '2.0.2',
    changes: [
      { type: 'fix', description: 'Fixed authentication API URL issue preventing signup/login on production' },
      { type: 'fix', description: 'Resolved double-slash URL bug (//api/auth/register) in server endpoints' },
      { type: 'fix', description: 'Added robust trailing slash handling for all API and WebSocket connections' }
    ]
  },
  {
    date: '2025-01-22',
    version: '2.0.1',
    changes: [
      { type: 'feature', description: 'Automatic JWT token refresh - Stay logged in without interruption' },
      { type: 'fix', description: 'Fixed JWT expiration errors causing "invalid credentials" messages' },
      { type: 'fix', description: 'Improved authentication token handling for better stability' },
      { type: 'performance', description: 'Increased session duration from 15 minutes to 1 hour' }
    ]
  },
  {
    date: '2025-01-22',
    version: '2.0.0',
    changes: [
      { type: 'feature', description: '🏆 NEW: Achievement & Badge System - Collect 50+ unique badges across multiple categories!' },
      { type: 'feature', description: 'Badge Gallery - View all available badges and track your collection progress' },
      { type: 'feature', description: 'Profile Badge Showcase - Display your favorite badges on your profile' },
      { type: 'feature', description: 'Real-time Badge Notifications - Get instant alerts when unlocking new achievements' },
      { type: 'feature', description: 'User Authentication - Create an account to save your progress and achievements' },
      { type: 'feature', description: 'Guest Username Protection - Reserve your username even as a guest player' },
      { type: 'feature', description: 'Elegant Card Redesign - New minimalist card design with improved performance' },
      { type: 'feature', description: 'Enhanced Victory Celebrations - Win screen now displays new records and achievements' },
      { type: 'fix', description: 'Fixed 2-character username registration validation' },
      { type: 'fix', description: 'Resolved TypeScript compilation errors in badge system' },
      { type: 'fix', description: 'Improved player disconnection handling' },
      { type: 'performance', description: 'Optimized badge system with local implementations' },
      { type: 'performance', description: 'Enhanced WebSocket connection stability' }
    ]
  },
  {
    date: '2025-01-21',
    version: '1.4.4',
    changes: [
      { type: 'fix', description: 'Fixed Extended Range mode scoring bug - now correctly awards 1 point per win instead of fractional points' },
      { type: 'feature', description: 'Added disconnection indicator to scoreboard - shows warning icon when opponent disconnects' }
    ]
  },
  {
    date: '2025-01-21',
    version: '1.4.3',
    changes: [
      { type: 'feature', description: 'Victory banner now shows new record information when players set or beat records' },
      { type: 'feature', description: 'Redesigned cards with cleaner, more elegant appearance - removed shadows and simplified design' },
      { type: 'fix', description: 'Removed blue popup overlay that briefly appeared during round transitions' },
      { type: 'fix', description: 'Fixed solo practice mode to skip solution replay entirely for smoother gameplay' },
      { type: 'fix', description: 'Victory celebration now maintains record information for its full duration' },
      { type: 'fix', description: 'Removed spinning animations when cards are dealt - now using smooth fade-in' },
      { type: 'fix', description: 'Removed P1/P2 labels from cards for cleaner look' },
      { type: 'performance', description: 'Reduced victory celebration duration to 2 seconds for faster gameplay' },
      { type: 'performance', description: 'Made all card animations 25-50% faster for more competitive gameplay' },
      { type: 'performance', description: 'Reduced card size by 10% for better layout on smaller screens' }
    ]
  },
  {
    date: '2025-01-20',
    version: '1.4.2',
    changes: [
      { type: 'feature', description: 'Enhanced puzzle records display - now shows fastest solver and their time' },
      { type: 'feature', description: 'Added first-solve celebration in victory banner' },
      { type: 'feature', description: 'Improved mobile UI with cleaner layout and better touch targets' },
      { type: 'fix', description: 'Fixed solve time tracking and display in round results' },
      { type: 'fix', description: 'Fixed puzzle records not showing for solving state in solo practice' },
      { type: 'fix', description: 'Improved card number visibility with darker background colors' },
      { type: 'performance', description: 'Sped up round end banner animations for better flow' }
    ]
  },
  {
    date: '2025-01-19',
    version: '1.4.1',
    changes: [
      { type: 'feature', description: 'Guest usernames are now remembered across sessions' },
      { type: 'performance', description: 'Improved user experience - no need to re-enter username every time' }
    ]
  },
  {
    date: '2025-01-19',
    version: '1.4.0',
    changes: [
      { type: 'feature', description: 'New point-based scoring for Extended Range mode - first to 4 points wins!' },
      { type: 'feature', description: 'Extended Range games are now much shorter and more dynamic' },
      { type: 'feature', description: 'Added momentum system: win gains +1 point or opponent loses -1 point' },
      { type: 'performance', description: 'Cards now return to original owners after each round in Extended mode' }
    ]
  },
  {
    date: '2025-01-19',
    version: '1.3.0',
    changes: [
      { type: 'feature', description: 'Added leaderboard with record holdings ranking' },
      { type: 'performance', description: 'Optimized leaderboard and puzzle records loading performance' },
      { type: 'fix', description: 'Fixed z-index issue with puzzle record hover tooltips' },
      { type: 'fix', description: 'Display all puzzle records instead of limiting to top 20' }
    ]
  },
  {
    date: '2025-01-19',
    version: '1.2.0',
    changes: [
      { type: 'feature', description: 'Added puzzle records tracking and display system' },
      { type: 'feature', description: 'Added PostgreSQL database support with Supabase integration' },
      { type: 'feature', description: 'Added database debugging endpoint and troubleshooting guide' },
      { type: 'feature', description: 'Added puzzle records button to mobile navigation' },
      { type: 'fix', description: 'Improved card visibility and mobile display for puzzle records' },
      { type: 'fix', description: 'Updated puzzle records display and game state synchronization' }
    ]
  },
  {
    date: '2025-01-18',
    version: '1.1.0',
    changes: [
      { type: 'feature', description: 'Added authentication UI components for user accounts' },
      { type: 'feature', description: 'Replaced game counter with online users display' },
      { type: 'fix', description: 'Improved login form validation and error handling' },
      { type: 'fix', description: 'Resolved Google Search Console indexing issues' }
    ]
  },
  {
    date: '2025-01-17',
    version: '1.0.0',
    changes: [
      { type: 'feature', description: 'Improved SEO for Chinese and 24points keywords' },
      { type: 'feature', description: 'Optimized solo practice mode with faster replay and auto-skip' },
      { type: 'fix', description: 'Fixed critical rapid reconnection loop issue' },
      { type: 'fix', description: 'Reduced card transfer delay in solo practice mode' },
      { type: 'fix', description: 'Fixed React StrictMode double-invocation of effects' },
      { type: 'fix', description: 'Fixed solo practice loading issues' }
    ]
  },
  {
    date: '2025-01-16',
    version: '0.9.0',
    changes: [
      { type: 'feature', description: 'Added Google AdSense integration' },
      { type: 'feature', description: 'Optimized UI for mobile with minimalist design' },
      { type: 'feature', description: 'Implemented heart emoji card display system' },
      { type: 'feature', description: 'Added solo practice mode' },
      { type: 'feature', description: 'Added Chinese language support with toggle button' },
      { type: 'feature', description: 'Redesigned room type selector with carousel UI' },
      { type: 'feature', description: 'Comprehensive SEO improvements for better search rankings' }
    ]
  },
  {
    date: '2025-01-15',
    version: '0.8.0',
    changes: [
      { type: 'feature', description: 'Added Extended room type with 1-20 card range' },
      { type: 'feature', description: 'Implemented spectator mode for watching live games' },
      { type: 'feature', description: 'Transformed lobby into Street Fighter style battle arena' },
      { type: 'feature', description: 'Added game counter showing total games played' },
      { type: 'feature', description: 'Added keyboard shortcuts for faster gameplay' },
      { type: 'feature', description: 'Added super mode (7倍圣水) with 8 center cards' },
      { type: 'fix', description: 'Fixed round 3+ card dealing sync issue' },
      { type: 'fix', description: 'Fixed spectator mode game state updates' },
      { type: 'fix', description: 'Shuffled decks after transfers to prevent repetitive patterns' }
    ]
  },
  {
    date: '2025-01-15',
    version: '0.7.0',
    changes: [
      { type: 'feature', description: 'Added disconnect notification with 30-second auto-forfeit' },
      { type: 'feature', description: 'Added player reconnection capability' },
      { type: 'feature', description: 'Added development helper scripts' },
      { type: 'fix', description: 'Fixed reconnection issues and empty room cleanup' },
      { type: 'fix', description: 'Reconnected players now rejoin active games properly' }
    ]
  },
  {
    date: '2025-01-14',
    version: '0.6.0',
    changes: [
      { type: 'feature', description: 'Added victory celebration message for correct answers' },
      { type: 'feature', description: 'Simplified player hand display to show only card count' },
      { type: 'feature', description: 'Configured backend for production deployment' },
      { type: 'fix', description: 'Fixed game-ending and card transfer bugs' },
      { type: 'fix', description: 'Fixed animation completion issues in solution replay' },
      { type: 'fix', description: 'Fixed Netlify and Render deployment configurations' }
    ]
  },
  {
    date: '2025-01-14',
    version: '0.5.0',
    changes: [
      { type: 'feature', description: 'Added solution replay animation system' },
      { type: 'feature', description: 'Added card validation system and network accessibility' },
      { type: 'feature', description: 'Removed all timers for a more relaxed gameplay' },
      { type: 'feature', description: 'Removed SolutionBuilder modal for streamlined gameplay' },
      { type: 'feature', description: 'Improved UX with direct card interaction' },
      { type: 'fix', description: 'Fixed interactive card selection and merging flow' },
      { type: 'fix', description: 'Fixed replay synchronization with server-controlled state' }
    ]
  },
  {
    date: '2025-01-14',
    version: '0.1.0',
    changes: [
      { type: 'feature', description: 'Initial implementation of 24 Points multiplayer arcade game' },
      { type: 'feature', description: 'Implemented round system with timer and UI components' },
      { type: 'feature', description: 'Added answer screen documentation' },
      { type: 'fix', description: 'Fixed Solution interface mismatch between client and server' }
    ]
  }
]

interface PatchNotesProps {
  onClose: () => void
}

const PatchNotes: React.FC<PatchNotesProps> = ({ onClose }) => {
  const { t } = useTranslation()

  const getTypeIcon = (type: 'feature' | 'fix' | 'performance') => {
    switch (type) {
      case 'feature':
        return '✨'
      case 'fix':
        return '🐛'
      case 'performance':
        return '⚡'
    }
  }

  const getTypeClass = (type: 'feature' | 'fix' | 'performance') => {
    switch (type) {
      case 'feature':
        return 'patch-note-feature'
      case 'fix':
        return 'patch-note-fix'
      case 'performance':
        return 'patch-note-performance'
    }
  }

  return (
    <div className="patch-notes-overlay" onClick={onClose}>
      <div className="patch-notes-container" onClick={(e) => e.stopPropagation()}>
        <div className="patch-notes-header">
          <h2>{t('patchNotes.title', 'Patch Notes')}</h2>
          <button className="patch-notes-close" onClick={onClose}>×</button>
        </div>
        <div className="patch-notes-content">
          {patchNotes.map((patch, index) => (
            <div key={index} className="patch-note-entry">
              <div className="patch-note-header">
                <span className="patch-note-version">v{patch.version}</span>
                <span className="patch-note-date">{patch.date}</span>
              </div>
              <ul className="patch-note-changes">
                {patch.changes.map((change, changeIndex) => (
                  <li key={changeIndex} className={getTypeClass(change.type)}>
                    <span className="patch-note-icon">{getTypeIcon(change.type)}</span>
                    <span className="patch-note-description">{change.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PatchNotes