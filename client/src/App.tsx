import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import socketService from './services/socketService'
import { useAuth } from './contexts/AuthContext'
import { Lobby } from './components/Lobby/Lobby'
import { RankedLobby } from './components/RankedLobby/RankedLobby'
import { WaitingRoom } from './components/WaitingRoom/WaitingRoom'
import { GameScreen } from './components/GameScreen/GameScreen'
import { DeckTest } from './components/DeckTest/DeckTest'
import { CalculatorTest } from './components/CalculatorTest/CalculatorTest'
import { InteractiveTableTest } from './components/InteractiveTableTest/InteractiveTableTest'
import { AuthTest } from './components/AuthTest/AuthTest'
import { ELOTest } from './components/ELOTest/ELOTest'
import { PuzzleRecordsView } from './components/PuzzleRecordsView/PuzzleRecordsView'
import { Leaderboard } from './components/Leaderboard/Leaderboard'
import { BadgesPage } from './components/Badges/BadgesPage'
import { BadgeNotificationQueue } from './components/Badges/BadgeNotification/BadgeNotificationQueue'
import { Profile } from './components/Profile/Profile'
import { BadgeImageUpload } from './components/Admin/BadgeImageUpload'
import { SEOContent } from './components/SEO/SEOContent'
import { DynamicSEO } from './components/SEO/DynamicSEO'
import Navigation from './components/Navigation/Navigation'
import { MobileNavigation } from './components/Navigation/MobileNavigation'
import PatchNotes from './components/PatchNotes'
import { AuthModal } from './components/AuthModal/AuthModal'
import { puzzleRecordsCache, leaderboardCache } from './services/puzzleRecordsCache'
import { guestService } from './services/guestService'
import type { GameRoom } from './types/game.types'
import { GameState } from './types/game.types'
import './App.css'
import './components/Badges/badges-mobile.css'
import './styles/mobile-global-fixes.css'

const AppState = {
  CONNECTING: 'connecting',
  LOBBY: 'lobby',
  RANKED_LOBBY: 'ranked_lobby',
  WAITING_ROOM: 'waiting_room',
  IN_GAME: 'in_game',
  TEST_MODE: 'test_mode',
  PUZZLES: 'puzzles',
  LEADERBOARD: 'leaderboard',
  BADGES: 'badges',
  PROFILE: 'profile',
  BADGE_ADMIN: 'badge_admin'
} as const;

type AppState = typeof AppState[keyof typeof AppState];

function App() {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false)
  const [appState, setAppState] = useState<AppState>(AppState.CONNECTING)
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null)
  const [playerId, setPlayerId] = useState<string>('')
  const [testComponent, setTestComponent] = useState<'deck' | 'calculator' | 'interactive' | 'auth' | 'elo' | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<number>(0)
  const [isSpectator, setIsSpectator] = useState<boolean>(false)
  const [showPatchNotes, setShowPatchNotes] = useState<boolean>(false)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [userRating, setUserRating] = useState<number | undefined>(undefined)
  const { user: authUser, logout } = useAuth()
  
  // Use ref to access current appState in event handlers without causing re-renders
  const appStateRef = useRef(appState)
  appStateRef.current = appState

  const handleRoomJoined = useCallback((room: GameRoom, playerId: string, isReconnection: boolean = false, isSpectatorJoin: boolean = false) => {
    console.log('[App] handleRoomJoined called:', { roomId: room.id, playerId, isReconnection, isSpectatorJoin })
    setCurrentRoom(room)
    setPlayerId(playerId)
    setIsSpectator(isSpectatorJoin)
    
    // Spectators go directly to game view
    if (isSpectatorJoin) {
      setAppState(AppState.IN_GAME)
      return
    }
    
    // Only go directly to game if this is a reconnection AND game is active
    if (isReconnection && (
        room.state === GameState.PLAYING || 
        room.state === GameState.SOLVING || 
        room.state === GameState.ROUND_END || 
        room.state === GameState.REPLAY ||
        room.state === GameState.GAME_OVER)) {
      setAppState(AppState.IN_GAME)
    } else {
      setAppState(AppState.WAITING_ROOM)
    }
  }, [])

  // Check URL on mount and handle special routes
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/testmode' || path.startsWith('/testmode/')) {
      setAppState(AppState.TEST_MODE);
    } else if (path === '/admin/badges') {
      setAppState(AppState.BADGE_ADMIN);
    }
  }, []);

  // Fetch user rating when authenticated
  useEffect(() => {
    if (authUser && isConnected) {
      // Listen for rating response
      const handleRatingResponse = (rating: any) => {
        if (rating && rating.currentRating !== undefined) {
          setUserRating(rating.currentRating)
        } else {
          setUserRating(undefined)
        }
      }
      
      socketService.on('ranked:rating', handleRatingResponse)
      socketService.emit('ranked:get-rating')
      
      return () => {
        socketService.off('ranked:rating', handleRatingResponse)
      }
    } else {
      setUserRating(undefined)
    }
  }, [authUser, isConnected])

  useEffect(() => {
    console.log('[App] useEffect mounting, connecting to socket...')
    
    // Connect to socket
    socketService.connect()
    
    const handleConnect = () => {
      setIsConnected(true)
      // Set to LOBBY if currently CONNECTING, otherwise preserve current state
      if (appStateRef.current === AppState.CONNECTING) {
        setAppState(AppState.LOBBY)
      } else if (appStateRef.current === AppState.TEST_MODE) {
        // Keep test mode active
      }
      
      // Get initial online users count
      socketService.emit('get-online-users', (data: { count: number }) => {
        setOnlineUsers(data.count)
      })
      
      // Preload puzzle records data in background
      puzzleRecordsCache.preload('puzzle-records', () => {
        return new Promise((resolve) => {
          socketService.emit('get-puzzle-records', (data: { records: any[] }) => {
            const filtered = data.records.filter(record => record.cards.length === 4);
            puzzleRecordsCache.set('puzzle-records', filtered);
            resolve(filtered);
          });
        });
      });
      
      // Preload leaderboard data in background
      leaderboardCache.preload('leaderboard-data', () => {
        return new Promise((resolve) => {
          socketService.emit('get-leaderboard-data', (data: any) => {
            leaderboardCache.set('leaderboard-data', data);
            resolve(data);
          });
        });
      })
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      setAppState(AppState.CONNECTING)
      setCurrentRoom(null)
      setIsSpectator(false)
    }

    const handleSpectatorJoined = (data: { room: GameRoom; playerId: string }) => {
      console.log('App.tsx: spectator-joined event received:', data)
      handleRoomJoined(data.room, data.playerId, false, true)
    }

    const handleGameStateUpdated = (gameState: GameRoom) => {
      console.log('[App] game-state-updated received:', {
        state: gameState.state,
        players: gameState.players?.length,
        isSoloPractice: gameState.isSoloPractice
      })
      setCurrentRoom(gameState)
      
      // Transition to game screen if in waiting room and game has started
      if (appStateRef.current === AppState.WAITING_ROOM && gameState.state === GameState.PLAYING) {
        console.log('[App] Transitioning from waiting room to game')
        setAppState(AppState.IN_GAME)
      }
    }

    // Setup event listeners
    socketService.on('connect', handleConnect)
    socketService.on('disconnect', handleDisconnect)
    socketService.on('spectator-joined', handleSpectatorJoined)
    socketService.on('game-state-updated', handleGameStateUpdated)

    return () => {
      // Clean up event listeners
      socketService.off('connect', handleConnect)
      socketService.off('disconnect', handleDisconnect)
      socketService.off('spectator-joined', handleSpectatorJoined)
      socketService.off('game-state-updated', handleGameStateUpdated)
      
      // Only disconnect if no other component is using the socket
      // This prevents disconnection during StrictMode double-render
      if (socketService.getSocket()?.connected) {
        console.log('App unmounting but keeping socket connected for potential re-mount')
      }
    }
  }, [handleRoomJoined])

  // Poll for online users updates
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      socketService.emit('get-online-users', (data: { count: number }) => {
        setOnlineUsers(data.count)
      })
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [isConnected])

  const handleGameStart = () => {
    setAppState(AppState.IN_GAME)
  }

  const handleLeaveRoom = () => {
    // Emit leave-room event to server
    socketService.emit('leave-room')
    
    setCurrentRoom(null)
    setPlayerId('')
    setIsSpectator(false)
    setAppState(AppState.LOBBY)
  }
  
  const handleAuthSuccess = () => {
    // Auth context will handle the user state update
    // Reconnect socket with new auth token
    console.log('[App] Auth success, reconnecting socket with new token...')
    socketService.reconnectWithAuth()
  }
  
  const handleSignOut = async () => {
    await logout()
    
    // Clear all caches when signing out
    puzzleRecordsCache.clear()
    leaderboardCache.clear()
    guestService.clearGuestUsername()
    
    // Disconnect and reconnect socket to clear auth state
    socketService.disconnect()
    socketService.connect()
    
    handleLeaveRoom()
  }

  // Handle navigation to ensure proper cleanup when leaving game
  const handleNavigation = (newState: AppState) => {
    // If currently in game or waiting room, leave the room first
    if ((appState === AppState.IN_GAME || appState === AppState.WAITING_ROOM) && currentRoom) {
      console.log('[App] Leaving room before navigation')
      handleLeaveRoom()
    }
    setAppState(newState)
  }

  // Check if we're on mobile
  const isMobile = window.innerWidth <= 768;

  return (
    <div className={`App ${appState === AppState.IN_GAME ? 'in-game' : ''} ${isMobile ? 'mobile' : ''}`}>
      <DynamicSEO />
      {/* Desktop Navigation */}
      <Navigation 
        username={authUser?.username || currentRoom?.players.find(p => p.id === playerId)?.name} 
        rating={userRating}
        onSignOut={authUser ? handleSignOut : handleLeaveRoom}
        onAuthSuccess={handleAuthSuccess}
        onPuzzlesClick={() => handleNavigation(AppState.PUZZLES)}
        onPlayClick={() => handleNavigation(AppState.LOBBY)}
        onLeaderboardClick={() => handleNavigation(AppState.LEADERBOARD)}
        onBadgesClick={() => handleNavigation(AppState.BADGES)}
        onProfileClick={() => handleNavigation(AppState.PROFILE)}
        currentView={appState}
      />
      
      {/* Mobile Navigation */}
      <MobileNavigation
        username={authUser?.username || currentRoom?.players.find(p => p.id === playerId)?.name} 
        rating={userRating}
        onSignOut={authUser ? handleSignOut : handleLeaveRoom}
        onAuthSuccess={handleAuthSuccess}
        onPuzzlesClick={() => handleNavigation(AppState.PUZZLES)}
        onPlayClick={() => handleNavigation(AppState.LOBBY)}
        onLeaderboardClick={() => handleNavigation(AppState.LEADERBOARD)}
        onBadgesClick={() => handleNavigation(AppState.BADGES)}
        onProfileClick={() => handleNavigation(AppState.PROFILE)}
        currentView={appState}
      />
      
      {/* Connection status bar */}
      <div className="status-bar">
        <div className="status-bar-content">
          <div className="game-counter">
            {t('app.onlineUsers', { count: onlineUsers })}
            <button 
              className="patch-notes-link" 
              onClick={() => setShowPatchNotes(true)}
              title={t('app.patchNotes', 'Patch Notes')}
            >
              📋 {t('app.patchNotes', 'Patch Notes')}
            </button>
          </div>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? t('app.status.connected') : t('app.status.disconnected')}
          </div>
        </div>
      </div>

      <main className="app-main">
        {appState === AppState.CONNECTING && !isConnected && (
          <div className="connecting">
            <h2>{t('app.status.connecting')}</h2>
          </div>
        )}

        {appState === AppState.LOBBY && (
          <Lobby 
            onRoomJoined={handleRoomJoined} 
            authUser={authUser}
            onRankedClick={() => setAppState(AppState.RANKED_LOBBY)}
          />
        )}

        {appState === AppState.RANKED_LOBBY && (
          <RankedLobby
            onRoomJoined={handleRoomJoined}
            authUser={authUser}
            onAuthRequired={() => {
              setShowAuthModal(true);
              setAuthMode('signin');
            }}
            onlineUsers={onlineUsers}
          />
        )}

        {appState === AppState.WAITING_ROOM && currentRoom && (
          <WaitingRoom 
            room={currentRoom}
            playerId={playerId}
            onGameStart={handleGameStart}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {appState === AppState.IN_GAME && currentRoom && (
          <GameScreen 
            room={currentRoom}
            playerId={playerId}
            onLeaveGame={handleLeaveRoom}
            isSpectator={isSpectator}
          />
        )}

        {appState === AppState.TEST_MODE && (
          <div className="test-mode">
            <div style={{ marginBottom: '2rem' }}>
              <button 
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                onClick={() => {
                  window.history.replaceState({}, '', '/');
                  setAppState(AppState.LOBBY);
                }}
              >
                ← Back to Game
              </button>
            </div>
            {!testComponent && (
              <div className="test-selector">
                <h2>{t('app.testMenu.title')}</h2>
                <div className="test-options">
                  <button onClick={() => setTestComponent('deck')}>
                    {t('app.testMenu.deckSystem')}
                  </button>
                  <button onClick={() => setTestComponent('calculator')}>
                    {t('app.testMenu.calculator')}
                  </button>
                  <button onClick={() => setTestComponent('interactive')}>
                    {t('app.testMenu.interactiveTable')}
                  </button>
                  <button onClick={() => setTestComponent('auth')}>
                    Authentication Test
                  </button>
                  <button onClick={() => setTestComponent('elo')}>
                    ELO Rating Test
                  </button>
                </div>
              </div>
            )}
            
            {testComponent === 'deck' && <DeckTest />}
            {testComponent === 'calculator' && <CalculatorTest />}
            {testComponent === 'interactive' && <InteractiveTableTest />}
            {testComponent === 'auth' && <AuthTest />}
            {testComponent === 'elo' && <ELOTest />}
            
            {testComponent && (
              <div className="test-back">
                <button onClick={() => setTestComponent(null)}>
                  {t('app.testMenu.back')}
                </button>
              </div>
            )}
          </div>
        )}

        {appState === AppState.PUZZLES && (
          <PuzzleRecordsView />
        )}

        {appState === AppState.LEADERBOARD && (
          <Leaderboard authUser={authUser} />
        )}

        {appState === AppState.BADGES && (
          authUser ? (
            <BadgesPage userId={authUser.id} />
          ) : (
            <div className="auth-required-message">
              <h2>{t('badges.authRequired.title', 'Sign In Required')}</h2>
              <p>{t('badges.authRequired.message', 'You need to sign in to view and track your badge collection. Create an account to start earning badges!')}</p>
              <button 
                className="sign-in-button"
                onClick={() => {
                  setShowAuthModal(true);
                  setAuthMode('signin');
                }}
              >
                {t('auth.tabs.signIn')}
              </button>
            </div>
          )
        )}

        {appState === AppState.PROFILE && (
          <Profile userId={authUser?.id} />
        )}

        {appState === AppState.BADGE_ADMIN && (
          <div className="admin-container">
            <div style={{ marginBottom: '2rem' }}>
              <button 
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                onClick={() => {
                  window.history.replaceState({}, '', '/');
                  setAppState(AppState.LOBBY);
                }}
              >
                ← Back to Game
              </button>
            </div>
            <BadgeImageUpload />
          </div>
        )}
      </main>
      
      {/* SEO Content - visible to search engines but can be hidden visually */}
      {appState === AppState.LOBBY && (
        <SEOContent />
      )}
      
      {/* Patch Notes Modal */}
      {showPatchNotes && (
        <PatchNotes onClose={() => setShowPatchNotes(false)} />
      )}
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={true}
          defaultTab={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false)
            handleAuthSuccess()
            // Refresh page state after successful auth
            if (appState === AppState.BADGES) {
              // Force re-render of badges page
              setAppState(AppState.LOBBY)
              setTimeout(() => setAppState(AppState.BADGES), 0)
            }
          }}
        />
      )}
      
      {/* Badge Notification Queue - shows badge unlock notifications */}
      <BadgeNotificationQueue 
        onShowBadgeDetails={() => {
          // Navigate to badges page with specific badge highlighted
          setAppState(AppState.BADGES);
        }}
      />
    </div>
  )
}

export default App