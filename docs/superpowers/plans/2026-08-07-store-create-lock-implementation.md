# 开新店资料审核锁定页实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从登录后的“开新店”入口进入一个复用消息详情布局的资料审核锁定页，并通过参数化路径跳转到审核资料页面。

**Architecture:** 保留 `store-access-scope.vue` 已有的 `create-store` 事件，由登录页继续准备草稿门店后跳转到新增的路由承载页。承载页读取审核资料路径并渲染独立的 `store-create-lock` 组件；组件只负责展示锁定内容和执行 `uni.navigateTo`，不负责门店数据或审核接口。

**Tech Stack:** Vue 3 `<script setup>`、uni-app、TypeScript、Vite、Node.js assertion checks、H5 build。

---

## 文件结构

- Create: `src/pages/me/store-create-lock/shared.ts`，集中定义临时审核入口和锁定页路由构造函数。
- Create: `tests/store-create-lock-path.test.mjs`，验证审核入口路径和锁定页路径的 query 编码行为。
- Create: `src/components/store-create-lock/store-create-lock.vue`，复用消息详情布局的锁定画面和审核入口按钮。
- Create: `src/pages/me/store-create-lock/index.vue`，读取路由参数并承载锁定组件。
- Modify: `src/pages/login/index.vue:1-20,227-255`，把“开新店”成功后的目标从门店资料页改为锁定页。
- Reuse unchanged: `src/components/store-access-scope/store-access-scope.vue`，继续发出 `create-store` 并关闭弹层；不重复实现已有按钮逻辑。

### Task 1: 先写路由契约测试并确认失败

**Files:**
- Create: `tests/store-create-lock-path.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tests/store-create-lock-path.test.mjs` with the following exact contents. The guarded import turns the missing production module into an assertion failure, so the red run has a feature-specific failure instead of an uncaught module error.

```js
import assert from 'node:assert/strict'

let routeHelpers
try {
  routeHelpers = await import('../src/pages/me/store-create-lock/shared.ts')
}
catch (error) {
  assert.fail(`store-create-lock route helpers are not implemented: ${error instanceof Error ? error.message : String(error)}`)
}

assert.equal(
  routeHelpers.buildAuditPagePath(42),
  '/pages/me/store-info/index?mode=create&storeId=42',
)

assert.equal(
  routeHelpers.buildAuditPagePath(42, '/pages/me/store-audit/index'),
  '/pages/me/store-audit/index?storeId=42',
)

assert.equal(
  routeHelpers.buildStoreCreateLockRoute(42),
  '/pages/me/store-create-lock/index?storeId=42&auditPath=%2Fpages%2Fme%2Fstore-info%2Findex%3Fmode%3Dcreate%26storeId%3D42',
)

assert.equal(
  routeHelpers.buildStoreCreateLockRoute(42, '/pages/me/store-audit/index?scene=new'),
  '/pages/me/store-create-lock/index?storeId=42&auditPath=%2Fpages%2Fme%2Fstore-audit%2Findex%3Fscene%3Dnew%26storeId%3D42',
)

console.log('store-create-lock path checks passed')
```

- [ ] **Step 2: Run the test to verify it fails for the expected reason**

Run from `D:\work\codeSpace\shengda\savelocal-store-app`:

```powershell
node tests/store-create-lock-path.test.mjs
```

Expected result: exit code `1` with an `AssertionError` beginning with `store-create-lock route helpers are not implemented`, because `shared.ts` does not exist yet.

### Task 2: Implement and verify the route helpers

**Files:**
- Create: `src/pages/me/store-create-lock/shared.ts`

- [ ] **Step 1: Add the minimal route implementation**

Create `src/pages/me/store-create-lock/shared.ts` with the following exact contents:

```ts
export const defaultAuditPagePath = '/pages/me/store-info/index?mode=create'

function appendStoreId(path: string, storeId: number) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}storeId=${encodeURIComponent(String(storeId))}`
}

export function buildAuditPagePath(storeId: number, basePath = defaultAuditPagePath) {
  return appendStoreId(basePath, storeId)
}

export function buildStoreCreateLockRoute(
  storeId: number,
  auditPagePath = defaultAuditPagePath,
) {
  const resolvedAuditPagePath = buildAuditPagePath(storeId, auditPagePath)
  const query = [
    `storeId=${encodeURIComponent(String(storeId))}`,
    `auditPath=${encodeURIComponent(resolvedAuditPagePath)}`,
  ].join('&')

  return `/pages/me/store-create-lock/index?${query}`
}
```

- [ ] **Step 2: Run the focused test to verify it passes**

Run:

```powershell
node tests/store-create-lock-path.test.mjs
```

Expected result: exit code `0` and `store-create-lock path checks passed`.

- [ ] **Step 3: Commit the route contract**

```powershell
git add -- tests/store-create-lock-path.test.mjs src/pages/me/store-create-lock/shared.ts
git commit -m "test: define store create lock routes"
```

### Task 3: Add the reusable lock component

**Files:**
- Create: `src/components/store-create-lock/store-create-lock.vue`

- [ ] **Step 1: Add the component with the approved copy and message-detail layout**

Create `src/components/store-create-lock/store-create-lock.vue` with the following exact contents:

```vue
<script setup lang="ts">
interface Props {
  auditPagePath?: string
}

const props = withDefaults(defineProps<Props>(), {
  auditPagePath: '',
})

function showAuditPageError() {
  uni.showToast({
    title: '审核信息页面暂未配置',
    icon: 'none',
  })
}

function openAuditPage() {
  const auditPagePath = props.auditPagePath.trim()
  if (!auditPagePath) {
    showAuditPageError()
    return
  }

  uni.navigateTo({
    url: auditPagePath,
    fail: showAuditPageError,
  })
}
</script>

<template>
  <view class="store-create-lock-page">
    <view class="store-create-lock-nav">
      <back-button
        fallback-url="/pages/login/index"
        fallback-mode="navigateTo"
        color="#23262c"
        background="transparent"
      />
      <text class="store-create-lock-nav__title">开新店</text>
      <view class="store-create-lock-nav__spacer" />
    </view>

    <view class="store-create-lock-content">
      <text class="store-create-lock-content__title">开新店前请先提交审核资料</text>
      <text class="store-create-lock-content__body">为保障门店信息真实有效，开设新分店前需要先填写并提交门店资料。审核通过后，即可进入新店经营管理。</text>
      <view
        class="store-create-lock-content__action"
        hover-class="store-create-lock-content__action--hover"
        @tap="openAuditPage"
      >
        去提交审核资料
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-create-lock-page {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 20rpx) 28rpx calc(env(safe-area-inset-bottom) + 40rpx);
  box-sizing: border-box;
  background: #f5f6f8;
}

.store-create-lock-nav {
  display: grid;
  grid-template-columns: 88rpx 1fr 88rpx;
  align-items: center;
  min-height: 76rpx;
}

.store-create-lock-nav__title {
  color: #23262c;
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
}

.store-create-lock-nav__spacer {
  width: 88rpx;
}

.store-create-lock-content {
  display: flex;
  flex-direction: column;
  margin-top: 28rpx;
  padding: 38rpx 32rpx;
  border-radius: 16rpx;
  background: #fff;
}

.store-create-lock-content__title {
  color: #20242a;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.45;
}

.store-create-lock-content__body {
  margin-top: 34rpx;
  color: #4e535c;
  font-size: 30rpx;
  line-height: 1.8;
  white-space: pre-wrap;
}

.store-create-lock-content__action {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 84rpx;
  margin-top: 48rpx;
  border-radius: 14rpx;
  background: #ffd34f;
  color: #2a2d33;
  font-size: 30rpx;
  font-weight: 700;
}

.store-create-lock-content__action--hover {
  opacity: 0.82;
}
</style>
```

- [ ] **Step 2: Run the focused route test and type-check the component**

Run:

```powershell
node tests/store-create-lock-path.test.mjs
pnpm type-check
```

Expected result: the route check exits `0`; `pnpm type-check` exits `0` without Vue template or `uni.navigateTo` type errors.

### Task 4: Add the route page and connect the login flow

**Files:**
- Create: `src/pages/me/store-create-lock/index.vue`
- Modify: `src/pages/login/index.vue:1-20,227-255`

- [ ] **Step 1: Add the route page that resolves the encoded audit path**

Create `src/pages/me/store-create-lock/index.vue` with the following exact contents:

```vue
<script setup lang="ts">
import StoreCreateLock from '@/components/store-create-lock/store-create-lock.vue'
import { buildAuditPagePath, defaultAuditPagePath } from './shared'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '开新店',
  },
})

const auditPagePath = ref(defaultAuditPagePath)

onLoad((options) => {
  const encodedAuditPath = typeof options?.auditPath === 'string' ? options.auditPath : ''
  if (encodedAuditPath) {
    try {
      auditPagePath.value = decodeURIComponent(encodedAuditPath)
    }
    catch {
      auditPagePath.value = encodedAuditPath
    }
    return
  }

  const storeId = Number(options?.storeId)
  if (Number.isFinite(storeId) && storeId > 0) {
    auditPagePath.value = buildAuditPagePath(storeId)
  }
})
</script>

<template>
  <store-create-lock :audit-page-path="auditPagePath" />
</template>
```

- [ ] **Step 2: Replace only the successful destination in the login handler**

Add this import beside the existing login imports in `src/pages/login/index.vue`:

```ts
import { buildStoreCreateLockRoute } from '@/pages/me/store-create-lock/shared'
```

In `handleCreateStore`, keep the existing `loadStores`, `resolveStoreIdForCreate`, `createMerchantStore`, validation, `selectStore`, error handling, and `finally` logic. Replace only the final navigation block:

```ts
uni.navigateTo({
  url: buildStoreCreateLockRoute(storeId),
})
```

The existing `store-access-scope.vue` button continues to emit `create-store`; no change is needed in that component. The default helper path currently opens `/pages/me/store-info/index?mode=create&storeId=...`. A future audit page can be selected by calling `buildStoreCreateLockRoute(storeId, '/pages/me/store-audit/index')`.

- [ ] **Step 3: Run the focused checks**

Run:

```powershell
node tests/store-create-lock-path.test.mjs
pnpm type-check
pnpm lint
```

Expected result: all commands exit `0`; lint output contains no new errors in the four changed/created source files.

- [ ] **Step 4: Commit the component and flow integration**

```powershell
git add -- src/components/store-create-lock/store-create-lock.vue src/pages/me/store-create-lock/index.vue src/pages/login/index.vue
git commit -m "feat: add store create audit lock page"
```

### Task 5: Build and validate the rendered flow

**Files:**
- Verify: `src/components/store-create-lock/store-create-lock.vue`
- Verify: `src/pages/me/store-create-lock/index.vue`
- Verify: `src/pages/login/index.vue`

- [ ] **Step 1: Run the H5 build**

Run:

```powershell
pnpm build:h5:test
```

Expected result: exit code `0`, with the new `pages/me/store-create-lock/index` page included in the generated H5 bundle and no framework compilation overlay reported by the build.

- [ ] **Step 2: Start the H5 dev server and identify its URL**

Run from `D:\work\codeSpace\shengda\savelocal-store-app`:

```powershell
pnpm dev:h5:test --host 127.0.0.1
```

Use the first available local URL printed by Vite. If the default port is occupied, use the port Vite prints instead of killing an existing process.

- [ ] **Step 3: Exercise the lock-page flow in the in-app browser**

The flow under test is: login page -> “开新店” in the access-scope sheet -> lock page -> “去提交审核资料” -> temporary store-info page.

Verify all of the following at the lock page:

1. The page URL/title identify the new `开新店` page.
2. The DOM contains `开新店前请先提交审核资料`, the approved explanatory copy, and `去提交审核资料`.
3. The first viewport has no blank shell, framework overlay, clipped text, or overlapping button.
4. Clicking `去提交审核资料` changes the URL to `/pages/me/store-info/index?mode=create&storeId=...`.
5. The back button returns to the login page when the lock page was entered from the access-scope flow.
6. Console warnings/errors contain no new application failures.

Also check the lock page at a desktop viewport and a mobile viewport. Capture screenshots outside the repository if visual evidence is needed.

- [ ] **Step 4: Run the final diff checks**

Run:

```powershell
git diff --check HEAD~1..HEAD
git status --short --branch
```

Expected result: `git diff --check` exits `0`; status contains only intentional implementation changes plus any pre-existing user files, which must not be reverted or included in the feature commit.

## Self-review checklist

- Spec coverage: the component, route wrapper, parameterized audit path, login integration, temporary target, error feedback, and H5 verification each have an explicit task above.
- Placeholder scan: the plan contains no unresolved placeholder marker or unspecified implementation step.
- Type consistency: `buildAuditPagePath`, `buildStoreCreateLockRoute`, `defaultAuditPagePath`, `auditPagePath`, and `auditPagePath` query names are used consistently across the test, helper, page, component, and login flow.
