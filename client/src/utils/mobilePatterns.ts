/**
 * Reusable mobile-first patterns and utilities
 * These patterns can be applied across all components for consistent mobile UX
 */

export const mobileBreakpoints = {
  small: 480,
  medium: 600,
  large: 768,
} as const;

export const isMobile = () => window.innerWidth <= mobileBreakpoints.medium;
export const isSmallMobile = () => window.innerWidth <= mobileBreakpoints.small;

/**
 * Touch-friendly sizes following iOS/Android guidelines
 */
export const touchSizes = {
  minTarget: 44, // Minimum touch target size (Apple HIG)
  buttonHeight: 48,
  inputHeight: 52,
  iconButton: 44,
} as const;

/**
 * Mobile-first spacing system
 */
export const mobileSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  screenPadding: 16, // Standard screen edge padding
} as const;

/**
 * Animation configurations optimized for mobile
 */
export const mobileAnimations = {
  bottomSheet: {
    type: 'spring',
    damping: 30,
    stiffness: 300,
  },
  swipe: {
    type: 'spring',
    damping: 25,
    stiffness: 250,
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
} as const;

/**
 * Handle viewport height changes (keyboard, browser UI)
 */
export const useViewportHeight = () => {
  const updateHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  if (typeof window !== 'undefined') {
    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }
};

/**
 * Prevent body scroll when modal is open
 */
export const preventBodyScroll = (prevent: boolean) => {
  if (prevent) {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.overflowY = 'scroll'; // Prevent layout shift
  } else {
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    document.body.style.overflowY = '';
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }
};

/**
 * Detect virtual keyboard height for proper layout adjustment
 */
export const useKeyboardHeight = (callback: (height: number) => void) => {
  const handleResize = () => {
    if (window.visualViewport) {
      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const keyboardHeight = windowHeight - viewportHeight;
      callback(keyboardHeight);
    }
  };

  if (typeof window !== 'undefined' && window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }
};

/**
 * Common mobile modal/sheet props
 */
export const getMobileSheetProps = (onClose: () => void) => ({
  drag: 'y' as const,
  dragConstraints: { top: 0, bottom: 0 },
  dragElastic: { top: 0, bottom: 0.3 },
  onDragEnd: (_: any, info: any) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  },
});

/**
 * Safe area inset CSS variables
 */
export const safeAreaInsets = {
  top: 'env(safe-area-inset-top)',
  right: 'env(safe-area-inset-right)',
  bottom: 'env(safe-area-inset-bottom)',
  left: 'env(safe-area-inset-left)',
} as const;