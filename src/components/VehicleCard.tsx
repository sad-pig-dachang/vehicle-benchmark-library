import { ExternalLink, GitCompare } from 'lucide-react';
import { formatPrice } from '../constants/options';
import type { Vehicle } from '../types/vehicle';
import { TagList } from './TagList';

interface VehicleCardProps {
  vehicle: Vehicle;
  isCompared: boolean;
  isCompareDisabled: boolean;
  onOpen: (vehicle: Vehicle) => void;
  onToggleCompare: (vehicle: Vehicle) => void;
}

export function VehicleCard({
  vehicle,
  isCompared,
  isCompareDisabled,
  onOpen,
  onToggleCompare,
}: VehicleCardProps) {
  return (
    <article className="vehicle-card">
      <div
        className="vehicle-card__image"
        style={{ backgroundImage: `url(${vehicle.coverImage.url})` }}
        aria-label={vehicle.coverImage.alt}
      >
        <span className={`status-pill status-pill--${vehicle.status}`}>{vehicle.status}</span>
        {vehicle.isKeyModel && <span className="key-pill">重点车型</span>}
      </div>

      <div className="vehicle-card__body">
        <div className="vehicle-card__meta">
          <span>{vehicle.brand}</span>
          <span>{vehicle.year} 款</span>
        </div>
        <h3>{vehicle.model}</h3>
        <p className="vehicle-card__summary">{vehicle.summary}</p>

        <div className="spec-strip">
          <span>{vehicle.energy}</span>
          <span>{vehicle.level}</span>
          <span>{formatPrice(vehicle.priceMin, vehicle.priceMax)}</span>
        </div>

        <div className="highlight-list">
          {vehicle.coreHighlights.slice(0, 3).map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>

        <TagList tags={[...vehicle.keyTags, ...vehicle.scenarioTags].slice(0, 6)} />

        <div className="card-actions">
          <button className="primary-button" type="button" onClick={() => onOpen(vehicle)}>
            <ExternalLink size={16} />
            打开档案
          </button>
          <button
            className={`icon-button ${isCompared ? 'is-active' : ''}`}
            disabled={!isCompared && isCompareDisabled}
            title={isCompared ? '移出对比' : '加入对比'}
            type="button"
            onClick={() => onToggleCompare(vehicle)}
          >
            <GitCompare size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
