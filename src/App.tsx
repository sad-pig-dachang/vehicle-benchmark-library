import { Download, GitCompare } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ComparePanel } from './components/ComparePanel';
import { FilterSidebar } from './components/FilterSidebar';
import { Overview } from './components/Overview';
import { VehicleProfile } from './components/VehicleProfile';
import { dataService, dataSourceLabel } from './services/dataService';
import type { FilterState } from './types/filters';
import type { Vehicle } from './types/vehicle';

type ViewMode = 'overview' | 'profile' | 'compare';

const defaultFilters: FilterState = {
  search: '',
  market: '全部',
  energies: [],
  levels: [],
  priceMin: '',
  priceMax: '',
  scenarioTags: [],
  hmiTags: [],
  stylingTags: [],
  statuses: [],
};

const unique = (items: string[]) => Array.from(new Set(items)).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

const tagHit = (selected: string[], target: string[]) =>
  selected.length === 0 || selected.some((tag) => target.includes(tag));

export function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    dataService
      .listVehicles()
      .then(setVehicles)
      .catch((error) => setLoadError(error instanceof Error ? error.message : '加载数据失败'));
  }, []);

  const availableScenarioTags = useMemo(
    () => unique(vehicles.flatMap((vehicle) => vehicle.scenarioTags)),
    [vehicles],
  );

  const availableHmiTags = useMemo(() => unique(vehicles.flatMap((vehicle) => vehicle.hmiTags)), [vehicles]);

  const availableStylingTags = useMemo(
    () => unique(vehicles.flatMap((vehicle) => vehicle.stylingTags)),
    [vehicles],
  );

  const filteredVehicles = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const minPrice = filters.priceMin ? Number(filters.priceMin) : null;
    const maxPrice = filters.priceMax ? Number(filters.priceMax) : null;

    return vehicles.filter((vehicle) => {
      const searchPool = [
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.countryRegion,
        vehicle.energy,
        vehicle.level,
        ...vehicle.keyTags,
        ...vehicle.scenarioTags,
        ...vehicle.hmiTags,
        ...vehicle.stylingTags,
      ]
        .join(' ')
        .toLowerCase();

      if (search && !searchPool.includes(search)) return false;
      if (filters.market !== '全部' && vehicle.market !== filters.market) return false;
      if (filters.energies.length && !filters.energies.includes(vehicle.energy)) return false;
      if (filters.levels.length && !filters.levels.includes(vehicle.level)) return false;
      if (filters.statuses.length && !filters.statuses.includes(vehicle.status)) return false;
      if (minPrice !== null && vehicle.priceMax < minPrice) return false;
      if (maxPrice !== null && vehicle.priceMin > maxPrice) return false;
      if (!tagHit(filters.scenarioTags, vehicle.scenarioTags)) return false;
      if (!tagHit(filters.hmiTags, vehicle.hmiTags)) return false;
      if (!tagHit(filters.stylingTags, vehicle.stylingTags)) return false;
      return true;
    });
  }, [filters, vehicles]);

  const stats = useMemo(
    () => ({
      vehicleCount: filteredVehicles.length,
      brandCount: new Set(filteredVehicles.map((vehicle) => vehicle.brand)).size,
      pendingCount: filteredVehicles.filter((vehicle) => vehicle.status === '待补充').length,
      keyModelCount: filteredVehicles.filter((vehicle) => vehicle.isKeyModel).length,
    }),
    [filteredVehicles],
  );

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null;
  const compareVehicles = compareIds
    .map((id) => vehicles.find((vehicle) => vehicle.id === id))
    .filter(Boolean) as Vehicle[];

  const toggleCompare = (vehicle: Vehicle) => {
    setCompareIds((prev) => {
      if (prev.includes(vehicle.id)) return prev.filter((id) => id !== vehicle.id);
      if (prev.length >= 3) return prev;
      return [...prev, vehicle.id];
    });
  };

  const exportJson = () => {
    const payload = JSON.stringify(vehicles, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vehicle-benchmark-library-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    if (viewMode === 'compare') {
      return (
        <ComparePanel
          vehicles={compareVehicles}
          onBack={() => setViewMode('overview')}
          onRemove={(vehicleId) => setCompareIds((prev) => prev.filter((id) => id !== vehicleId))}
        />
      );
    }

    if (viewMode === 'profile' && selectedVehicle) {
      return (
        <VehicleProfile
          isCompared={compareIds.includes(selectedVehicle.id)}
          isCompareDisabled={compareIds.length >= 3}
          vehicle={selectedVehicle}
          onBack={() => setViewMode('overview')}
          onToggleCompare={toggleCompare}
        />
      );
    }

    return (
      <Overview
        compareIds={compareIds}
        stats={stats}
        vehicles={filteredVehicles}
        onOpen={(vehicle) => {
          setSelectedVehicleId(vehicle.id);
          setViewMode('profile');
        }}
        onToggleCompare={toggleCompare}
      />
    );
  };

  return (
    <div className="app-shell">
      <FilterSidebar
        availableHmiTags={availableHmiTags}
        availableScenarioTags={availableScenarioTags}
        availableStylingTags={availableStylingTags}
        filters={filters}
        resultCount={filteredVehicles.length}
        totalCount={vehicles.length}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      <div className="workspace">
        <header className="workspace-header">
          <div>
            <span>当前数据源：{dataSourceLabel}</span>
            <strong>设计 / HMI / 产品体验团队内部工具 Demo</strong>
          </div>
          <div className="toolbar-actions">
            <button
              className="secondary-button"
              disabled={compareIds.length < 2}
              title="打开对比页"
              type="button"
              onClick={() => setViewMode('compare')}
            >
              <GitCompare size={16} />
              对比 {compareIds.length}
            </button>
            <button className="secondary-button" type="button" onClick={exportJson}>
              <Download size={16} />
              导出 JSON
            </button>
          </div>
        </header>

        {loadError ? (
          <div className="empty-state">
            <h3>数据加载失败</h3>
            <p>{loadError}</p>
          </div>
        ) : (
          renderContent()
        )}
      </div>

    </div>
  );
}
