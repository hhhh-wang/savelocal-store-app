<script lang="ts" setup>
import customerServiceIcon from '@/static/icons/customer-service.png'
import emptyNoDataIcon from '@/static/icons/empty-no-data.png'

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
  },
})

const storeName = ref('喵小厨美食社（盖饭·油炸小吃）')

const stats = [
  { label: '实收金额', value: '¥0', subtext: '昨日 ¥--' },
  { label: '订单笔数', value: '0笔', subtext: '昨日 --' },
  { label: '原价金额', value: '¥0', subtext: '昨日 ¥--' },
]

const menuList = [
  { title: '商品管理', short: '商', background: 'linear-gradient(180deg, #ffa726 0%, #ff9300 100%)' },
  { title: '订单管理', short: '单', background: 'linear-gradient(180deg, #5ea8ff 0%, #3a8cff 100%)' },
  { title: '财务对账', short: '¥', background: 'linear-gradient(180deg, #74dc62 0%, #42bf33 100%)' },
  { title: '售后管理', short: '售', background: 'linear-gradient(180deg, #5ea8ff 0%, #3a8cff 100%)' },
  { title: '全部', short: '全', background: 'linear-gradient(180deg, #d0d6e2 0%, #bcc4d4 100%)' },
] as const

const assistantTabs = [
  { key: 'orders', label: '待处理订单', emptyText: '无订单' },
  { key: 'reviews', label: '新的评价', emptyText: '无评价' },
  { key: 'todos', label: '待办事项', emptyText: '无待办' },
  { key: 'messages', label: '重要消息', emptyText: '无消息' },
] as const

type AssistantTabKey = typeof assistantTabs[number]['key']

const assistantData: Record<AssistantTabKey, unknown[]> = {
  orders: [],
  reviews: [],
  todos: [],
  messages: [],
}

const activeTab = ref<AssistantTabKey>('orders')

const assistantTabList = computed(() => {
  return assistantTabs.map(tab => ({
    ...tab,
    count: assistantData[tab.key].length,
  }))
})

const activeTabConfig = computed(() => {
  return assistantTabList.value.find(tab => tab.key === activeTab.value) || assistantTabList.value[0]
})

function switchTab(tabKey: AssistantTabKey) {
  activeTab.value = tabKey
}

function openCustomerService() {
  uni.showToast({
    title: '客服入口待接入',
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
        <text class="dashboard-header__title">
          {{ storeName }}
        </text>

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
        <view class="menu-grid">
          <view v-for="item in menuList" :key="item.title" class="menu-grid__item">
            <view class="menu-grid__icon" :style="{ background: item.background }">
              {{ item.short }}
            </view>
            <text class="menu-grid__title">
              {{ item.title }}
            </text>
          </view>
        </view>
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

        <view class="assistant-empty">
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

.dashboard-header__title {
  flex: 1;
  overflow: hidden;
  color: #1f2023;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.menu-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8rpx;
}

.menu-grid__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
}

.menu-grid__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  border-radius: 16rpx;
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow: 0 10rpx 20rpx rgba(74, 102, 153, 0.12);
}

.menu-grid__title {
  color: #666a74;
  font-size: 24rpx;
  line-height: 1.3;
}

.section-card--assistant {
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

.assistant-tabs__item--active::after {
  position: absolute;
  right: 16rpx;
  bottom: 0;
  left: 16rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: #efc873;
  content: '';
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
</style>
