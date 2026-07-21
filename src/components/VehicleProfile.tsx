import { ArrowLeft, ChevronLeft, ChevronRight, GitCompare } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { formatPrice } from '../constants/options';
import heroImage from '../assets/figma-yu7-optimized/hero.jpg';
import exteriorMainImage from '../assets/figma-yu7-optimized/exterior-main.jpg';
import exteriorDetailImage from '../assets/figma-yu7-optimized/exterior-detail.jpg';
import interiorDetailImage from '../assets/figma-yu7-optimized/interior-detail.jpg';
import hmiDrivingImage from '../assets/figma-yu7-optimized/hmi-driving.jpg';
import hmiScreenImage from '../assets/figma-yu7-optimized/hmi-screen.jpg';
import sceneCockpitImage from '../assets/figma-yu7-optimized/scene-cockpit.jpg';
import sceneDoorImage from '../assets/figma-yu7-optimized/scene-door.jpg';
import type {
  MediaAsset,
  ProfileDesignReference,
  ProfileFeature,
  ProfileKeyValue,
  ProfileOpportunity,
  ProfileScene,
  ProfileSceneNeed,
  ProfileScoreRow,
  ProfileSpecRow,
  ProfileUserPoint,
  Vehicle,
} from '../types/vehicle';

interface VehicleProfileProps {
  vehicle: Vehicle;
  isCompared: boolean;
  isCompareDisabled: boolean;
  onBack: () => void;
  onToggleCompare: (vehicle: Vehicle) => void;
}

interface LabelValue {
  label: string;
  value: string;
}

interface ConfigMatrixRow {
  label: string;
  standard: string;
  version: string;
}

interface VersionMatrixRow {
  label: string;
  values: string[];
}

interface GallerySlide {
  id: string;
  title: string;
  description: string;
  media?: MediaAsset;
}

interface GalleryCard {
  id: string;
  group: string;
  kicker: string;
  url?: string;
  slides: GallerySlide[];
}

const navItems = ['L1 用户市场', 'L2 竞品档案', 'L3 对标分析', 'L4 设计对标', 'L5 测评追溯'];
const versionColumns = ['标准版', 'Pro 版', 'Max 版', 'GT 版'];

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
  const text = String(value).trim();
  return text !== '' && text !== '待补充' && text !== '[]' && text !== '{}';
};

const clean = (value: string | number | undefined | null) => (hasValue(value) ? String(value).trim() : '');

const unique = (items: Array<string | undefined>) =>
  Array.from(new Set(items.map((item) => item?.trim()).filter(Boolean) as string[]));

const compactRows = (rows: Array<[string, string | number | undefined | null]>): LabelValue[] =>
  rows
    .map(([label, value]) => ({ label, value: clean(value) }))
    .filter((row) => hasValue(row.value));

const numberFromText = (value: string | number | undefined) => {
  const match = String(value || '').match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const assetUrl = (asset?: MediaAsset) => clean(asset?.url);

const imageAsset = (id: string, url: string, title: string): MediaAsset => ({
  id,
  type: 'image',
  url,
  title,
  alt: title,
  source: 'Figma 设计稿',
});

const FigmaImage = ({
  alt,
  className,
  fallbackSrc,
  src,
}: {
  alt: string;
  className?: string;
  fallbackSrc?: string;
  src?: string;
}) => {
  const primary = clean(src);
  const fallback = clean(fallbackSrc);
  const resolved = primary || fallback;
  if (!resolved) return null;

  return (
    <img
      alt={alt}
      className={className}
      src={resolved}
      onError={(event) => {
        const image = event.currentTarget;
        if (fallback && image.dataset.fallbackApplied !== 'true') {
          image.dataset.fallbackApplied = 'true';
          image.src = fallback;
        }
      }}
    />
  );
};

const valueFromItems = (items: ProfileKeyValue[], names: string[]) => {
  const matched = items.find((item) => names.includes(item.label));
  return clean(matched?.value);
};

const valueFromRows = (rows: LabelValue[], label: string) => rows.find((row) => row.label === label)?.value || '';

const preferRows = (rows: LabelValue[], fallback: LabelValue[], enableFallback: boolean) => {
  if (!enableFallback) return rows;
  return fallback
    .map((fallbackRow) => ({
      label: fallbackRow.label,
      value: valueFromRows(rows, fallbackRow.label) || fallbackRow.value,
    }))
    .filter((row) => hasValue(row.value));
};

const priceText = (vehicle: Vehicle) => {
  if (!vehicle.priceMin && !vehicle.priceMax) return '';
  if (vehicle.priceMin === vehicle.priceMax) return `${vehicle.priceMin} 万`;
  return formatPrice(vehicle.priceMin, vehicle.priceMax).replace('-', ' - ');
};

const officialNameOf = (vehicle: Vehicle) => {
  const brand = clean(vehicle.brand);
  const model = clean(vehicle.model);
  if (!brand) return model;
  if (!model) return brand;
  return model.includes(brand) ? model : `${brand} ${model}`;
};

const visibleIdOf = (vehicle: Vehicle, fallback: string) => {
  const id = clean(vehicle.id);
  if (id && !/^rec/i.test(id)) return id;
  return fallback;
};

const isYu7Vehicle = (vehicle: Vehicle) => `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes('yu7') || vehicle.model.includes('小米');

const textAfterLabel = (source: string, labels: string[]) => {
  const lines = clean(source)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (const label of labels) {
    const pattern = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:：]\\s*(.*)$`, 'i');
    const matched = lines.find((line) => pattern.test(line));
    if (matched) return matched.replace(pattern, '$1').trim();
  }

  return '';
};

const rowText = (row: ProfileSpecRow) => [row.value, row.description].filter(hasValue).join('\n');

const specRowByLabel = (rows: ProfileSpecRow[], names: string[]) =>
  rows.find((row) => names.some((name) => clean(row.label).includes(name)));

const parseConfigMatrix = (rows: ProfileSpecRow[]) => {
  const labels = ['智能座舱', '智能驾驶', '舒适配置'];
  return labels
    .map((label) => {
      const row = specRowByLabel(rows, [label]);
      if (!row) return null;
      const text = rowText(row);
      return {
        label,
        standard: textAfterLabel(text, ['全系标配']) || clean(row.value),
        version: textAfterLabel(text, ['版本专属配置', '版本配置']),
      };
    })
    .filter((row): row is ConfigMatrixRow => Boolean(row && (row.standard || row.version)));
};

const parseVersionMatrix = (rows: ProfileSpecRow[]) => {
  const rowLabels = [
    ['驱动形式', '驱动'],
    ['峰值功率', '功率'],
    ['零百加速', '加速'],
    ['电池容量', '电池'],
    ['CLTC 续航', 'CLTC', '续航'],
    ['车身尺寸', '尺寸', '长宽高'],
  ];

  return rowLabels
    .map(([displayLabel, ...aliases]) => {
      const row = specRowByLabel(rows, [displayLabel, ...aliases]);
      if (!row) return null;
      const text = rowText(row);
      const values = [
        textAfterLabel(text, ['标准版']),
        textAfterLabel(text, ['Pro版', 'Pro 版']),
        textAfterLabel(text, ['Max版', 'Max 版']),
        textAfterLabel(text, ['GT版', 'GT 版']),
      ];
      const fallback = clean(row.value);
      return {
        label: displayLabel,
        values: values.some(hasValue) ? values : [fallback, fallback, fallback, fallback],
      };
    })
    .filter((row): row is VersionMatrixRow => Boolean(row && row.values.some(hasValue)));
};

const mergeSceneImages = (scenes: ProfileScene[], fallbacks: ProfileScene[], enableFallback: boolean) => {
  if (!scenes.length) return enableFallback ? fallbacks : [];
  return scenes.map((scene, index) => ({
    ...scene,
    source: clean(scene.source) || fallbacks[index]?.source || '',
    image: scene.image?.url ? scene.image : fallbacks[index]?.image,
    needs: scene.needs?.length ? scene.needs : fallbacks[index]?.needs || [],
  }));
};

const mergeScoreRows = (rows: ProfileScoreRow[], fallback: ProfileScoreRow[], enableFallback: boolean) => {
  if (!enableFallback) return rows;
  if (!rows.length) return fallback;

  return fallback.map((fallbackRow) => {
    const matched = rows.find((row) => clean(row.dimension) === fallbackRow.dimension);
    return {
      dimension: fallbackRow.dimension,
      maxScore: clean(matched?.maxScore) || fallbackRow.maxScore,
      score: clean(matched?.score) || fallbackRow.score,
      reason: clean(matched?.reason) || fallbackRow.reason,
    };
  });
};

const designCardsFromReferences = (references: ProfileDesignReference[]): GalleryCard[] => {
  const cards: GalleryCard[] = [];

  references.forEach((item, index) => {
    const group = clean(item.group) || `设计亮点 ${index + 1}`;
    const cardId = `l4-${group}`;
    let card = cards.find((existing) => existing.id === cardId);
    if (!card) {
      card = {
        id: cardId,
        group,
        kicker: group ? `${group} Highlights` : 'Highlights',
        url: item.url,
        slides: [],
      };
      cards.push(card);
    }

    card.slides.push({
      id: item.id || `${cardId}-${card.slides.length + 1}`,
      title: item.title,
      description: item.description,
      media: item.image,
    });
  });

  return cards.filter((card) =>
    card.slides.some((slide) => hasValue(slide.title) || hasValue(slide.description) || hasValue(slide.media?.url)),
  );
};

const yu7Fallback = {
  vehicleId: 'COM-001',
  benchmarkLevel: 'L1 - L5',
  hero: imageAsset('yu7-fallback-hero', heroImage, '小米 YU7 主视觉'),
  summary:
    '小米 YU7 的核心不是单纯做一台“大 SUV”，而是把 SUV 的空间能力、智能座舱、生态配件、车外语音、宠物模式和内容分享能力整合成一个移动生活空间。',
  tags: ['纯电中大型 SUV', '家庭生活方式 SUV', '科技与美学共生', '生态拓展', '智能座舱'],
  l1Targets: [
    { keyword: '科技爱好者 / 小米生态用户', description: '25-45岁' },
    { keyword: '家庭用户 / 关注空间与长续航', description: '多孩' },
    { keyword: '新能源 SUV 意向购车群体', description: '25-40万' },
    { keyword: '生活方式与审美敏感用户', description: '高线城市' },
  ],
  marketPoints: [
    { keyword: '卖点 01', description: '全系标配激光雷达 + 高阶辅助驾驶，同价位配置天花板。' },
    { keyword: '卖点 02', description: '800V 高压平台 + 最高 835km CLTC 续航，兼顾性能与长途实用。' },
    { keyword: '卖点 03', description: '延续小米 SU7 设计语言，轿跑 SUV 造型兼顾颜值与空间。' },
    { keyword: '卖点 04', description: '米家生态全链路打通，座舱智能体验拉满。' },
  ],
  basicRows: [
    { label: '官方车型名称', value: '小米 YU7' },
    { label: '车型级别', value: '中大型纯电SUV' },
    { label: '生产平台', value: '小米摩德纳平台' },
    { label: '上市时间', value: '2025年6月26日正式发布' },
    { label: '官方指导价', value: '25.35 万元 - 42.99 万元' },
    { label: '能源类型', value: '纯电动' },
    { label: '车身结构', value: '5门5座SUV，承载式车身' },
    { label: '对标车型', value: '特斯拉 Model Y、蔚来 ES6、理想 L6、极氪 7X' },
  ],
  configRows: [
    {
      label: '智能座舱',
      standard: '骁龙 8 Gen3 芯片、四合一域控制模块、14 扬声器音响、双层静音玻璃、HEPA 高效空气净化系统。',
      version: 'Pro/Max 版：Nappa 真皮座椅、主副驾零重力座椅、电动前备箱\nGT 版：Alcantara 运动座椅、碳纤内饰件',
    },
    {
      label: '智能驾驶',
      standard: '全系标配激光雷达、英伟达 Thor 芯片（700TOPS 算力）、Xiaomi Pilot 小米辅助驾驶、180 度超广角照明大灯。',
      version: 'Max 版：5.2C 超充技术\nGT 版：赛道级驾驶模式、专属空气动力学套件',
    },
    {
      label: '舒适配置',
      standard: '全车座椅按摩、防眩目内后视镜、盲区监测、电动尾门、无框车门。',
      version: 'Pro/Max 版：双区 / 四区自动空调、座椅通风加热\nGT 版：专属赛道模式、Alcantara 方向盘',
    },
  ],
  versionRows: [
    { label: '驱动形式', values: ['后置单电机', '双电机四驱', '高性能四驱', '高性能四驱'] },
    { label: '峰值功率', values: ['235kW', '496kW', '690kW', '738kW'] },
    { label: '零百加速', values: ['5.8s', '4.27s', '3.2s', '2.92s'] },
    { label: '电池容量', values: ['96.3kWh 磷酸铁锂', '96.3kWh 磷酸铁锂', '96.3kWh 磷酸铁锂', '101.7kWh 三元锂'] },
    { label: 'CLTC 续航', values: ['835km', '770km', '730km', '705km'] },
    { label: '车身尺寸', values: ['4999 × 1998 × 1600mm，轴距 3000mm', '', '', ''] },
  ],
  scenes: [
    {
      id: 'yu7-scene-outdoor',
      title: '郊外骑行 / 轻户外出行',
      source: '小米汽车官方资料 / 用户骑行与轻户外场景讨论',
      image: imageAsset('yu7-scene-cockpit', sceneCockpitImage, '郊外骑行场景'),
      needs: [
        {
          need: '出发前整理装备',
          note: '放自行车、头盔、护具、补给、水壶、维修工具。',
          hardware: '141L 电动前备箱、后备箱、后排 4/6 电动放倒、1970L 最大储物容积、36 处收纳',
          software: '/',
          judgement: '现有表达重点是“空间能装”，通过官方骑行场景展示自行车、露营装备、骑行护具的装载能力。',
        },
        {
          need: '区分干净物和脏污物',
          note: '骑行后鞋、护具、自行车零件可能带泥水，不希望弄脏座舱。',
          hardware: '前备箱、后备箱、后排储物抽屉、36 处收纳',
          software: '/',
          judgement: '硬件具备分区基础，但现有体验主要依赖用户自行判断。',
        },
        {
          need: '双手拿装备时开闭储物空间',
          note: '搬自行车、折叠椅、背包时，不方便掏手机或钥匙。',
          hardware: '电动前备箱、电动后尾门、车外 4 模组 8 麦克风阵列',
          software: '车外小爱语音、声纹 + 数字钥匙双重验证、车外连续说',
          judgement: '这是 YU7 当前比较完整的车外拿取链路，适合装备搬运和前备箱开启场景。',
        },
        {
          need: '保留部分乘坐空间',
          note: '后排坐人和装装备需要共存。',
          hardware: '后排 4/6 比例电动放倒、后备箱空间',
          software: '/',
          judgement: '硬件支持半载入半装物，但没有看到官方提供放倒比例推荐。',
        },
        {
          need: '途中补给和休息',
          note: '短暂停靠时补水、休息、取用食物。',
          hardware: '4.6L 车载智能冰箱、36 处收纳、水杯架、后排储物抽屉',
          software: '冰箱支持前后排控制屏和智能语音控制',
          judgement: '冰箱和多处收纳覆盖补给需求，其中冰箱控制链路比较明确。',
        },
        {
          need: '记录和分享出行内容',
          note: '到达骑行点或风景地后，希望拍照、录像、一键生成内容。',
          hardware: '车载拍摄能力、车外语音能力、生态拓展接口',
          software: '智能影像、一键成片、车外语音操控；车载拍照功能需 OTA',
          judgement: 'YU7 已经有内容化方向，但车载拍照需注意 OTA 状态，不能当作完全落地能力写死。',
        },
      ],
    },
    {
      id: 'yu7-scene-pet',
      title: '宠物友好 / 临停驻车',
      source: '小米澎湃智能座舱官方页 / 小米汽车官方问答 / 小红书、抖音、微博养宠用户讨论',
      image: imageAsset('yu7-scene-door', sceneDoorImage, '宠物友好座舱场景'),
      needs: [
        {
          need: '短时间离车时保证宠物安全',
          note: '车主需要确认空间、电量、温度、门窗状态。',
          hardware: '空调系统、电量基础能力、车机屏幕',
          software: '宠物模式 / 智能宠物空间',
          judgement: 'YU7 已经把宠物作为官方场景，但更完整的宠物安全状态展示仍可在机会点中展开。',
        },
        {
          need: '防止宠物误触车窗、门锁、喇叭等功能',
          note: '宠物在车内活动时，可能误触实体或触控开关。',
          hardware: '门窗、踏板、喇叭等车辆控制硬件',
          software: '媒体转述官方问答中提到宠物模式下会限制部分误触行为',
          judgement: '该点建议标注为“媒体转述官方问答，需复核”，不要直接当作无条件全系能力。',
        },
        {
          need: '车外安全提示',
          note: '避免路人误以为宠物被困在高温车内。',
          hardware: '车机屏幕、外部提示能力',
          software: '驻车屏幕提示 / 宠物状态提示',
          judgement: '适合作为 HMI 表达重点，强调“车内安全状态对车外可见”。',
        },
        {
          need: '宠物主题资产',
          note: '用户希望用真实宠物照片、名字、头像生成专属体验。',
          hardware: '中控屏、车载影像能力',
          software: '宠物主题卡片、专属动效、照片资产',
          judgement: '适合沉淀为生态主题和车机内容资产机会。',
        },
      ],
    },
  ] satisfies ProfileScene[],
  features: [
    {
      id: 'yu7-feature-voice',
      title: '亮点 01',
      feature: '车外小爱语音与声纹安全链路',
      judgement: '把“手上拿着东西”的动作场景转成车外语音入口，适合前备箱、尾门、装备搬运等高频场景。',
      benchmarkValue: '对标时重点看车外语音是否能和数字钥匙、声纹、安全确认形成闭环。',
      image: imageAsset('yu7-feature-cockpit', sceneCockpitImage, '车外小爱语音场景'),
    },
    {
      id: 'yu7-feature-pet',
      title: '亮点 02',
      feature: '宠物模式 / 智能宠物空间',
      judgement: '官方已经把宠物作为可感知场景，但安全状态、误触限制、车外提示还需要更清晰的 HMI 分层。',
      benchmarkValue: '适合用来对标“生活方式场景如何从功能变成可被信任的状态表达”。',
      image: imageAsset('yu7-feature-pet', sceneDoorImage, '宠物模式座舱'),
    },
  ] satisfies ProfileFeature[],
  opportunities: [
    {
      id: 'yu7-opportunity-storage',
      title: '外饰 / 储物与前备箱一体入口',
      type: 'Exterior / Function',
      priority: '高',
      source: '骑行、露营、装备搬运场景',
      direction: '把前备箱开启、装载提示和外部语音入口形成明确视觉锚点。',
      description: '围绕前备箱、尾门和车外语音，建立“装备到车”的完整拿取体验。',
      designValue: '有助于把 SUV 空间优势从参数转成可见、可感知、可操作的体验资产。',
    },
    {
      id: 'yu7-opportunity-pet',
      title: '座舱 / 宠物安全状态表达',
      type: 'Cockpit / HMI',
      priority: '高',
      source: '宠物临停与车外提示场景',
      direction: '把温度、电量、门窗、误触锁定、车外提示统一到一个宠物安全状态面板。',
      description: '避免只做“宠物主题皮肤”，而是让用户和路人都能理解车内状态。',
      designValue: '可作为家庭生活方式 SUV 的差异化 HMI 表达。',
    },
  ] satisfies ProfileOpportunity[],
  designHero: [imageAsset('yu7-l4-hero', exteriorMainImage, 'L4 设计对标主视觉')],
  designCards: [
    {
      id: 'yu7-l4-ext',
      group: '外观亮点',
      kicker: 'EXT Highlights',
      url: 'https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
      slides: [
        {
          id: 'yu7-l4-ext-1',
          title: '家族化超大蚌式机盖',
          description: '跳转链接：https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
          media: imageAsset('yu7-l4-ext-1', exteriorDetailImage, '家族化超大蚌式机盖'),
        },
        {
          id: 'yu7-l4-ext-2',
          title: '低趴运动 SUV 姿态',
          description: '跳转链接：https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
          media: imageAsset('yu7-l4-ext-2', exteriorMainImage, '低趴运动 SUV 姿态'),
        },
      ],
    },
    {
      id: 'yu7-l4-int',
      group: '内饰亮点',
      kicker: 'EXT Highlights',
      url: 'https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
      slides: [
        {
          id: 'yu7-l4-int-1',
          title: '环抱式智能座舱布局',
          description: '跳转链接：https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
          media: imageAsset('yu7-l4-int-1', hmiScreenImage, '环抱式智能座舱布局'),
        },
        {
          id: 'yu7-l4-int-2',
          title: '智能座舱生活场景',
          description: '跳转链接：https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
          media: imageAsset('yu7-l4-int-2', sceneDoorImage, '智能座舱生活场景'),
        },
      ],
    },
    {
      id: 'yu7-l4-cmf',
      group: 'CMF亮点',
      kicker: 'CMF Highlights',
      url: 'https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
      slides: [
        {
          id: 'yu7-l4-cmf-1',
          title: '丰富的色彩体系',
          description: '跳转链接：https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
          media: imageAsset('yu7-l4-cmf-1', interiorDetailImage, '丰富的色彩体系'),
        },
        {
          id: 'yu7-l4-cmf-2',
          title: '多色车身展示',
          description: '跳转链接：https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
          media: imageAsset('yu7-l4-cmf-2', heroImage, '多色车身展示'),
        },
      ],
    },
    {
      id: 'yu7-l4-hmi',
      group: 'HMI亮点',
      kicker: 'HMI Highlights',
      url: 'https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
      slides: [
        {
          id: 'yu7-l4-hmi-1',
          title: '小米澎湃 OS',
          description: '跳转链接：https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
          media: imageAsset('yu7-l4-hmi-1', hmiDrivingImage, '小米澎湃 OS'),
        },
        {
          id: 'yu7-l4-hmi-2',
          title: '座舱 HMI 布局',
          description: '跳转链接：https://www.xiaomiev.com/yu7?c=baidu_brandyu7_pc&g_utm=Thirdparty.Baidu.ProductUnion.BrandZone-Baidu-PC.Brand-A-62',
          media: imageAsset('yu7-l4-hmi-2', hmiScreenImage, '座舱 HMI 布局'),
        },
      ],
    },
  ] satisfies GalleryCard[],
  score: '78',
  totalScore: '100',
  scoreRows: [
    { dimension: '1.1 上下车流畅度', maxScore: '10', score: '6', reason: '溜背造型后排进出易碰头，底盘偏低，老人小孩上下车不便，仅前排流畅' },
    { dimension: '1.2 前 / 后备箱使用体验', maxScore: '10', score: '8', reason: '电动前备箱 + 常规后备箱 560L，开口大进深足，溜背造型限制垂直高度，大件高箱体装载受限' },
    { dimension: '2.1 内饰用料覆盖度', maxScore: '10', score: '8', reason: '全车 Nappa 真皮 + Alcantara 运动面料，中控台、门板软包全覆盖，底部、门槛大面积硬塑料' },
    { dimension: '2.2 座椅乘坐体验', maxScore: '10', score: '7', reason: '前排包裹支撑极强，适合激烈驾驶；后排坐垫偏短、靠背陡，溜背头部压抑，长途舒适性一般' },
    { dimension: '2.3 车内储物空间', maxScore: '10', score: '7', reason: '中控下层掏空、门板储物槽常规，无多格分层收纳，缺少更多分层收纳，储物数量偏少' },
    { dimension: '2.4 车内环境质量', maxScore: '10', score: '8', reason: '新车异味控制良好，双层隔音玻璃，高速风噪偏大，无主动香氛、空气净化档位偏少' },
    { dimension: '3.1 硬件配置', maxScore: '10', score: '9', reason: '全系标配激光雷达、800V 高压平台、前排座椅通风加热，硬件偏驾驶取向' },
    { dimension: '3.2 车机系统功能体验', maxScore: '10', score: '8', reason: '小米澎湃 OS 流畅度高，手机生态联动强，连续对话能力仍可增强' },
    { dimension: '3.3 灯光氛围', maxScore: '10', score: '9', reason: '全车多色动态氛围灯，门板、中控台、座椅靠背灯带联动，灯效动画丰富' },
    { dimension: '3.4 空调功能', maxScore: '10', score: '8', reason: '双区自动空调，前排座椅温控，后排风量偏弱，无独立后排控制面板' },
    { dimension: '整车总分', maxScore: '100', score: '78', reason: '轿跑运动取向，科技配置拉满，家用舒适属性有明显短板' },
  ] satisfies ProfileScoreRow[],
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
    <h3>{title}</h3>
    <p className="figma-panel__kicker">{kicker}</p>
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

const MetricValue = ({ label, value }: { label: string; value: string }) => (
  <div className="figma-metric">
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
);

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

const SceneBlock = ({
  fallbackImage,
  index,
  scene,
}: {
  fallbackImage?: MediaAsset;
  index: number;
  scene: ProfileScene;
}) => {
  const sceneImage = assetUrl(scene.image);
  const fallbackSceneImage = assetUrl(fallbackImage);
  const displayImage = sceneImage || fallbackSceneImage;
  const notes = scene.needs.filter((row) => hasValue(row.need) && (hasValue(row.note) || hasValue(row.judgement)));

  return (
    <div className={`figma-scene ${displayImage ? '' : 'figma-scene--text-only'}`}>
      {displayImage && <FigmaImage alt={scene.title} src={sceneImage} fallbackSrc={fallbackSceneImage} />}
      <div className="figma-scene__copy">
        <p>Scene {String(index + 1).padStart(2, '0')}</p>
        <h3>{scene.title}</h3>
        {hasValue(scene.source) && <span>{scene.source}</span>}
        {notes.length > 0 && (
          <dl>
            {notes.map((row, noteIndex) => (
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
  fallbackMedia = [],
  media,
  activeIndex,
  onPrevious,
  onNext,
}: {
  fallbackMedia?: MediaAsset[];
  media: MediaAsset[];
  activeIndex: number;
  onPrevious: () => void;
  onNext: () => void;
}) => {
  if (!media.length) return null;
  const activeMedia = media[activeIndex % media.length];
  const fallbackActiveMedia = fallbackMedia[activeIndex % Math.max(fallbackMedia.length, 1)] || fallbackMedia[0];

  return (
    <div className="figma-gallery-hero">
      <FigmaImage alt={activeMedia.title} src={activeMedia.url} fallbackSrc={assetUrl(fallbackActiveMedia)} />
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
  const [activeCardIndex, setActiveCardIndex] = useState<Record<string, number>>({});
  const profile = vehicle.profile;
  const useYu7Fallback = isYu7Vehicle(vehicle);
  const useYu7DemoFallback = useYu7Fallback && !vehicle.recordId;
  const officialName = officialNameOf(vehicle);
  const displayPrice = useYu7DemoFallback
    ? '25.35 - 42.99 万'
    : valueFromItems(profile?.l2?.basicItems || [], ['官方指导价', '指导价']) || priceText(vehicle);
  const displayLevel = clean(vehicle.level);
  const rawVisibleVehicleId = visibleIdOf(vehicle, '');
  const visibleVehicleId = useYu7DemoFallback ? yu7Fallback.vehicleId : rawVisibleVehicleId || vehicle.recordId || vehicle.id;
  const fallbackHeroImage = useYu7DemoFallback ? yu7Fallback.hero.url : '';
  const coverImage = assetUrl(vehicle.coverImage) || fallbackHeroImage;
  const heroStyle =
    coverImage
      ? {
          backgroundImage: fallbackHeroImage && coverImage !== fallbackHeroImage
            ? `url(${coverImage}), url(${fallbackHeroImage})`
            : `url(${coverImage})`,
        }
      : undefined;
  const summary = useYu7DemoFallback ? yu7Fallback.summary : clean(vehicle.summary);
  const benchmarkLevel = clean(profile?.benchmarkLevel) || (useYu7DemoFallback ? yu7Fallback.benchmarkLevel : '');
  const tags = useYu7DemoFallback
    ? yu7Fallback.tags
    : unique([...(vehicle.keyTags || []), ...(profile?.l1?.tags || [])]).slice(0, 5);
  const l1Targets = (profile?.l1?.targetUsers || []).filter((item) => hasValue(item.keyword) && hasValue(item.description));
  const marketPoints = (profile?.l1?.marketPoints || []).filter((item) => hasValue(item.keyword) && hasValue(item.description));
  const displayTargets = useYu7DemoFallback && !l1Targets.length ? yu7Fallback.l1Targets : l1Targets;
  const displayMarketPoints = useYu7DemoFallback && !marketPoints.length ? yu7Fallback.marketPoints : marketPoints;
  const l2BasicItems = profile?.l2?.basicItems || [];

  const baseRows = useYu7DemoFallback
    ? yu7Fallback.basicRows
    : preferRows(
        compactRows([
          ['官方车型名称', officialName],
          ['车型级别', valueFromItems(l2BasicItems, ['车型级别']) || displayLevel],
          ['生产平台', valueFromItems(l2BasicItems, ['生产平台', '车型平台'])],
          ['上市时间', valueFromItems(l2BasicItems, ['上市时间'])],
          ['官方指导价', displayPrice],
          ['能源类型', valueFromItems(l2BasicItems, ['能源类型', '能源形式']) || vehicle.energy],
          ['车身结构', valueFromItems(l2BasicItems, ['车身结构'])],
          ['对标车型', valueFromItems(l2BasicItems, ['对标车型'])],
        ]),
        yu7Fallback.basicRows,
        useYu7DemoFallback,
      );

  const specRows = useMemo(() => profile?.l2?.specRows || [], [profile?.l2?.specRows]);
  const parsedConfigRows = parseConfigMatrix(specRows);
  const configRows = parsedConfigRows.length ? parsedConfigRows : useYu7DemoFallback ? yu7Fallback.configRows : [];
  const parsedVersionRows = parseVersionMatrix(specRows);
  const versionRows = parsedVersionRows.length ? parsedVersionRows : useYu7DemoFallback ? yu7Fallback.versionRows : [];
  const scenes = mergeSceneImages((profile?.l3Scenes || []).filter((scene) => hasValue(scene.title)), yu7Fallback.scenes, useYu7DemoFallback);
  const features = (profile?.l3Features || []).filter((item) => hasValue(item.title) || hasValue(item.feature));
  const displayFeatures = features.length ? features : useYu7DemoFallback ? yu7Fallback.features : [];
  const opportunities = (profile?.l3Styling || []).filter((item) => hasValue(item.title) || hasValue(item.description));
  const displayOpportunities = opportunities.length ? opportunities : useYu7DemoFallback ? yu7Fallback.opportunities : [];
  const designReferences = (profile?.l4Design?.references || []).filter((item) => hasValue(item.description) || hasValue(item.image?.url));
  const profileDesignMedia = [
    ...(profile?.l4Design?.heroImages || []),
    ...designReferences.map((item) => item.image).filter(Boolean),
  ].filter((item): item is MediaAsset => Boolean(item?.url));
  const designMedia = profileDesignMedia.length ? profileDesignMedia : useYu7DemoFallback ? yu7Fallback.designHero : [];
  const galleryCards: GalleryCard[] = designReferences.length
    ? designCardsFromReferences(designReferences)
    : useYu7DemoFallback
      ? yu7Fallback.designCards
      : [];
  const rawScoreRows = (profile?.l5?.rows || []).filter((row: ProfileScoreRow) => hasValue(row.dimension));
  const scoreRows = mergeScoreRows(rawScoreRows, yu7Fallback.scoreRows, useYu7DemoFallback);
  const score = clean(profile?.l5?.score) || (useYu7DemoFallback ? yu7Fallback.score : '');
  const totalScore = clean(profile?.l5?.totalScore) || (useYu7DemoFallback ? yu7Fallback.totalScore : '100');
  const scorePercent = score ? Math.min(100, Math.round((numberFromText(score) / Math.max(numberFromText(totalScore), 1)) * 100)) : 0;
  const hasL3 = scenes.length > 0 || displayFeatures.length > 0 || displayOpportunities.length > 0;
  const hasL4 = designMedia.length > 0 || galleryCards.length > 0;
  const hasL5 = score || scoreRows.length > 0;

  const changeCardImage = (card: GalleryCard, direction: -1 | 1) => {
    if (card.slides.length <= 1) return;
    setActiveCardIndex((current) => ({
      ...current,
      [card.id]: ((current[card.id] || 0) + direction + card.slides.length) % card.slides.length,
    }));
  };

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
            <span>Vehicle Benchmark / Full Profile</span>
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

      <section className={`figma-hero ${coverImage ? '' : 'figma-hero--plain'}`} style={heroStyle}>
        <div className="figma-hero__overlay" />
        <div className="figma-hero__content">
          <p>{officialName} / Full Profile</p>
          <h1>{officialName}</h1>
          <h2>竞品分析档案</h2>
          {summary && <span>{summary}</span>}
          {tags.length > 0 && (
            <div className="figma-pill-row">
              {tags.map((tag) => <em key={tag}>{tag}</em>)}
            </div>
          )}
          <div className="figma-hero__meta">
            {compactRows([
              ['竞品库 ID', visibleVehicleId],
              ['建议对标层级', benchmarkLevel],
              ['指导价', displayPrice],
              ['车型级别', baseRows.find((row) => row.label === '车型级别')?.value || displayLevel],
            ]).map((row) => <KeyValue label={row.label} value={row.value} key={row.label} />)}
          </div>
        </div>
      </section>

      {(displayTargets.length > 0 || displayMarketPoints.length > 0) && (
        <section className="figma-section figma-section--l1" id="L1">
          <SectionHeader
            kicker="L1 USER / MARKET"
            title="L1-用户市场层"
            intro="根据品牌所定义的目标用户、核心市场卖点与市场定位标签，回答“这台车卖给谁、为什么值得买”。"
          />
          <div className="figma-two">
            {displayTargets.length > 0 && (
              <Panel title="核心目标用户" kicker="USER">
                <div className="figma-metric-grid">
                  {displayTargets.slice(0, 4).map((item: ProfileUserPoint) => (
                    <MetricValue label={item.keyword} value={item.description} key={item.keyword} />
                  ))}
                </div>
              </Panel>
            )}
            {displayMarketPoints.length > 0 && (
              <Panel title="核心市场卖点与定位标签" kicker="MARKET" className="figma-panel--wide">
                <div className="figma-market-grid">
                  {displayMarketPoints.slice(0, 4).map((item: ProfileUserPoint) => (
                    <KeyValue label={item.keyword} value={item.description} key={item.keyword} />
                  ))}
                </div>
              </Panel>
            )}
          </div>
        </section>
      )}

      {(baseRows.length > 0 || configRows.length > 0 || versionRows.length > 0) && (
        <section className="figma-section figma-section--l2" id="L2">
          <SectionHeader kicker="L2 PRODUCT PROFILE" title="L2-竞品档案层" intro="基础档案、核心参数、智能配置、版本差异" />
          {(baseRows.length > 0 || configRows.length > 0) && (
            <div className="figma-two">
              {baseRows.length > 0 && (
                <Panel title="核心基础档案" kicker="Hexin jichu dangan">
                  <div className="figma-basic-list">
                    {baseRows.map((row) => (
                      <KeyValue label={row.label} value={row.value} key={row.label} />
                    ))}
                  </div>
                </Panel>
              )}
              {configRows.length > 0 && (
                <Panel title="智能与配置核心信息" kicker="Zhineng yupeizhi hexinxinxi">
                  <div className="figma-config-table">
                    <div>
                      <span />
                      <strong>全系标配</strong>
                      <strong>版本专属配置</strong>
                    </div>
                    {configRows.map((row) => (
                      <div key={row.label}>
                        <span>{row.label}</span>
                        <p>{row.standard}</p>
                        <p>{row.version}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          )}
          {versionRows.length > 0 && (
            <Panel title="核心硬件参数总表" kicker="Hexin jichu dangan" className="figma-panel--full">
              <div className="figma-version-table">
                <div className="figma-version-table__head">
                  <span />
                  {versionColumns.map((column) => <strong key={column}>{column}</strong>)}
                </div>
                {versionRows.map((row) => (
                  <div className={row.label === '车身尺寸' ? 'is-wide' : ''} key={row.label}>
                    <span>{row.label}</span>
                    {versionColumns.map((column, index) => (
                      <p key={column}>{row.values[index]}</p>
                    ))}
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </section>
      )}

      {hasL3 && (
        <section className="figma-section figma-section--l3" id="L3">
          {scenes.length > 0 && (
            <>
              <SectionHeader kicker="L3 BENCHMARK / EXPERIENCE" title="L3-场景对标分析层" intro="场景对标、功能亮点与机会清单" />
              {scenes.map((scene, index) => (
                <SceneBlock
                  fallbackImage={useYu7DemoFallback ? yu7Fallback.scenes[index]?.image : undefined}
                  key={scene.id}
                  scene={scene}
                  index={index}
                />
              ))}
            </>
          )}

          {displayFeatures.length > 0 && (
            <>
              <SectionHeader kicker="L3 FUNCTION HIGHLIGHTS" title="L3-具体功能亮点" intro="从用户场景中提炼可直接对标的功能亮点。" />
              <div className="figma-card-grid">
                {displayFeatures.map((item: ProfileFeature, index) => {
                  const image = assetUrl(item.image);
                  const fallbackImage = useYu7DemoFallback ? assetUrl(yu7Fallback.features[index]?.image) : '';
                  return (
                    <article className="figma-feature-card" key={item.id}>
                      {(image || fallbackImage) && <FigmaImage alt={item.title} src={image} fallbackSrc={fallbackImage} />}
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

          {displayOpportunities.length > 0 && (
            <>
              <SectionHeader kicker="L3 STYLING OPPORTUNITIES" title="L3-造型机会点" intro="把场景、功能与设计可落地机会连接起来。" />
              <div className="figma-card-grid">
                {displayOpportunities.map((item: ProfileOpportunity) => (
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
        <section className="figma-section figma-section--l4" id="L4">
          <SectionHeader kicker="L4 DESIGN REFERENCE" title="L4-设计对标层" intro="沉淀外饰、内饰、CMF 与 HMI 设计语言" />
          <DesignCarousel
            activeIndex={activeDesignIndex}
            fallbackMedia={useYu7DemoFallback ? yu7Fallback.designHero : []}
            media={designMedia}
            onPrevious={() => setActiveDesignIndex((index) => (index - 1 + designMedia.length) % designMedia.length)}
            onNext={() => setActiveDesignIndex((index) => (index + 1) % designMedia.length)}
          />
          {galleryCards.length > 0 && (
            <div className="figma-gallery-grid">
              {galleryCards.map((card, cardIndex) => {
                const currentIndex = activeCardIndex[card.id] || 0;
                const slide = card.slides[currentIndex % Math.max(card.slides.length, 1)];
                const fallbackCard =
                  useYu7DemoFallback
                    ? yu7Fallback.designCards.find((item) => item.group === card.group) || yu7Fallback.designCards[cardIndex]
                    : undefined;
                const fallbackSlide = fallbackCard?.slides[currentIndex % Math.max(fallbackCard.slides.length, 1)] || fallbackCard?.slides[0];
                const image = slide?.media;
                const fallbackImage = fallbackSlide?.media;
                const title = clean(slide?.title) || clean(fallbackSlide?.title) || card.group;
                const description = clean(slide?.description) || clean(fallbackSlide?.description);
                return (
                  <article className="figma-gallery-card" key={card.id}>
                    <h3>{card.group}</h3>
                    <p>{card.kicker}</p>
                    {(assetUrl(image) || assetUrl(fallbackImage)) && (
                      <div className="figma-gallery-card__image">
                        <FigmaImage alt={title} src={assetUrl(image)} fallbackSrc={assetUrl(fallbackImage)} />
                        {card.slides.length > 1 && (
                          <>
                            <button aria-label="上一张卡片图片" type="button" onClick={() => changeCardImage(card, -1)}>
                              <ChevronLeft size={18} />
                            </button>
                            <button aria-label="下一张卡片图片" type="button" onClick={() => changeCardImage(card, 1)}>
                              <ChevronRight size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    <strong>{title}</strong>
                    {hasValue(description) && <span>{description}</span>}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {hasL5 && (
        <section className="figma-section figma-section--l5" id="L5">
          <SectionHeader
            kicker="L5 TEST / TRACEABILITY"
            title="L5-测评与追溯层"
            intro="用例、打分、优劣判定与对比测试统一放在这一层，先看结果摘要，再看追溯依据。"
          />
          <div className="figma-score-layout">
            {score && (
              <Panel title="核心基础档案" kicker="Hexin jichu dangan" className="figma-score-card">
                <div className="figma-score-ring" style={{ '--score': `${scorePercent}%` } as CSSProperties}>
                  <strong>{score}</strong>
                  <span>整体评分 / {totalScore}</span>
                </div>
                <div className="figma-score-split">
                  {fixedScoreBreakdown.map(([label, value]) => (
                    <div className="figma-score-row" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
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
                    <span>{vehicle.model}得分</span>
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
        </section>
      )}
    </main>
  );
}
