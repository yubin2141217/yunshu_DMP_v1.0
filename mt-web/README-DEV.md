# 云数中台 · MT 运营端（前端工程）

基于 HTML 原型 `mt/` 落地的 Vue 3 + Vite + Arco Design Vue 工程。Mock 默认开启，无需后端。

对齐 SRS：`docs/01-需求与规划/20260908-云数中台-SRS需求规格说明书-V1.1.md`

## 启动

```bash
cd mt-web
npm install
npm run dev
```

访问 `http://localhost:5174`，默认进入「综合看板」（免登录）。

## 页面

| 路由 | 功能 |
| --- | --- |
| `/stats` | 综合看板（单页：接入/推送 KPI + 接入vs推送趋势；右上角机构与时间跨度） |
| `/standard/access-data` | 接入数据明细（侧栏「数据接入管理」下；支持表头字段模糊筛选；可从接入方案列表「接入数据量」带参进入） |
| `/data-query` | 已隐藏，重定向至 `/standard/access-data` |
| `/org-config` | 已隐藏，重定向至接入方案管理 |
| `/standard` | 接入方案管理（方案与机构、供数方一对一绑定） |
| `/standard` | 接入方案管理（HTTP 方案含 AppKey/AppSecret） |
| `/suppliers` | 供数方管理（归属「数据接入管理」） |
| `/metadata` | 字段库管理 |
| `/scheme` | 接入方案（侧栏隐藏，路由保留） |
| `/whitelist` | IP 白名单（按供数方批量添加） |
| `/push/schemes` | 推送方案管理（含推送量统计 KPI） |
| `/push/receivers` | 接收方管理（第三方接收方档案；机构ID/名称/关联MT机构/联系人） |
| `/push/push-data` | 推送数据明细（侧栏「数据推送管理」下；按推送方案与时间查询，支持表头字段筛选） |
| `/push/schemes/edit`、`/push/schemes/edit/:id` | 新增 / 编辑（三步：基础信息含接收方与机构 → 选择推送数据 → 推送方式；支持 `?copyFrom=`） |
| `/push/schemes/:id` | 推送方案详情 |
| `/push` | 重定向至 `/push/schemes` |
| `/push/tasks` | 已下线，重定向至推送方案列表 |

侧栏顺序：综合看板 → 数据接入管理（接入方案管理 / 接入数据明细 / 字段库 / IP 白名单 / 供数方）→ 数据推送管理（推送方案管理 / 推送数据明细 / 接收方管理）。从接入方案列表「接入数据量」仍可带参跳转至「接入数据明细」。

## Mock

`VITE_USE_MOCK=true`（默认）。接入数据在 `src/mock/mt.ts`；推送数据在 `src/mock/push.ts`（`yunshu-mt-push-v6`）。生效标准桥接写入 `localStorage` key `yunshu-enabled-standard-v1` 供 V8 读取。
