import React, { useState, useEffect } from 'react';
import socketService from '../../services/socketService';
import { puzzleRecordsCache } from '../../services/puzzleRecordsCache';
import './PuzzleRecordsView.css';
import './PuzzleRecordsView.mobile.css';

interface PuzzleRecord {
  puzzleKey: string;
  cards: number[];
  occurrenceCount: number;
  bestRecord?: {
    username: string;
    solveTimeMs: number;
    solution?: string;
  };
}

type SortMode = 'occurrence' | 'shortest' | 'longest' | 'numbersAsc' | 'numbersDesc';

export const PuzzleRecordsView: React.FC = () => {
  const [puzzleRecords, setPuzzleRecords] = useState<PuzzleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('occurrence');
  const [rawRecords, setRawRecords] = useState<PuzzleRecord[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    // Check cache first
    const cachedData = puzzleRecordsCache.get('puzzle-records');
    if (cachedData) {
      setRawRecords(cachedData);
      setLoading(false);
      
      // Still fetch fresh data in background for next time
      fetchRecordsInBackground();
    } else {
      // No cache, fetch immediately
      fetchRecords();
    }

    // Refresh every 30 seconds (less aggressive)
    const interval = setInterval(fetchRecordsInBackground, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecords = () => {
    socketService.emit('get-puzzle-records', (data: { records: PuzzleRecord[] }) => {
      const filtered = data.records.filter(record => record.cards.length === 4);
      setRawRecords(filtered);
      puzzleRecordsCache.set('puzzle-records', filtered);
      setLoading(false);
    });
  };

  const fetchRecordsInBackground = () => {
    socketService.emit('get-puzzle-records', (data: { records: PuzzleRecord[] }) => {
      const filtered = data.records.filter(record => record.cards.length === 4);
      puzzleRecordsCache.set('puzzle-records', filtered);
      
      // Only update state if data changed significantly
      if (JSON.stringify(filtered) !== JSON.stringify(rawRecords)) {
        setRawRecords(filtered);
      }
    });
  };

  // Sort records based on current sort mode
  useEffect(() => {
    let sorted = [...rawRecords];
    
    switch (sortMode) {
      case 'occurrence':
        sorted.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
        break;
      case 'shortest':
        sorted.sort((a, b) => {
          const aTime = a.bestRecord?.solveTimeMs ?? Infinity;
          const bTime = b.bestRecord?.solveTimeMs ?? Infinity;
          return aTime - bTime;
        });
        break;
      case 'longest':
        sorted.sort((a, b) => {
          const aTime = a.bestRecord?.solveTimeMs ?? -1;
          const bTime = b.bestRecord?.solveTimeMs ?? -1;
          return bTime - aTime;
        });
        break;
      case 'numbersAsc':
        sorted.sort((a, b) => {
          const aSum = a.cards.reduce((sum, card) => sum + card, 0);
          const bSum = b.cards.reduce((sum, card) => sum + card, 0);
          return aSum - bSum;
        });
        break;
      case 'numbersDesc':
        sorted.sort((a, b) => {
          const aSum = a.cards.reduce((sum, card) => sum + card, 0);
          const bSum = b.cards.reduce((sum, card) => sum + card, 0);
          return bSum - aSum;
        });
        break;
    }
    
    setPuzzleRecords(sorted); // Display all records
  }, [rawRecords, sortMode]);

  const formatTime = (ms: number) => {
    const seconds = ms / 1000;
    return seconds.toFixed(1) + 's';
  };

  const getLastOperation = (solution?: string) => {
    if (!solution) return null;
    
    // Solution format is like "5 - 1 = 4, 5 × 4 = 20, 20 + 5 = 25, 25 - 1 = 24"
    // Or could use arrows: "5 - 1 = 4 → 5 × 4 = 20 → 20 + 5 = 25 → 25 - 1 = 24"
    const operations = solution.split(/[,→]/).map(op => op.trim());
    const lastOp = operations[operations.length - 1];
    
    // Extract just the calculation part (e.g., "25 - 1 = 24")
    if (lastOp && lastOp.includes('=')) {
      return lastOp;
    }
    
    return null;
  };

  const getCardColor = (value: number) => {
    if (value <= 3) return '#4CAF50'; // Green for low numbers
    if (value <= 6) return '#2196F3'; // Blue for medium numbers
    if (value <= 9) return '#FF9800'; // Orange for high numbers
    return '#F44336'; // Red for 10
  };

  if (loading) {
    return (
      <div className="puzzle-records-view">
        <h2>Puzzle Records</h2>
        <div className="loading">Loading puzzle records...</div>
      </div>
    );
  }

  return (
    <div className="puzzle-records-view">
      <h2>Puzzle Records</h2>
      
      <div className="sort-controls">
        <span className="sort-label">Sort by:</span>
        <button 
          className={`sort-btn ${sortMode === 'occurrence' ? 'active' : ''}`}
          onClick={() => setSortMode('occurrence')}
        >
          Most Common
        </button>
        <button 
          className={`sort-btn ${sortMode === 'shortest' ? 'active' : ''}`}
          onClick={() => setSortMode('shortest')}
        >
          Shortest Time
        </button>
        <button 
          className={`sort-btn ${sortMode === 'longest' ? 'active' : ''}`}
          onClick={() => setSortMode('longest')}
        >
          Longest Time
        </button>
        <button 
          className={`sort-btn ${sortMode === 'numbersAsc' ? 'active' : ''}`}
          onClick={() => setSortMode('numbersAsc')}
        >
          Numbers ↑
        </button>
        <button 
          className={`sort-btn ${sortMode === 'numbersDesc' ? 'active' : ''}`}
          onClick={() => setSortMode('numbersDesc')}
        >
          Numbers ↓
        </button>
      </div>
      
      <div className="records-grid">
        {puzzleRecords.map((record, index) => (
          <div
            key={record.puzzleKey}
            className={`record-item ${hoveredIndex === index ? 'hovered' : ''} ${expandedIndex === index ? 'expanded' : ''} ${record.bestRecord ? 'has-record' : 'no-record-data'}`}
            onMouseEnter={() => !isMobile && setHoveredIndex(index)}
            onMouseLeave={() => !isMobile && setHoveredIndex(null)}
            onClick={() => isMobile && record.bestRecord && setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <div className="rank">
              {sortMode === 'occurrence' && `#${index + 1}`}
              {sortMode === 'shortest' && record.bestRecord && formatTime(record.bestRecord.solveTimeMs)}
              {sortMode === 'longest' && record.bestRecord && formatTime(record.bestRecord.solveTimeMs)}
              {(sortMode === 'numbersAsc' || sortMode === 'numbersDesc') && 
                `Σ${record.cards.reduce((sum, card) => sum + card, 0)}`}
            </div>
            <div className="cards-display">
              {record.cards.map((card, cardIndex) => (
                <div
                  key={cardIndex}
                  className="card-value"
                  style={{ backgroundColor: getCardColor(card) }}
                >
                  {card}
                </div>
              ))}
            </div>
            <div className="occurrence-count">
              {record.occurrenceCount} {record.occurrenceCount === 1 ? 'time' : 'times'}
            </div>
            
            {hoveredIndex === index && record.bestRecord && (
              <div className="record-tooltip">
                <div className="tooltip-content">
                  <div className="record-holder">
                    <span className="trophy">🏆</span>
                    <span className="username">{record.bestRecord.username}</span>
                  </div>
                  <div className="record-time">
                    {formatTime(record.bestRecord.solveTimeMs)}
                  </div>
                  {getLastOperation(record.bestRecord.solution) && (
                    <div className="last-operation">
                      {getLastOperation(record.bestRecord.solution)}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Mobile expanded view */}
            {isMobile && expandedIndex === index && record.bestRecord && (
              <div className="mobile-record-details">
                <div className="record-holder">
                  <span className="trophy">🏆</span>
                  <span className="username">{record.bestRecord.username}</span>
                </div>
                <div className="record-time">
                  {formatTime(record.bestRecord.solveTimeMs)}
                </div>
                {getLastOperation(record.bestRecord.solution) && (
                  <div className="last-operation">
                    {getLastOperation(record.bestRecord.solution)}
                  </div>
                )}
              </div>
            )}
            
            {!record.bestRecord && (
              <div className="no-record">No record yet</div>
            )}
          </div>
        ))}
      </div>
      
      {puzzleRecords.length === 0 && (
        <div className="no-data">No puzzle records yet. Play some games!</div>
      )}
    </div>
  );
};