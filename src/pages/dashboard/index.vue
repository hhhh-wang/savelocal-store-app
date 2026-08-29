<script lang="ts" setup>
import type { AssistantTabKey } from './message-shared'
import type { MerchantMessage, MerchantMessageSummary } from '@/api/types/merchant-message'
import { getMerchantMessages, getMerchantMessageSummary } from '@/api/merchant-message'
import customerServiceIcon from '@/static/icons/customer-service.png'
import activityIcon from '@/static/icons/dashboard/activity-icon.png'
import afterSalesIcon from '@/static/icons/dashboard/after-sales.png'
import groupBuyRedemptionIcon from '@/static/icons/dashboard/group-buy-redemption.png'
import merchantReconciliationIcon from '@/static/icons/dashboard/merchant-reconciliation.png'
import orderManagementIcon from '@/static/icons/dashboard/order-management.png'
import productManagementIcon from '@/static/icons/dashboard/product-management.png'
import templateDetailIcon from '@/static/icons/dashboard/template-detail.png'
import emptyNoDataIcon from '@/static/icons/empty-no-data.png'
import { useMerchantFoodStore } from '@/store'
import { GROUP_BUY_REDEMPTION_PATH } from './group-buy-redemption/redemption'
import { categoryForTab } from './message-shared'

defineOptions({
  name: 'Home',
})

definePage({
  // 使用 type: "home" 属性设置首页，其他页面不需要设置，默认为page
  type: 'home',
  style: {
    // 'custom' 表示开启自定义导航栏，默认 'default'
    navigationStyle: 'custom',
    navigationBarTitleText: '工作台',
    enablePullDownRefresh: true,
  },
})

const merchantFoodStore = useMerchantFoodStore()

onShow(() => {
  merchantFoodStore.loadProfile(true).catch(() => {})
  loadMessageSummary()
})

onPullDownRefresh(async () => {
  await Promise.allSettled([merchantFoodStore.loadProfile(true), loadMessageSummary()])
  uni.stopPullDownRefresh()
})

const stats = [
  { label: '实收金额', value: '¥0', subtext: '昨日 ¥--' },
  { label: '订单笔数', value: '0笔', subtext: '昨日 --' },
  { label: '原价金额', value: '¥0', subtext: '昨日 ¥--' },
]

interface DashboardMenuItem {
  title: string
  icon: string
  path?: string
}

const menuList: DashboardMenuItem[] = [
  {
    title: '商品管理',
    icon: productManagementIcon,
    path: '/pages/dashboard/product-management/index',
  },
  {
    title: '订单管理',
    icon: orderManagementIcon,
    path: '/pages/dashboard/order-management/index',
  },
  {
    title: '商家对账',
    icon: merchantReconciliationIcon,
    path: '/pages/dashboard/merchant-reconciliation/index',
  },
  {
    title: '售后管理',
    icon: afterSalesIcon,
    path: '/pages/dashboard/after-sales/index',
  },
  {
    title: '营销活动',
    icon: activityIcon,
    path: '/pages/dashboard/marketing-activity/index',
  },
  {
    title: '详情模板',
    icon: templateDetailIcon,
  },
]

const MENU_PAGE_SIZE = 5

const menuGroups = computed(() => {
  const groups: DashboardMenuItem[][] = []
  for (let i = 0; i < menuList.length; i += MENU_PAGE_SIZE) {
    groups.push(menuList.slice(i, i + MENU_PAGE_SIZE))
  }
  return groups
})

const assistantTabs = [
  { key: 'orders', label: '待处理订单', emptyText: '无订单' },
  { key: 'reviews', label: '新的评价', emptyText: '无评价' },
  { key: 'todos', label: '待办事项', emptyText: '无待办' },
  { key: 'messages', label: '重要消息', emptyText: '无消息' },
] as const

const assistantData = reactive<Record<AssistantTabKey, MerchantMessage[]>>({
  orders: [],
  reviews: [],
  todos: [],
  messages: [],
})

const assistantCounts = reactive<Record<AssistantTabKey, number>>({ orders: 0, reviews: 0, todos: 0, messages: 0 })
const assistantLoading = ref(false)
const assistantError = ref(false)

const activeTab = ref<AssistantTabKey>('orders')

const assistantTabList = computed(() => {
  return assistantTabs.map(tab => ({
    ...tab,
    count: assistantCounts[tab.key],
  }))
})

const activeTabConfig = computed(() => {
  return assistantTabList.value.find(tab => tab.key === activeTab.value) || assistantTabList.value[0]
})

const activeMessages = computed(() => assistantData[activeTab.value])

async function loadMessageSummary() {
  assistantLoading.value = true
  assistantError.value = false
  try {
    const summary: MerchantMessageSummary = await getMerchantMessageSummary()
    for (const tab of assistantTabs) {
      assistantCounts[tab.key] = summary[tab.key]?.count || 0
      assistantData[tab.key] = summary[tab.key]?.items || []
    }
  }
  catch {
    assistantError.value = true
  }
  finally {
    assistantLoading.value = false
  }
}

async function switchTab(tabKey: AssistantTabKey) {
  activeTab.value = tabKey
  if (assistantData[tabKey].length || assistantCounts[tabKey] === 0)
    return
  try {
    const result = await getMerchantMessages(categoryForTab(tabKey))
    assistantData[tabKey] = result.rows
  }
  catch {
    assistantError.value = true
  }
}

function openMessage(message: MerchantMessage) {
  uni.navigateTo({ url: `/pages/dashboard/message-detail/index?messageId=${encodeURIComponent(message.messageId)}` })
}

function openCustomerService() {
  uni.showToast({
    title: '客服入口待接入',
    icon: 'none',
  })
}

function openGroupBuyRedemption() {
  uni.navigateTo({
    url: GROUP_BUY_REDEMPTION_PATH,
  })
}

function handleMenuTap(item: DashboardMenuItem) {
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
  <view class="dashboard-page">
    <view class="dashboard-page__glow dashboard-page__glow--left" />
    <view class="dashboard-page__glow dashboard-page__glow--right" />

    <view class="dashboard-page__content">
      <view class="dashboard-header">
        <view
          class="dashboard-header__icon-button"
          hover-class="dashboard-header__icon-button--hover"
          aria-label="团购核销"
          @tap="openGroupBuyRedemption"
        >
          <image class="dashboard-header__redemption-icon" :src="groupBuyRedemptionIcon" mode="aspectFit" />
        </view>

        <view class="dashboard-header__actions">
          <view class="dashboard-header__icon-button" hover-class="dashboard-header__icon-button--hover" @tap="openCustomerService">
            <image class="dashboard-header__icon" :src="customerServiceIcon" mode="aspectFit" />
          </view>
        </view>
      </view>

      <view class="stats-card">
        <view v-for="item in stats" :key="item.label" class="stats-card__item">
          <text class="stats-card__label">
            {{ item.label }}
          </text>
          <text class="stats-card__value">
            {{ item.value }}
          </text>
          <text class="stats-card__subtext">
            {{ item.subtext }}
          </text>
        </view>

        <view class="stats-card__expand">
          <view class="stats-card__expand-line stats-card__expand-line--left" />
          <view class="stats-card__expand-line stats-card__expand-line--right" />
        </view>
      </view>

      <view class="section-card">
        <swiper
          class="menu-swiper"
          :indicator-dots="menuGroups.length > 1"
          indicator-color="rgba(102, 106, 116, 0.25)"
          indicator-active-color="#666a74"
        >
          <swiper-item v-for="(group, groupIndex) in menuGroups" :key="groupIndex">
            <view class="menu-swiper__page">
              <view
                v-for="item in group"
                :key="item.title"
                class="menu-swiper__item"
                hover-class="menu-swiper__item--hover"
                @tap="handleMenuTap(item)"
              >
                <image class="menu-swiper__icon" :src="item.icon" mode="aspectFit" />
                <text class="menu-swiper__title">
                  {{ item.title }}
                </text>
              </view>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <view class="section-card section-card--assistant">
        <text class="section-card__title">
          经营助手
        </text>

        <view class="assistant-tabs">
          <view
            v-for="item in assistantTabList"
            :key="item.key"
            class="assistant-tabs__item"
            :class="{ 'assistant-tabs__item--active': item.key === activeTab }"
            @tap="switchTab(item.key)"
          >
            <view class="assistant-tabs__label-wrap">
              <text class="assistant-tabs__label">
                {{ item.label }}
              </text>
              <text class="assistant-tabs__arrow">
                ›
              </text>
            </view>
            <text class="assistant-tabs__count">
              {{ item.count }}
            </text>
          </view>
        </view>

        <view v-if="assistantLoading" class="assistant-state">
          <text class="assistant-state__text">正在加载</text>
        </view>

        <view v-else-if="assistantError" class="assistant-state">
          <text class="assistant-state__text">消息暂时无法加载</text>
          <view class="assistant-state__retry" hover-class="assistant-state__retry--hover" @tap="loadMessageSummary">
            重新加载
          </view>
        </view>

        <view v-else-if="activeMessages.length" class="assistant-list">
          <view
            v-for="message in activeMessages"
            :key="message.messageId"
            class="assistant-message"
            hover-class="assistant-message--hover"
            @tap="openMessage(message)"
          >
            <view class="assistant-message__indicator" :class="{ 'assistant-message__indicator--read': !message.unread }" />
            <view class="assistant-message__content">
              <text class="assistant-message__title">{{ message.title }}</text>
              <text class="assistant-message__summary">{{ message.summary || message.content || '点击查看详情' }}</text>
            </view>
            <text class="assistant-message__arrow">›</text>
          </view>
        </view>

        <view v-else class="assistant-empty">
          <image class="assistant-empty__image" :src="emptyNoDataIcon" mode="aspectFit" />
          <text class="assistant-empty__text">
            {{ activeTabConfig.emptyText }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.dashboard-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #fff7df 0%, #f8f7fb 14%, #f5f6fa 36%, #f3f4f8 100%);
}

.dashboard-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  filter: blur(16rpx);
  pointer-events: none;
}

.dashboard-page__glow--left {
  top: -100rpx;
  left: -120rpx;
  width: 420rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 226, 130, 0.7) 0%, rgba(255, 226, 130, 0) 70%);
}

.dashboard-page__glow--right {
  top: -40rpx;
  right: -100rpx;
  width: 360rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(224, 211, 255, 0.8) 0%, rgba(224, 211, 255, 0) 68%);
}

.dashboard-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 26rpx) 18rpx calc(env(safe-area-inset-bottom) + 160rpx);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 10rpx 8rpx 0;
}

.dashboard-header__actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.dashboard-header__icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 14rpx 36rpx rgba(121, 115, 144, 0.12);
}

.dashboard-header__icon-button--hover {
  opacity: 0.88;
}

.dashboard-header__icon {
  width: 42rpx;
  height: 42rpx;
}

.dashboard-header__redemption-icon {
  width: 50rpx;
  height: 50rpx;
}

.stats-card,
.section-card {
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16rpx 44rpx rgba(56, 61, 86, 0.08);
}

.stats-card {
  position: relative;
  display: flex;
  margin-top: 26rpx;
  padding: 34rpx 10rpx 42rpx;
}

.stats-card__item {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.stats-card__item:not(:last-child)::after {
  position: absolute;
  top: 18rpx;
  right: 0;
  width: 1rpx;
  height: 120rpx;
  background: rgba(31, 41, 55, 0.06);
  content: '';
}

.stats-card__label {
  color: #2a2e35;
  font-size: 28rpx;
  font-weight: 600;
}

.stats-card__value {
  color: #202327;
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1;
}

.stats-card__subtext {
  color: #8f949f;
  font-size: 26rpx;
}

.stats-card__expand {
  position: absolute;
  bottom: 10rpx;
  left: 50%;
  width: 30rpx;
  height: 18rpx;
  transform: translateX(-50%);
}

.stats-card__expand-line {
  position: absolute;
  bottom: 4rpx;
  width: 16rpx;
  height: 4rpx;
  background: #777c87;
  border-radius: 999rpx;
}

.stats-card__expand-line--left {
  left: 1rpx;
  transform: rotate(42deg);
}

.stats-card__expand-line--right {
  right: 1rpx;
  transform: rotate(-42deg);
}

.section-card {
  margin-top: 24rpx;
  padding: 30rpx 18rpx;
}

.menu-swiper {
  height: 160rpx;
}

.menu-swiper__page {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8rpx;
  align-items: start;
}

.menu-swiper__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
}

.menu-swiper__item--hover {
  opacity: 0.84;
}

.menu-swiper__icon {
  width: 72rpx;
  height: 72rpx;
}

.menu-swiper__title {
  color: #666a74;
  font-size: 24rpx;
  line-height: 1.3;
}

.section-card--assistant {
  min-height: 580rpx;
  padding: 28rpx 18rpx 20rpx;
}

.section-card__title {
  color: #1d2025;
  font-size: 40rpx;
  font-weight: 700;
}

.assistant-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8rpx;
  margin-top: 26rpx;
}

.assistant-tabs__item {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 18rpx;
  padding: 0 6rpx 18rpx;
}

.assistant-tabs__label-wrap {
  display: flex;
  align-items: center;
  gap: 6rpx;
  min-width: 0;
}

.assistant-tabs__label {
  overflow: hidden;
  color: #666b76;
  font-size: 24rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assistant-tabs__arrow {
  flex-shrink: 0;
  color: #868b96;
  font-size: 24rpx;
  line-height: 1;
}

.assistant-tabs__count {
  color: #1f2328;
  font-size: 56rpx;
  font-weight: 700;
  line-height: 1;
}

.assistant-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360rpx;
  margin-top: 22rpx;
  border: 2rpx solid #f5e7bf;
  border-radius: 24rpx;
  background: #fff;
}

.assistant-empty__image {
  width: 176rpx;
  height: 132rpx;
}

.assistant-empty__text {
  margin-top: 16rpx;
  color: #8a909b;
  font-size: 30rpx;
}

.assistant-state {
  display: flex;
  min-height: 260rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22rpx;
}

.assistant-state__text {
  color: #8a909b;
  font-size: 28rpx;
}

.assistant-state__retry {
  padding: 14rpx 28rpx;
  border: 2rpx solid #d7d9df;
  border-radius: 16rpx;
  color: #4d525b;
  font-size: 26rpx;
}

.assistant-state__retry--hover,
.assistant-message--hover {
  opacity: 0.78;
}

.assistant-list {
  margin-top: 18rpx;
  border-top: 2rpx solid #f1f2f5;
}

.assistant-message {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 118rpx;
  padding: 18rpx 8rpx;
  border-bottom: 2rpx solid #f1f2f5;
}

.assistant-message__indicator {
  width: 14rpx;
  height: 14rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: #ff5b4d;
}

.assistant-message__indicator--read {
  background: #c9ccd3;
}

.assistant-message__content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
}

.assistant-message__title,
.assistant-message__summary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assistant-message__title {
  color: #292d34;
  font-size: 29rpx;
  font-weight: 700;
}

.assistant-message__summary {
  color: #8a909b;
  font-size: 25rpx;
}

.assistant-message__arrow {
  flex-shrink: 0;
  color: #9da1aa;
  font-size: 38rpx;
}
</style>
