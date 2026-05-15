<script lang="ts" setup>
import settingIcon from '@/static/icons/setting.png'
import customerServiceIcon from '@/static/icons/customer-service.png'

defineOptions({
  name: 'Me',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '我的',
  },
})

const storeName = ref('喵小厨美食社（现炒盖饭·油炸小吃）')

const storeStatus = {
  label: '营业中',
  color: '#6bc93f',
}

const walletItems = [
  { label: '今日到账', value: '25.9', subtext: '去查看' },
  { label: '待到账', value: '25.9', subtext: '查余额' },
  { label: '最近入账', value: '25.9', subtext: '05-14' },
  { label: '余额(元)', value: '25.9', subtext: '可提现' },
]

const menuItems = [
  { title: '门店信息', iconText: '店' },
  { title: '通知设置', iconText: '通' },
  { title: '我的合同', iconText: '合' },
  { title: '联系客服', iconText: '服', iconImage: customerServiceIcon },
  { title: '违规记录', iconText: '违' },
  { title: '规则中心', iconText: '规' },
  { title: '关于我们', iconText: '关' },
]

function openSettings() {
  uni.showToast({
    title: '设置入口待接入',
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
          <text class="me-header__title">
            {{ storeName }}
          </text>

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
          <view v-for="item in menuItems" :key="item.title" class="menu-grid__item">
            <view class="menu-grid__icon-shell">
              <image v-if="item.iconImage" class="menu-grid__icon-image" :src="item.iconImage" mode="aspectFit" />
              <text v-else class="menu-grid__icon-text">
                {{ item.iconText }}
              </text>
            </view>
            <text class="menu-grid__title">
              {{ item.title }}
            </text>
          </view>
        </view>
      </view>
    </view>
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

.me-header__title {
  display: block;
  overflow: hidden;
  color: #202226;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.menu-grid__icon-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 84rpx;
  border: 2rpx solid #23262c;
  border-radius: 26rpx;
  background: #fff;
}

.menu-grid__icon-text {
  color: #23262c;
  font-size: 30rpx;
  font-weight: 700;
}

.menu-grid__icon-image {
  width: 40rpx;
  height: 40rpx;
}

.menu-grid__title {
  color: #42464f;
  font-size: 24rpx;
}
</style>
