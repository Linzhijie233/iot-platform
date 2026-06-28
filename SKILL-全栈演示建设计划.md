# 物联网卡平台 · 全栈演示建设 Skill 计划（权威执行文档）

> **本文件是后续所有开发的唯一权威依据**，每一轮都按它推进、并把进展回写到本文件「执行进度」与 `.claude/skills/iot-platform-demo/SKILL.md` 经验库。
> 最近更新：2026-06-24。

---

## 一、目标与铁律（不可违背）

**目标**：交付一套**完整可用、给客户演示**的物联网卡管理平台 —— 前端所有页面都接通**真实后端**，且**每一处数据都能由用户在界面上手动「新增」**（按钮 + 弹窗表单），现场可即时录入、即时看到效果。

**铁律**：
1. **功能只增不减**：现有任何页面、菜单、按钮、字段、操作、弹窗**一律保留**，不得删改其原有形态；本计划只在其上**叠加**「新增/编辑/删除 + 真实后端」。
2. **每个数据来源都要能手动新增**：凡是页面里有列表/表格/卡片数据，都要补一个「新增」按钮 + 弹窗表单，提交后写入后端并刷新。
3. **后端镜像前端**：前端有什么实体，后端就建对应的 CRUD 模块与接口，字段与现有 TS 类型对齐。
4. **演示稳健优先**：默认带种子数据（一开就有内容）、可重置；要考虑客户机器**可能没装 MongoDB** 的兜底。
5. **思考齐全**：见第六节「易被忽略的关键点」，每轮开工前对照检查。

---

## 二、现有「页面 ↔ 实体」全量清单（建设范围基线）

> （建设前基线，现已完成）前端页面的数据原为组件内静态常量、操作多为「静态演示入口」假提示。本计划已把它们**逐一接到后端并补新增**（见文末「执行进度」Phase 0–8 全部完成）。

| # | 菜单/页面 | 路由 | 前端实体(TS type) | 关键字段（摘） | 当前状态 | 后端模块(待建) | 需补「新增弹窗」 |
|---|---|---|---|---|---|---|---|
| 1 | 卡标识管理 | `/communication/card-identifier-management` | `CardRecord`（3 页签 普通/NB/池） | iccid,msisdn,operator,packageName,status,流量,project,imei,esim,有效期… (30+) | 静态 | `cards` | ✅ 新增卡 + 编辑 + 真实停复机/续期/注销 |
| 2 | 流量池 | `/communication/flow-pool` | `FlowPoolRecord` | poolNo,operator,basePackage,total/used/remain,simCount | 静态(+订购/日流量/自动续费弹窗) | `flow-pools` | ✅ 新增池 |
| 3 | 语音池 | `/communication/voice-pool` | `VoicePoolRecord` | poolNo,operator,语音分钟,simCount… | 静态(+3 弹窗) | `voice-pools` | ✅ 新增池 |
| 4 | 套餐列表 | `/communication/package-list` | `PackageLifecycleRecord` + `LifecycleEvent` | 套餐编码/名称/运营商/价格/生命周期事件 | 静态 | `packages` | ✅ 新增套餐 |
| 5 | 风险管控 | `/communication/risk-control-management` | `WhiteListRecord` + `RuleRecord` + `HitRecord`（3 实体） | 白名单/风控规则/命中记录 | 静态 | `risk`(三子集合) | ✅ 各自新增 |
| 6 | 设备列表 | `/device/device-list` | `DeviceRecord` | deviceNo,deviceName,model,iccid,imei,guardianCode,status,发货/激活/心跳/告警数,固件 | 静态(+批量入库弹窗) | `devices` | ✅ 新增设备 + 真实发货/激活/参数下发/绑卡 |
| 7 | 服务产品 | `/service/service-product` | `ServiceProductRecord` | productCode,name,type,billingMode,status,price,validPeriod | 静态 | `service-products` | ✅ 新增产品 |
| 8 | 服务订阅 | `/service/service-subscription` | `ServiceSubscriptionRecord` | subscriptionNo,customer,product,instance,status,start/expire,renewStatus | 静态 | `service-subscriptions` | ✅ 新增订阅 |
| 9 | 服务运营 | `/service/service-operations` | `ServiceOperationRecord` | orderNo,customer,product,operationType,status,submit/target,owner | 静态 | `service-operations` | ✅ 新增运营单 |
| 10 | 服务保障 | `/service/service-assurance` | `AssuranceRecord` | 保障单号/状态/SLA… | 静态 | `service-assurances` | ✅ 新增保障单 |
| 11 | 订单结算 | `/finance/order-settlement` | `OrderSettlementRecord` | orderNo,customer,iccid,msisdn,package,金额(order/cost/margin/commission),账期 | 静态 | `orders` | ✅ 新增订单 |
| 12 | 分佣管理 | `/finance/commission-management` | `CommissionSummaryRecord` | 结算类型/账期/订单额/成本/毛利/分佣比例/分佣额 | 静态 | `commissions` | ✅ 新增分佣记录 |
| 13 | 提现管理 | `/finance/withdraw-management` | `WithdrawRecord` | orderNo,提现账号,金额,申请/处理时间,状态 | **空数据**(已有申请弹窗) | `withdrawals` | ✅ 申请弹窗接后端 |
| 14 | 商户与风控 | `/finance/merchant-risk` | `MerchantRisk*`（按现页字段） | 商户/风险评分/风控状态… | 静态 | `merchant-risks` | ✅ 新增商户 |
| 15 | 告警中心 | `/alert-center` | `AlertRow` | time,target,operator,type,level,desc,status | 前端 state（已闭环） | `alerts` | ✅ 新增告警 + 接后端 |
| 16 | 数据看板 | `/data-board` | 聚合 KPI + 开卡闭环 | 在网/在线率/续费率/ARPU/告警/分布/趋势 | 前端 state | `stats`(聚合接口) | 看板调聚合接口；开卡闭环可写入 cards |
| 17 | 用户登录 | `/user/login` | 鉴权 | admin/ant.design（已演示化） | mock(已放宽) | 保留(可选接 user) | 保留 |

> 保留不动的既有后端：`sim`(移动/电信批量查卡)、`china-mobile`、`china-telecom`、`china-unicom`(鉴权)、`user`、`health`。本计划**只新增**上述业务模块。

---

## 三、总体技术方案（前端↔后端如何接通）

### 3.1 后端（NestJS + 持久层）
- 每个实体一个模块：`schema(Mongoose) + dto(create/update/query) + service(CRUD+种子) + controller(REST) + module`，在 `app.module.ts` 注册。
- 路由统一在全局前缀 `/api` 下（`main.ts` 已 `setGlobalPrefix('api')`）：`GET /api/<entity>`(分页列表)、`POST /api/<entity>`(新增)、`PATCH /api/<entity>/:id`、`DELETE /api/<entity>/:id`，以及实体特有动作（如 `POST /api/cards/:id/suspend` 停机）。
- 统一响应信封：`{ success: true, data: <对象|数组>, total?: number }`，错误 `{ success:false, errorMessage }`。
- Swagger：每模块 `@ApiTags`，演示可直接看 `/docs`。

### 3.2 持久层（关键决策，见第五节）
- **方案 A：MongoDB**（项目已配 `mongodb://localhost:27017/iot-platform`）——标准、可持久化，需客户机器装 Mongo。
- **方案 B：内存仓储兜底**——抽象一个 `Repository` 接口，Mongo 不可用时自动回退到进程内数组（演示用，重启清空）。**强烈建议实现 B 作为兜底**，保证「客户没装 Mongo 也能演示」。
- 两方案对前端透明（接口一致）。

### 3.3 前端改造
- 新建 `src/services/<entity>.ts`：用 `@umijs/max` 的 `request` 封装该实体的 list/create/update/remove/action。
- 列表：把组件内静态 `const xxxRecords` 改为 `ProTable` 的 `request`（分页/筛选转 query），**保留**原有筛选器、页签、列、工具栏按钮。
- **新增弹窗**：用 `ModalForm`/`DrawerForm`(ProForm) 实现「新增」按钮，字段对应实体，提交 `POST` 成功后 `actionRef.reload()`。
- 同时补「编辑」(回填+`PATCH`)、「删除」(`Popconfirm`+`DELETE`)；原有静态操作按钮**保留**，逐步指向真实动作接口。

### 3.4 请求基址 / 代理（⚠️ 易漏，必须先做）
- `src/app.tsx` 当前 `request.baseURL = 'https://proapi.azurewebsites.net'`（Pro 演示后端）——**必须改为本地**（空基址 + dev 代理，或 `http://localhost:3000`）。
- `config/proxy.ts` 的 `dev` 当前被注释——**启用** `'/api': { target: 'http://localhost:3000', changeOrigin: true }`，让 8000 的 `/api` 走到 3000，避免 CORS。
- 后端路由已带 `/api` 前缀，故前端请求 `/api/cards` → 代理 → `http://localhost:3000/api/cards`。✔ 对齐。

---

## 四、标准建设范式（每个实体照抄，保证一致）

### 4.1 后端 per-entity 清单
1. `schemas/<entity>.schema.ts`：`@Schema({timestamps:true})` + `@Prop` 全字段；`toJSON` 把 `_id`→`id`、去 `__v`。
2. `dto/create-<entity>.dto.ts` / `update-*.dto.ts` / `query-*.dto.ts`：`class-validator` 装饰；查询含 `page,pageSize,keyword,排序,各筛选`。
3. `<entity>.service.ts`：`findPaged(query)`、`create`、`update`、`remove`、特有动作；`onModuleInit` 种子（集合空则插示例）。
4. `<entity>.controller.ts`：REST + `@ApiTags`，返回统一信封。
5. `<entity>.module.ts` → 注册进 `app.module.ts`。

### 4.2 前端 per-page 清单
1. `services/<entity>.ts`：`list/create/update/remove/<action>`。
2. 列表接 `request`（保留原筛选/页签/列/工具栏）。
3. 「新增」`ModalForm`：字段=实体可填字段，提交→`create`→`reload`+`message.success`。
4. 「编辑」回填→`update`；「删除」`Popconfirm`→`remove`。
5. 原有按钮保留；能接真就接对应动作接口，不能接的暂留提示（但不删）。

---

## 五、关键决策点（开工前需你拍板一次）

1. **持久层**：① 仅 MongoDB；② **MongoDB + 内存兜底（推荐，演示最稳）**；③ 仅内存（最简，重启清空）。
2. **看板/告警闭环**：是否把已做的前端闭环改为写后端（推荐保留前端闭环 + 看板 KPI 读后端聚合，双轨最稳）。
3. **登录**：保留现有演示化 mock（推荐），暂不做真实鉴权。

> 这三点一旦定下写入本节，后续不再反复确认。

---

## 六、易被忽略的关键点（思考齐全清单 · 每轮对照）

1. **ValidationPipe 坑**：`main.ts` 已开 `forbidNonWhitelisted:true` —— 前端多传一个字段就会 400。DTO 必须与前端提交字段完全对齐，或调整该选项。
2. **统一响应体 vs ProTable**：ProTable `request` 需返回 `{data,total,success}`；要么后端直接返回该形状，要么在 `services` 层适配。
3. **ID 映射**：Mongo `_id`(ObjectId) → 前端用的 `id`(string)；schema `toJSON` 统一转换。
4. **种子数据 & 重置**：`onModuleInit` 仅在集合空时插入；提供 `POST /api/dev/reset`（或脚本）一键重置演示数据。
5. **金额/日期类型**：金额用 `number`，日期沿用前端字符串格式，避免渲染错位。
6. **看板聚合接口**：`GET /api/stats/overview` 实时统计各集合（在网数/在线率/续费率/ARPU/告警数/分布/趋势），替代前端写死。
7. **告警计数联动**：设备/卡的告警数与告警中心同源，避免两处对不上。
8. **运营商真实接口保留并增强**：不动 `/api/sim/*`；可在卡台账页加「同步真实卡信息」按钮调用它。
9. **后端一键启动器**：补 `启动后端.bat`（仿 `启动演示.bat`），并在 README/Skill 说明 Mongo 依赖与兜底。
10. **CORS**：优先用 dev proxy 免 CORS；若直连则后端开 `app.enableCors()`。
11. **分页/筛选/排序**统一 query 约定：`page,pageSize,keyword,sortField,sortOrder,<字段筛选>`。
12. **错误与加载态**：`requestErrorConfig` 统一 toast；表格/弹窗 loading。
13. **导入/导出/批量**：现有批量入库、导出按钮保留，可逐步接后端。
14. **多实体页**：风控页有 3 个实体（白名单/规则/命中），需 3 套接口 + 3 个新增入口，别漏。
15. **演示数据自洽**：新增卡/设备后，看板与告警的统计应能反映（聚合接口实时算）。

---

## 七、分阶段执行计划（后续每轮认领一个 Phase）

| Phase | 内容 | 交付 |
|---|---|---|
| **0 · 地基** | 启用 dev 代理 + 改 baseURL；建统一响应信封与基础 CRUD 模板；选定持久层(含内存兜底)；种子机制；`启动后端.bat` | 前端能调通后端一个样例实体 |
| **1 · 卡台账** | `cards` 后端 + 卡标识管理页接通 + 新增/编辑/删除 + 真实停复机/续期/注销 | 核心实体全链路 |
| **2 · 设备** | `devices` 后端 + 设备页接通 + 新增 + 发货/激活/参数下发/守护码↔ICCID 绑卡 | 设备闭环 |
| **3 · 告警** | `alerts` 后端 + 告警中心接通 + 新增告警 + 处理/忽略 | 告警入库 |
| **4 · 连接引擎其余** | `flow-pools / voice-pools / packages / risk(白名单/规则/命中)` 后端 + 各页新增 | 连接引擎全量 |
| **5 · 服务** | `service-products / -subscriptions / -operations / -assurances` + 各页新增 | 服务版块全量 |
| **6 · 财务** | `orders / commissions / withdrawals / merchant-risks` + 各页新增 | 财务版块全量 |
| **7 · 看板聚合** | `GET /api/stats/overview` + 看板改读后端；开卡闭环可写 cards | 数据版块真实化 |
| **8 · 收尾** | 运营商「同步真实卡」按钮、重置接口、Swagger 校验、文档与经验回写 | 交付级演示 |

> 每个 Phase 完成后跑「验证清单」并把经验追加到 `.claude/skills/iot-platform-demo/SKILL.md`。

---

## 八、每个 Phase 的验证清单

- [ ] 后端 `cd backend; pnpm run dev` 起得来，`/docs` 有新模块。
- [ ] 前端 `npx tsc --noEmit` 新增/改动文件零错误。
- [ ] dev 日志 `Full rebuilt` 无 `Module not found`/error。
- [ ] 目标页能列表(读后端)、能「新增」(弹窗→入库→刷新)、原有功能与按钮**全部还在**。
- [ ] 看板/告警等联动统计正确。
- [ ] 经验回写 SKILL.md。

---

## 九、不可删减清单（执行时逐页核对，确保"只增不减"）

- 所有一级/二级菜单与路由（含已加的 数据看板、告警中心）。
- 卡标识管理：3 页签、全部筛选项、表头管理、批量操作、导出、行内「操作」下拉、详情抽屉、停开机开关。
- 流量池/语音池：订购/日流量(语音)/自动续费 弹窗。
- 套餐：生命周期事件展示。
- 风控：白名单 + 规则 + 命中 三块。
- 设备：KPI 概览卡、筛选、批量入库弹窗、详情抽屉、行内操作。
- 服务/财务各页：现有列、筛选、详情、统计。
- 数据看板：KPI、运营商/状态/项目分布、趋势、开卡全生命周期闭环向导、重置。
- 告警中心：KPI、筛选、处理/忽略/批量、详情抽屉、重置。
- 登录：账户/手机号双 tab、演示化提示。

---

## 执行进度（每轮更新）

- 2026-06-24：本计划创建完成。已确认决策：持久层=**② MongoDB + 内存兜底**；看板/告警=前端闭环 + 看板读后端聚合；登录=保留 mock。
- 2026-06-24：进入 **Phase 0（地基）** —— 后端通用持久层(Mongo/内存自动切换) + 统一响应 + cards 样例 CRUD + 前端代理/基址 + `启动后端.bat`。
- 2026-06-24：**Phase 0 完成并端到端验证** ✅。后端在内存模式跑通 cards 增删改查+停复机+搜索+中文往返；前端 8000 经 dev 代理访问 `/api/cards` total=6 打通。
- 2026-06-24：**Phase 1（卡台账）完成并验证** ✅。卡标识管理页接 `/api/cards`；新增/编辑/删除 + 真实停复机/注销；原页全保留。
- 2026-06-24：**Phase 2（设备）完成并验证** ✅。devices 后端 + 设备列表页接通；新增/编辑/删除 + 发货/激活/参数下发/绑卡；原页全保留。
- 2026-06-24：**Phase 3（告警）完成并验证** ✅。alerts 后端 + 告警中心接通 + 看板联动。
- 2026-06-24：**Phase 4a（流量池+语音池）完成并验证** ✅。flow-pools/voice-pools 后端 + 两页接通 + 新增/编辑/删除。
- 2026-06-24：**Phase 4b（套餐）完成并验证** ✅。packages 后端（含嵌套 timeline）+ 套餐页全量重写接通。
- 2026-06-24：**Phase 4c（风控）完成** ✅ —— **Phase 4 全部完成**。
- 2026-06-24：**Phase 5a（服务产品+服务订阅）完成** ✅。
- 2026-06-24：**Phase 5b（服务运营+服务保障）完成** ✅ —— **Phase 5 全部完成**。
- 2026-06-24：**Phase 6a（订单结算+分佣管理）完成** ✅。
- 2026-06-24：**Phase 6b（提现+商户风控）完成** ✅ —— **Phase 6 全部完成**。
- 2026-06-24：**Phase 7（看板聚合）完成** ✅。stats 后端跨集合聚合 + 看板改读后端；任意页新增数据→看板真实变化。
- 2026-06-24：**Phase 8（收尾）完成** ✅ —— 🎉 **建设计划 Phase 0–8 全部 100% 完成**。admin 一键重置接口(+看板按钮)、卡页运营商真实同步按钮、演示文档刷新为全栈现状。
  - **交付状态**：五大版块全部接通后端、每处数据可手动新增、看板实时聚合、Mongo/内存自动切换、一键重置、`启动后端.bat`/`启动演示.bat` 一键启动。后端 15 业务模块，前后端 tsc 全零错误。
