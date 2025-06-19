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