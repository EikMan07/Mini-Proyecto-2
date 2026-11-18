export const spring = { type: 'spring', stiffness: 380, damping: 28, mass: 0.8 };
export const springSoft = { type: 'spring', stiffness: 260, damping: 24 };
export const springBouncy = { type: 'spring', stiffness: 420, damping: 18 };

export const pageVariants = {
  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: .34, ease: [0.22, 1, .36, 1], staggerChildren: .07 } },
  exit: { opacity: 0, y: -14, filter: 'blur(4px)', transition: { duration: .18, ease: 'easeIn' } },
};

export const dashboardVariants = {
  initial: {},
  animate: { transition: { staggerChildren: .09, delayChildren: .08 } },
};

export const dashboardItemVariants = {
  initial: { opacity: 0, y: 22, scale: .985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { ...springSoft, duration: .38 } },
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
