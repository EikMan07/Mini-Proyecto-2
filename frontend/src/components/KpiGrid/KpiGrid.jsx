import { motion } from 'framer-motion';
import KpiCard from '../KpiCard/KpiCard';
import { dashboardVariants } from '../../lib/motion';
export default function KpiGrid({ items = [] }) { return <motion.div className="kpi-grid" variants={dashboardVariants}>{items.map((item, index) => <KpiCard {...item} index={index} key={item.label} />)}</motion.div>; }
