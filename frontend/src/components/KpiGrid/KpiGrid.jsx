import KpiCard from '../KpiCard/KpiCard';
export default function KpiGrid({ items }) { return <div className="kpi-grid">{items.map((item) => <KpiCard {...item} key={item.label} />)}</div>; }
