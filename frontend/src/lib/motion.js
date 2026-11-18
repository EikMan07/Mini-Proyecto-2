export const spring = { type: 'spring', stiffness: 380, damping: 28, mass: 0.8 };
export const springSoft = { type: 'spring', stiffness: 260, damping: 24 };
export const springBouncy = { type: 'spring', stiffness: 420, damping: 18 };

export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { ...springSoft, staggerChildren: 0.06 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const cardVariants = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: springSoft },
  hover: { y: -4, transition: spring },
  tap: { scale: 0.985 },
};

export const messageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: springSoft },
};

export const buttonTap = { scale: 0.97, transition: { type: 'spring', stiffness: 500, damping: 25 } };
