import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import './PuzzleRecords.css';

interface PuzzleRecordsProps {
  occurrenceCount?: number;
  bestRecord?: {
    username: string;
    timeSeconds: number;
  } | null;
}

export const PuzzleRecords: React.FC<PuzzleRecordsProps> = ({ 
  occurrenceCount = 0, 
  bestRecord
}) => {
  const { t } = useTranslation();

  console.log('[PuzzleRecords] RENDERING:', {
    occurrenceCount,
    bestRecord,
    isFirstTime: occurrenceCount <= 1 && !bestRecord,
    timestamp: new Date().toISOString()
  });

  // Always show the component if we have any data
  // (even if occurrenceCount is 0, it might be loading or a first-time puzzle)

  return (
    <div className="puzzle-records">
      <motion.div 
        className={`records-container ${occurrenceCount <= 1 && !bestRecord ? 'first-time' : ''}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="record-info">
          {occurrenceCount <= 1 && !bestRecord ? (
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
              {bestRecord ? (
                <>
                  <span className="separator">•</span>
                  <span className="best-record">
                    {t('gameScreen.puzzleRecords.record', { 
                      username: bestRecord.username, 
                      time: bestRecord.timeSeconds.toFixed(1) 
                    })}
                  </span>
                </>
              ) : occurrenceCount > 1 ? (
                <>
                  <span className="separator">•</span>
                  <span className="no-record">
                    {t('gameScreen.puzzleRecords.noRecordYet')}
                  </span>
                </>
              ) : null}
            </>
          )}
        </div>
      </motion.div>

    </div>
  );
};