import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageVariants } from '../../lib/motion';

export default function PageTransition({ children }) {
  const location = useLocation();
  return <AnimatePresence mode="wait"><motion.div className="route-transition" key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">{children}</motion.div></AnimatePresence>;
}
