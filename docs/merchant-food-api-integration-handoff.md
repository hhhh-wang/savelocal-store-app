# 饮食商家接口对接顺序与交接记录

更新时间：2026-07-28

## 1. 目标与范围

本文用于把 `savelocal-store-app` 中现有饮食商家页面对接到后端 `/merchant/food/**` 接口，并作为后续 AI 的工作入口。

本轮范围：

- 门店列表、门店资料、营业状态、品类、入口图
- 门店名称/地址等资料变更申请
- 门店电话、经营资质
- 菜单相册、商品、规格和上下架
- 到店买单订单、团购订单
- 团购退款
- 经营概览、团购结算账单

本轮明确不包含：

- 外卖订单
- 商家接单、备餐、出餐/呼叫骑手
- 快跑者联盟 `KeloopClient` 调用
- 用户端团购下单流程

已确认的未来外卖流程是：用户付款后生成外卖订单，商家接单后备餐，只有点击“出餐/呼叫骑手”时才发送给快跑者。不要在本轮前端对接中提前实现。

## 2. 当前状态

### 2.1 后端

- 饮食商家模块已经完成并合并到 `savelocal-api/main`。
- 功能提交的最后一个提交为 `e1c275b`，当前后端仓库可能已有后续提交。
- Controller：`savelocal-admin/src/main/java/com/savelocal/web/controller/merchant/food/`
- Service：`savelocal-system/src/main/java/com/savelocal/system/service/merchant/food/`
- Mapper：`savelocal-system/src/main/resources/mapper/merchant/food/MerchantFoodMapper.xml`
- 数据库迁移：`doc/sql/merchant_food_management_migration.sql`
- 已创建 15 个 `merchant:food:*` 权限，并关联本地 `merchant_admin` 角色。
- 后端全量验证通过：`savelocal-system` 43 个测试、`savelocal-admin` 2 个测试，0 失败。
- MyBatis 只读查询已连接本地 MySQL 做过实际执行冒烟。

### 2.2 前端

- 尚未创建饮食商家 API 文件或类型文件。
- 全项目没有 `/merchant/food/**` 请求。
- 登录、注册、当前商家资料接口已经接入，见 `src/api/login.ts`。
- 请求拦截器会自动拼接服务器地址并携带 `Authorization: Bearer <token>`，见 `src/http/interceptor.ts`。
- 门店、商品、相册、订单、售后、对账页面仍使用静态数据、本地缓存或 Toast 占位。
- 前端工作区在编写本文前是干净的；本文是本轮新增文件。

### 2.3 本地数据库实况

使用数据库：`mysql -uroot -p123456 savelocal`

2026-07-28 查询结果：

| 数据 | 数量 |
| --- | ---: |
| 符合 `FOOD` 行业树的门店 | 1 |
| `sl_food_pay_order` 到店买单 | 19 |
| `FOOD_GROUP_BUY` 团购订单 | 0 |
| `FOOD_GROUP_BUY` 团购退款 | 0 |
| `FOOD_GROUP_BUY` 团购结算单 | 0 |
| `merchant:food:*` 权限 | 15 |

因此订单页应能看到到店数据；团购、售后、团购账单接通后显示空状态是正常结果，不应继续保留静态样例来“填满”页面。

## 3. 对接前必须先处理的基础层

### 3.1 新增 API 和类型文件

建议新增：

```text
src/api/merchant-food.ts
src/api/types/merchant-food.ts
src/store/merchant-food.ts（或项目现有 Pinia 目录中的同等文件）
```

所有请求继续使用 `@/http/http`，不要在页面中直接调用 `uni.request`。

### 3.2 响应结构差异

普通接口返回：

```ts
interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}
```

现有 `http` 封装会自动解出 `data`，所以普通 GET 可以直接声明返回业务对象。

分页接口不是 `data.list`，而是后端 `TableDataInfo`：

```ts
interface TableDataInfo<T> {
  code: number
  msg: string
  rows: T[]
  total: number
}
```

分页响应没有 `data` 字段，现有 `http` 封装会返回整个对象。不要复用当前 `PageResult<T>` 的 `list/page/pageSize` 结构。

分页请求参数使用后端 PageHelper 约定：

```ts
interface BackendPageQuery {
  pageNum: number
  pageSize: number
}
```

不要发送现有 `PageParams` 中的 `page`，否则分页页码不会生效。

### 3.3 门店上下文

第一条业务请求必须是：

```http
GET /merchant/food/stores
```

后续绝大多数接口都需要 `storeId`。建议建立统一的 `selectedStoreId` 状态：

1. 登录后或进入商家首页时加载门店列表。
2. 如果只有一个门店，自动选中。
3. 如果有多个门店，保留切换能力，不要把第一个门店永久写死。
4. 如果没有门店，页面进入明确空状态，停止请求门店详情接口。
5. 页面跳转时优先从统一状态读取 `storeId`，不要每个页面各自写静态门店。

### 3.4 权限与登录态

- 权限由后端从当前商家登录态判断，前端不得传 `merchantId`。
- 本地权限种子已经执行；如果账号在权限写入前已登录，应退出后重新登录以刷新权限集合。
- 401 已由 `src/http/http.ts` 统一处理。
- 403 应展示明确错误，不要回退到静态数据。

## 4. 推荐对接顺序

以下顺序是依赖顺序，不只是页面顺序。

### 阶段 1：API 类型层与门店上下文

目标：完成 `merchant-food.ts`、类型定义、统一门店选择状态。

验收：

- 登录后可以请求门店列表。
- 页面可以拿到真实 `storeId` 和 `storeName`。
- 删除 `dashboard/index.vue`、`me/me.vue` 等入口页面的静态门店名。
- 普通响应与分页响应分别正确解包。

### 阶段 2：门店资料只读与营业状态

先接：

```http
GET /merchant/food/stores/{storeId}/profile
PUT /merchant/food/stores/{storeId}/business-status
```

页面：

- `src/pages/me/store-info/index.vue`
- `src/pages/me/store-status/index.vue`

前端现有营业状态为 `normal | pause`，后端值为：

| 前端 | 后端 `storeStatus` |
| --- | --- |
| `normal` | `0`，营业中 |
| `pause` | `1`，停用/暂停营业 |

营业时间请求体：

```ts
interface BusinessStatusPayload {
  storeStatus: '0' | '1'
  businessTimes: Array<{
    dayOfWeek: number
    startTime: string
    endTime: string
    crossDay: '0' | '1'
    status: string
  }>
}
```

时间使用 `HH:mm`，`dayOfWeek` 必须与当前营业时间组件的星期定义核对后再映射。

完成后删除 `store-status/shared.ts` 的本地缓存作为数据源；最多只保留为表单草稿，不得覆盖服务器结果。

### 阶段 3：门店资料编辑

接口：

```http
PUT  /merchant/food/stores/{storeId}/category
PUT  /merchant/food/stores/{storeId}/entry-images
POST /merchant/food/stores/{storeId}/profile-changes
```

页面：

- `src/pages/me/store-name/index.vue`
- `src/pages/me/store-address/index.vue`
- `src/pages/me/store-category/index.vue`
- `src/pages/me/store-entry/index.vue`
- `src/pages/me/store-entry-main/index.vue`
- `src/pages/me/store-entry-image/index.vue`

品类请求：

```json
{ "industryCode": "FOOD 行业树下的有效编码" }
```

资料变更 `changeType`：

| 页面 | `changeType` | 主要字段 |
| --- | --- | --- |
| 门店名称 | `NAME` | `storeName`, `shortName` |
| 门店地址 | `ADDRESS` | `provinceCode`, `cityCode`, `districtCode`, `addressDetail`, `longitude`, `latitude` |
| 综合资料 | `PROFILE` | 名称和地址相关字段 |

同一门店、同一类型已有待审核记录时，后端会返回已有记录，不会重复创建。页面应展示“审核中”，不要反复提交。

入口图请求：

```ts
interface EntryImagesPayload {
  coverImage: string
  galleryImages: string[]
}
```

### 阶段 4：电话与资质

接口：

```http
GET    /merchant/food/stores/{storeId}/phones
POST   /merchant/food/stores/{storeId}/phones
PUT    /merchant/food/stores/{storeId}/phones/{phoneId}
DELETE /merchant/food/stores/{storeId}/phones/{phoneId}

GET /merchant/food/stores/{storeId}/qualifications
PUT /merchant/food/stores/{storeId}/qualifications
```

页面：

- `src/pages/me/store-phone/index.vue`
- `src/pages/me/store-qualifications/index.vue`

电话请求体：

```json
{ "phoneNumber": "13800138000", "sortNum": 0 }
```

资质保存请求体是数组，不是包在对象中：

```ts
type QualificationSavePayload = Array<{
  qualificationCode: string
  qualificationNo?: string
  qualificationImages: string[]
  validFrom?: string
  validTo?: string
  remark?: string
}>
```

日期格式使用后端配置的 `yyyy-MM-dd HH:mm:ss`。

### 阶段 5：图片上传与菜单相册

必须先接相册，再接商品，因为商品保存要求 `coverImageId` 对应已审核通过的相册图片。

接口：

```http
GET    /merchant/food/stores/{storeId}/album/page
POST   /merchant/food/stores/{storeId}/album/images
DELETE /merchant/food/stores/{storeId}/album/images/{imageId}
```

页面：`src/pages/dashboard/menu-album/index.vue`

查询参数：`auditStatus`，取值 `0` 待审核、`1` 已通过、`2` 未通过，并携带 `pageNum/pageSize`。

登记请求体：

```json
{ "imageUrl": "/profile/upload/.../image.png" }
```

关键限制：

- 相册登记接口只接收已经上传完成的 URL，不接收文件流。
- 前端已有通用上传代码 `src/utils/uploadFile.ts`，但当前只配置了用户头像地址。
- 对接前必须确认商家图片可用的上传端点和返回字段，再把返回 URL 传给相册登记接口。
- 新登记图片默认待审核。
- 商品保存只接受 `auditStatus = '1'` 的相册图片。
- 当前饮食商家模块没有“商家自己审核图片”的接口，联调时需要后台审核流程或准备已审核数据。

### 阶段 6：商品列表与编辑

接口：

```http
GET /merchant/food/stores/{storeId}/products/page
GET /merchant/food/stores/{storeId}/products/{productId}
POST /merchant/food/stores/{storeId}/products
PUT /merchant/food/stores/{storeId}/products/{productId}
PUT /merchant/food/stores/{storeId}/products/{productId}/status
PUT /merchant/food/stores/{storeId}/products/batch-off-shelf
```

页面：

- `src/pages/dashboard/product-library/index.vue`
- `src/pages/dashboard/product-editor/index.vue`

列表查询：`name`、`type`、`status`、`pageNum`、`pageSize`。

枚举：

| 字段 | 值 |
| --- | --- |
| `productType` | `SINGLE` 单品、`SET` 套餐 |
| `saleStatus` | `ON_SALE`、`OFF_SHELF` |
| `auditStatus` | `0` 待审核、`1` 已通过、`2` 未通过 |

保存请求：

```ts
interface ProductSavePayload {
  productName: string
  productType: 'SINGLE' | 'SET'
  coverImageId: number
  tagText?: string
  productDesc?: string
  sortNum?: number
  specs: Array<{
    specName: string
    salePrice: number | string
    unitName: string
    stockQuantity: number
    display: boolean
    sortNum?: number
  }>
}
```

规则：

- 至少一个规格。
- 恰好一个规格 `display = true`。
- 价格和库存不能小于 0。
- `coverImageId` 必须属于当前门店且已审核通过。
- 批量下架请求为 `{ productIds: number[] }`，最多 100 个。
- 金额字段建议在类型层保留 `string | number`，显示时统一格式化，避免浮点计算。

### 阶段 7：订单

接口：

```http
GET /merchant/food/orders/page
GET /merchant/food/orders/{scene}/{orderId}
GET /merchant/food/orders/{scene}/{orderId}/contact
```

页面：`src/pages/dashboard/order-management/index.vue`

列表查询：

```ts
interface FoodOrderQuery extends BackendPageQuery {
  storeId?: number
  scene?: 'ALL' | 'ONSITE' | 'GROUP_BUY'
  todoOnly?: boolean
  timeRange?: 'QUARTER'
  orderStatus?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  keyword?: string
}
```

列表字段：`scene`、`orderId`、`orderNo`、`storeId`、`storeName`、`productName`、`imageUrl`、`amount`、`quantity`、`orderStatus`、`statusText`、`todo`、`orderTime`。

详情的 `scene` 只能传 `ONSITE` 或 `GROUP_BUY`。联系方式接口成功时数据位于响应顶层 `contact`，不是 `data.contact`；现有 `http` 封装没有 `data` 可解包时会返回整个响应对象，应单独定义返回类型。

### 阶段 8：售后退款

接口：

```http
GET  /merchant/food/refunds/page
GET  /merchant/food/refunds/{refundId}
POST /merchant/food/refunds/{refundId}/approve
POST /merchant/food/refunds/{refundId}/reject
```

页面：`src/pages/dashboard/after-sales/index.vue`

查询：`storeId`、`refundType`、`refundStatus`、`keyword`、`pageNum`、`pageSize`。

枚举：

| 字段 | 值 |
| --- | --- |
| `refundType` | `BEFORE` 消费前、`AFTER` 消费后 |
| `refundStatus` | `0` 待商家处理、`1` 待平台审核、`2` 退款中、`3` 已退款、`4` 已驳回、`5` 已关闭 |

审批请求体：

```json
{ "remark": "商家处理备注" }
```

重要状态机：

- 同意退款只把状态从 `0` 改为 `1`，进入平台审核。
- 拒绝退款把状态从 `0` 改为 `4`。
- 商家接口不会伪造微信退款成功。
- 重复审批返回“退款记录不存在或已被处理”，前端应刷新列表。
- 售后响应已包含 `productName`、`productImage`、`quantity`、`productSummary`。

### 阶段 9：经营概览与对账

接口：

```http
GET /merchant/food/reconciliation/overview
GET /merchant/food/reconciliation/bills/page
GET /merchant/food/reconciliation/bills/{settlementId}
```

页面：`src/pages/dashboard/merchant-reconciliation/index.vue`

查询：

```ts
interface ReconciliationQuery {
  storeId?: number
  scene?: 'ALL' | 'ONSITE' | 'GROUP_BUY'
  startTime?: string
  endTime?: string
  month?: string // yyyy-MM
  todayOnly?: boolean
  settlementStatus?: string
}
```

概览一次返回三组数据：`all`、`onsite`、`groupBuy`。每组包含：

```ts
interface ReconciliationStat {
  completedCount: number
  completedAmount: number | string
  onsiteCount: number
  onsiteAmount: number | string
  progressCount: number
  progressAmount: number | string
  todayCount: number
  todayAmount: number | string
  historyCount: number
  historyAmount: number | string
  settlementAmount: number | string
}
```

账单现状：

- 团购账单来自 `sl_settlement_record`。
- 到店买单当前没有结算记录，`scene=ONSITE` 返回空列表，这是设计行为。
- 日期过滤使用 `[startTime, endTime)` 半开区间。
- `todayOnly=true` 会覆盖月份时间范围。
- `month` 格式必须是 `yyyy-MM`。

## 5. 页面与接口映射总表

| 页面 | 当前数据 | 首要接口 |
| --- | --- | --- |
| `dashboard/index.vue` | 静态门店名 | 门店列表/门店上下文 |
| `me/me.vue` | 静态门店名 | 门店列表/门店资料 |
| `me/store-info/index.vue` | 静态资料 | 门店 profile |
| `me/store-status/index.vue` | 本地缓存 | profile + business-status |
| `me/store-name/index.vue` | 本地表单 | profile-changes `NAME` |
| `me/store-address/index.vue` | 本地表单 | profile-changes `ADDRESS` |
| `me/store-category/index.vue` | 静态选项 | category |
| `me/store-entry*` | 静态门店名/图片 | entry-images |
| `me/store-phone/index.vue` | 本地表单 | phones CRUD |
| `me/store-qualifications/index.vue` | 静态数组 | qualifications GET/PUT |
| `dashboard/menu-album/index.vue` | 静态数组/Toast | album page/create/delete |
| `dashboard/product-library/index.vue` | 静态数组 | products page/status/batch |
| `dashboard/product-editor/index.vue` | Toast“待接入” | product detail/create/update |
| `dashboard/order-management/index.vue` | 静态数组 | orders page/detail/contact |
| `dashboard/after-sales/index.vue` | 静态数组 | refunds page/approve/reject |
| `dashboard/merchant-reconciliation/index.vue` | 静态汇总和账单 | overview/bills |

## 6. 建议的每阶段实现方式

每完成一个阶段都执行：

1. 在 `src/api/types/merchant-food.ts` 增加或校正类型。
2. 在 `src/api/merchant-food.ts` 增加请求函数。
3. 页面增加 loading、空状态、错误重试、提交中禁用。
4. 用真实响应替换静态数组，不保留静态数据作为失败回退。
5. 写操作成功后重新请求服务器数据，不只修改本地数组。
6. 运行 `pnpm type-check`。
7. 运行 `pnpm lint`，只修复本阶段引入的问题。
8. 至少在 H5 或微信小程序环境手动验证页面主流程。

如果运行 H5：

```powershell
pnpm dev:h5
```

服务器地址来自 `env/.env` 的 `VITE_SERVER_BASEURL`。当前默认值指向测试环境；若联调本机后端，应只调整合适的开发环境配置，不要提交个人局域网地址或凭据。

## 7. 后端接口清单

### 门店与资料

```text
GET    /merchant/food/stores
GET    /merchant/food/stores/{storeId}/profile
PUT    /merchant/food/stores/{storeId}/business-status
PUT    /merchant/food/stores/{storeId}/category
PUT    /merchant/food/stores/{storeId}/entry-images
POST   /merchant/food/stores/{storeId}/profile-changes
GET    /merchant/food/stores/{storeId}/phones
POST   /merchant/food/stores/{storeId}/phones
PUT    /merchant/food/stores/{storeId}/phones/{phoneId}
DELETE /merchant/food/stores/{storeId}/phones/{phoneId}
GET    /merchant/food/stores/{storeId}/qualifications
PUT    /merchant/food/stores/{storeId}/qualifications
```

### 相册与商品

```text
GET    /merchant/food/stores/{storeId}/album/page
POST   /merchant/food/stores/{storeId}/album/images
DELETE /merchant/food/stores/{storeId}/album/images/{imageId}
GET    /merchant/food/stores/{storeId}/products/page
GET    /merchant/food/stores/{storeId}/products/{productId}
POST   /merchant/food/stores/{storeId}/products
PUT    /merchant/food/stores/{storeId}/products/{productId}
PUT    /merchant/food/stores/{storeId}/products/{productId}/status
PUT    /merchant/food/stores/{storeId}/products/batch-off-shelf
```

### 订单、退款、对账

```text
GET  /merchant/food/orders/page
GET  /merchant/food/orders/{scene}/{orderId}
GET  /merchant/food/orders/{scene}/{orderId}/contact
GET  /merchant/food/refunds/page
GET  /merchant/food/refunds/{refundId}
POST /merchant/food/refunds/{refundId}/approve
POST /merchant/food/refunds/{refundId}/reject
GET  /merchant/food/reconciliation/overview
GET  /merchant/food/reconciliation/bills/page
GET  /merchant/food/reconciliation/bills/{settlementId}
```

## 8. 已知风险和待确认项

1. 图片上传端点尚未在饮食商家模块中明确，需要先确认可复用的商家上传接口。
2. 相册图片必须审核通过后才能创建商品；当前商家模块没有图片审核接口。
3. 本地没有团购订单、退款和结算数据，相关页面只能先验证空状态；需要测试数据才能验证完整交互。
4. 前端 `PageParams` 使用 `page`，后端要求 `pageNum`，必须建立专用分页类型。
5. 联系方式接口返回顶层 `contact`，与普通 `data` 响应不同。
6. 资质日期使用 `yyyy-MM-dd HH:mm:ss`，不要直接发送仅日期字符串而不验证。
7. 门店电话和资料变更具有审核语义，提交成功不代表立即变成已生效资料。
8. 不要把 `merchantId` 放进前端请求；后端只信任登录态。
9. 不要在接口失败时继续展示静态演示数据，这会掩盖权限、数据和网络问题。
10. 后端主工作区存在用户自己的未提交 SQL、配置和文档文件，修改后端时必须保留，不要 reset 或覆盖。

## 9. 下一位 AI 的建议起始任务

建议先只完成阶段 1 和阶段 2，不要一次改完全部页面：

1. 阅读本文、`src/http/http.ts`、`src/http/interceptor.ts` 和 `src/api/login.ts`。
2. 阅读后端七个 `MerchantFood*Controller`，以代码为最终契约。
3. 新建饮食商家 API 类型和请求文件。
4. 建立真实门店上下文。
5. 对接 `store-info` 和 `store-status`。
6. 删除这两个页面的静态数据/本地缓存主数据源。
7. 运行类型检查并实际登录验证。
8. 在本文“当前状态”中更新已完成项，再进入下一阶段。

对接进度更新格式建议：

```text
- [x] API 类型与请求层
- [x] 门店上下文
- [x] 门店资料只读
- [x] 营业状态
- [ ] 名称/地址/品类/入口图
- [ ] 电话与资质
- [ ] 相册
- [ ] 商品
- [ ] 订单
- [ ] 售后
- [ ] 对账
```

当前进度：以上所有前端对接项均未完成，只有后端接口、数据库结构和权限已完成。
