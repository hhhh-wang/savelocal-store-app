<script lang="ts" setup>
import type { SubAccount, SubAccountStore } from './sub-account'
import { fromSubAccountStatus, maskSubAccountMobile } from './sub-account'
import { changeMerchantSubAccountStatus, getMerchantSubAccounts, getMerchantSubAccountStores } from '@/api/merchant-sub-account'
import { useUserStore } from '@/store'

defineOptions({ name: 'SubAccountManagement' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '子账号管理',
    backgroundColor: '#f5f5f5',
  },
})

const accounts = ref<SubAccount[]>([])
const userStore = useUserStore()
const keyword = ref('')
const scopeIndex = ref(0)
const statusIndex = ref(0)
const loading = ref(false)
const loaded = ref(false)
const availableStores = ref<SubAccountStore[]>([])
const pageNum = ref(0)
const total = ref(0)
const pageSize = 20

const scopeOptions = computed(() => [
  { label: '全部门店', value: undefined as number | undefined },
  ...availableStores.value.map(store => ({ label: store.storeName, value: store.storeId })),
])
const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '已启用', value: 'enabled' },
  { label: '已禁用', value: 'disabled' },
]

const filteredAccounts = computed(() => accounts.value)

const selectedStatus = computed(() => statusOptions[statusIndex.value].value)
const selectedStoreId = computed(() => scopeOptions.value[scopeIndex.value]?.value)
const hasMore = computed(() => accounts.value.length < total.value)

async function loadAccounts(reset = true) {
  if (userStore.userInfo.userId > 0 && userStore.userInfo.canManageSubAccounts !== true) {
    uni.showToast({ title: '仅主账号可管理子账号', icon: 'none' })
    uni.navigateBack()
    return
  }
  if (loading.value || (!reset && !hasMore.value))
    return
  loading.value = true
  try {
    const keywordValue = keyword.value.trim()
    if (!availableStores.value.length) {
      availableStores.value = await getMerchantSubAccountStores()
    }
    const page = await getMerchantSubAccounts({
      pageNum: reset ? 1 : pageNum.value + 1,
      pageSize,
      loginName: keywordValue || undefined,
      mobile: keywordValue || undefined,
      status: selectedStatus.value === 'enabled' ? '0' : selectedStatus.value === 'disabled' ? '1' : undefined,
      storeId: selectedStoreId.value,
    })
    accounts.value = reset ? page.rows : [...accounts.value, ...page.rows]
    pageNum.value = reset ? 1 : pageNum.value + 1
    total.value = page.total
    loaded.value = true
  }
  finally {
    loading.value = false
  }
}

function confirmSearch() {
  uni.hideKeyboard()
  void loadAccounts()
}

function showAllAccounts() {
  keyword.value = ''
  scopeIndex.value = 0
  statusIndex.value = 0
  void loadAccounts()
}

async function toggleAccountStatus(account: SubAccount) {
  const action = account.status === 'enabled' ? '禁用' : '启用'
  uni.showModal({
    title: `确认${action}该子账号？`,
    content: `账号：${account.loginName}`,
    confirmText: action,
    confirmColor: '#333333',
    async success({ confirm }) {
      if (!confirm)
        return
      try {
        const nextStatus = account.status === 'enabled' ? 'disabled' : 'enabled'
        await changeMerchantSubAccountStatus(account.merchantUserId, fromSubAccountStatus(nextStatus))
        account.status = nextStatus
        uni.showToast({ title: `已${action}`, icon: 'success' })
      }
      catch {
        // http 层已显示请求失败信息，列表保留服务端原状态。
      }
    },
  })
}

function openEditor(account?: SubAccount) {
  uni.navigateTo({
    url: `/pages/me/sub-account/edit/index${account ? `?merchantUserId=${account.merchantUserId}` : ''}`,
    events: {
      saved: () => loadAccounts(),
    },
  })
}

onShow(() => { void loadAccounts() })
watch(statusIndex, () => { void loadAccounts() })
watch(scopeIndex, () => { void loadAccounts() })
onReachBottom(() => { void loadAccounts(false) })
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
        <view v-for="account in filteredAccounts" :key="account.merchantUserId" class="account-card">
          <text class="account-card__status" :class="{ 'account-card__status--disabled': account.status === 'disabled' }">
            {{ account.status === 'enabled' ? '已启用' : '已禁用' }}
          </text>

          <view class="account-card__heading">
            <text class="account-card__username">{{ account.loginName }}</text>
            <text class="account-card__mobile">{{ maskSubAccountMobile(account.mobile) }}</text>
          </view>

          <view class="account-card__details">
            <view class="account-card__row">
              <text class="account-card__label">商家名称:</text>
              <text class="account-card__value">{{ account.merchantName }}</text>
            </view>
            <view class="account-card__row">
              <text class="account-card__label">管理门店:</text>
              <text class="account-card__value">{{ account.stores.map(store => store.storeName).join('、') || account.storeNames || '暂无门店' }}</text>
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

        <view v-if="loaded && !loading && !filteredAccounts.length" class="account-empty">
          <view class="i-carbon-user-multiple account-empty__icon" />
          <text class="account-empty__title">暂无符合条件的子账号</text>
          <text class="account-empty__description">请检查完整账号名、手机号或筛选条件</text>
          <button class="account-empty__reset" @tap="showAllAccounts">
            查看全部账号
          </button>
        </view>
        <text v-else-if="loaded && loading" class="account-list__loading">加载中</text>
        <text v-else-if="loaded && !hasMore && filteredAccounts.length" class="account-list__loading">没有更多账号</text>
      </view>
    </view>

    <view class="sub-account-footer">
      <button class="sub-account-footer__button" :disabled="loading" hover-class="account-button--hover" @tap="openEditor()">
        新建子账号
      </button>
    </view>
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

.account-list__loading {
  display: block;
  padding: 28rpx 0;
  color: #999;
  font-size: 24rpx;
  text-align: center;
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
.account-card__button::after,
.account-empty__reset::after,
.sub-account-footer__button::after {
  border: 0;
}
</style>
