<script setup lang="ts">
interface Props {
  auditPagePath?: string
}

const props = withDefaults(defineProps<Props>(), {
  auditPagePath: '',
})

function showAuditPageError() {
  uni.showToast({
    title: '审核信息页面暂未配置',
    icon: 'none',
  })
}

function openAuditPage() {
  const auditPagePath = props.auditPagePath.trim()
  if (!auditPagePath) {
    showAuditPageError()
    return
  }

  uni.navigateTo({
    url: auditPagePath,
    fail: showAuditPageError,
  })
}
</script>

<template>
  <view class="store-create-lock-page">
    <view class="store-create-lock-nav">
      <back-button
        fallback-url="/pages/login/index"
        fallback-mode="navigateTo"
        color="#23262c"
        background="transparent"
      />
      <text class="store-create-lock-nav__title">开新店</text>
      <view class="store-create-lock-nav__spacer" />
    </view>

    <view class="store-create-lock-content">
      <text class="store-create-lock-content__title">开新店前请先提交审核资料</text>
      <text class="store-create-lock-content__body">为保障门店信息真实有效，开设新分店前需要先填写并提交门店资料。审核通过后，即可进入新店经营管理。</text>
      <view
        class="store-create-lock-content__action"
        hover-class="store-create-lock-content__action--hover"
        @tap="openAuditPage"
      >
        去提交审核资料
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-create-lock-page {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 20rpx) 28rpx calc(env(safe-area-inset-bottom) + 40rpx);
  box-sizing: border-box;
  background: #f5f6f8;
}

.store-create-lock-nav {
  display: grid;
  grid-template-columns: 88rpx 1fr 88rpx;
  align-items: center;
  min-height: 76rpx;
}

.store-create-lock-nav__title {
  color: #23262c;
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
}

.store-create-lock-nav__spacer {
  width: 88rpx;
}

.store-create-lock-content {
  display: flex;
  flex-direction: column;
  margin-top: 28rpx;
  padding: 38rpx 32rpx;
  border-radius: 16rpx;
  background: #fff;
}

.store-create-lock-content__title {
  color: #20242a;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.45;
}

.store-create-lock-content__body {
  margin-top: 34rpx;
  color: #4e535c;
  font-size: 30rpx;
  line-height: 1.8;
  white-space: pre-wrap;
}

.store-create-lock-content__action {
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

.store-create-lock-content__action--hover {
  opacity: 0.82;
}
</style>
