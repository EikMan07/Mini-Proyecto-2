import { motion } from 'framer-motion';
import { dashboardItemVariants } from '../../lib/motion';

export default function KpiCard({ label, value, detail, trend, tone = 'neutral', index = 0 }) { return <motion.article className={`kpi-card ${tone}`} variants={dashboardItemVariants} custom={index} whileHover={{ y: -6, transition: { type: 'spring', stiffness: 360, damping: 22 } }}><p>{label}</p><strong>{value}</strong><span>{detail}</span><small>{trend}</small></motion.article>; }
