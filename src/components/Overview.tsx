import { AlertCircle, BadgeCheck, Building2, CarFront } from 'lucide-react';
import heroImage from '../assets/figma-yu7-optimized/hero.jpg';
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
  onToggleCompare,
}: OverviewProps) {
  return (
    <main className="overview-page">
      <section className="overview-hero overview-hero--figma" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="overview-hero__scrim" />
        <div>
          <p className="eyebrow">Vehicle Benchmark / Full Profile</p>
          <h2>竞品车型库</h2>
          <p>
            面向汽车设计、HMI 与产品体验团队，按 L1 用户市场、L2 车型档案、L3 对标分析、L4 设计借鉴、L5 测评追溯组织单车资料。
          </p>
          <div className="overview-hero__tags">
            <span>L1-L5 单车档案</span>
            <span>体验场景对标</span>
            <span>HMI / 内外饰</span>
            <span>飞书数据源</span>
          </div>
        </div>
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
            onOpen={onOpen}
            onToggleCompare={onToggleCompare}
          />
        ))}
      </section>

      {!vehicles.length && (
        <div className="empty-state">
          <h3>没有匹配的车型</h3>
          <p>可以放宽筛选条件，或在飞书多维表格中补充车型资料。</p>
        </div>
      )}
    </main>
  );
}
