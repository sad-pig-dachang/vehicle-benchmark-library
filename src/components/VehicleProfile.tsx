import { ArrowLeft, ExternalLink, GitCompare } from 'lucide-react';
import type { ReactNode } from 'react';
import exteriorDetailImage from '../assets/figma-yu7-optimized/exterior-detail.jpg';
import exteriorMainImage from '../assets/figma-yu7-optimized/exterior-main.jpg';
import heroImage from '../assets/figma-yu7-optimized/hero.jpg';
import hmiDrivingImage from '../assets/figma-yu7-optimized/hmi-driving.jpg';
import hmiScreenImage from '../assets/figma-yu7-optimized/hmi-screen.jpg';
import interiorDetailImage from '../assets/figma-yu7-optimized/interior-detail.jpg';
import sceneCockpitImage from '../assets/figma-yu7-optimized/scene-cockpit.jpg';
import sceneDoorImage from '../assets/figma-yu7-optimized/scene-door.jpg';
import { formatPrice, joinOrDash } from '../constants/options';
import type { Vehicle } from '../types/vehicle';

interface VehicleProfileProps {
  vehicle: Vehicle;
  isCompared: boolean;
  isCompareDisabled: boolean;
  onBack: () => void;
  onToggleCompare: (vehicle: Vehicle) => void;
}

interface NeedRow {
  need: string;
  hardware: string;
  software: string;
  judgement: string;
}

const navItems = ['L1 用户市场', 'L2 竞品档案', 'L3 对标分析', 'L4 设计借鉴', 'L5 测评追溯'];

const yu7Tags = ['纯电中大型 SUV', '家庭生活方式 SUV', '科技与美学共生', '生态拓展', '智能座舱'];

const yu7MarketPoints = [
  ['卖点 01', '全系标配激光雷达 + 高阶辅助驾驶，同价位配置天花板。'],
  ['卖点 02', '800V 高压平台 + 最高 835km CLTC 续航，兼顾性能与长途实用。'],
  ['卖点 03', '延续小米 SU7 设计语言，轿跑 SUV 造型兼顾颜值与空间。'],
  ['卖点 04', '米家生态全链路打通，座舱智能体验拉满。'],
];

const ridingNeeds: NeedRow[] = [
  {
    need: '出发前整理装备',
    hardware: '141L 电动前备箱、后备箱、后排 4/6 电动放倒、1970L 最大储物容积、36 处收纳',
    software: '/',
    judgement: '现有表达重点是“空间能装”，通过官方骑行场景展示自行车、露营装备、骑行护具的装载能力。',
  },
  {
    need: '区分干净物和脏污物',
    hardware: '前备箱、后备箱、后排储物抽屉、36 处收纳',
    software: '/',
    judgement: '硬件具备分区基础，但现有体验主要依赖用户自行判断。',
  },
  {
    need: '双手拿装备时开闭储物空间',
    hardware: '电动前备箱、电动后尾门、车外 4 模组 8 麦克风阵列',
    software: '车外小爱语音、声纹 + 数字钥匙双重验证、车外连续说',
    judgement: '这是 YU7 当前比较完整的车外拿取链路，适合装备搬运和前备箱开启场景。',
  },
  {
    need: '保留部分乘坐空间',
    hardware: '后排 4/6 比例电动放倒、后备箱空间',
    software: '/',
    judgement: '硬件支持半载人半装物，但没有看到官方提供放倒比例推荐。',
  },
  {
    need: '途中补给和休息',
    hardware: '4.6L 车载智能冰箱、36 处收纳、水杯架、后排储物抽屉',
    software: '冰箱支持前后排控制屏和智能语音控制',
    judgement: '冰箱和多处收纳覆盖补给需求，其中冰箱控制链路比较明确。',
  },
  {
    need: '记录和分享出行内容',
    hardware: '车载拍摄能力、车外语音能力、生态拓展接口',
    software: '智能影像、一键成片、车外语音操控；车载拍照功能需 OTA',
    judgement: 'YU7 已经有内容化方向，但车载拍照需注意 OTA 状态，不能当作完全落地能力写死。',
  },
];

const petNeeds: NeedRow[] = [
  {
    need: '短时间离车时保证宠物安全',
    hardware: '空调系统、电量基础能力、车机屏幕',
    software: '宠物模式 / 智能宠物空间',
    judgement: 'YU7 已经把宠物作为官方场景，但更完整的宠物安全状态展示仍可在机会点中展开。',
  },
  {
    need: '防止宠物误触车窗、门锁、喇叭等功能',
    hardware: '门窗、踏板、喇叭等车辆控制硬件',
    software: '媒体转述官方问答中提到宠物模式下会限制部分误触行为',
    judgement: '该点建议标注为“媒体转述官方问答，需复核”，不要直接当作无条件全系能力。',
  },
  {
    need: '让车外路人知道宠物处于安全状态',
    hardware: '车机屏幕、车窗可见区域',
    software: '宠物模式相关提示，具体展示形式需进一步核实',
    judgement: '可以确认有宠物模式，但车外提示的完整形式需要进一步补图或实车验证。',
  },
  {
    need: '车主远程查看宠物状态',
    hardware: '/',
    software: '/',
    judgement: '没有看到官方明确说明 YU7 宠物模式支持远程实时查看宠物，该点应放在机会点中。',
  },
  {
    need: '把自己的宠物带进车机主题',
    hardware: '中控屏、车机图形系统',
    software: '上传宠物照片生成专属车机萌宠主题、宠物组件 Pin 到桌面',
    judgement: '这是 YU7 已明确的情绪化亮点，能把真实宠物转成车机陪伴资产。',
  },
  {
    need: '用实体玩偶强化陪伴感',
    hardware: '全车 9 处磁吸点位、磁吸附件',
    software: '磁吸萌宠、一碰切换车机专属主题',
    judgement: '这是 YU7 已明确的实体情绪化拓展能力，但“自家宠物定制玩偶”属于后续机会点。',
  },
];

const scoreRows = [
  ['1.1 上下车流畅度', '10', '6', '溜背造型后排进出易碰头，底盘偏低，老人小孩上下车不便，仅前排流畅'],
  ['1.2 前 / 后备箱使用体验', '10', '8', '电动前备箱 + 常规后备箱 560L，开口大进深足，溜背造型限制垂直高度'],
  ['2.1 内饰用料覆盖度', '10', '8', 'Nappa 真皮 + Alcantara 运动面料，中控台、门板软包覆盖，底部、门槛硬塑料较多'],
  ['2.2 座椅乘坐体验', '10', '7', '前排包裹支撑极强；后排坐垫偏短、靠背陡，长途舒适性一般'],
  ['2.3 车内储物空间', '10', '7', '中控下层掏空、门板储物槽常规，缺少更多分层收纳'],
  ['2.4 车内环境质量', '10', '8', '新车异味控制良好，双层隔音玻璃，高速风噪偏大'],
  ['3.1 硬件配置', '10', '9', '全系标配激光雷达、800V 高压平台、前排座椅通风加热，硬件偏驾驶向'],
  ['3.2 车机系统功能体验', '10', '8', '澎湃 OS 流畅度高，手机生态联动强，连续对话能力仍可增强'],
  ['3.3 灯光氛围', '10', '9', '全车多色动态氛围灯，门板、中控台、座椅靠背灯带联动，灯效动画丰富'],
  ['3.4 空调功能', '10', '8', '双区自动空调，前排座椅温控，后排风量偏弱，无独立后排控制面板'],
  ['整车总分', '100', '78', '轿跑运动取向，科技配置拉满，家用舒适属性有明显短板'],
];

const isYu7 = (vehicle: Vehicle) => vehicle.brand.includes('小米') && vehicle.model.toUpperCase().includes('YU7');

const mediaUrl = (vehicle: Vehicle, fallback: string) => {
  if (isYu7(vehicle)) return fallback;
  return vehicle.coverImage.url || fallback;
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

const KeyValue = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div className="figma-kv">
    <span>{label}</span>
    <strong>{value || '待补充'}</strong>
  </div>
);

const NeedTable = ({ rows }: { rows: NeedRow[] }) => (
  <div className="figma-need-table">
    <div className="figma-need-table__head">
      <span>行为需求</span>
      <span>YU7 已有硬件支撑</span>
      <span>YU7 已有软件 / HMI 支撑</span>
      <span>现有体验判断</span>
    </div>
    {rows.map((row) => (
      <div className="figma-need-table__row" key={row.need}>
        <strong>{row.need}</strong>
        <span>{row.hardware}</span>
        <span>{row.software}</span>
        <span>{row.judgement}</span>
      </div>
    ))}
  </div>
);

const SceneBlock = ({
  no,
  title,
  source,
  image,
  bullets,
  rows,
}: {
  no: string;
  title: string;
  source: string;
  image: string;
  bullets: Array<[string, string]>;
  rows: NeedRow[];
}) => (
  <div className="figma-scene">
    <img alt={title} src={image} />
    <div className="figma-scene__copy">
      <p>{no}</p>
      <h3>{title}</h3>
      <span>{source}</span>
      <dl>
        {bullets.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
    <Panel title="基于行为需求现有的功能拆解" kicker="Hexin jichu dangan" className="figma-scene__table">
      <NeedTable rows={rows} />
    </Panel>
  </div>
);

export function VehicleProfile({
  vehicle,
  isCompared,
  isCompareDisabled,
  onBack,
  onToggleCompare,
}: VehicleProfileProps) {
  const hero = mediaUrl(vehicle, heroImage);
  const tags = isYu7(vehicle) ? yu7Tags : [vehicle.energy, vehicle.level, ...vehicle.keyTags].slice(0, 5);
  const score = isYu7(vehicle) ? 78 : vehicle.completeness;
  const displayPrice = isYu7(vehicle) ? '25.35 - 42.99 万' : formatPrice(vehicle.priceMin, vehicle.priceMax);
  const displayLevel = isYu7(vehicle) ? '中大型纯电 SUV' : `${vehicle.energy}${vehicle.level}`;
  const baseRows = [
    ['官方车型名称', `${vehicle.brand} ${vehicle.model}`],
    ['车型级别', displayLevel],
    ['价格区间', displayPrice],
    ['国家 / 地区', vehicle.countryRegion],
    ['数据完整度', `${vehicle.completeness}%`],
    ['更新时间', vehicle.updatedAt],
    ['能源形式', vehicle.energy],
    ['车型状态', vehicle.status],
  ];
  const specRows = [
    ['长宽高', [vehicle.spec.lengthMm, vehicle.spec.widthMm, vehicle.spec.heightMm].filter(Boolean).join(' / ') || '待补充'],
    ['轴距', vehicle.spec.wheelbaseMm ? `${vehicle.spec.wheelbaseMm} mm` : '待补充'],
    ['座位数', vehicle.spec.seats || '待补充'],
    ['驱动形式', vehicle.spec.drivetrain || '待补充'],
    ['续航', vehicle.spec.cltcRangeKm || '待补充'],
    ['座舱芯片', vehicle.spec.cockpitChip || '待补充'],
    ['屏幕布局', vehicle.spec.screenLayout || '待补充'],
    ['辅助驾驶', vehicle.spec.assistDriving || '待补充'],
  ];

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
            <strong>{vehicle.brand} {vehicle.model} 竞品分析档案</strong>
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

      <section className="figma-hero" style={{ backgroundImage: `url(${hero})` }}>
        <div className="figma-hero__overlay" />
        <div className="figma-hero__content">
          <p>Xiaomi YU7 / Full Profile</p>
          <h1>{vehicle.brand} {vehicle.model}</h1>
          <h2>竞品分析档案</h2>
          <span>
            从 L1 用户市场、L2 车型档案、L3 体验对标、L4 设计借鉴到 L5 测评追溯，形成单车竞品库完整页面。
          </span>
          <div className="figma-pill-row">
            {tags.map((tag) => <em key={tag}>{tag}</em>)}
          </div>
          <div className="figma-hero__meta">
            <KeyValue label="竞品库 ID" value={vehicle.id || 'COM-001'} />
            <KeyValue label="建议层级" value="L1 - L5" />
            <KeyValue label="指导价" value={displayPrice} />
            <KeyValue label="车型级别" value={displayLevel} />
          </div>
        </div>
      </section>

      <section className="figma-section" id="L1">
        <SectionHeader
          kicker="L1 USER / MARKET"
          title="L1-用户市场层"
          intro="根据品牌所定义的目标用户、核心市场卖点与市场定位标签，回答“这台车卖给谁、为什么值得买”。"
        />
        <div className="figma-two">
          <Panel title="核心目标用户" kicker="USER">
            <div className="figma-metric-grid">
              <KeyValue label="科技爱好者 / 小米生态用户" value="25-45岁" />
              <KeyValue label="家庭用户 / 关注空间与长续航" value="多孩" />
              <KeyValue label="新能源 SUV 意向购车群体" value={isYu7(vehicle) ? '25-40万' : displayPrice} />
              <KeyValue label="生活方式与审美敏感用户" value="高线城市" />
            </div>
          </Panel>
          <Panel title="核心市场卖点与定位标签" kicker="MARKET" className="figma-panel--wide">
            <div className="figma-market-grid">
              {(isYu7(vehicle) ? yu7MarketPoints : vehicle.coreHighlights.slice(0, 4).map((item, index) => [`卖点 0${index + 1}`, item])).map(([label, value]) => (
                <KeyValue label={label} value={value} key={label} />
              ))}
            </div>
            <div className="figma-mini-tags">
              {(isYu7(vehicle) ? ['25 万级新能源 SUV 性价比标杆', '跑车级性能家用 SUV', '小米汽车第二款量产车型'] : vehicle.benchmarkSuitability).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <section className="figma-section" id="L2">
        <SectionHeader kicker="L2 PRODUCT PROFILE" title="L2-竞品档案层" intro="基础档案、核心参数、智能配置、版本差异" />
        <div className="figma-two">
          <Panel title="核心基础档案" kicker="Hexin jichu dangan">
            <div className="figma-list-grid">
              {baseRows.map(([label, value]) => <KeyValue label={label} value={value} key={label} />)}
            </div>
          </Panel>
          <Panel title="产品定位与设计价值" kicker="Product / Design">
            <div className="figma-market-grid">
              <KeyValue label="产品定位" value={vehicle.productPositioning} />
              <KeyValue label="目标用户" value={vehicle.targetUsers} />
              <KeyValue label="一句话总结" value={vehicle.summary} />
              <KeyValue label="适合做什么类型对标" value={joinOrDash(vehicle.benchmarkSuitability)} />
            </div>
          </Panel>
        </div>
        <Panel title="核心硬件参数总表" kicker="Hexin jichu dangan" className="figma-panel--full">
          <div className="figma-spec-table">
            {specRows.map(([label, value]) => (
              <div key={label}>
                <strong>{label}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="figma-section" id="L3">
        <SectionHeader kicker="L3 BENCHMARK / EXPERIENCE" title="L3-场景对标分析层" intro="场景对标、功能亮点与机会清单" />
        <SceneBlock
          no="Scene 01"
          title="郊外骑行 / 轻户外出行"
          source="小米 YU7 官方空间场景 / 小红书、抖音轻户外内容 / 汽车之家、懂车帝装载实拍"
          image={mediaUrl(vehicle, sceneCockpitImage)}
          bullets={[
            ['出发前整理装备', '放自行车、头盔、护具、补给、水壶、维修工具。'],
            ['区分干净物和脏污物', '骑行后鞋、护具、自行车零件可能带泥水，不希望弄脏座舱。'],
            ['双手拿装备时开闭储物空间', '搬自行车、折叠椅、背包时，不方便掏手机或钥匙。'],
            ['记录和分享出行内容', '到达骑行点或风景地后，希望拍照、录像、一键生成内容。'],
          ]}
          rows={ridingNeeds}
        />
        <SceneBlock
          no="Scene 02"
          title="宠物友好 / 临停驻车"
          source="小米澎湃智能座舱官方页 / 小米汽车官方问答 / 小红书、抖音、微博养宠用户讨论"
          image={mediaUrl(vehicle, sceneDoorImage)}
          bullets={[
            ['短时间离车时保证宠物安全', '车主需要确认空调、电量、温度、门窗状态。'],
            ['防止宠物误触', '宠物在车内活动时，可能误触实体或触控开关。'],
            ['车外安全提示', '避免路人误以为宠物被困在高温车内。'],
            ['宠物主题资产', '用户希望用真实宠物照片、名字、头像生成专属体验。'],
          ]}
          rows={petNeeds}
        />
      </section>

      <section className="figma-section" id="L4">
        <SectionHeader kicker="L4 DESIGN REFERENCE" title="L4-设计借鉴层" intro="外饰、内饰、HMI 与情绪化体验机会" />
        <div className="figma-gallery-hero" style={{ backgroundImage: `url(${mediaUrl(vehicle, exteriorMainImage)})` }} />
        <div className="figma-gallery-grid">
          {[
            ['外饰', '低趴运动 SUV 姿态', mediaUrl(vehicle, exteriorDetailImage), '长车头、低车顶、宽肩线和短后悬营造跨界运动感。'],
            ['内饰', '科技生活化内饰', mediaUrl(vehicle, interiorDetailImage), '横向仪表台和大屏中心形成简洁座舱，弱化传统机械按钮。'],
            ['HMI', '跨端任务卡片', mediaUrl(vehicle, hmiScreenImage), '以任务为核心组织入口，把导航、音乐、家居等任务压缩到可扫读短卡片。'],
            ['智驾', '驾驶信息前移', mediaUrl(vehicle, hmiDrivingImage), '驾驶高频信息独立，娱乐与生态内容留在中控。'],
          ].map(([label, title, image, copy]) => (
            <article className="figma-gallery-card" key={title}>
              <img alt={title} src={image} />
              <p>{label}</p>
              <h3>{title}</h3>
              <span>{copy}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="figma-section" id="L5">
        <SectionHeader kicker="L5 REVIEW / TRACE" title="L5-测评追溯层" intro="资料链接、讨论热度、评分依据与后续调研线索" />
        <div className="figma-score-layout">
          <Panel title="核心基础档案" kicker="Hexin jichu dangan" className="figma-score-card">
            <div className="figma-score-ring">
              <strong>{score}</strong>
              <span>整体评分 / 100</span>
            </div>
            <div className="figma-score-split">
              <KeyValue label="1.X 外部实用体验" value="14 / 20" />
              <KeyValue label="2.X 内部空间体验" value="30 / 40" />
              <KeyValue label="3.X 硬件及智能化体验" value="34 / 40" />
            </div>
          </Panel>
          <Panel title="模块评测逻辑" kicker="Hexin jichu dangan" className="figma-score-copy">
            <KeyValue label="1.X 外部实用体验" value="上下车流畅度 / 前后备箱使用体验" />
            <KeyValue label="2.X 内部空间体验" value="内饰用料 / 座椅乘坐 / 储物 / 环境质量" />
            <KeyValue label="3.X 硬件及智能化体验" value="硬件配置 / 车机系统 / 灯光氛围 / 空调功能" />
          </Panel>
          <Panel title="核心评测参数总表" kicker="Hexin jichu dangan" className="figma-score-table-panel">
            <div className="figma-score-table">
              <div>
                <span>评测维度</span>
                <span>满分</span>
                <span>{vehicle.model} 得分</span>
                <span>评分依据</span>
              </div>
              {scoreRows.map(([dimension, max, current, reason]) => (
                <div key={dimension}>
                  <strong>{dimension}</strong>
                  <span>{max}</span>
                  <em>{isYu7(vehicle) ? current : '待评'}</em>
                  <p>{isYu7(vehicle) ? reason : '待结合实车体验、媒体评测和用户讨论补充评分依据。'}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

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
      </section>
    </main>
  );
}
