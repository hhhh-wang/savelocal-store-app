<script lang="ts" setup>
interface Props {
  title: string
  fallbackUrl?: string
}

withDefaults(defineProps<Props>(), {
  fallbackUrl: '/pages/dashboard/merchant-reconciliation/index',
})
</script>

<template>
  <view class="withdrawal-header">
    <back-button
      :fallback-url="fallbackUrl"
      fallback-mode="navigateTo"
      color="#303030"
      background="transparent"
      size="64rpx"
    />
    <text class="withdrawal-header__title">
      {{ title }}
    </text>
    <view class="withdrawal-header__spacer" />
  </view>
</template>

<style lang="scss" scoped>
.withdrawal-header {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 64rpx minmax(0, 1fr) 64rpx;
  align-items: center;
  min-height: 88rpx;
  padding: calc(env(safe-area-inset-top) + 10rpx) 24rpx 10rpx;
  border-bottom: 1rpx solid #e8e8e8;
  box-sizing: content-box;
  background: #fff;
}

.withdrawal-header__title {
  overflow: hidden;
  color: #2d2d2d;
  font-size: 36rpx;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.withdrawal-header__spacer {
  width: 64rpx;
  height: 64rpx;
}
</style>
