import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import socketService from './services/socketService'
import { Lobby } from './components/Lobby/Lobby'
import { WaitingRoom } from './components/WaitingRoom/WaitingRoom'
import { GameScreen } from './components/GameScreen/GameScreen'
import { DeckTest } from './components/DeckTest/DeckTest'
import { CalculatorTest } from './components/CalculatorTest/CalculatorTest'
import { InteractiveTableTest } from './components/InteractiveTableTest/InteractiveTableTest'
import { SEOContent } from './components/SEO/SEOContent'
import Navigation from './components/Navigation/Navigation'
import type { GameRoom } from './types/game.types'
import { GameState } from './types/game.types'
import './App.css'

const AppState = {
  CONNECTING: 'connecting',
  LOBBY: 'lobby',
  WAITING_ROOM: 'waiting_room',
  IN_GAME: 'in_game',
  TEST_MODE: 'test_mode'
} as const;

type AppState = typeof AppState[keyof typeof AppState];

function App() {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false)
  const [appState, setAppState] = useState<AppState>(AppState.CONNECTING)
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null)
  const [playerId, setPlayerId] = useState<string>('')
  const [testComponent, setTestComponent] = useState<'deck' | 'calculator' | 'interactive' | null>(null)
  const [gameCount, setGameCount] = useState<number>(0)
  const [isSpectator, setIsSpectator] = useState<boolean>(false)

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
    socketService.connect()
    
    socketService.on('connect', () => {
      setIsConnected(true)
      setAppState(AppState.LOBBY)
      
      // Get initial game count
      socketService.emit('get-game-count', (data: { count: number }) => {
        setGameCount(data.count)
      })
    })

    socketService.on('disconnect', () => {
      setIsConnected(false)
      setAppState(AppState.CONNECTING)
      setCurrentRoom(null)
      setIsSpectator(false)
    })

    // Handle spectator joins separately
    socketService.on('spectator-joined', (data: { room: GameRoom; playerId: string }) => {
      console.log('App.tsx: spectator-joined event received:', data)
      handleRoomJoined(data.room, data.playerId, false, true)
    })

    // Handle game state updates (important for solo practice)
    socketService.on('game-state-updated', (gameState: GameRoom) => {
      console.log('[App] game-state-updated received:', {
        state: gameState.state,
        players: gameState.players?.length,
        isSoloPractice: gameState.isSoloPractice
      })
      setCurrentRoom(gameState)
      
      // Transition to game screen if in waiting room and game has started
      if (appState === AppState.WAITING_ROOM && gameState.state === GameState.PLAYING) {
        console.log('[App] Transitioning from waiting room to game')
        setAppState(AppState.IN_GAME)
      }
    })

    return () => {
      socketService.off('connect')
      socketService.off('disconnect')
      socketService.off('spectator-joined')
      socketService.off('game-state-updated')
      socketService.disconnect()
    }
  }, [handleRoomJoined, appState])

  // Poll for game count updates
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      socketService.emit('get-game-count', (data: { count: number }) => {
        setGameCount(data.count)
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

  return (
    <div className="App">
      <Navigation 
        username={currentRoom?.players.find(p => p.id === playerId)?.name} 
        onSignOut={handleLeaveRoom}
        onTestModeToggle={() => {
          setAppState(appState === AppState.TEST_MODE ? AppState.LOBBY : AppState.TEST_MODE);
          setTestComponent(null);
        }}
        isTestMode={appState === AppState.TEST_MODE}
      />
      
      {/* Connection status bar */}
      <div className="status-bar">
        <div className="status-bar-content">
          <div className="game-counter">
            {t('app.gameCounter', { count: gameCount })}
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
          <Lobby onRoomJoined={handleRoomJoined} />
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
      </main>
      
      {/* SEO Content - visible to search engines but can be hidden visually */}
      {appState === AppState.LOBBY && (
        <SEOContent />
      )}
    </div>
  )
}

export default App