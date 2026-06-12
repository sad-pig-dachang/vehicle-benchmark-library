import { AlertCircle, BadgeCheck, Building2, CarFront, Plus } from 'lucide-react';
import type { Vehicle } from '../types/vehicle';
import { VehicleCard } from './VehicleCard';

interface OverviewStats {
  vehicleCount: number;
  brandCount: number;
  pendingCount: number;
  keyModelCount: number;
}

interface OverviewProps {
  vehicles: Vehicle[];
  stats: OverviewStats;
  compareIds: string[];
  onOpen: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onAdd: () => void;
  onToggleCompare: (vehicle: Vehicle) => void;
}

const statItems = [
  { key: 'vehicleCount', label: '车型数量', icon: CarFront },
  { key: 'brandCount', label: '品牌数量', icon: Building2 },
  { key: 'pendingCount', label: '待补充数量', icon: AlertCircle },
  { key: 'keyModelCount', label: '重点车型数量', icon: BadgeCheck },
] as const;

export function Overview({
  vehicles,
  stats,
  compareIds,
  onOpen,
  onEdit,
  onAdd,
  onToggleCompare,
}: OverviewProps) {
  return (
    <main className="overview-page">
      <section className="overview-hero">
        <div>
          <p className="eyebrow">Competition Intelligence</p>
          <h2>竞品车型总览</h2>
          <p>
            用于汽车设计、HMI 与产品体验团队沉淀车型资料、对标点、讨论链接和迭代记录。
          </p>
        </div>
        <button className="primary-button primary-button--large" type="button" onClick={onAdd}>
          <Plus size={18} />
          新增车型
        </button>
      </section>

      <section className="stats-grid">
        {statItems.map(({ key, label, icon: Icon }) => (
          <article className="stat-card" key={key}>
            <Icon size={22} />
            <span>{label}</span>
            <strong>{stats[key]}</strong>
          </article>
        ))}
      </section>

      <section className="vehicle-grid">
        {vehicles.map((vehicle) => (
          <VehicleCard
            isCompared={compareIds.includes(vehicle.id)}
            isCompareDisabled={compareIds.length >= 3}
            key={vehicle.id}
            vehicle={vehicle}
            onEdit={onEdit}
            onOpen={onOpen}
            onToggleCompare={onToggleCompare}
          />
        ))}
      </section>

      {!vehicles.length && (
        <div className="empty-state">
          <h3>没有匹配的车型</h3>
          <p>可以放宽筛选条件，或新增一台车型继续整理资料。</p>
          <button className="secondary-button" type="button" onClick={onAdd}>
            新增车型
          </button>
        </div>
      )}
    </main>
  );
}
