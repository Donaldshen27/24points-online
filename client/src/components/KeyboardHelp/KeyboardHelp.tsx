import React from 'react';
import './KeyboardHelp.css';

interface KeyboardHelpProps {
  show: boolean;
  onClose: () => void;
}

export const KeyboardHelp: React.FC<KeyboardHelpProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="keyboard-help-overlay" onClick={onClose}>
      <div className="keyboard-help-content" onClick={e => e.stopPropagation()}>
        <h3>Keyboard Shortcuts</h3>
        
        <div className="help-section">
          <h4>Card Selection</h4>
          <div className="help-item">
            <kbd>1</kbd> - <kbd>9</kbd>
            <span>Select cards by number</span>
          </div>
          <div className="help-item">
            <kbd>0</kbd>
            <span>Select 10th card</span>
          </div>
        </div>

        <div className="help-section">
          <h4>Operations</h4>
          <div className="help-item">
            <kbd>+</kbd> or <kbd>=</kbd>
            <span>Addition</span>
          </div>
          <div className="help-item">
            <kbd>-</kbd>
            <span>Subtraction</span>
          </div>
          <div className="help-item">
            <kbd>*</kbd> or <kbd>x</kbd>
            <span>Multiplication</span>
          </div>
          <div className="help-item">
            <kbd>/</kbd> or <kbd>?</kbd>
            <span>Division</span>
          </div>
        </div>

        <div className="help-section">
          <h4>Actions</h4>
          <div className="help-item">
            <kbd>Backspace</kbd> or <kbd>U</kbd>
            <span>Undo last operation</span>
          </div>
          <div className="help-item">
            <kbd>R</kbd>
            <span>Reset all</span>
          </div>
          <div className="help-item">
            <kbd>Esc</kbd>
            <span>Cancel selection</span>
          </div>
          <div className="help-item">
            <kbd>H</kbd>
            <span>Toggle this help</span>
          </div>
        </div>

        <button className="close-help-btn" onClick={onClose}>
          Close (ESC)
        </button>
      </div>
    </div>
  );
};