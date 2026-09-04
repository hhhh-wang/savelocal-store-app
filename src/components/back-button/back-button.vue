<script setup lang="ts">
import { ref } from 'vue'

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

const isNavigating = ref(false)

function navigateToFallback() {
  const complete = () => {
    isNavigating.value = false
  }

  if (props.fallbackMode === 'reLaunch') {
    uni.reLaunch({ url: props.fallbackUrl, complete })
    return
  }

  if (props.fallbackMode === 'navigateTo') {
    // The current page has no usable history entry. Replacing it prevents
    // the fallback page and current page from forming a two-page loop.
    uni.redirectTo({ url: props.fallbackUrl, complete })
    return
  }

  uni.switchTab({ url: props.fallbackUrl, complete })
}

function handleBack() {
  if (isNavigating.value) {
    return
  }

  isNavigating.value = true
  const pages = getCurrentPages()
  if (pages.length > 1) {
    let fallbackStarted = false
    uni.navigateBack({
      fail: () => {
        // getCurrentPages may retain stale entries after an app resumes.
        fallbackStarted = true
        navigateToFallback()
      },
      complete: () => {
        if (!fallbackStarted) {
          isNavigating.value = false
        }
      },
    })
    return
  }

  navigateToFallback()
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
