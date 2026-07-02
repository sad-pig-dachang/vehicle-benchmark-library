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

网站现在优先读取中文表名，且只把 `档案基础信息1` / `档案基础信息` 作为必需主表。其他 L1-L5 表都是增强信息，缺失或删掉不会让整站加载失败。

推荐保留这些表：

| 表名 | 用途 | 网站容错 |
| --- | --- | --- |
| 档案基础信息1 | 车型主表，一车一行，承载列表和详情页必需字段 | 必需 |
| L1-用户市场层1 | 用户画像、市场卖点、定位标签 | 可选 |
| L2-竞品档案层1 | 核心参数、版本信息、硬件配置 | 可选 |
| L3-场景对标分析层1 | 体验场景卡片 | 可选 |
| L3-具体功能亮点1 | 场景下的功能拆解 | 可选 |
| L3-造型机会点1 | 外饰、内饰、材质色彩机会点 | 可选 |
| L4-设计对标层1 | 设计、体验、HMI、智驾、品牌上的可借鉴总结 | 可选 |
| L5-测评与追溯层1 | 资料链接、热帖、评分、迭代记录 | 可选 |

主表建议至少保留这些字段：`车型ID`、`品牌`、`车型`、`年款`、`国内/海外`、`国家/地区`、`车型级别`、`能源形式`、`价格下限（万元）`、`价格上限（万元）`、`产品定位`、`目标用户`、`车型一句话总结`、`关键标签`、`数据状态`、`数据完整度`、`是否重点车型`、`更新时间`、`核心特点`、`设计看点`、`适合对标类型`、`参数JSON`。

### 飞书多维表格权限

飞书应用只需要开通多维表格记录读取相关权限，并把应用添加到目标多维表格的协作者中。网站默认只读，不通过后端写入飞书。

- `tenant_access_token`：通过 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 获取。
- Records API：对指定 app token 和 table id 做记录列表读取。

### 需要创建的表

建议在一个多维表格里创建 6 张表。

#### 1. Vehicle 表

用于保存车型主记录，对应 `VEHICLE_TABLE_ID`。

字段建议优先使用中文表头。后端同时兼容旧英文表头，所以已经导入的英文表不会立刻失效；但后续维护建议改成中文。

| 字段名 | 类型建议 | 说明 |
| --- | --- | --- |
| 车型ID | 单行文本 | 唯一 ID，例如 `xiaomi-yu7-2025` |
| 品牌 | 单行文本 | 品牌 |
| 车型 | 单行文本 | 车型名称 |
| 年款 | 单行文本 | 年款 |
| 市场 | 单选 | 国内 / 海外 |
| 国家/地区 | 单行文本 | 国家或地区 |
| 车型级别 | 单选 | 轿车 / SUV / MPV / 皮卡 / 跑车 |
| 能源形式 | 单选 | 纯电 / 插混 / 增程 / 燃油 / 混动 |
| 最低价格 | 数字 | 万元 |
| 最高价格 | 数字 | 万元 |
| 封面图链接 | URL / 文本 | 图片 URL |
| 封面图标题 | 单行文本 | 图片标题 |
| 封面图说明 | 单行文本 | 图片说明 |
| 封面图来源 | 单行文本 | 图片来源 |
| 产品定位 | 多行文本 | 产品定位 |
| 目标用户 | 多行文本 | 目标用户 |
| 车型一句话总结 | 多行文本 | 一句话总结 |
| 关键标签 | 多选 / 多行文本 | 多个标签 |
| 使用场景标签 | 多选 / 多行文本 | 多个标签 |
| HMI标签 | 多选 / 多行文本 | 多个标签 |
| 内外饰标签 | 多选 / 多行文本 | 多个标签 |
| 数据状态 | 单选 | 已完成 / 调研中 / 待补充 |
| 数据完整度 | 数字 | 0-100 |
| 更新时间 | 单行文本 / 日期 | 更新时间 |
| 重点车型 | 复选框 | 是否重点车型 |
| 核心特点 | 多选 / 多行文本 | 3-5 条核心特点 |
| 设计看点 | 多选 / 多行文本 | 设计 / 体验 / HMI / 智驾 / 品牌看点 |
| 适合对标类型 | 多选 / 多行文本 | 适合做什么对标 |

#### 2. Specs 表

对应 `SPECS_TABLE_ID`。

| 字段名 | 类型建议 | 说明 |
| --- | --- | --- |
| 车型ID | 单行文本 | 关联 Vehicle 表的车型ID |
| 参数JSON | 多行文本 | `VehicleSpec` JSON |

#### 3. Benchmark 表

对应 `BENCHMARK_TABLE_ID`，统一保存体验、HMI、外饰、内饰对标点。

| 字段名 | 类型建议 | 说明 |
| --- | --- | --- |
| 车型ID | 单行文本 | 关联车型 |
| 对标点ID | 单行文本 | 对标点 ID |
| 类别 | 单选 | 体验 / HMI / 外饰 / 内饰 |
| 标题 | 单行文本 | 标题 |
| 描述 | 多行文本 | 通用描述 |
| 场景描述 | 多行文本 | 场景描述 |
| 用户价值 | 多行文本 | 用户价值 |
| 体验亮点 | 多行文本 | 亮点 |
| 问题 | 多行文本 | 问题 |
| 可借鉴点 | 多行文本 | 可借鉴点 |
| 媒体JSON | 多行文本 | `MediaAsset` JSON |
| 界面位置 | 单行文本 | HMI 界面位置 |
| 交互方式 | 单行文本 | HMI 交互方式 |
| 视觉风格 | 多行文本 | HMI 视觉风格 |
| 信息架构 | 多行文本 | 信息架构 |
| 动效 | 多行文本 | 动效 |
| 造型特征 | 多行文本 | 造型特征 |
| 品牌识别点 | 多行文本 | 品牌识别点 |
| 比例姿态 | 多行文本 | 比例姿态 |
| 细节设计 | 多行文本 | 细节设计 |
| 材质/色彩 | 多行文本 | 材质 / 色彩 |

#### 4. Media 表

对应 `MEDIA_TABLE_ID`，当前版本预留给后续附件库。现阶段图片信息暂存在 `Vehicle.coverImage*` 和 `Benchmark.mediaJson` 中。

建议字段：

| 字段名 | 类型建议 |
| --- | --- |
| 车型ID | 单行文本 |
| assetId | 单行文本 |
| type | 单选 |
| 链接 | URL / 文本 |
| 标题 | 单行文本 |
| alt | 单行文本 |
| source | 单行文本 |

#### 5. Discussion 表

对应 `DISCUSSION_TABLE_ID`。

| 字段名 | 类型建议 | 对应字段 |
| --- | --- | --- |
| 车型ID | 单行文本 | 关联车型 |
| 链接ID | 单行文本 | id |
| 平台 | 单选 / 文本 | 平台 |
| 标题 | 单行文本 | 标题 |
| 链接 | URL / 文本 | URL |
| 热度 | 单行文本 | 热度 |
| 观点摘要 | 多行文本 | 摘要 |
| 情绪倾向 | 单选 | 正向 / 中性 / 负向 |
| 引用价值 | 多行文本 | 引用价值 |

#### 6. Version 表

对应 `VERSION_TABLE_ID`。

| 字段名 | 类型建议 | 对应字段 |
| --- | --- | --- |
| 车型ID | 单行文本 | 关联车型 |
| 迭代记录ID | 单行文本 | id |
| 年款/改款时间 | 单行文本 | 年款或改款节点 |
| 改款时间 | 单行文本 | 变化时间 |
| 变化类型 | 多选 / 多行文本 | 外饰 / 内饰 / HMI / 智驾 / 配置 / 动力 |
| 描述 | 多行文本 | 变化描述 |
| 对设计对标的影响 | 多行文本 | 影响说明 |

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
