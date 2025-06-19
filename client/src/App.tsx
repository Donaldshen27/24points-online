import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import socketService from './services/socketService'
import { authService, type AuthUser } from './services/authService'
import { Lobby } from './components/Lobby/Lobby'
import { WaitingRoom } from './components/WaitingRoom/WaitingRoom'
import { GameScreen } from './components/GameScreen/GameScreen'
import { DeckTest } from './components/DeckTest/DeckTest'
import { CalculatorTest } from './components/CalculatorTest/CalculatorTest'
import { InteractiveTableTest } from './components/InteractiveTableTest/InteractiveTableTest'
import { PuzzleRecordsView } from './components/PuzzleRecordsView/PuzzleRecordsView'
import { SEOContent } from './components/SEO/SEOContent'
import { DynamicSEO } from './components/SEO/DynamicSEO'
import Navigation from './components/Navigation/Navigation'
import type { GameRoom } from './types/game.types'
import { GameState } from './types/game.types'
import './App.css'

const AppState = {
  CONNECTING: 'connecting',
  LOBBY: 'lobby',
  WAITING_ROOM: 'waiting_room',
  IN_GAME: 'in_game',
  TEST_MODE: 'test_mode',
  PUZZLES: 'puzzles'
} as const;

type AppState = typeof AppState[keyof typeof AppState];

function App() {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false)
  const [appState, setAppState] = useState<AppState>(AppState.CONNECTING)
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null)
  const [playerId, setPlayerId] = useState<string>('')
  const [testComponent, setTestComponent] = useState<'deck' | 'calculator' | 'interactive' | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<number>(0)
  const [isSpectator, setIsSpectator] = useState<boolean>(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  
  // Use ref to access current appState in event handlers without causing re-renders
  const appStateRef = useRef(appState)
  appStateRef.current = appState

  // Load authenticated user on mount
  useEffect(() => {
    const user = authService.getUser()
    if (user) {
      setAuthUser(user)
    }
  }, [])

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

  useEffect(() => {
    console.log('[App] useEffect mounting, connecting to socket...')
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      const user = await authService.getCurrentUser()
      if (user) {
        setAuthUser(user)
      }
    }
    checkAuth()
    
    // Connect to socket
    socketService.connect()
    
    const handleConnect = () => {
      setIsConnected(true)
      setAppState(AppState.LOBBY)
      
      // Get initial online users count
      socketService.emit('get-online-users', (data: { count: number }) => {
        setOnlineUsers(data.count)
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
  
  const handleAuthSuccess = (user: AuthUser) => {
    setAuthUser(user)
  }
  
  const handleSignOut = async () => {
    await authService.logout()
    setAuthUser(null)
    handleLeaveRoom()
  }

  return (
    <div className="App">
      <DynamicSEO />
      <Navigation 
        username={authUser?.username || currentRoom?.players.find(p => p.id === playerId)?.name} 
        onSignOut={authUser ? handleSignOut : handleLeaveRoom}
        onTestModeToggle={() => {
          setAppState(appState === AppState.TEST_MODE ? AppState.LOBBY : AppState.TEST_MODE);
          setTestComponent(null);
        }}
        isTestMode={appState === AppState.TEST_MODE}
        onAuthSuccess={handleAuthSuccess}
        onPuzzlesClick={() => setAppState(AppState.PUZZLES)}
        onPlayClick={() => setAppState(AppState.LOBBY)}
        currentView={appState}
      />
      
      {/* Connection status bar */}
      <div className="status-bar">
        <div className="status-bar-content">
          <div className="game-counter">
            {t('app.onlineUsers', { count: onlineUsers })}
          </div>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? t('app.status.connected') : t('app.status.disconnected')}
          </div>
        </div>
      </div>

      <main className="app-main">
        {appState === AppState.CONNECTING && (
          <div className="connecting">
            <h2>{t('app.status.connecting')}</h2>
          </div>
        )}

        {appState === AppState.LOBBY && (
          <Lobby onRoomJoined={handleRoomJoined} authUser={authUser} />
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
                </div>
              </div>
            )}
            
            {testComponent === 'deck' && <DeckTest />}
            {testComponent === 'calculator' && <CalculatorTest />}
            {testComponent === 'interactive' && <InteractiveTableTest />}
            
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
      </main>
      
      {/* SEO Content - visible to search engines but can be hidden visually */}
      {appState === AppState.LOBBY && (
        <SEOContent />
      )}
    </div>
  )
}

export default App