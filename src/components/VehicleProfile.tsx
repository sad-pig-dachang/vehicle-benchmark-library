import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Edit3,
  ExternalLink,
  GitCompare,
  ImageIcon,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { formatPrice, joinOrDash } from '../constants/options';
import type { BenchmarkPoint, Vehicle } from '../types/vehicle';
import { TagList } from './TagList';

interface VehicleProfileProps {
  vehicle: Vehicle;
  isCompared: boolean;
  isCompareDisabled: boolean;
  onBack: () => void;
  onEdit: (vehicle: Vehicle) => void;
  onToggleCompare: (vehicle: Vehicle) => void;
}

const Field = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div className="info-field">
    <span>{label}</span>
    <strong>{value || '待补充'}</strong>
  </div>
);

const MediaFrame = ({ point }: { point: BenchmarkPoint }) => (
  <div
    className="benchmark-media"
    style={point.media ? { backgroundImage: `url(${point.media.url})` } : undefined}
  >
    {!point.media && <ImageIcon size={24} />}
    <span>{point.media?.title || '预留图片 / 视频封面'}</span>
  </div>
);

const TextBlock = ({ label, value }: { label: string; value?: string }) => (
  <div className="text-block">
    <span>{label}</span>
    <p>{value || '待补充'}</p>
  </div>
);

const BenchmarkCard = ({ point, mode }: { point: BenchmarkPoint; mode: 'experience' | 'hmi' | 'styling' }) => {
  const isExperience = mode === 'experience';
  const isHmi = mode === 'hmi';

  return (
    <article className="benchmark-card">
      <MediaFrame point={point} />
      <div className="benchmark-card__content">
        <h4>{point.title}</h4>
        {isExperience && (
          <div className="benchmark-grid">
            <TextBlock label="场景描述" value={point.sceneDescription || point.description} />
            <TextBlock label="用户价值" value={point.userValue} />
            <TextBlock label="体验亮点" value={point.highlight} />
            <TextBlock label="问题" value={point.issue} />
            <TextBlock label="可借鉴点" value={point.referenceValue} />
          </div>
        )}
        {isHmi && (
          <div className="benchmark-grid">
            <TextBlock label="界面位置" value={point.interfaceLocation} />
            <TextBlock label="交互方式" value={point.interactionMode} />
            <TextBlock label="视觉风格" value={point.visualStyle} />
            <TextBlock label="信息架构" value={point.informationArchitecture} />
            <TextBlock label="动效" value={point.motion} />
            <TextBlock label="亮点" value={point.highlight} />
            <TextBlock label="问题" value={point.issue} />
            <TextBlock label="可借鉴点" value={point.referenceValue} />
          </div>
        )}
        {mode === 'styling' && (
          <div className="benchmark-grid">
            <TextBlock label="造型特征" value={point.stylingFeature} />
            <TextBlock label="品牌识别点" value={point.brandIdentity} />
            <TextBlock label="比例姿态" value={point.proportion} />
            <TextBlock label="细节设计" value={point.detailDesign} />
            <TextBlock label="材质 / 色彩" value={point.materialColor} />
            <TextBlock label="可借鉴点" value={point.referenceValue} />
          </div>
        )}
      </div>
    </article>
  );
};

export function VehicleProfile({
  vehicle,
  isCompared,
  isCompareDisabled,
  onBack,
  onEdit,
  onToggleCompare,
}: VehicleProfileProps) {
  return (
    <main className="profile-page">
      <div className="profile-toolbar">
        <button className="ghost-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          返回总览
        </button>
        <div className="toolbar-actions">
          <button className="secondary-button" type="button" onClick={() => onEdit(vehicle)}>
            <Edit3 size={16} />
            编辑
          </button>
          <button
            className={`secondary-button ${isCompared ? 'is-active' : ''}`}
            disabled={!isCompared && isCompareDisabled}
            type="button"
            onClick={() => onToggleCompare(vehicle)}
          >
            <GitCompare size={16} />
            {isCompared ? '已加入对比' : '加入对比'}
          </button>
        </div>
      </div>

      <section className="profile-hero">
        <div
          className="profile-cover"
          style={{ backgroundImage: `url(${vehicle.coverImage.url})` }}
          aria-label={vehicle.coverImage.alt}
        />
        <div className="profile-intro">
          <p className="eyebrow">{vehicle.brand}</p>
          <h2>
            {vehicle.model} <span>{vehicle.year} 款</span>
          </h2>
          <p>{vehicle.summary}</p>
          <TagList tags={vehicle.keyTags} tone="accent" />

          <div className="info-grid">
            <Field label="国家 / 地区" value={vehicle.countryRegion} />
            <Field label="级别" value={vehicle.level} />
            <Field label="能源形式" value={vehicle.energy} />
            <Field label="价格区间" value={formatPrice(vehicle.priceMin, vehicle.priceMax)} />
            <Field label="数据完整度" value={`${vehicle.completeness}%`} />
            <Field label="更新时间" value={vehicle.updatedAt} />
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <Sparkles size={20} />
          <div>
            <p>A. 基础信息区</p>
            <h3>产品定位与目标用户</h3>
          </div>
        </div>
        <div className="two-column">
          <TextBlock label="产品定位" value={vehicle.productPositioning} />
          <TextBlock label="目标用户" value={vehicle.targetUsers} />
          <TextBlock label="车型一句话总结" value={vehicle.summary} />
          <TextBlock
            label="关键标签"
            value={[...vehicle.keyTags, ...vehicle.scenarioTags, ...vehicle.hmiTags, ...vehicle.stylingTags].join(' / ')}
          />
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <CheckCircle2 size={20} />
          <div>
            <p>B. 车型特点总结区</p>
            <h3>核心特点与对标价值</h3>
          </div>
        </div>
        <div className="summary-grid">
          <article>
            <h4>核心特点</h4>
            {vehicle.coreHighlights.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </article>
          <article>
            <h4>主要看点</h4>
            <p>{joinOrDash(vehicle.designFocus)}</p>
          </article>
          <article>
            <h4>适合对标</h4>
            <p>{joinOrDash(vehicle.benchmarkSuitability)}</p>
          </article>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div className="section-index">C</div>
          <div>
            <p>体验场景对标点</p>
            <h3>用户场景与体验价值</h3>
          </div>
        </div>
        <div className="benchmark-stack">
          {vehicle.experiencePoints.map((point) => (
            <BenchmarkCard key={point.id} mode="experience" point={point} />
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div className="section-index">D</div>
          <div>
            <p>HMI 对标点</p>
            <h3>界面、交互与信息架构</h3>
          </div>
        </div>
        <div className="benchmark-stack">
          {vehicle.hmiPoints.map((point) => (
            <BenchmarkCard key={point.id} mode="hmi" point={point} />
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div className="section-index">E</div>
          <div>
            <p>内外饰造型对标点</p>
            <h3>外饰与内饰分组</h3>
          </div>
        </div>
        <div className="styling-groups">
          <div>
            <h4>外饰</h4>
            {vehicle.exteriorPoints.map((point) => (
              <BenchmarkCard key={point.id} mode="styling" point={point} />
            ))}
          </div>
          <div>
            <h4>内饰</h4>
            {vehicle.interiorPoints.map((point) => (
              <BenchmarkCard key={point.id} mode="styling" point={point} />
            ))}
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <LinkIcon size={20} />
          <div>
            <p>F. 资料和热帖链接</p>
            <h3>外部资料引用池</h3>
          </div>
        </div>
        <div className="link-grid">
          {vehicle.links.map((link) => (
            <article className="resource-card" key={link.id}>
              <div>
                <span>{link.platform}</span>
                <strong>{link.heat}</strong>
              </div>
              <h4>{link.title}</h4>
              <p>{link.summary}</p>
              <p className={`sentiment sentiment--${link.sentiment}`}>{link.sentiment}</p>
              <p>{link.referenceValue}</p>
              <a href={link.url} target="_blank" rel="noreferrer">
                打开链接 <ExternalLink size={14} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <CalendarDays size={20} />
          <div>
            <p>G. 车型迭代记录</p>
            <h3>年款、变化与设计影响</h3>
          </div>
        </div>
        <div className="timeline">
          {vehicle.versionLogs.map((log) => (
            <article className="timeline-item" key={log.id}>
              <span>{log.changeTime}</span>
              <h4>{log.yearModel}</h4>
              <TagList tags={log.changeTypes} />
              <p>{log.description}</p>
              <strong>{log.designImpact}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
