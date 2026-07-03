import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, GitCompare } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { formatPrice } from '../constants/options';
import type {
  MediaAsset,
  ProfileDesignReference,
  ProfileFeature,
  ProfileKeyValue,
  ProfileOpportunity,
  ProfileScene,
  ProfileSceneNeed,
  ProfileScoreRow,
  Vehicle,
} from '../types/vehicle';

interface VehicleProfileProps {
  vehicle: Vehicle;
  isCompared: boolean;
  isCompareDisabled: boolean;
  onBack: () => void;
  onToggleCompare: (vehicle: Vehicle) => void;
}

const navItems = ['L1 用户市场', 'L2 竞品档案', 'L3 对标分析', 'L4 设计借鉴', 'L5 测评追溯'];

const fixedScoreBreakdown = [
  ['1.X 外部实用体验', '14 / 20'],
  ['2.X 内部空间体验', '30 / 40'],
  ['3.X 硬件及智能化体验', '34 / 40'],
];

const fixedScoreLogic = [
  ['1.X 外部实用体验', '上下车流畅度 / 前后备箱使用体验'],
  ['2.X 内部空间体验', '内饰用料 / 座椅乘坐 / 储物 / 环境质量'],
  ['3.X 硬件及智能化体验', '硬件配置 / 车机系统 / 灯光氛围 / 空调功能'],
];

const hasValue = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value === undefined || value === null) return false;
  return String(value).trim() !== '' && String(value).trim() !== '待补充';
};

const clean = (value: string | number | undefined) => (hasValue(value) ? String(value).trim() : '');

const unique = (items: Array<string | undefined>) =>
  Array.from(new Set(items.map((item) => item?.trim()).filter(Boolean) as string[]));

const compactRows = (rows: Array<[string, string | number | undefined]>) =>
  rows
    .map(([label, value]) => ({ label, value: clean(value) }))
    .filter((row) => hasValue(row.value));

const numberFromText = (value: string | number | undefined) => {
  const match = String(value || '').match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const assetUrl = (asset?: MediaAsset) => clean(asset?.url);

const valueFromItems = (items: ProfileKeyValue[], names: string[]) => {
  const matched = items.find((item) => names.includes(item.label));
  return clean(matched?.value);
};

const priceText = (vehicle: Vehicle) => {
  if (!vehicle.priceMin && !vehicle.priceMax) return '';
  if (vehicle.priceMin === vehicle.priceMax) return `${vehicle.priceMin} 万`;
  return formatPrice(vehicle.priceMin, vehicle.priceMax).replace('-', ' - ');
};

const Panel = ({
  title,
  kicker,
  children,
  className = '',
}: {
  title: string;
  kicker: string;
  children: ReactNode;
  className?: string;
}) => (
  <article className={`figma-panel ${className}`}>
    <p className="figma-panel__kicker">{kicker}</p>
    <h3>{title}</h3>
    {children}
  </article>
);

const SectionHeader = ({ kicker, title, intro }: { kicker: string; title: string; intro: string }) => (
  <div className="figma-section__header">
    <p>{kicker}</p>
    <h2>{title}</h2>
    <span>{intro}</span>
  </div>
);

const KeyValue = ({ label, value }: { label: string; value: string | number | undefined }) => {
  const nextValue = clean(value);
  if (!nextValue) return null;

  return (
    <div className="figma-kv">
      <span>{label}</span>
      <strong>{nextValue}</strong>
    </div>
  );
};

const NeedTable = ({ rows }: { rows: ProfileSceneNeed[] }) => (
  <div className="figma-need-table">
    <div className="figma-need-table__head">
      <span>行为需求</span>
      <span>YU7 已有硬件支撑</span>
      <span>YU7 已有软件 / HMI 支撑</span>
      <span>现有体验判断</span>
    </div>
    {rows.map((row, index) => (
      <div className="figma-need-table__row" key={`${row.need}-${index}`}>
        <strong>{clean(row.need)}</strong>
        <span>{clean(row.hardware)}</span>
        <span>{clean(row.software)}</span>
        <span>{clean(row.judgement)}</span>
      </div>
    ))}
  </div>
);

const SceneBlock = ({ scene, index }: { scene: ProfileScene; index: number }) => {
  const sceneImage = assetUrl(scene.image);
  const notes = scene.needs.filter((row) => hasValue(row.need) && (hasValue(row.note) || hasValue(row.judgement)));

  return (
    <div className={`figma-scene ${sceneImage ? '' : 'figma-scene--text-only'}`}>
      {sceneImage && <img alt={scene.title} src={sceneImage} />}
      <div className="figma-scene__copy">
        <p>Scene {String(index + 1).padStart(2, '0')}</p>
        <h3>{scene.title}</h3>
        {hasValue(scene.source) && <span>{scene.source}</span>}
        {notes.length > 0 && (
          <dl>
            {notes.slice(0, 6).map((row, noteIndex) => (
              <div key={`${row.need}-${noteIndex}`}>
                <dt>{row.need}</dt>
                <dd>{clean(row.note) || clean(row.judgement)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      {scene.needs.length > 0 && (
        <Panel title="基于行为需求现有的功能拆解" kicker="Hexin jichu dangan" className="figma-scene__table">
          <NeedTable rows={scene.needs} />
        </Panel>
      )}
    </div>
  );
};

const DesignCarousel = ({
  media,
  activeIndex,
  onPrevious,
  onNext,
}: {
  media: MediaAsset[];
  activeIndex: number;
  onPrevious: () => void;
  onNext: () => void;
}) => {
  if (!media.length) return null;
  const activeMedia = media[activeIndex % media.length];

  return (
    <div className="figma-gallery-hero">
      <img alt={activeMedia.title} src={activeMedia.url} />
      {media.length > 1 && (
        <>
          <button aria-label="上一张设计参考图" className="figma-gallery-nav figma-gallery-nav--prev" type="button" onClick={onPrevious}>
            <ChevronLeft size={22} />
          </button>
          <button aria-label="下一张设计参考图" className="figma-gallery-nav figma-gallery-nav--next" type="button" onClick={onNext}>
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </div>
  );
};

export function VehicleProfile({
  vehicle,
  isCompared,
  isCompareDisabled,
  onBack,
  onToggleCompare,
}: VehicleProfileProps) {
  const [activeDesignIndex, setActiveDesignIndex] = useState(0);
  const profile = vehicle.profile;
  const displayPrice = priceText(vehicle);
  const displayLevel = clean(vehicle.level);
  const hero = assetUrl(vehicle.coverImage);
  const visibleVehicleId = vehicle.id && vehicle.id !== vehicle.recordId ? vehicle.id : '';
  const tags = unique([...(vehicle.keyTags || []), ...(profile?.l1?.tags || [])]).slice(0, 5);
  const l1Targets = (profile?.l1?.targetUsers || []).filter((item) => hasValue(item.keyword) && hasValue(item.description));
  const marketPoints = (profile?.l1?.marketPoints || []).filter((item) => hasValue(item.keyword) && hasValue(item.description));
  const l2BasicItems = profile?.l2?.basicItems || [];
  const officialName = unique([vehicle.brand, vehicle.model]).join(' ');
  const baseRows = compactRows([
    ['官方车型名称', officialName],
    ['车型级别', displayLevel],
    ['生产平台', valueFromItems(l2BasicItems, ['生产平台', '车型平台'])],
    ['上市时间', valueFromItems(l2BasicItems, ['上市时间'])],
    ['官方指导价', valueFromItems(l2BasicItems, ['官方指导价', '指导价']) || displayPrice],
    ['能源类型', valueFromItems(l2BasicItems, ['能源类型', '能源形式']) || vehicle.energy],
    ['车身结构', valueFromItems(l2BasicItems, ['车身结构'])],
    ['对标车型', valueFromItems(l2BasicItems, ['对标车型'])],
  ]);
  const productRows = compactRows([
    ['产品定位', vehicle.productPositioning],
    ['目标用户', vehicle.targetUsers],
    ['一句话总结', vehicle.summary],
    ['适合做什么类型对标', vehicle.benchmarkSuitability?.join(' / ')],
  ]);
  const specRows = (profile?.l2?.specRows || []).filter((row) => hasValue(row.label) && hasValue(row.value));
  const scenes = (profile?.l3Scenes || []).filter((scene) => hasValue(scene.title));
  const features = (profile?.l3Features || []).filter((item) => hasValue(item.title) || hasValue(item.feature));
  const opportunities = (profile?.l3Styling || []).filter((item) => hasValue(item.title) || hasValue(item.description));
  const designReferences = (profile?.l4Design?.references || []).filter((item) => hasValue(item.description) || hasValue(item.image?.url));
  const designMedia = [
    ...(profile?.l4Design?.heroImages || []),
    ...designReferences.map((item) => item.image).filter(Boolean),
  ].filter((item): item is MediaAsset => Boolean(item?.url));
  const scoreRows = (profile?.l5?.rows || []).filter((row: ProfileScoreRow) => hasValue(row.dimension));
  const score = clean(profile?.l5?.score);
  const totalScore = clean(profile?.l5?.totalScore) || '100';
  const scorePercent = score ? Math.min(100, Math.round((numberFromText(score) / Math.max(numberFromText(totalScore), 1)) * 100)) : 0;
  const hasL3 = scenes.length > 0 || features.length > 0 || opportunities.length > 0;
  const hasL4 = designMedia.length > 0 || designReferences.length > 0;
  const hasL5 = score || scoreRows.length > 0;

  return (
    <main className="profile-page profile-page--figma">
      <header className="figma-topbar">
        <button className="figma-back-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          返回总览
        </button>
        <div className="figma-brand">
          <i />
          <div>
            <strong>{officialName} 竞品分析档案</strong>
            <span>L1-L5 单车档案结构</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <a href={`#${item.slice(0, 2)}`} key={item}>{item}</a>
          ))}
        </nav>
        <button
          className={`figma-compare ${isCompared ? 'is-active' : ''}`}
          disabled={!isCompared && isCompareDisabled}
          type="button"
          onClick={() => onToggleCompare(vehicle)}
        >
          <GitCompare size={15} />
          {isCompared ? '已加入对比' : '加入对比'}
        </button>
      </header>

      <section className={`figma-hero ${hero ? '' : 'figma-hero--plain'}`} style={hero ? { backgroundImage: `url(${hero})` } : undefined}>
        <div className="figma-hero__overlay" />
        <div className="figma-hero__content">
          <p>{vehicle.brand} {vehicle.model} / Full Profile</p>
          <h1>{officialName}</h1>
          <h2>竞品分析档案</h2>
          {hasValue(vehicle.summary) && <span>{vehicle.summary}</span>}
          {tags.length > 0 && (
            <div className="figma-pill-row">
              {tags.map((tag) => <em key={tag}>{tag}</em>)}
            </div>
          )}
          <div className="figma-hero__meta">
            {compactRows([
              ['竞品库 ID', visibleVehicleId],
              ['建议对标层级', profile?.benchmarkLevel],
              ['指导价', displayPrice],
              ['车型级别', displayLevel],
            ]).map((row) => <KeyValue label={row.label} value={row.value} key={row.label} />)}
          </div>
        </div>
      </section>

      {(l1Targets.length > 0 || marketPoints.length > 0 || tags.length > 0) && (
        <section className="figma-section" id="L1">
          <SectionHeader
            kicker="L1 USER / MARKET"
            title="L1-用户市场层"
            intro="根据品牌所定义的目标用户、核心市场卖点与市场定位标签，回答“这台车卖给谁、为什么值得买”。"
          />
          <div className="figma-two">
            {l1Targets.length > 0 && (
              <Panel title="核心目标用户" kicker="USER">
                <div className="figma-metric-grid">
                  {l1Targets.slice(0, 4).map((item) => (
                    <KeyValue label={item.keyword} value={item.description} key={item.keyword} />
                  ))}
                </div>
              </Panel>
            )}
            {(marketPoints.length > 0 || tags.length > 0) && (
              <Panel title="核心市场卖点与定位标签" kicker="MARKET" className="figma-panel--wide">
                {marketPoints.length > 0 && (
                  <div className="figma-market-grid">
                    {marketPoints.slice(0, 4).map((item) => (
                      <KeyValue label={item.keyword} value={item.description} key={item.keyword} />
                    ))}
                  </div>
                )}
                {tags.length > 0 && (
                  <div className="figma-mini-tags">
                    {tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </Panel>
            )}
          </div>
        </section>
      )}

      {(baseRows.length > 0 || productRows.length > 0 || specRows.length > 0) && (
        <section className="figma-section" id="L2">
          <SectionHeader kicker="L2 PRODUCT PROFILE" title="L2-竞品档案层" intro="基础档案、核心参数、智能配置、版本差异" />
          {(baseRows.length > 0 || productRows.length > 0) && (
            <div className="figma-two">
              {baseRows.length > 0 && (
                <Panel title="核心基础档案" kicker="Hexin jichu dangan">
                  <div className="figma-list-grid figma-list-grid--compact">
                    {baseRows.map((row) => <KeyValue label={row.label} value={row.value} key={row.label} />)}
                  </div>
                </Panel>
              )}
              {productRows.length > 0 && (
                <Panel title="产品定位与设计价值" kicker="Product / Design">
                  <div className="figma-market-grid">
                    {productRows.map((row) => <KeyValue label={row.label} value={row.value} key={row.label} />)}
                  </div>
                </Panel>
              )}
            </div>
          )}
          {specRows.length > 0 && (
            <Panel title="核心硬件参数总表" kicker="Hexin jichu dangan" className="figma-panel--full">
              <div className="figma-spec-table">
                {specRows.map((row) => (
                  <div key={`${row.label}-${row.value}`}>
                    <strong>{row.label}</strong>
                    <span>{row.value}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </section>
      )}

      {hasL3 && (
        <section className="figma-section" id="L3">
          {scenes.length > 0 && (
            <>
              <SectionHeader kicker="L3 BENCHMARK / EXPERIENCE" title="L3-场景对标分析层" intro="场景对标、功能亮点与机会清单" />
              {scenes.map((scene, index) => (
                <SceneBlock key={scene.id} scene={scene} index={index} />
              ))}
            </>
          )}

          {features.length > 0 && (
            <>
              <SectionHeader kicker="L3 FUNCTION HIGHLIGHTS" title="L3-具体功能亮点" intro="从用户场景中提炼可直接对标的功能亮点。" />
              <div className="figma-card-grid">
                {features.map((item: ProfileFeature) => {
                  const image = assetUrl(item.image);
                  return (
                    <article className="figma-feature-card" key={item.id}>
                      {image && <img alt={item.title} src={image} />}
                      {hasValue(item.title) && <p>{item.title}</p>}
                      {hasValue(item.feature) && <h3>{item.feature}</h3>}
                      <KeyValue label="亮点判断" value={item.judgement} />
                      <KeyValue label="对标价值" value={item.benchmarkValue} />
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {opportunities.length > 0 && (
            <>
              <SectionHeader kicker="L3 STYLING OPPORTUNITIES" title="L3-造型机会点" intro="把场景、功能与设计可落地机会连接起来。" />
              <div className="figma-card-grid">
                {opportunities.map((item: ProfileOpportunity) => (
                  <article className="figma-opportunity-card" key={item.id}>
                    {(hasValue(item.type) || hasValue(item.priority)) && (
                      <p>{[item.type, item.priority].filter(hasValue).join(' · ')}</p>
                    )}
                    {hasValue(item.title) && <h3>{item.title}</h3>}
                    <KeyValue label="来源线索" value={item.source} />
                    <KeyValue label="可做方向" value={item.direction} />
                    <KeyValue label="功能描述" value={item.description} />
                    <KeyValue label="设计价值" value={item.designValue} />
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {hasL4 && (
        <section className="figma-section" id="L4">
          <SectionHeader kicker="L4 DESIGN REFERENCE" title="L4-设计借鉴层" intro="外饰、内饰、HMI 与情绪化体验机会" />
          <DesignCarousel
            activeIndex={activeDesignIndex}
            media={designMedia}
            onPrevious={() => setActiveDesignIndex((index) => (index - 1 + designMedia.length) % designMedia.length)}
            onNext={() => setActiveDesignIndex((index) => (index + 1) % designMedia.length)}
          />
          {designReferences.length > 0 && (
            <div className="figma-gallery-grid">
              {designReferences.map((item: ProfileDesignReference) => {
                const image = assetUrl(item.image);
                return (
                  <article className="figma-gallery-card" key={item.id}>
                    {image && <img alt={item.title || item.group} src={image} />}
                    {hasValue(item.group) && <p>{item.group}</p>}
                    {hasValue(item.title) && <h3>{item.title}</h3>}
                    {hasValue(item.description) && <span>{item.description}</span>}
                    {hasValue(item.url) && (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        查看来源 <ExternalLink size={14} />
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {hasL5 && (
        <section className="figma-section" id="L5">
          <SectionHeader kicker="L5 REVIEW / TRACE" title="L5-测评与追溯层" intro="资料链接、讨论热度、评分依据与后续调研线索" />
          <div className="figma-score-layout">
            {score && (
              <Panel title="核心基础档案" kicker="Hexin jichu dangan" className="figma-score-card">
                <div className="figma-score-ring" style={{ '--score': `${scorePercent}%` } as CSSProperties}>
                  <strong>{score}</strong>
                  <span>整体评分 / {totalScore}</span>
                </div>
                <div className="figma-score-split">
                  {fixedScoreBreakdown.map(([label, value]) => (
                    <KeyValue label={label} value={value} key={label} />
                  ))}
                </div>
              </Panel>
            )}
            <Panel title="模块评测逻辑" kicker="Hexin jichu dangan" className="figma-score-copy">
              {fixedScoreLogic.map(([label, value]) => (
                <KeyValue label={label} value={value} key={label} />
              ))}
            </Panel>
            {scoreRows.length > 0 && (
              <Panel title="核心评测参数总表" kicker="Hexin jichu dangan" className="figma-score-table-panel">
                <div className="figma-score-table">
                  <div>
                    <span>评测维度</span>
                    <span>满分</span>
                    <span>{vehicle.model} 得分</span>
                    <span>评分依据</span>
                  </div>
                  {scoreRows.map((row) => (
                    <div key={row.dimension}>
                      <strong>{row.dimension}</strong>
                      <span>{clean(row.maxScore)}</span>
                      <em>{clean(row.score)}</em>
                      <p>{clean(row.reason)}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {vehicle.links.length > 0 && (
            <Panel title="资料和热帖链接" kicker="Research Links" className="figma-links-panel">
              <div className="figma-link-list">
                {vehicle.links.map((link) => (
                  <a href={link.url} target="_blank" rel="noreferrer" key={link.id}>
                    <span>{link.platform}</span>
                    <strong>{link.title}</strong>
                    <p>{link.summary}</p>
                    <em>{link.heat} / {link.sentiment}</em>
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            </Panel>
          )}
        </section>
      )}
    </main>
  );
}
