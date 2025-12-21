// Animation and transition constants
export const Animation = {
  // Duration (in milliseconds)
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  
  // Easing functions (for Animated API)
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  // Common animation configs
  spring: {
    damping: 15,
    mass: 1,
    stiffness: 150,
  },
  
  bounce: {
    damping: 8,
    mass: 1,
    stiffness: 100,
  },
};

// Opacity values
export const Opacity = {
  transparent: 0,
  light: 0.3,
  medium: 0.5,
  dark: 0.7,
  almostOpaque: 0.9,
  opaque: 1,
};
