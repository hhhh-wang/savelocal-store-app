<script setup lang="ts">
interface Props {
  fallbackUrl?: string
  fallbackMode?: 'switchTab' | 'navigateTo' | 'reLaunch'
  color?: string
  background?: string
  size?: string
}

const props = withDefaults(defineProps<Props>(), {
  fallbackUrl: '/pages/me/me',
  fallbackMode: 'switchTab',
  color: '#feefd0',
  background: 'rgba(254, 239, 208, 0.08)',
  size: '64rpx',
})

function handleBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  if (props.fallbackMode === 'reLaunch') {
    uni.reLaunch({ url: props.fallbackUrl })
    return
  }

  if (props.fallbackMode === 'navigateTo') {
    uni.navigateTo({ url: props.fallbackUrl })
    return
  }

  uni.switchTab({ url: props.fallbackUrl })
}
</script>

<template>
  <view
    class="back-button"
    :style="{
      width: props.size,
      height: props.size,
      background: props.background,
    }"
    @tap="handleBack"
  >
    <view class="back-button__icon" :style="{ borderColor: props.color }" />
  </view>
</template>

<style scoped>
.back-button {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.back-button__icon {
  width: 20rpx;
  height: 20rpx;
  margin-left: 8rpx;
  border-bottom: 4rpx solid #feefd0;
  border-left: 4rpx solid #feefd0;
  box-sizing: border-box;
  transform: rotate(45deg);
}
</style>
