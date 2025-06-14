import React, { useEffect } from 'react';
import { useDeckManager } from '../../hooks/useDeckManager';
import { PlayerHand } from '../PlayerHand/PlayerHand';
import { CenterTable } from '../CenterTable/CenterTable';
import type { Player } from '../../types/game.types';
import './DeckTest.css';

export const DeckTest: React.FC = () => {
  const {
    deckState,
    initializeDecks,
    dealNewRound,
    selectCard,
    clearSelection,
    transferCardsToPlayer,
    getPlayerStats
  } = useDeckManager();

  useEffect(() => {
    initializeDecks();
  }, [initializeDecks]);

  const stats = getPlayerStats();

  // Create mock players for display
  const player1: Player = {
    id: 'player1',
    socketId: 'socket1',
    name: 'Player 1',
    deck: deckState.player1Deck,
    isReady: true
  };

  const player2: Player = {
    id: 'player2',
    socketId: 'socket2',
    name: 'Player 2',
    deck: deckState.player2Deck,
    isReady: true
  };

  return (
    <div className="deck-test">
      <h2>Deck System Test</h2>
      
      <div className="test-controls">
        <button onClick={initializeDecks}>Reset Decks</button>
        <button onClick={dealNewRound} disabled={!stats.canContinue}>
          Deal New Round
        </button>
        <button onClick={clearSelection} disabled={deckState.selectedCards.length === 0}>
          Clear Selection
        </button>
        <button 
          onClick={() => transferCardsToPlayer('player1')} 
          disabled={deckState.centerCards.length === 0}
        >
          P1 Takes Cards
        </button>
        <button 
          onClick={() => transferCardsToPlayer('player2')} 
          disabled={deckState.centerCards.length === 0}
        >
          P2 Takes Cards
        </button>
      </div>

      <div className="game-stats">
        <p>P1 Cards: {stats.player1Cards} | P2 Cards: {stats.player2Cards}</p>
        <p>Selected: {deckState.selectedCards.length}/4</p>
      </div>

      <div className="game-layout">
        <PlayerHand
          player={player1}
          isCurrentPlayer={true}
          showCards={true}
        />
        
        <CenterTable
          cards={deckState.centerCards}
          onCardClick={selectCard}
          selectedCards={deckState.selectedCards}
        />
        
        <PlayerHand
          player={player2}
          isCurrentPlayer={false}
          showCards={false}
        />
      </div>

      {deckState.selectedCards.length === 4 && (
        <div className="selected-cards-display">
          <h3>Selected Cards: {deckState.selectedCards.map(c => c.value).join(', ')}</h3>
          <p>Ready to solve for 24!</p>
        </div>
      )}
    </div>
  );
};