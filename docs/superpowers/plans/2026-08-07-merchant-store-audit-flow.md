# 门店资料审核流程调整实施计划

**目标：** 将门店资料审核从主体审核中独立出来，覆盖新门店首次提审以及已通过门店后续的名称、地址、电话和资质修改，并支持后台按门店资料审核通过或驳回。

**架构：** 商家端继续通过当前门店的 `storeId` 提交新门店审核；后台审核中心新增独立的门店资料审核页签，直接查询待审核门店或待审核资料变更。现有 `MerchantStoreAuditDialog.vue` 改为按 `storeId` 打开，统一展示门店基础资料、待审核变更、电话和资质，并调用门店级审核接口。

**技术栈：** Vue 3 + uni-app 商家端、Vue 2 + Element UI 后台、Spring Boot + MyBatis 门店审核接口。

---

### 任务 1：扩展门店审核数据接口

**文件：**
- 修改：`savelocal-api/savelocal-system/src/main/java/com/savelocal/system/domain/local/LocalStore.java`
- 修改：`savelocal-api/savelocal-system/src/main/java/com/savelocal/system/domain/local/vo/LocalStoreAuditDetailVO.java`
- 修改：`savelocal-api/savelocal-system/src/main/java/com/savelocal/system/mapper/local/LocalStoreAuditMapper.java`
- 修改：`savelocal-api/savelocal-system/src/main/resources/mapper/local/LocalStoreAuditMapper.xml`

- [ ] 为门店列表增加待审核资料类型字段，使通过门店的资料变更也能进入待审核列表。
- [ ] 门店详情返回门店电话记录，后台可以查看电话及其审核状态。
- [ ] 待审核列表同时覆盖 `sl_store.audit_status = '1'`、待审核的门店资料变更、门店资质和门店电话。

### 任务 2：完善门店审核服务和控制器

**文件：**
- 修改：`savelocal-api/savelocal-system/src/main/java/com/savelocal/system/service/local/merchantCenter/ILocalStoreAuditService.java`
- 修改：`savelocal-api/savelocal-system/src/main/java/com/savelocal/system/service/impl/local/merchantCenter/LocalStoreAuditServiceImpl.java`
- 修改：`savelocal-api/savelocal-system/src/main/java/com/savelocal/system/mapper/local/LocalStoreAuditMapper.java`
- 修改：`savelocal-api/savelocal-admin/src/main/java/com/savelocal/web/controller/local/merchantCenter/LocalStoreAuditController.java`

- [ ] 所有待审核资料查询支持按 `merchantId + storeId` 定位，避免多个门店之间串资料。
- [ ] 新门店通过或驳回时同步处理该门店下的待审核资质和电话记录。
- [ ] 增加门店电话单项通过、驳回接口，并复用现有权限和驳回原因校验。

### 任务 3：将后台审核中心改为门店独立审核入口

**文件：**
- 修改：`savelocal-api/savelocal-ui/src/views/local/platform/merchantCenter/audit/index.vue`
- 新增：`savelocal-api/savelocal-ui/src/views/local/platform/merchantCenter/audit/components/StoreAudit.vue`
- 修改：`savelocal-api/savelocal-ui/src/views/local/platform/merchantCenter/audit/components/MerchantAudit.vue`
- 修改：`savelocal-api/savelocal-ui/src/views/local/platform/merchantCenter/audit/components/MerchantStoreAuditDialog.vue`
- 修改：`savelocal-api/savelocal-ui/src/api/local/merchantCenter/audit/storeAudit.js`

- [ ] 保留主体审核页签，移除主体列表中的门店资料审核入口，避免审核对象混淆。
- [ ] 新增门店资料审核页签，展示待审核新门店和后续资料变更。
- [ ] “资料审核”按钮直接将门店行传给弹窗，弹窗按 `storeId` 加载对应资料。
- [ ] 弹窗支持新门店整体通过/驳回、资料变更通过/驳回、资质和电话单项审核。

### 任务 4：保持商家端提审入口与门店审核状态一致

**文件：**
- 修改：`savelocal-store-app/src/pages/me/store-info/index.vue`
- 修改：`savelocal-store-app/src/api/merchant-store.ts`

- [ ] 新门店按钮提交当前门店的审核状态并显示明确的提审结果。
- [ ] 审核中、已通过状态禁止重复提审；驳回或草稿状态允许重新提交。

### 任务 5：构建验证

- [ ] 不新增或修改测试文件。
- [ ] 运行商家端 `pnpm type-check`。
- [ ] 运行商家端 `pnpm build:h5:test`。
- [ ] 在 `D:/work/codeSpace/shengda/savelocal-api` 运行 `mvn -pl savelocal-admin -am -DskipTests compile`，确认 Java 和 MyBatis XML 编译通过。
- [ ] 在 `D:/work/codeSpace/shengda/savelocal-api/savelocal-ui` 运行 `npm run build:prod`，确认后台 Vue 文件构建通过。
- [ ] 使用 `git diff --check` 检查本次业务代码改动。
