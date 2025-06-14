import { useState, useCallback } from 'react';
import type { Card, Player } from '../types/game.types';
import { CardUtils } from '../utils/cardUtils';

interface DeckState {
  player1Deck: Card[];
  player2Deck: Card[];
  centerCards: Card[];
  selectedCards: Card[];
}

export const useDeckManager = () => {
  const [deckState, setDeckState] = useState<DeckState>({
    player1Deck: [],
    player2Deck: [],
    centerCards: [],
    selectedCards: []
  });

  const initializeDecks = useCallback(() => {
    const { player1Deck, player2Deck } = CardUtils.initializePlayerDecks();
    setDeckState({
      player1Deck,
      player2Deck,
      centerCards: [],
      selectedCards: []
    });
  }, []);

  const dealNewRound = useCallback(() => {
    setDeckState(prev => {
      if (prev.player1Deck.length < 2 || prev.player2Deck.length < 2) {
        console.error('Not enough cards to deal');
        return prev;
      }

      const { drawn: p1Cards, remaining: p1Remaining } = CardUtils.drawCards(prev.player1Deck, 2);
      const { drawn: p2Cards, remaining: p2Remaining } = CardUtils.drawCards(prev.player2Deck, 2);

      return {
        player1Deck: p1Remaining,
        player2Deck: p2Remaining,
        centerCards: [...p1Cards, ...p2Cards],
        selectedCards: []
      };
    });
  }, []);

  const selectCard = useCallback((card: Card) => {
    setDeckState(prev => {
      const isSelected = prev.selectedCards.some(c => c.id === card.id);
      
      if (isSelected) {
        return {
          ...prev,
          selectedCards: prev.selectedCards.filter(c => c.id !== card.id)
        };
      } else if (prev.selectedCards.length < 4) {
        return {
          ...prev,
          selectedCards: [...prev.selectedCards, card]
        };
      }
      
      return prev;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setDeckState(prev => ({
      ...prev,
      selectedCards: []
    }));
  }, []);

  const transferCardsToPlayer = useCallback((toPlayer: 'player1' | 'player2') => {
    setDeckState(prev => {
      const transferredCards = CardUtils.transferCards(prev.centerCards, toPlayer);
      
      if (toPlayer === 'player1') {
        return {
          ...prev,
          player1Deck: CardUtils.shuffleDeck([...prev.player1Deck, ...transferredCards]),
          centerCards: [],
          selectedCards: []
        };
      } else {
        return {
          ...prev,
          player2Deck: CardUtils.shuffleDeck([...prev.player2Deck, ...transferredCards]),
          centerCards: [],
          selectedCards: []
        };
      }
    });
  }, []);

  const updateFromServerState = useCallback((players: Player[], centerCards: Card[]) => {
    if (players.length === 2) {
      setDeckState({
        player1Deck: players[0].deck,
        player2Deck: players[1].deck,
        centerCards,
        selectedCards: []
      });
    }
  }, []);

  const getPlayerStats = useCallback(() => {
    return {
      player1Cards: deckState.player1Deck.length,
      player2Cards: deckState.player2Deck.length,
      canContinue: deckState.player1Deck.length >= 2 && deckState.player2Deck.length >= 2
    };
  }, [deckState]);

  return {
    deckState,
    initializeDecks,
    dealNewRound,
    selectCard,
    clearSelection,
    transferCardsToPlayer,
    updateFromServerState,
    getPlayerStats
  };
};