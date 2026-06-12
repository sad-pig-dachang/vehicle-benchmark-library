import { BatteryCharging, Car, Database, Globe2, Search, SlidersHorizontal, Tag } from 'lucide-react';
import { energyOptions, levelOptions, statusOptions } from '../constants/options';
import type { FilterState } from '../types/filters';
import type { DataStatus, EnergyType, VehicleLevel } from '../types/vehicle';

interface FilterSidebarProps {
  filters: FilterState;
  availableScenarioTags: string[];
  availableHmiTags: string[];
  availableStylingTags: string[];
  resultCount: number;
  totalCount: number;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const toggleItem = <T extends string>(list: T[], value: T) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

export function FilterSidebar({
  filters,
  availableScenarioTags,
  availableHmiTags,
  availableStylingTags,
  resultCount,
  totalCount,
  onChange,
  onReset,
}: FilterSidebarProps) {
  const patch = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });

  const renderChips = <T extends string>(
    items: T[],
    selected: T[],
    onToggle: (value: T) => void,
  ) => (
    <div className="filter-chip-grid">
      {items.map((item) => (
        <button
          className={`filter-chip ${selected.includes(item) ? 'is-active' : ''}`}
          key={item}
          type="button"
          onClick={() => onToggle(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );

  return (
    <aside className="filter-sidebar">
      <div className="sidebar-title">
        <div>
          <p>Vehicle Benchmark</p>
          <h1>汽车竞品车型库</h1>
        </div>
        <SlidersHorizontal size={22} />
      </div>

      <div className="sidebar-count">
        <strong>{resultCount}</strong>
        <span>/ {totalCount} 台车型</span>
      </div>

      <section className="filter-section">
        <label className="filter-label" htmlFor="vehicle-search">
          <Search size={16} />
          搜索车型 / 品牌
        </label>
        <input
          id="vehicle-search"
          className="control-input control-input--dark"
          placeholder="例如 Tesla / ES6 / 小米"
          value={filters.search}
          onChange={(event) => patch({ search: event.target.value })}
        />
      </section>

      <section className="filter-section">
        <div className="filter-label">
          <Globe2 size={16} />
          国内 / 海外
        </div>
        <div className="segmented segmented--dark">
          {(['全部', '国内', '海外'] as const).map((market) => (
            <button
              className={filters.market === market ? 'is-active' : ''}
              key={market}
              type="button"
              onClick={() => patch({ market })}
            >
              {market}
            </button>
          ))}
        </div>
      </section>

      <section className="filter-section">
        <div className="filter-label">
          <BatteryCharging size={16} />
          能源形式
        </div>
        {renderChips<EnergyType>(energyOptions, filters.energies, (value) =>
          patch({ energies: toggleItem(filters.energies, value) }),
        )}
      </section>

      <section className="filter-section">
        <div className="filter-label">
          <Car size={16} />
          车型级别
        </div>
        {renderChips<VehicleLevel>(levelOptions, filters.levels, (value) =>
          patch({ levels: toggleItem(filters.levels, value) }),
        )}
      </section>

      <section className="filter-section">
        <div className="filter-label">价格区间（万元）</div>
        <div className="range-row">
          <input
            className="control-input control-input--dark"
            placeholder="最低"
            type="number"
            value={filters.priceMin}
            onChange={(event) => patch({ priceMin: event.target.value })}
          />
          <input
            className="control-input control-input--dark"
            placeholder="最高"
            type="number"
            value={filters.priceMax}
            onChange={(event) => patch({ priceMax: event.target.value })}
          />
        </div>
      </section>

      <section className="filter-section">
        <div className="filter-label">
          <Tag size={16} />
          使用场景标签
        </div>
        {renderChips(availableScenarioTags, filters.scenarioTags, (value) =>
          patch({ scenarioTags: toggleItem(filters.scenarioTags, value) }),
        )}
      </section>

      <section className="filter-section">
        <div className="filter-label">HMI 标签</div>
        {renderChips(availableHmiTags, filters.hmiTags, (value) =>
          patch({ hmiTags: toggleItem(filters.hmiTags, value) }),
        )}
      </section>

      <section className="filter-section">
        <div className="filter-label">内外饰标签</div>
        {renderChips(availableStylingTags, filters.stylingTags, (value) =>
          patch({ stylingTags: toggleItem(filters.stylingTags, value) }),
        )}
      </section>

      <section className="filter-section">
        <div className="filter-label">
          <Database size={16} />
          数据状态
        </div>
        {renderChips<DataStatus>(statusOptions, filters.statuses, (value) =>
          patch({ statuses: toggleItem(filters.statuses, value) }),
        )}
      </section>

      <button className="ghost-button ghost-button--dark" type="button" onClick={onReset}>
        清空筛选
      </button>
    </aside>
  );
}
