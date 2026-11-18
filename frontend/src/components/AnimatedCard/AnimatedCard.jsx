import { motion } from 'framer-motion';
import { cardVariants } from '../../lib/motion';

export default function AnimatedCard({ children, className = '', elevated = true, delay = 0, ...props }) {
  return <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover={elevated ? 'hover' : undefined} whileTap="tap" transition={{ delay }} className={className} {...props}>{children}</motion.div>;
}
