import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import './PuzzleRecords.css';

interface PuzzleRecordsProps {
  occurrenceCount?: number;
  bestRecord?: {
    username: string;
    timeSeconds: number;
  } | null;
  showNewRecord?: boolean;
}

export const PuzzleRecords: React.FC<PuzzleRecordsProps> = ({ 
  occurrenceCount = 0, 
  bestRecord,
  showNewRecord = false
}) => {
  const { t } = useTranslation();

  // Don't show anything if no occurrence data
  if (occurrenceCount === 0 && !bestRecord) {
    return null;
  }

  return (
    <div className="puzzle-records">
      <motion.div 
        className={`records-container ${occurrenceCount === 1 && !bestRecord ? 'first-time' : ''}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="record-info">
          {occurrenceCount === 1 && !bestRecord ? (
            <>
              <span className="first-time-icon">✨</span>
              <span className="first-time-message">
                {t('gameScreen.puzzleRecords.firstTime')}
              </span>
            </>
          ) : (
            <>
              <span className="occurrence-count">
                {t('gameScreen.puzzleRecords.appeared', { count: occurrenceCount })}
              </span>
              {bestRecord && (
                <>
                  <span className="separator">•</span>
                  <span className="best-record">
                    {t('gameScreen.puzzleRecords.record', { 
                      username: bestRecord.username, 
                      time: bestRecord.timeSeconds.toFixed(1) 
                    })}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showNewRecord && (
          <motion.div 
            className="new-record-celebration"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="celebration-text">
              🏆 {t('gameScreen.puzzleRecords.newRecord')} 🏆
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};