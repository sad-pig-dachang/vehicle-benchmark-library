import { Download, GitCompare, RefreshCcw, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ComparePanel } from './components/ComparePanel';
import { FilterSidebar } from './components/FilterSidebar';
import { Overview } from './components/Overview';
import { VehicleEditor } from './components/VehicleEditor';
import { VehicleProfile } from './components/VehicleProfile';
import { uid } from './constants/options';
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

const makeEmptyVehicle = (): Vehicle => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: uid('vehicle'),
    brand: '',
    model: '',
    year: '2026',
    market: '国内',
    countryRegion: '中国',
    level: 'SUV',
    energy: '纯电',
    priceMin: 0,
    priceMax: 0,
    coverImage: {
      id: uid('media'),
      type: 'image',
      url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80',
      title: '车型封面图',
      alt: '车型封面图',
      source: 'Demo image',
    },
    productPositioning: '',
    targetUsers: '',
    summary: '',
    keyTags: [],
    scenarioTags: [],
    hmiTags: [],
    stylingTags: [],
    status: '待补充',
    completeness: 10,
    updatedAt: today,
    isKeyModel: false,
    spec: {},
    coreHighlights: [],
    designFocus: [],
    benchmarkSuitability: [],
    experiencePoints: [],
    hmiPoints: [],
    exteriorPoints: [],
    interiorPoints: [],
    links: [],
    versionLogs: [],
  };
};

export function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [editor, setEditor] = useState<{ vehicle: Vehicle; isNew: boolean } | null>(null);
  const [loadError, setLoadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const saveVehicle = async (vehicle: Vehicle) => {
    const exists = vehicles.some((item) => item.id === vehicle.id);
    const saved = exists ? await dataService.updateVehicle(vehicle) : await dataService.createVehicle(vehicle);
    const next = exists
      ? vehicles.map((item) => (item.id === saved.id ? saved : item))
      : [saved, ...vehicles];
    setVehicles(next);
    setEditor(null);
    setSelectedVehicleId(saved.id);
    setViewMode('profile');
  };

  const deleteVehicle = async (vehicleId: string) => {
    await dataService.deleteVehicle(vehicleId);
    setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== vehicleId));
    setCompareIds((prev) => prev.filter((id) => id !== vehicleId));
    if (selectedVehicleId === vehicleId) {
      setSelectedVehicleId(null);
      setViewMode('overview');
    }
    setEditor(null);
  };

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

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Vehicle[] | { vehicles: Vehicle[] };
      const next = Array.isArray(parsed) ? parsed : parsed.vehicles;
      if (!Array.isArray(next)) throw new Error('JSON 根节点需要是 Vehicle[] 或 { vehicles: Vehicle[] }');
      const saved = await dataService.saveVehicles(next);
      setVehicles(saved);
      setCompareIds([]);
      setSelectedVehicleId(null);
      setViewMode('overview');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '导入失败，请检查 JSON 文件。');
    } finally {
      event.target.value = '';
    }
  };

  const resetData = async () => {
    if (!window.confirm('确认恢复为内置示例数据？本地修改会被覆盖。')) return;
    try {
      const next = await dataService.resetVehicles();
      setVehicles(next);
      setCompareIds([]);
      setSelectedVehicleId(null);
      setViewMode('overview');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '恢复示例数据失败。');
    }
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
          onEdit={(vehicle) => setEditor({ vehicle, isNew: false })}
          onToggleCompare={toggleCompare}
        />
      );
    }

    return (
      <Overview
        compareIds={compareIds}
        stats={stats}
        vehicles={filteredVehicles}
        onAdd={() => setEditor({ vehicle: makeEmptyVehicle(), isNew: true })}
        onEdit={(vehicle) => setEditor({ vehicle, isNew: false })}
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
            <button className="secondary-button" type="button" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} />
              导入 JSON
            </button>
            <button className="icon-button" title="恢复示例数据" type="button" onClick={resetData}>
              <RefreshCcw size={16} />
            </button>
          </div>
          <input ref={fileInputRef} accept="application/json" hidden type="file" onChange={importJson} />
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

      {editor && (
        <VehicleEditor
          isNew={editor.isNew}
          vehicle={editor.vehicle}
          onClose={() => setEditor(null)}
          onDelete={deleteVehicle}
          onSave={saveVehicle}
        />
      )}
    </div>
  );
}
