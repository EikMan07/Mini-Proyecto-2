import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const distance = shouldReduceMotion ? 0 : 7;
  const variants = {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -distance / 2, transition: { duration: 0.14, ease: 'easeIn' } },
  };

  return (
    <div className="route-transition">
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          className="route-view"
          key={location.pathname}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
