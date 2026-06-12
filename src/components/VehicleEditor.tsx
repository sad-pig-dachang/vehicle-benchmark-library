import { Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { energyOptions, levelOptions, statusOptions } from '../constants/options';
import type { DataStatus, EnergyType, Market, Vehicle, VehicleLevel } from '../types/vehicle';

interface VehicleEditorProps {
  vehicle: Vehicle;
  isNew: boolean;
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
}

const tabs = [
  { id: 'basic', label: '基础信息' },
  { id: 'experience', label: '体验场景' },
  { id: 'hmi', label: 'HMI' },
  { id: 'styling', label: '内外饰' },
  { id: 'links', label: '资料链接' },
  { id: 'versions', label: '迭代记录' },
  { id: 'json', label: 'JSON 高级编辑' },
] as const;

type TabId = (typeof tabs)[number]['id'];

type SectionBuffers = {
  spec: string;
  experiencePoints: string;
  hmiPoints: string;
  exteriorPoints: string;
  interiorPoints: string;
  links: string;
  versionLogs: string;
};

const toLines = (items: string[]) => items.join('\n');
const fromLines = (text: string) =>
  text
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const createBuffers = (vehicle: Vehicle): SectionBuffers => ({
  spec: JSON.stringify(vehicle.spec, null, 2),
  experiencePoints: JSON.stringify(vehicle.experiencePoints, null, 2),
  hmiPoints: JSON.stringify(vehicle.hmiPoints, null, 2),
  exteriorPoints: JSON.stringify(vehicle.exteriorPoints, null, 2),
  interiorPoints: JSON.stringify(vehicle.interiorPoints, null, 2),
  links: JSON.stringify(vehicle.links, null, 2),
  versionLogs: JSON.stringify(vehicle.versionLogs, null, 2),
});

export function VehicleEditor({ vehicle, isNew, onClose, onSave, onDelete }: VehicleEditorProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [draft, setDraft] = useState<Vehicle>(vehicle);
  const [buffers, setBuffers] = useState<SectionBuffers>(() => createBuffers(vehicle));
  const [jsonBuffer, setJsonBuffer] = useState(() => JSON.stringify(vehicle, null, 2));
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(vehicle);
    setBuffers(createBuffers(vehicle));
    setJsonBuffer(JSON.stringify(vehicle, null, 2));
    setActiveTab('basic');
    setError('');
  }, [vehicle]);

  const setField = <K extends keyof Vehicle>(key: K, value: Vehicle[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const setCoverUrl = (url: string) => {
    setDraft((prev) => ({
      ...prev,
      coverImage: {
        ...prev.coverImage,
        url,
      },
    }));
  };

  const selectTab = (id: TabId) => {
    if (id === 'json') {
      setJsonBuffer(JSON.stringify(draft, null, 2));
    }
    setActiveTab(id);
    setError('');
  };

  const buildVehicleFromBuffers = () => {
    try {
      return {
        ...draft,
        spec: JSON.parse(buffers.spec) as Vehicle['spec'],
        experiencePoints: JSON.parse(buffers.experiencePoints) as Vehicle['experiencePoints'],
        hmiPoints: JSON.parse(buffers.hmiPoints) as Vehicle['hmiPoints'],
        exteriorPoints: JSON.parse(buffers.exteriorPoints) as Vehicle['exteriorPoints'],
        interiorPoints: JSON.parse(buffers.interiorPoints) as Vehicle['interiorPoints'],
        links: JSON.parse(buffers.links) as Vehicle['links'],
        versionLogs: JSON.parse(buffers.versionLogs) as Vehicle['versionLogs'],
      };
    } catch (parseError) {
      throw new Error(parseError instanceof Error ? parseError.message : 'JSON 格式错误');
    }
  };

  const handleSave = () => {
    setError('');
    try {
      const next =
        activeTab === 'json' ? (JSON.parse(jsonBuffer) as Vehicle) : buildVehicleFromBuffers();
      if (!next.brand || !next.model) {
        setError('品牌和车型不能为空。');
        return;
      }
      onSave({
        ...next,
        updatedAt: next.updatedAt || new Date().toISOString().slice(0, 10),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败，请检查 JSON。');
    }
  };

  const handleDelete = () => {
    if (!window.confirm(`确认删除 ${draft.brand} ${draft.model}？`)) return;
    onDelete(draft.id);
  };

  const renderTextArea = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    hint?: string,
  ) => (
    <label className="form-field form-field--full">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  );

  const renderJsonArea = (
    label: string,
    key: keyof SectionBuffers,
    hint = '可直接粘贴该板块的数组或对象 JSON。',
  ) =>
    renderTextArea(label, buffers[key], (value) => setBuffers((prev) => ({ ...prev, [key]: value })), hint);

  return (
    <div className="editor-backdrop" role="dialog" aria-modal="true">
      <div className="editor-panel">
        <header className="editor-header">
          <div>
            <p>{isNew ? 'New Vehicle' : 'Edit Vehicle'}</p>
            <h2>{isNew ? '新增车型' : `${draft.brand} ${draft.model}`}</h2>
          </div>
          <button className="icon-button" title="关闭" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <nav className="editor-tabs" aria-label="车型编辑分组">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.id ? 'is-active' : ''}
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="editor-body">
          {activeTab === 'basic' && (
            <div className="form-grid">
              <label className="form-field">
                <span>品牌</span>
                <input value={draft.brand} onChange={(event) => setField('brand', event.target.value)} />
              </label>
              <label className="form-field">
                <span>车型</span>
                <input value={draft.model} onChange={(event) => setField('model', event.target.value)} />
              </label>
              <label className="form-field">
                <span>年款</span>
                <input value={draft.year} onChange={(event) => setField('year', event.target.value)} />
              </label>
              <label className="form-field">
                <span>国家 / 地区</span>
                <input
                  value={draft.countryRegion}
                  onChange={(event) => setField('countryRegion', event.target.value)}
                />
              </label>
              <label className="form-field">
                <span>国内 / 海外</span>
                <select value={draft.market} onChange={(event) => setField('market', event.target.value as Market)}>
                  <option value="国内">国内</option>
                  <option value="海外">海外</option>
                </select>
              </label>
              <label className="form-field">
                <span>能源形式</span>
                <select
                  value={draft.energy}
                  onChange={(event) => setField('energy', event.target.value as EnergyType)}
                >
                  {energyOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>车型级别</span>
                <select value={draft.level} onChange={(event) => setField('level', event.target.value as VehicleLevel)}>
                  {levelOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>数据状态</span>
                <select value={draft.status} onChange={(event) => setField('status', event.target.value as DataStatus)}>
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>最低价（万）</span>
                <input
                  type="number"
                  value={draft.priceMin}
                  onChange={(event) => setField('priceMin', Number(event.target.value))}
                />
              </label>
              <label className="form-field">
                <span>最高价（万）</span>
                <input
                  type="number"
                  value={draft.priceMax}
                  onChange={(event) => setField('priceMax', Number(event.target.value))}
                />
              </label>
              <label className="form-field">
                <span>数据完整度</span>
                <input
                  max={100}
                  min={0}
                  type="number"
                  value={draft.completeness}
                  onChange={(event) => setField('completeness', Number(event.target.value))}
                />
              </label>
              <label className="form-field">
                <span>更新时间</span>
                <input
                  type="date"
                  value={draft.updatedAt}
                  onChange={(event) => setField('updatedAt', event.target.value)}
                />
              </label>
              <label className="form-field form-field--full">
                <span>封面图 URL</span>
                <input value={draft.coverImage.url} onChange={(event) => setCoverUrl(event.target.value)} />
              </label>
              {renderTextArea('产品定位', draft.productPositioning, (value) => setField('productPositioning', value))}
              {renderTextArea('目标用户', draft.targetUsers, (value) => setField('targetUsers', value))}
              {renderTextArea('车型一句话总结', draft.summary, (value) => setField('summary', value))}
              {renderTextArea('3-5 条核心特点', toLines(draft.coreHighlights), (value) =>
                setField('coreHighlights', fromLines(value)),
              )}
              {renderTextArea('关键标签', draft.keyTags.join(', '), (value) =>
                setField(
                  'keyTags',
                  value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                ),
              )}
              {renderTextArea('使用场景标签', draft.scenarioTags.join(', '), (value) =>
                setField(
                  'scenarioTags',
                  value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                ),
              )}
              {renderTextArea('HMI 标签', draft.hmiTags.join(', '), (value) =>
                setField(
                  'hmiTags',
                  value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                ),
              )}
              {renderTextArea('内外饰标签', draft.stylingTags.join(', '), (value) =>
                setField(
                  'stylingTags',
                  value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                ),
              )}
              {renderTextArea('适合做什么类型的对标', toLines(draft.benchmarkSuitability), (value) =>
                setField('benchmarkSuitability', fromLines(value)),
              )}
              <label className="checkbox-row">
                <input
                  checked={draft.isKeyModel}
                  type="checkbox"
                  onChange={(event) => setField('isKeyModel', event.target.checked)}
                />
                <span>标记为重点车型</span>
              </label>
              {renderJsonArea('基础参数 VehicleSpec', 'spec', '可维护车身尺寸、续航、芯片、屏幕布局等参数。')}
            </div>
          )}

          {activeTab === 'experience' && renderJsonArea('体验场景对标点', 'experiencePoints')}
          {activeTab === 'hmi' && renderJsonArea('HMI 对标点', 'hmiPoints')}
          {activeTab === 'styling' && (
            <div className="form-grid">
              {renderJsonArea('外饰造型对标点', 'exteriorPoints')}
              {renderJsonArea('内饰造型对标点', 'interiorPoints')}
            </div>
          )}
          {activeTab === 'links' && renderJsonArea('资料和热帖链接', 'links')}
          {activeTab === 'versions' && renderJsonArea('车型迭代记录', 'versionLogs')}
          {activeTab === 'json' &&
            renderTextArea(
              '完整 Vehicle JSON',
              jsonBuffer,
              setJsonBuffer,
              '高级编辑会以这里的完整 JSON 为准，保存前请确保字段结构正确。',
            )}
        </div>

        {error && <div className="editor-error">{error}</div>}

        <footer className="editor-footer">
          {!isNew && (
            <button className="danger-button" type="button" onClick={handleDelete}>
              <Trash2 size={16} />
              删除车型
            </button>
          )}
          <div>
            <button className="ghost-button" type="button" onClick={onClose}>
              取消
            </button>
            <button className="primary-button" type="button" onClick={handleSave}>
              <Save size={16} />
              保存
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
