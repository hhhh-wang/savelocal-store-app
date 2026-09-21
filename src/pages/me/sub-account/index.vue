<script lang="ts" setup>
import type { SubAccount, SubAccountForm } from './sub-account'
import SubAccountEditor from './components/sub-account-editor.vue'
import { createDemoSubAccounts, getSubAccountRoleNames, maskSubAccountMobile, subAccountRoles } from './sub-account'

defineOptions({ name: 'SubAccountManagement' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '子账号管理',
    backgroundColor: '#f5f5f5',
  },
})

const accounts = ref<SubAccount[]>(createDemoSubAccounts())
const keyword = ref('')
const scopeIndex = ref(0)
const roleIndex = ref(0)
const statusIndex = ref(1)
const editorVisible = ref(false)
const editingAccount = ref<SubAccount>()
let nextAccountId = 1

const scopeOptions = [
  { label: '总部', value: 'headquarters' },
  { label: '门店', value: 'store' },
  { label: '全部范围', value: 'all' },
]
const roleOptions = [
  { label: '全部角色', value: 'all' },
  ...subAccountRoles.map(role => ({ label: role.name, value: role.id })),
]
const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '已启用', value: 'enabled' },
  { label: '已禁用', value: 'disabled' },
]

const filteredAccounts = computed(() => {
  const search = keyword.value.trim()
  const scope = scopeOptions[scopeIndex.value].value
  const role = roleOptions[roleIndex.value].value
  const status = statusOptions[statusIndex.value].value

  return accounts.value.filter((account) => {
    const matchesKeyword = !search || account.username === search || account.mobile === search
    const matchesScope = scope === 'all'
      || (scope === 'headquarters' ? account.storeNames.length === 0 : account.storeNames.length > 0)
    const matchesRole = role === 'all' || account.roleIds.includes(role)
    const matchesStatus = status === 'all' || account.status === status
    return matchesKeyword && matchesScope && matchesRole && matchesStatus
  })
})

function confirmSearch() {
  uni.hideKeyboard()
}

function showAllAccounts() {
  keyword.value = ''
  scopeIndex.value = 2
  roleIndex.value = 0
  statusIndex.value = 0
}

function showRoles(account: SubAccount) {
  uni.showModal({
    title: '账号角色',
    content: getSubAccountRoleNames(account.roleIds).join('\n') || '暂无角色',
    showCancel: false,
    confirmText: '知道了',
    confirmColor: '#333333',
  })
}

function toggleAccountStatus(account: SubAccount) {
  const action = account.status === 'enabled' ? '禁用' : '启用'
  uni.showModal({
    title: `确认${action}该子账号？`,
    content: `账号：${account.username}`,
    confirmText: action,
    confirmColor: '#333333',
    success: ({ confirm }) => {
      if (!confirm)
        return
      account.status = account.status === 'enabled' ? 'disabled' : 'enabled'
      uni.showToast({ title: `已${action}`, icon: 'success' })
    },
  })
}

function openEditor(account?: SubAccount) {
  editingAccount.value = account
  editorVisible.value = true
}

function saveAccount(form: SubAccountForm) {
  const otherAccounts = accounts.value.filter(account => account.id !== editingAccount.value?.id)
  if (otherAccounts.some(account => account.username === form.username)) {
    uni.showToast({ title: '该账号名已存在', icon: 'none' })
    return
  }
  if (otherAccounts.some(account => account.mobile === form.mobile)) {
    uni.showToast({ title: '该手机号已被其他子账号使用', icon: 'none' })
    return
  }

  const isEditing = !!editingAccount.value
  const status = editingAccount.value?.status || 'enabled'
  if (editingAccount.value) {
    Object.assign(editingAccount.value, form)
  }
  else {
    accounts.value.unshift({ ...form, id: `local-account-${nextAccountId++}`, status })
  }

  // 保存后展示该账号所在范围和状态，避免新建成功却被之前的筛选条件隐藏。
  keyword.value = ''
  scopeIndex.value = form.storeNames.length ? 1 : 0
  roleIndex.value = 0
  statusIndex.value = statusOptions.findIndex(option => option.value === status)
  editorVisible.value = false
  uni.showToast({ title: isEditing ? '已保存' : '已新建', icon: 'success' })
}

onBackPress(() => {
  if (!editorVisible.value)
    return false
  editorVisible.value = false
  return true
})
</script>

<template>
  <view class="sub-account-page">
    <view class="sub-account-nav">
      <back-button
        fallback-url="/pages/me/me"
        fallback-mode="reLaunch"
        color="#262626"
        background="transparent"
        size="64rpx"
      />
      <text class="sub-account-nav__title">子账号管理</text>
      <view class="sub-account-nav__spacer" />
    </view>

    <view class="sub-account-content">
      <view class="account-search">
        <view class="i-carbon-search account-search__icon" />
        <input
          v-model="keyword"
          class="account-search__input"
          placeholder="输入完整账号名/手机号"
          placeholder-class="account-search__placeholder"
          confirm-type="search"
          :maxlength="32"
          @confirm="confirmSearch"
        >
        <button v-if="keyword" class="account-search__clear" aria-label="清空搜索" @tap="keyword = ''">
          <view class="i-carbon-close" />
        </button>
      </view>

      <view class="account-filters">
        <picker
          class="account-filters__picker"
          :range="scopeOptions"
          range-key="label"
          :value="scopeIndex"
          @change="scopeIndex = Number($event.detail.value)"
        >
          <view class="account-filters__item">
            <text class="account-filters__label">{{ scopeOptions[scopeIndex].label }}</text>
            <view class="account-filters__arrow" />
          </view>
        </picker>
        <picker
          class="account-filters__picker"
          :range="roleOptions"
          range-key="label"
          :value="roleIndex"
          @change="roleIndex = Number($event.detail.value)"
        >
          <view class="account-filters__item">
            <text class="account-filters__label">{{ roleOptions[roleIndex].label }}</text>
            <view class="account-filters__arrow" />
          </view>
        </picker>
        <picker
          class="account-filters__picker"
          :range="statusOptions"
          range-key="label"
          :value="statusIndex"
          @change="statusIndex = Number($event.detail.value)"
        >
          <view class="account-filters__item">
            <text class="account-filters__label">{{ statusOptions[statusIndex].label }}</text>
            <view class="account-filters__arrow" />
          </view>
        </picker>
      </view>

      <view class="account-list">
        <view v-for="account in filteredAccounts" :key="account.id" class="account-card">
          <text class="account-card__status" :class="{ 'account-card__status--disabled': account.status === 'disabled' }">
            {{ account.status === 'enabled' ? '已启用' : '已禁用' }}
          </text>

          <view class="account-card__heading">
            <text class="account-card__username">{{ account.username }}</text>
            <text class="account-card__mobile">{{ maskSubAccountMobile(account.mobile) }}</text>
          </view>

          <view class="account-card__details">
            <view class="account-card__row">
              <text class="account-card__label">商家名称:</text>
              <text class="account-card__value">{{ account.merchantName }}</text>
            </view>
            <button class="account-card__row account-card__roles" @tap="showRoles(account)">
              <text class="account-card__label">账号角色:</text>
              <text class="account-card__role-name">{{ getSubAccountRoleNames(account.roleIds)[0] || '暂无角色' }}</text>
              <text v-if="account.roleIds.length > 1" class="account-card__role-count">等{{ account.roleIds.length }}个角色</text>
              <view class="account-card__arrow" />
            </button>
            <view class="account-card__row">
              <text class="account-card__label">管理门店:</text>
              <text class="account-card__value">{{ account.storeNames.join('、') || '暂无门店' }}</text>
            </view>
          </view>

          <view class="account-card__actions">
            <button class="account-card__button" hover-class="account-button--hover" @tap="toggleAccountStatus(account)">
              {{ account.status === 'enabled' ? '禁用' : '启用' }}
            </button>
            <button class="account-card__button" hover-class="account-button--hover" @tap="openEditor(account)">
              编辑
            </button>
          </view>
        </view>

        <view v-if="!filteredAccounts.length" class="account-empty">
          <view class="i-carbon-user-multiple account-empty__icon" />
          <text class="account-empty__title">暂无符合条件的子账号</text>
          <text class="account-empty__description">请检查完整账号名、手机号或筛选条件</text>
          <button class="account-empty__reset" @tap="showAllAccounts">
            查看全部账号
          </button>
        </view>
      </view>
    </view>

    <view class="sub-account-footer">
      <button class="sub-account-footer__button" hover-class="account-button--hover" @tap="openEditor()">
        新建子账号
      </button>
    </view>

    <sub-account-editor
      v-model:visible="editorVisible"
      :account="editingAccount"
      merchant-name="太平"
      @save="saveAccount"
    />
  </view>
</template>

<style lang="scss" scoped>
.sub-account-page {
  min-height: 100vh;
  background: #f5f5f5;
  color: #262626;
}

.sub-account-nav {
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  min-height: 88rpx;
  padding: var(--status-bar-height, 0px) 12rpx 0;
  background: #fff;
}

.sub-account-nav__title {
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
}

.sub-account-nav__spacer {
  width: 64rpx;
}

.sub-account-content {
  padding: 24rpx 24rpx calc(env(safe-area-inset-bottom) + 160rpx);
}

.account-search {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 64rpx;
  padding: 0 24rpx;
  border-radius: 12rpx;
  background: #fff;
}

.account-search__icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
  color: #999;
}

.account-search__input {
  min-width: 0;
  height: 64rpx;
  flex: 1;
  font-size: 28rpx;
}

.account-search__placeholder {
  color: #a2a2a2;
}

.account-search__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  margin: 0;
  padding: 0;
  background: transparent;
  color: #999;
  font-size: 28rpx;
}

.account-filters {
  display: flex;
  align-items: center;
  height: 72rpx;
}

.account-filters__picker {
  min-width: 0;
  flex: 1;
}

.account-filters__item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  height: 72rpx;
  padding: 0 12rpx;
}

.account-filters__label {
  overflow: hidden;
  font-size: 28rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-filters__arrow {
  width: 7rpx;
  height: 7rpx;
  flex-shrink: 0;
  margin-top: -5rpx;
  border-right: 3rpx solid #888;
  border-bottom: 3rpx solid #888;
  transform: rotate(45deg);
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.account-card {
  position: relative;
  padding: 28rpx 24rpx 24rpx;
  overflow: hidden;
  border-radius: 20rpx;
  background: #fff;
}

.account-card__status {
  position: absolute;
  top: 0;
  right: 0;
  padding: 6rpx 18rpx;
  border-bottom-left-radius: 16rpx;
  background: #ecffed;
  color: #22aa45;
  font-size: 22rpx;
  line-height: 28rpx;
}

.account-card__status--disabled {
  background: #f0f0f0;
  color: #999;
}

.account-card__heading {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  min-height: 48rpx;
  padding-right: 64rpx;
}

.account-card__username {
  min-width: 0;
  overflow: hidden;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 48rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-card__mobile {
  flex-shrink: 0;
  color: #686868;
  font-size: 28rpx;
}

.account-card__details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 16rpx;
}

.account-card__row {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  min-height: 40rpx;
  font-size: 26rpx;
  line-height: 40rpx;
}

.account-card__label {
  flex-shrink: 0;
  color: #777;
}

.account-card__value {
  min-width: 0;
  overflow-wrap: anywhere;
}

.account-card__roles {
  align-items: center;
  width: 100%;
  margin: 0;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}

.account-card__role-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-card__role-count {
  flex-shrink: 0;
  margin-left: -8rpx;
}

.account-card__arrow {
  width: 12rpx;
  height: 12rpx;
  flex-shrink: 0;
  border-top: 2rpx solid #333;
  border-right: 2rpx solid #333;
  transform: rotate(45deg);
}

.account-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 24rpx;
  margin-top: 24rpx;
}

.account-card__button {
  width: 120rpx;
  height: 48rpx;
  margin: 0;
  padding: 0;
  border: 1rpx solid #ddd;
  border-radius: 12rpx;
  background: #fff;
  color: #262626;
  font-size: 26rpx;
  line-height: 46rpx;
}

.account-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 112rpx 16rpx;
  text-align: center;
}

.account-empty__icon {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 24rpx;
  color: #c5c5c5;
}

.account-empty__title {
  font-size: 28rpx;
}

.account-empty__description {
  margin-top: 14rpx;
  color: #999;
  font-size: 24rpx;
}

.account-empty__reset {
  margin-top: 24rpx;
  padding: 0 28rpx;
  border: 1rpx solid #ddd;
  border-radius: 12rpx;
  background: #fff;
  font-size: 24rpx;
  line-height: 60rpx;
}

.sub-account-footer {
  position: fixed;
  z-index: 10;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 24rpx 24rpx calc(env(safe-area-inset-bottom) + 20rpx);
  background: #fff;
}

.sub-account-footer__button {
  height: 88rpx;
  margin: 0;
  padding: 0;
  border-radius: 12rpx;
  background: #ffd600;
  color: #262626;
  font-size: 32rpx;
  line-height: 88rpx;
}

.account-button--hover {
  opacity: 0.75;
}

.account-search__clear::after,
.account-card__roles::after,
.account-card__button::after,
.account-empty__reset::after,
.sub-account-footer__button::after {
  border: 0;
}
</style>
