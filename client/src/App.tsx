import { useEffect, useState } from 'react'
import socketService from './services/socketService'
import { Lobby } from './components/Lobby/Lobby'
import { WaitingRoom } from './components/WaitingRoom/WaitingRoom'
import { GameScreen } from './components/GameScreen/GameScreen'
import { DeckTest } from './components/DeckTest/DeckTest'
import { CalculatorTest } from './components/CalculatorTest/CalculatorTest'
import { InteractiveTableTest } from './components/InteractiveTableTest/InteractiveTableTest'
import { SEOContent } from './components/SEO/SEOContent'
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
  const [isConnected, setIsConnected] = useState(false)
  const [appState, setAppState] = useState<AppState>(AppState.CONNECTING)
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null)
  const [playerId, setPlayerId] = useState<string>('')
  const [testComponent, setTestComponent] = useState<'deck' | 'calculator' | 'interactive' | null>(null)
  const [gameCount, setGameCount] = useState<number>(0)
  const [isSpectator, setIsSpectator] = useState<boolean>(false)

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

    // Handle room-joined for spectators
    socketService.on('room-joined', (data: { room: GameRoom; playerId: string; isSpectator?: boolean }) => {
      if (data.isSpectator) {
        handleRoomJoined(data.room, data.playerId, false, true)
      }
    })

    return () => {
      socketService.off('connect')
      socketService.off('disconnect')
      socketService.off('room-joined')
      socketService.disconnect()
    }
  }, [])

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

  const handleRoomJoined = (room: GameRoom, playerId: string, isReconnection: boolean = false, isSpectator: boolean = false) => {
    setCurrentRoom(room)
    setPlayerId(playerId)
    setIsSpectator(isSpectator)
    
    // Spectators go directly to game view
    if (isSpectator) {
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
  }

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
      {/* Game counter at the very top */}
      <div className="game-counter">
        {gameCount} games played since server start
      </div>
      
      <header className="app-header">
        <h1>24 Points Game</h1>
        <div className="header-actions">
          <button 
            className="test-mode-btn"
            onClick={() => {
              setAppState(appState === AppState.TEST_MODE ? AppState.LOBBY : AppState.TEST_MODE);
              setTestComponent(null);
            }}
          >
            {appState === AppState.TEST_MODE ? 'Exit Test Mode' : 'Test Mode'}
          </button>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </header>

      <main className="app-main">
        {appState === AppState.CONNECTING && (
          <div className="connecting">
            <h2>Connecting to server...</h2>
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
                <h2>Select Test Component</h2>
                <div className="test-options">
                  <button onClick={() => setTestComponent('deck')}>
                    Deck System Test
                  </button>
                  <button onClick={() => setTestComponent('calculator')}>
                    Calculator Test
                  </button>
                  <button onClick={() => setTestComponent('interactive')}>
                    Interactive Table Test
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
                  ← Back to Test Menu
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