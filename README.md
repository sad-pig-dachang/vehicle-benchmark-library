# 汽车竞品车型库 Demo

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
- 新增 / 编辑 / 删除车型：编辑表单按 Tab 分组，复杂字段可直接维护 JSON。
- 导入 / 导出 JSON：便于把调研资料迁移到其他环境。
- 本地持久化：刷新页面后保留编辑结果。

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

页面内可以直接点击「新增车型」或车型卡片上的编辑按钮。

编辑弹窗分为：

1. 基础信息
2. 体验场景
3. HMI
4. 内外饰
5. 资料链接
6. 迭代记录
7. JSON 高级编辑

基础信息是普通表单；体验、HMI、造型、链接、迭代记录等嵌套资料使用 JSON 编辑区，适合早期快速整理和粘贴结构化调研内容。

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

## 导入 / 导出 JSON

右上角提供「导出 JSON」和「导入 JSON」。

导入文件支持两种格式：

```json
[
  { "id": "vehicle-1", "brand": "..." }
]
```

或：

```json
{
  "vehicles": [
    { "id": "vehicle-1", "brand": "..." }
  ]
}
```

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
CORS_ORIGIN=https://你的线上域名

FEISHU_APP_ID=你的飞书应用 App ID
FEISHU_APP_SECRET=你的飞书应用 App Secret
BASE_APP_TOKEN=你的多维表格 App Token
VEHICLE_TABLE_ID=车型主表 ID
SPECS_TABLE_ID=参数表 ID
BENCHMARK_TABLE_ID=对标点表 ID
MEDIA_TABLE_ID=媒体表 ID
DISCUSSION_TABLE_ID=讨论链接表 ID
VERSION_TABLE_ID=迭代表 ID
```

说明：

- `npm run build` 会生成 `dist`。
- `npm run start` 会启动 `server/index.js`。
- Express 会自动托管 `dist`，并提供 `/api`。
- 线上访问根路径就是前端页面，例如 `https://你的线上域名/`。

### 可选部署方式：前后端分开

如果前端部署到 Vercel / Netlify，后端部署到 Render / Railway，则前端构建环境设置：

```bash
VITE_DATA_SOURCE=feishu
VITE_API_BASE_URL=https://你的后端域名/api
```

后端环境变量设置：

```bash
CORS_ORIGIN=https://你的前端域名
```

这种方式也可用，但多一个跨域配置点。团队内部工具优先建议使用“前后端同服务”。

### 后端接口

已实现：

```txt
GET    /api/vehicles
GET    /api/vehicles/:vehicleId
POST   /api/vehicles
PUT    /api/vehicles/:vehicleId
DELETE /api/vehicles/:vehicleId
GET    /api/benchmark-points?vehicleId=xxx
POST   /api/benchmark-points
PUT    /api/benchmark-points/:recordId
GET    /api/discussions?vehicleId=xxx
```

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

FEISHU_APP_ID=
FEISHU_APP_SECRET=
BASE_APP_TOKEN=
VEHICLE_TABLE_ID=
SPECS_TABLE_ID=
BENCHMARK_TABLE_ID=
MEDIA_TABLE_ID=
DISCUSSION_TABLE_ID=
VERSION_TABLE_ID=
```

`BASE_APP_TOKEN` 是多维表格 app token；各 `*_TABLE_ID` 是对应数据表 ID。

### 飞书多维表格权限

飞书应用需要开通多维表格记录读写权限，并把应用添加到目标多维表格的协作者中。后端使用：

- `tenant_access_token`：通过 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 获取。
- Records API：对指定 app token 和 table id 做记录列表、新增、更新、删除。

### 需要创建的表

建议在一个多维表格里创建 6 张表。

#### 1. Vehicle 表

用于保存车型主记录，对应 `VEHICLE_TABLE_ID`。

字段建议：

| 字段名 | 类型建议 | 对应 Vehicle 字段 |
| --- | --- | --- |
| vehicleId | 单行文本 | id |
| brand | 单行文本 | brand |
| model | 单行文本 | model |
| year | 单行文本 | year |
| market | 单选 | market |
| countryRegion | 单行文本 | countryRegion |
| level | 单选 | level |
| energy | 单选 | energy |
| priceMin | 数字 | priceMin |
| priceMax | 数字 | priceMax |
| coverImageUrl | URL / 文本 | coverImage.url |
| coverImageTitle | 单行文本 | coverImage.title |
| coverImageAlt | 单行文本 | coverImage.alt |
| coverImageSource | 单行文本 | coverImage.source |
| productPositioning | 多行文本 | productPositioning |
| targetUsers | 多行文本 | targetUsers |
| summary | 多行文本 | summary |
| keyTags | 多选 / 多行文本 | keyTags |
| scenarioTags | 多选 / 多行文本 | scenarioTags |
| hmiTags | 多选 / 多行文本 | hmiTags |
| stylingTags | 多选 / 多行文本 | stylingTags |
| status | 单选 | status |
| completeness | 数字 | completeness |
| updatedAt | 单行文本 | updatedAt |
| isKeyModel | 复选框 | isKeyModel |
| coreHighlights | 多选 / 多行文本 | coreHighlights |
| designFocus | 多选 / 多行文本 | designFocus |
| benchmarkSuitability | 多选 / 多行文本 | benchmarkSuitability |

#### 2. Specs 表

对应 `SPECS_TABLE_ID`。

| 字段名 | 类型建议 | 说明 |
| --- | --- | --- |
| vehicleId | 单行文本 | 关联 Vehicle.vehicleId |
| specJson | 多行文本 | `VehicleSpec` JSON |

#### 3. Benchmark 表

对应 `BENCHMARK_TABLE_ID`，统一保存体验、HMI、外饰、内饰对标点。

| 字段名 | 类型建议 | 说明 |
| --- | --- | --- |
| vehicleId | 单行文本 | 关联车型 |
| pointId | 单行文本 | 对标点 ID |
| category | 单选 | experience / hmi / exterior / interior |
| title | 单行文本 | 标题 |
| description | 多行文本 | 通用描述 |
| sceneDescription | 多行文本 | 场景描述 |
| userValue | 多行文本 | 用户价值 |
| highlight | 多行文本 | 亮点 |
| issue | 多行文本 | 问题 |
| referenceValue | 多行文本 | 可借鉴点 |
| mediaJson | 多行文本 | `MediaAsset` JSON |
| interfaceLocation | 单行文本 | HMI 界面位置 |
| interactionMode | 单行文本 | HMI 交互方式 |
| visualStyle | 多行文本 | HMI 视觉风格 |
| informationArchitecture | 多行文本 | 信息架构 |
| motion | 多行文本 | 动效 |
| stylingFeature | 多行文本 | 造型特征 |
| brandIdentity | 多行文本 | 品牌识别点 |
| proportion | 多行文本 | 比例姿态 |
| detailDesign | 多行文本 | 细节设计 |
| materialColor | 多行文本 | 材质 / 色彩 |

#### 4. Media 表

对应 `MEDIA_TABLE_ID`，当前版本预留给后续附件库。现阶段图片信息暂存在 `Vehicle.coverImage*` 和 `Benchmark.mediaJson` 中。

建议字段：

| 字段名 | 类型建议 |
| --- | --- |
| vehicleId | 单行文本 |
| assetId | 单行文本 |
| type | 单选 |
| url | URL / 文本 |
| title | 单行文本 |
| alt | 单行文本 |
| source | 单行文本 |

#### 5. Discussion 表

对应 `DISCUSSION_TABLE_ID`。

| 字段名 | 类型建议 | 对应字段 |
| --- | --- | --- |
| vehicleId | 单行文本 | 关联车型 |
| linkId | 单行文本 | id |
| platform | 单选 / 文本 | platform |
| title | 单行文本 | title |
| url | URL / 文本 | url |
| heat | 单行文本 | heat |
| summary | 多行文本 | summary |
| sentiment | 单选 | sentiment |
| referenceValue | 多行文本 | referenceValue |

#### 6. Version 表

对应 `VERSION_TABLE_ID`。

| 字段名 | 类型建议 | 对应字段 |
| --- | --- | --- |
| vehicleId | 单行文本 | 关联车型 |
| logId | 单行文本 | id |
| yearModel | 单行文本 | yearModel |
| changeTime | 单行文本 | changeTime |
| changeTypes | 多选 / 多行文本 | changeTypes |
| description | 多行文本 | description |
| designImpact | 多行文本 | designImpact |

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
- 增加字段级校验，避免 JSON 高级编辑缺失必要字段。
- 增加多维表格字段映射配置页。
- 增加导出对比报告能力。
