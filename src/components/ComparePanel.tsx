import { ArrowLeft, X } from 'lucide-react';
import type { CSSProperties } from 'react';
import { formatPrice, joinOrDash } from '../constants/options';
import type { Vehicle } from '../types/vehicle';

interface ComparePanelProps {
  vehicles: Vehicle[];
  onBack: () => void;
  onRemove: (vehicleId: string) => void;
}

const compareRows = [
  {
    label: '基础参数',
    value: (vehicle: Vehicle) =>
      `${vehicle.year} 款 / ${vehicle.countryRegion} / ${vehicle.level} / ${vehicle.energy} / ${formatPrice(
        vehicle.priceMin,
        vehicle.priceMax,
      )}`,
  },
  {
    label: '产品定位',
    value: (vehicle: Vehicle) => vehicle.productPositioning,
  },
  {
    label: '目标用户',
    value: (vehicle: Vehicle) => vehicle.targetUsers,
  },
  {
    label: '体验场景',
    value: (vehicle: Vehicle) => vehicle.experiencePoints.map((item) => item.title).join(' / '),
  },
  {
    label: 'HMI',
    value: (vehicle: Vehicle) => vehicle.hmiPoints.map((item) => item.title).join(' / '),
  },
  {
    label: '内饰',
    value: (vehicle: Vehicle) => vehicle.interiorPoints.map((item) => item.referenceValue).join(' / '),
  },
  {
    label: '外饰',
    value: (vehicle: Vehicle) => vehicle.exteriorPoints.map((item) => item.referenceValue).join(' / '),
  },
  {
    label: '用户讨论度',
    value: (vehicle: Vehicle) =>
      vehicle.links.map((item) => `${item.platform}：${item.heat}，${item.sentiment}`).join(' / '),
  },
  {
    label: '可借鉴点',
    value: (vehicle: Vehicle) => joinOrDash(vehicle.benchmarkSuitability),
  },
];

export function ComparePanel({ vehicles, onBack, onRemove }: ComparePanelProps) {
  return (
    <main className="compare-page">
      <div className="profile-toolbar">
        <button className="ghost-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          返回总览
        </button>
      </div>

      <section className="overview-hero">
        <div>
          <p className="eyebrow">Comparison</p>
          <h2>车型横向对比</h2>
          <p>支持 2-3 台车对比，重点用于设计、体验和 HMI 讨论会的快速扫读。</p>
        </div>
      </section>

      {vehicles.length < 2 ? (
        <div className="empty-state">
          <h3>请至少加入 2 台车</h3>
          <p>回到总览页，在车型卡片上点击对比按钮即可加入对比池。</p>
        </div>
      ) : (
        <section className="compare-table" style={{ '--compare-cols': vehicles.length } as CSSProperties}>
          <div className="compare-row compare-row--header">
            <div className="compare-label">维度</div>
            {vehicles.map((vehicle) => (
              <div className="compare-vehicle" key={vehicle.id}>
                <div>
                  <span>{vehicle.brand}</span>
                  <strong>{vehicle.model}</strong>
                </div>
                <button title="移出对比" type="button" onClick={() => onRemove(vehicle.id)}>
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>

          {compareRows.map((row) => (
            <div className="compare-row" key={row.label}>
              <div className="compare-label">{row.label}</div>
              {vehicles.map((vehicle) => (
                <div className="compare-cell" key={`${vehicle.id}-${row.label}`}>
                  {row.value(vehicle) || '待补充'}
                </div>
              ))}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
