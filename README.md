# 汽车竞品车型库 Demo

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/sad-pig-dachang/vehicle-benchmark-library)

面向汽车设计、HMI、产品体验团队的竞品车型资料库前端 demo。项目使用 React + Vite + TypeScript，默认通过浏览器 `localStorage` 保存数据。

## 运行

```bash
npm install
npm run dev
```

打开终端提示的本地地址，默认是：

```bash
http://localhost:5173
```

如果启用飞书多维表格模式，需要再开一个终端启动后端：

```bash
npm run server
```

后端默认地址：

```bash
http://localhost:8787
```

## 已实现功能

- 左侧固定筛选栏：车型 / 品牌搜索、国内 / 海外、能源形式、车型级别、价格区间、场景标签、HMI 标签、内外饰标签、数据状态。
- 右侧总览页：数据概览、车型卡片列表、筛选后实时更新。
- 单车型档案页：基础信息、车型特点、体验场景、HMI、内外饰、资料链接、车型迭代记录。
- 对比功能：支持 2-3 台车按基础参数、定位、体验、HMI、内饰、外饰、讨论度、可借鉴点横向对比。
- 只读展示：网站不提供新增、编辑、删除入口，所有数据维护都在飞书多维表格内完成。
- 导出 JSON：便于沉淀快照或迁移资料。

## 数据结构

核心类型在 `src/types/vehicle.ts`：

- `Vehicle`
- `VehicleSpec`
- `BenchmarkPoint`
- `MediaAsset`
- `DiscussionLink`
- `VersionLog`

内置示例数据在 `src/data/sampleVehicles.ts`，包含：

- 小米 YU7
- 极氪 007
- 蔚来 ES6
- Tesla Model Y
- 理想 L9

示例数据不追求参数完全真实，重点是覆盖竞品库所需字段结构，方便后续替换为真实调研资料。

## 如何编辑数据

线上网站是只读展示端，不开放新增、编辑、删除。请在飞书多维表格内维护车型、参数、对标点、资料链接和迭代记录；网站刷新后会从飞书重新读取最新数据。

## 本地存储说明

默认数据源为：

```ts
src/services/localStorageService.ts
```

统一数据入口为：

```ts
src/services/dataService.ts
```

业务组件只调用 `dataService`，不会直接写死 `localStorage`，后续替换数据源时主要改服务层。

如果需要恢复内置示例数据，点击页面右上角的刷新按钮即可。注意这会覆盖当前浏览器里的本地修改。

## 导出 JSON

右上角提供「导出 JSON」，用于保存当前飞书数据快照。线上网站不支持导入 JSON，避免公开页面被用来写入数据。

## 飞书多维表格接入预留

已新增 Node.js + Express 后端：

```bash
server/
├── index.js
├── config.js
├── feishuClient.js
├── fieldMapping.js
├── repositories/vehicleRepository.js
└── routes/api.js
```

前端不会直接请求飞书，也不会接触 `FEISHU_APP_SECRET`。前端 `src/services/feishuService.ts` 只请求本地 Node 后端 `/api`，后端再去调用飞书开放平台。

## 线上部署，让任何人都能打开

本项目已经支持“一个 Node 服务同时托管前端页面和后端 API”的部署方式。上线后访问公网域名即可打开前端，页面再通过同域名 `/api` 调飞书数据。

推荐架构：

```txt
用户浏览器
  ↓
公网域名，例如 https://vehicle-library.example.com
  ↓
Node + Express 服务
  ├─ 托管 dist 前端静态页面
  └─ /api 请求飞书多维表格
       ↓
     飞书开放平台 / 多维表格
```

这样 `FEISHU_APP_SECRET` 只存在云端 Node 服务环境变量中，不会暴露给前端。

### 推荐部署方式：前后端同服务

适合 Render、Railway、Fly.io、阿里云、腾讯云、公司内网服务器等 Node 托管环境。

部署配置：

```bash
Build Command: npm install && npm run build
Start Command: npm run start
```

线上环境变量：

```bash
VITE_DATA_SOURCE=feishu
VITE_API_BASE_URL=/api

PORT=8787
CORS_ORIGIN=*
ALLOW_WRITES=false

FEISHU_APP_ID=你的飞书应用 App ID
FEISHU_APP_SECRET=你的飞书应用 App Secret
BASE_APP_TOKEN=你的多维表格 App Token
WIKI_NODE_TOKEN=如果你的链接是 /wiki/ 形式，填 wiki 后面的 token，可替代 BASE_APP_TOKEN
# 以下表 ID 现在是可选项。后端会优先按中文表名自动识别。
VEHICLE_TABLE_ID=
L1_MARKET_TABLE_ID=
L2_PROFILE_TABLE_ID=
L3_SCENE_TABLE_ID=
L3_FEATURE_TABLE_ID=
L3_STYLING_TABLE_ID=
L4_DESIGN_TABLE_ID=
L5_TRACE_TABLE_ID=
SPECS_TABLE_ID=
BENCHMARK_TABLE_ID=
DISCUSSION_TABLE_ID=
VERSION_TABLE_ID=
```

说明：

- `npm run build` 会生成 `dist`。
- `npm run start` 会启动 `server/index.js`。
- Express 会自动托管 `dist`，并提供 `/api`。
- 线上访问根路径就是前端页面，例如 `https://你的线上域名/`。
- 网站默认只读，`ALLOW_WRITES=false` 时后端会拒绝所有 POST / PUT / DELETE 请求。

### 可选部署方式：前后端分开

如果前端部署到 Vercel / Netlify，后端部署到 Render / Railway，则前端构建环境设置：

```bash
VITE_DATA_SOURCE=feishu
VITE_API_BASE_URL=https://你的后端域名/api
```

后端环境变量设置：

```bash
CORS_ORIGIN=https://你的前端域名
ALLOW_WRITES=false
```

这种方式也可用，但多一个跨域配置点。团队内部工具优先建议使用“前后端同服务”。

### 后端接口

公开只读接口：

```txt
GET    /api/vehicles
GET    /api/vehicles/:vehicleId
GET    /api/benchmark-points?vehicleId=xxx
GET    /api/discussions?vehicleId=xxx
```

代码里保留了写接口实现，方便未来做私有管理后台；但公开部署默认 `ALLOW_WRITES=false`，后端会拒绝 `POST / PUT / DELETE`。

辅助检查：

```txt
GET /api/health
GET /api/feishu/health
```

### 环境变量

复制 `.env.example` 为 `.env`，按实际飞书应用和多维表格填写：

```bash
VITE_DATA_SOURCE=feishu
VITE_API_BASE_URL=/api

PORT=8787
CORS_ORIGIN=http://localhost:5173
ALLOW_WRITES=false

FEISHU_APP_ID=
FEISHU_APP_SECRET=
BASE_APP_TOKEN=
WIKI_NODE_TOKEN=

# 可选。通常不需要手填，后端会按表名自动找：
# 档案基础信息1 / 档案基础信息
# L1-用户市场层1 / L1-用户市场层
# L2-竞品档案层1 / L2-竞品档案层
# L3-场景对标分析层1 / L3-场景对标分析层
# L3-具体功能亮点1 / L3-具体功能亮点
# L3-造型机会点1 / L3-造型机会点
# L4-设计对标层1 / L4-设计对标层
# L5-测评与追溯层1 / L5-测评与追溯层
VEHICLE_TABLE_ID=
SPECS_TABLE_ID=
BENCHMARK_TABLE_ID=
DISCUSSION_TABLE_ID=
VERSION_TABLE_ID=
```

`BASE_APP_TOKEN` 是多维表格 app token；如果你的飞书链接是 `/wiki/xxx?table=...` 这种形式，可以不填 `BASE_APP_TOKEN`，改填 `WIKI_NODE_TOKEN=xxx`。后端会通过飞书 Wiki 节点信息接口解析出真正的多维表格 app token。各 `*_TABLE_ID` 现在是可选兜底项：当自动表名识别失败时再手填。

### 当前中文表结构

网站现在优先读取中文表名，且只把 `档案基础信息` / `档案基础信息1` 作为必需主表。其他 L1-L5 表都是增强信息，缺失或删掉不会让整站加载失败。

推荐保留这些表：

| 表名 | 用途 | 网站容错 |
| --- | --- | --- |
| 档案基础信息 | 车型主表，一车一行，承载列表卡片和详情页首屏 Hero | 必需 |
| L1-用户市场层 | 目标用户、市场卖点、定位标签，对应详情页 L1 模块 | 可选 |
| L2-竞品档案层 | 车型基础档案、配置项、核心硬件参数，对应详情页 L2 模块 | 可选 |
| L3-场景对标分析层 | 场景图、场景来源、行为需求拆解，对应 L3 场景模块 | 可选 |
| L3-具体功能亮点 | 功能亮点卡片，对应 L3 具体功能亮点模块 | 可选 |
| L3-造型机会点 | 造型 / 场景 / 功能机会点，对应 L3 造型机会模块 | 可选 |
| L4-设计对标层 | 视觉参考图、外观 / 内饰 / CMF / HMI 亮点，对应 L4 模块 | 可选 |
| L5-测评与追溯层 | 总分、评分表、评分依据、资料追溯，对应 L5 模块 | 可选 |

### 表格与页面模块对应关系

#### 1. 档案基础信息

一行就是一台车。当前页面首屏和首页卡片主要读取这些字段：

| 字段名 | 页面位置 |
| --- | --- |
| 竞品库ID | Hero 底部「竞品库 ID」，也是各层表匹配车型的主键 |
| 品牌 | 首页卡片、详情页标题 |
| 车型 | 首页卡片、详情页标题 |
| 建议对标层级 | Hero 底部、详情页基础信息 |
| 车型总结 | Hero 文案、L2 一句话总结 |
| 车型标签/关键词 | Hero 橙色标签、左侧筛选标签 |
| 指导价 | Hero 底部、首页价格 |
| 车型级别 | Hero 底部、左侧筛选 |
| 封面图 | Hero 大图、首页卡片封面 |

#### 2. L1-用户市场层

一行对应一台车。网站会自动读取类似下面的成对字段：

| 字段名示例 | 页面位置 |
| --- | --- |
| 核心目标用户1关键词 / 核心目标用户1描述 | L1「核心目标用户」 |
| 核心目标用户2关键词 / 核心目标用户2描述 | L1「核心目标用户」 |
| 核心市场卖点1关键词 / 核心市场卖点1描述 | L1「核心市场卖点与定位标签」 |
| 市场定位标签 / 定位标签 | L1 标签、Hero 标签补充 |

#### 3. L2-竞品档案层

建议用父子记录维护：父记录是车型，子记录是配置或参数项。网站会按表格顺序把父记录下面的子记录收进这台车的 L2 模块。

| 字段名示例 | 页面位置 |
| --- | --- |
| 竞品库ID / 品牌 / 车型 | 父记录识别车型 |
| 竞品ID / 参数项 / 配置项 / 项目 | L2 参数名称 |
| 参数值 / 内容 / 值 | L2 参数值 |
| 智能座舱、智能驾驶、舒适配置、驱动形式、峰值功率、零百加速、电池容量、CLTC续航、车身尺寸 | L2 核心硬件参数总表 |

#### 4. L3-场景对标分析层

建议用父子记录维护：父记录写「场景名称 / 场景来源 / 场景图片」，下面的子记录写这个场景里的行为需求。

| 字段名 | 页面位置 |
| --- | --- |
| 场景名称 | L3 场景标题 |
| 场景来源 | L3 场景说明 |
| 场景图片 | L3 场景大图 |
| 行为需求 | L3 场景右侧要点、下方表格第一列 |
| 行为需求备注 | L3 场景右侧说明 |
| YU7已有硬件支撑 | L3 行为需求表 |
| YU7已有软件/HMI支撑 | L3 行为需求表 |
| 竞品判断 | L3 行为需求表 |

#### 5. L3-具体功能亮点

父记录是车型，子记录是功能亮点卡片。

| 字段名 | 页面位置 |
| --- | --- |
| 亮点标题 | L3 功能亮点卡片标题 |
| 具体功能点 | L3 功能亮点卡片主文案 |
| 亮点判断 | L3 功能亮点卡片 |
| 对标价值 | L3 功能亮点卡片 |
| 亮点图片 | L3 功能亮点卡片图片 |

#### 6. L3-造型机会点

父记录是车型，子记录是机会点卡片。

| 字段名 | 页面位置 |
| --- | --- |
| 机会标题 | L3 造型机会卡片标题 |
| 机会类型 | L3 造型机会卡片标签 |
| 优先级 | L3 造型机会卡片标签 |
| 来源线索 | L3 造型机会卡片 |
| 可做方向 | L3 造型机会卡片 |
| 功能描述 | L3 造型机会卡片 |
| 设计价值 | L3 造型机会卡片 |

#### 7. L4-设计对标层

父记录是车型。父记录里的 `核心视觉效果参考` 会作为 L4 大图；子记录按表格中的分组顺序展示为外观、内饰、CMF、HMI 等设计参考卡片。

| 字段名 | 页面位置 |
| --- | --- |
| 核心视觉效果参考 | L4 大图 / 卡片图片 |
| 对应亮点描述 / 对照亮点描述 | L4 设计参考卡片文案 |
| 可跳转链接 | L4 卡片来源链接 |

#### 8. L5-测评与追溯层

父记录是车型，子记录是评分表。模块评分逻辑是网站固定展示，不从飞书读取；飞书里的 `评分依据` 字段对应评分表最后一列。

| 字段名 | 页面位置 |
| --- | --- |
| 总分 / 车型得分 / 小米YU7得分 | L5 圆环总分 |
| 满分 | L5 圆环满分、评分表满分 |
| 评测维度 / 竞品ID | L5 评分表第一列 |
| 车型得分 / 小米YU7得分 / 得分 | L5 评分表得分 |
| 评分依据 | L5 评分表「评分依据」 |

### 飞书多维表格权限

飞书应用只需要开通多维表格记录读取相关权限，并把应用添加到目标多维表格的协作者中。网站默认只读，不通过后端写入飞书。

- `tenant_access_token`：通过 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 获取。
- Records API：对指定 app token 和 table id 做记录列表读取。

### 本地运行飞书模式

1. 配置 `.env`。
2. 启动后端：

```bash
npm run server
```

3. 启动前端：

```bash
npm run dev
```

4. 打开：

```bash
http://localhost:5173
```

前端 Vite 已配置 `/api` 代理到 `http://localhost:8787`。

## 推荐后续增强

- 给每个对标点增加附件上传和本地图片缓存。
- 增加多维表格字段映射配置页。
- 增加导出对比报告能力。
