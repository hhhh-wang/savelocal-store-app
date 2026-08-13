<script lang="ts" setup>
import { createMerchantStoreDraft } from '@/api/merchant-store'
import { buildStoreCreateLockRoute } from '@/pages/me/store-create-lock/store-create-lock'
import arrowDownIcon from '@/static/icons/arrow-down.png'
import aboutUsIcon from '@/static/icons/me/about-us.png'
import customerServiceIcon from '@/static/icons/me/customer-service.png'
import myContractsIcon from '@/static/icons/me/my-contracts.png'
import notificationSettingsIcon from '@/static/icons/me/notification-settings.png'
import settlementAccountIcon from '@/static/icons/me/rules-center.png'
import storeInfoIcon from '@/static/icons/me/store-info.png'
import violationRecordsIcon from '@/static/icons/me/violation-records.png'
import settingIcon from '@/static/icons/setting.png'
import { useMerchantFoodStore } from '@/store'
import {
  canCreateStore as canCreateMerchantStore,
  resolveStoreAccessAction,
  resolveStoreIdForCreate,
} from '@/store/merchant-food-selection'
import { useTokenStore } from '@/store/token'

defineOptions({
  name: 'Me',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '我的',
  },
})

const merchantFoodStore = useMerchantFoodStore()
const tokenStore = useTokenStore()
const isLoggingOut = ref(false)
const storeAccessVisible = ref(false)
const selectedStoreId = ref<number>()
const creatingStore = ref(false)
const storeName = computed(() => merchantFoodStore.currentStore?.storeName || '餐饮门店')

const storeStatus = computed(() => merchantFoodStore.currentStore?.storeStatus === '1'
  ? { label: '暂停营业', color: '#a0a4ab' }
  : { label: '营业中', color: '#6bc93f' })

onShow(() => {
  merchantFoodStore.loadProfile(true).catch(() => {})
})

const walletItems = [
  { label: '今日到账', value: '25.9', subtext: '去查看' },
  { label: '待到账', value: '25.9', subtext: '查余额' },
  { label: '最近入账', value: '25.9', subtext: '05-14' },
  { label: '余额(元)', value: '25.9', subtext: '可提现' },
]

interface MenuItem {
  title: string
  icon?: string
  path?: string
  action?: 'logout'
}

const menuItems: MenuItem[] = [
  { title: '门店信息', icon: storeInfoIcon, path: '/pages/me/store-info/index' },
  { title: '通知设置', icon: notificationSettingsIcon },
  { title: '我的合同', icon: myContractsIcon, path: '/pages/me/my-contracts/index' },
  { title: '联系客服', icon: customerServiceIcon },
  { title: '违规记录', icon: violationRecordsIcon },
  { title: '结算账户', icon: settlementAccountIcon, path: '/pages/me/settlement-account/index' },
  { title: '关于我们', icon: aboutUsIcon },
  { title: '退出登录', action: 'logout' },
]

function openSettings() {
  uni.showToast({
    title: '设置入口待接入',
    icon: 'none',
  })
}

async function handleLogout() {
  if (isLoggingOut.value)
    return

  isLoggingOut.value = true
  try {
    await tokenStore.logout()
    uni.reLaunch({ url: '/pages/login/index' })
  }
  finally {
    isLoggingOut.value = false
  }
}

async function openStoreAccessScope() {
  try {
    const stores = await merchantFoodStore.loadStores()
    selectedStoreId.value = merchantFoodStore.currentStoreId ?? stores[0]?.storeId
    storeAccessVisible.value = true
  }
  catch (error) {
    console.error('加载可访问门店失败:', error)
    uni.showToast({
      title: '加载门店失败，请重试',
      icon: 'none',
    })
  }
}

async function handleStoreAccessConfirm(storeId: number) {
  const store = merchantFoodStore.stores.find(item => item.storeId === storeId)
  if (!store) {
    uni.showToast({
      title: '门店不存在或已失效',
      icon: 'none',
    })
    return
  }

  merchantFoodStore.selectStore(storeId)
  if (resolveStoreAccessAction(store) === 'lock') {
    uni.navigateTo({
      url: buildStoreCreateLockRoute(storeId),
    })
    return
  }

  try {
    await merchantFoodStore.loadProfile(true)
  }
  catch (error) {
    console.error('切换门店失败:', error)
    uni.showToast({
      title: '切换门店失败，请重试',
      icon: 'none',
    })
  }
}

async function handleCreateStore() {
  if (creatingStore.value)
    return

  creatingStore.value = true
  try {
    const stores = await merchantFoodStore.loadStores()
    let storeId = resolveStoreIdForCreate(stores)

    if (!canCreateMerchantStore(stores) && !storeId) {
      throw new Error('当前存在未完成审核的门店，请先完成资料审核')
    }

    if (!storeId) {
      const createdStore = await createMerchantStoreDraft()
      storeId = createdStore.storeId
    }

    if (!storeId) {
      throw new Error('创建门店失败，请重试')
    }

    merchantFoodStore.selectStore(storeId)
    uni.navigateTo({
      url: buildStoreCreateLockRoute(storeId),
    })
  }
  catch (error) {
    console.error('开新店准备失败:', error)
    uni.showToast({
      title: error instanceof Error && error.message ? error.message : '开新店准备失败，请重试',
      icon: 'none',
    })
  }
  finally {
    creatingStore.value = false
  }
}

function handleMenuItemTap(item: (typeof menuItems)[number]) {
  if (item.action === 'logout') {
    void handleLogout()
    return
  }

  if (item.path) {
    uni.navigateTo({
      url: item.path,
    })
    return
  }

  uni.showToast({
    title: `${item.title}入口待接入`,
    icon: 'none',
  })
}
</script>

<template>
  <view class="me-page">
    <view class="me-page__glow me-page__glow--left" />
    <view class="me-page__glow me-page__glow--right" />

    <view class="me-page__content">
      <view class="me-header">
        <view class="me-header__main">
          <view class="me-header__store-switcher" hover-class="me-header__store-switcher--hover" @tap="openStoreAccessScope">
            <text class="me-header__title">
              {{ storeName }}
            </text>
            <image class="me-header__store-arrow" :src="arrowDownIcon" mode="aspectFit" />
          </view>

          <view class="me-header__status">
            <text class="me-header__status-label">
              店铺状态:
            </text>
            <view class="me-header__status-pill">
              <text class="me-header__status-dot" :style="{ backgroundColor: storeStatus.color }" />
              <text class="me-header__status-text">
                {{ storeStatus.label }}
              </text>
            </view>
          </view>
        </view>

        <view class="me-header__actions">
          <view class="me-header__icon-button" hover-class="me-header__icon-button--hover" @tap="openSettings">
            <image class="me-header__icon" :src="settingIcon" mode="aspectFit" />
          </view>
        </view>
      </view>

      <view class="wallet-card">
        <view class="wallet-card__header">
          <text class="wallet-card__title">
            我的钱包
          </text>
          <text class="wallet-card__action">
            查看钱包余额 >
          </text>
        </view>

        <view class="wallet-card__grid">
          <view v-for="item in walletItems" :key="item.label" class="wallet-card__item">
            <text class="wallet-card__label">
              {{ item.label }}
            </text>
            <text class="wallet-card__value">
              {{ item.value }}
            </text>
            <text class="wallet-card__subtext">
              {{ item.subtext }}
            </text>
          </view>
        </view>
      </view>

      <view class="menu-card">
        <view class="menu-grid">
          <view
            v-for="item in menuItems"
            :key="item.title"
            class="menu-grid__item"
            hover-class="menu-grid__item--hover"
            @tap="handleMenuItemTap(item)"
          >
            <image v-if="item.icon" class="menu-grid__icon-image" :src="item.icon" mode="aspectFit" />
            <text class="menu-grid__title">
              {{ item.title }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <store-access-scope
      v-model:visible="storeAccessVisible"
      v-model="selectedStoreId"
      :stores="merchantFoodStore.stores"
      :can-create-store="canCreateMerchantStore(merchantFoodStore.stores)"
      @confirm="handleStoreAccessConfirm"
      @create-store="handleCreateStore"
    />
  </view>
</template>

<style lang="scss" scoped>
.me-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #fff9df 0%, #f7f7fb 15%, #f3f4f8 38%, #f1f2f6 100%);
}

.me-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.me-page__glow--left {
  top: -120rpx;
  left: -140rpx;
  width: 440rpx;
  height: 320rpx;
  background: radial-gradient(circle, rgba(255, 227, 112, 0.78) 0%, rgba(255, 227, 112, 0) 70%);
}

.me-page__glow--right {
  top: -50rpx;
  right: -120rpx;
  width: 360rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(229, 216, 255, 0.8) 0%, rgba(229, 216, 255, 0) 68%);
}

.me-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 24rpx) 18rpx calc(env(safe-area-inset-bottom) + 160rpx);
}

.me-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 14rpx 10rpx 0;
}

.me-header__main {
  flex: 1;
  min-width: 0;
}

.me-header__store-switcher {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 10rpx;
}

.me-header__store-switcher--hover {
  opacity: 0.72;
}

.me-header__title {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: #202226;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.me-header__store-arrow {
  width: 26rpx;
  height: 26rpx;
  flex-shrink: 0;
}

.me-header__status {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 14rpx;
}

.me-header__status-label {
  color: #2b2f35;
  font-size: 28rpx;
  font-weight: 500;
}

.me-header__status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.78);
}

.me-header__status-dot {
  display: block;
  width: 14rpx;
  height: 14rpx;
  border-radius: 9999rpx;
}

.me-header__status-text {
  color: #30343a;
  font-size: 24rpx;
}

.me-header__actions {
  display: flex;
  align-items: center;
}

.me-header__icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14rpx 36rpx rgba(120, 116, 148, 0.12);
}

.me-header__icon-button--hover {
  opacity: 0.88;
}

.me-header__icon {
  width: 46rpx;
  height: 46rpx;
}

.wallet-card,
.menu-card {
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.wallet-card {
  margin-top: 28rpx;
  padding: 24rpx 20rpx 18rpx;
}

.wallet-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.wallet-card__title {
  color: #1f2328;
  font-size: 28px;
  font-weight: 700;
}

.wallet-card__action {
  color: #a2a8b3;
  font-size: 26rpx;
}

.wallet-card__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10rpx;
  margin-top: 22rpx;
}

.wallet-card__item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16rpx;
  padding: 0 4rpx 4rpx;
}

.wallet-card__label {
  color: #25292f;
  font-size: 24rpx;
  line-height: 1.3;
}

.wallet-card__value {
  color: #171a1f;
  font-size: 58rpx;
  font-weight: 700;
  line-height: 1;
}

.wallet-card__subtext {
  color: #acb1bb;
  font-size: 22rpx;
}

.menu-card {
  margin-top: 24rpx;
  padding: 20rpx 12rpx 12rpx;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20rpx 4rpx;
}

.menu-grid__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  padding: 14rpx 0;
}

.menu-grid__item--hover {
  opacity: 0.84;
}

.menu-grid__icon-image {
  width: 72rpx;
  height: 72rpx;
}

.menu-grid__title {
  color: #42464f;
  font-size: 24rpx;
}
</style>
