import React, { useEffect, useRef } from 'react';
import './OperationMenu.css';

interface OperationMenuProps {
  position: { x: number; y: number };
  onSelect: (operation: '+' | '-' | '*' | '/') => void;
  onClose: () => void;
}

export const OperationMenu: React.FC<OperationMenuProps> = ({ position, onSelect, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Calculate menu position to keep it within viewport
  const getMenuStyle = () => {
    const menuWidth = 250; // Approximate menu width
    const menuHeight = 80; // Approximate menu height
    const padding = 20;
    
    let left = position.x - menuWidth / 2;
    let top = position.y - menuHeight / 2;

    // Adjust if menu would go off screen
    if (left < padding) left = padding;
    if (top < padding) top = padding;
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }
    if (top + menuHeight > window.innerHeight - padding) {
      top = window.innerHeight - menuHeight - padding;
    }

    return { left, top };
  };

  const operations = [
    { symbol: '+', label: 'Add' },
    { symbol: '-', label: 'Subtract' },
    { symbol: '*', label: 'Multiply' },
    { symbol: '/', label: 'Divide' }
  ] as const;

  return (
    <div 
      ref={menuRef}
      className="operation-menu"
      style={getMenuStyle()}
    >
      <div className="operation-menu-inner">
        {operations.map(({ symbol, label }) => (
          <button
            key={symbol}
            className="operation-btn"
            onClick={() => onSelect(symbol)}
            aria-label={label}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
};