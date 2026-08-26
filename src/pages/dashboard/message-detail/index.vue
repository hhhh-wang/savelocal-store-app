<script lang="ts" setup>
import type { MerchantMessage } from '@/api/types/merchant-message'
import { getMerchantMessage, markMerchantMessageRead } from '@/api/merchant-message'
import { resolveMessageAction } from '../message-shared'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '消息详情',
  },
})

const message = ref<MerchantMessage>()
const loading = ref(true)
const loadError = ref(false)
const messageId = ref('')
const actionRoute = computed(() => resolveMessageAction(message.value?.actionCode))

async function loadMessage() {
  if (!messageId.value)
    return
  loading.value = true
  loadError.value = false
  try {
    message.value = await getMerchantMessage(messageId.value)
    if (message.value.unread) {
      try {
        await markMerchantMessageRead(messageId.value)
        message.value.unread = false
      }
      catch {
        // 正文已经加载成功，已读状态失败时保留未读并允许用户继续查看。
      }
    }
  }
  catch {
    loadError.value = true
  }
  finally {
    loading.value = false
  }
}

function executeAction() {
  if (!actionRoute.value)
    return
  if (actionRoute.value === '/pages/me/me')
    uni.switchTab({ url: actionRoute.value })
  else
    uni.navigateTo({ url: actionRoute.value })
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 16) : ''
}

onLoad((options) => {
  messageId.value = options?.messageId ? decodeURIComponent(options.messageId) : ''
  loadMessage()
})
</script>

<template>
  <view class="message-detail-page">
    <view class="message-detail-nav">
      <back-button fallback-url="/pages/dashboard/index" fallback-mode="switchTab" color="#000000" />
      <text class="message-detail-nav__title">消息详情</text>
      <view class="message-detail-nav__spacer" />
    </view>

    <view v-if="loading" class="message-detail-state">正在加载</view>
    <view v-else-if="loadError" class="message-detail-state">
      <text>消息暂时无法加载</text>
      <view class="message-detail-state__retry" @tap="loadMessage">重新加载</view>
    </view>
    <view v-else-if="message" class="message-detail-content">
      <text class="message-detail-content__title">{{ message.title }}</text>
      <text v-if="message.publishedAt" class="message-detail-content__time">{{ formatTime(message.publishedAt) }}</text>
      <text class="message-detail-content__body">{{ message.content || message.summary || '暂无详细内容' }}</text>
      <view v-if="actionRoute" class="message-detail-content__action" hover-class="message-detail-content__action--hover" @tap="executeAction">
        前往处理
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.message-detail-page {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 20rpx) 28rpx calc(env(safe-area-inset-bottom) + 40rpx);
  box-sizing: border-box;
  background: #f5f6f8;
}

.message-detail-nav {
  display: grid;
  grid-template-columns: 88rpx 1fr 88rpx;
  align-items: center;
  min-height: 76rpx;
}

.message-detail-nav__title {
  color: #23262c;
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
}

.message-detail-nav__spacer {
  width: 88rpx;
}

.message-detail-state,
.message-detail-content {
  margin-top: 28rpx;
  background: #fff;
  border-radius: 16rpx;
}

.message-detail-state {
  display: flex;
  min-height: 360rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  color: #8b9099;
  font-size: 28rpx;
}

.message-detail-state__retry {
  padding: 14rpx 28rpx;
  border: 2rpx solid #d6d9df;
  border-radius: 14rpx;
  color: #4b5059;
}

.message-detail-content {
  display: flex;
  flex-direction: column;
  padding: 38rpx 32rpx;
}

.message-detail-content__title {
  color: #20242a;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.45;
}

.message-detail-content__time {
  margin-top: 14rpx;
  color: #a0a4ac;
  font-size: 24rpx;
}

.message-detail-content__body {
  margin-top: 34rpx;
  color: #4e535c;
  font-size: 30rpx;
  line-height: 1.8;
  white-space: pre-wrap;
}

.message-detail-content__action {
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

.message-detail-content__action--hover {
  opacity: 0.82;
}
</style>
