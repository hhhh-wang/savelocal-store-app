<script lang="ts" setup>
import storeEntryBackgroundPreview from '@/static/images/store-entry-background.png'

defineOptions({
  name: 'StoreEntryMain',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '店铺入口主图',
  },
})

const fallbackUrl = '/pages/me/store-entry/index'
const storeName = ref('喵小厨美食社（现炒盖饭·油炸小吃）')

const backgroundSlots = [
  { key: 'bg-1', filled: false },
  { key: 'bg-2', filled: false },
  { key: 'bg-3', filled: false },
  { key: 'bg-4', filled: false },
  { key: 'bg-5', filled: true },
] as const

function handleUploadBackground() {
  uni.showToast({
    title: '上传图片待接入',
    icon: 'none',
  })
}

function handleBackgroundSlotTap(slot: typeof backgroundSlots[number]) {
  uni.showToast({
    title: slot.filled ? '背景图片待接入' : '新增背景图待接入',
    icon: 'none',
  })
}
</script>

<template>
  <view class="store-entry-main-page">
    <view class="store-entry-main-page__glow store-entry-main-page__glow--left" />
    <view class="store-entry-main-page__glow store-entry-main-page__glow--right" />

    <view class="store-entry-main-page__content">
      <view class="store-entry-main-nav">
        <back-button
          :fallback-url="fallbackUrl"
          fallback-mode="navigateTo"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />

        <text class="store-entry-main-nav__title">
          店铺入口主图
        </text>

        <view class="store-entry-main-nav__spacer" />
      </view>

      <view class="store-entry-main-store">
        <text class="store-entry-main-store__name">
          {{ storeName }}
        </text>
      </view>

      <view class="store-entry-main-section">
        <view class="store-entry-main-section__header">
          <view class="store-entry-main-section__marker" />
          <text class="store-entry-main-section__title">
            店铺背景图片
          </text>
        </view>

        <view class="store-entry-main-section__body">
          <view class="store-entry-main-section__tips">
            <text class="store-entry-main-section__tip">
              建议尺寸900*900像素，不超过5M，格式支持png、jpg、jpeg。
            </text>
            <text class="store-entry-main-section__tip">
              不支持上传GIF格式。
            </text>
          </view>

          <view class="store-entry-main-example">
            <image class="store-entry-main-example__image" :src="storeEntryBackgroundPreview" mode="widthFix" />
          </view>

          <view class="store-entry-main-background">
            <view class="store-entry-main-background__grid">
              <view
                v-for="slot in backgroundSlots"
                :key="slot.key"
                class="store-entry-main-background__slot"
                :class="{ 'store-entry-main-background__slot--add': slot.filled }"
                hover-class="store-entry-main-background__slot--hover"
                @tap="handleBackgroundSlotTap(slot)"
              >
                <view v-if="slot.filled" class="store-entry-main-background__plus">
                  <view class="store-entry-main-background__plus-line store-entry-main-background__plus-line--horizontal" />
                  <view class="store-entry-main-background__plus-line store-entry-main-background__plus-line--vertical" />
                </view>
              </view>
            </view>

            <view class="store-entry-main-background__upload" hover-class="store-entry-main-background__upload--hover" @tap="handleUploadBackground">
              上传图片
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-entry-main-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f8f8fa 20%, #f4f5f8 100%);
}

.store-entry-main-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.store-entry-main-page__glow--left {
  top: -110rpx;
  left: -120rpx;
  width: 420rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 229, 122, 0.28) 0%, rgba(255, 229, 122, 0) 72%);
}

.store-entry-main-page__glow--right {
  top: -40rpx;
  right: -120rpx;
  width: 340rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(233, 225, 255, 0.42) 0%, rgba(233, 225, 255, 0) 68%);
}

.store-entry-main-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 20rpx calc(env(safe-area-inset-bottom) + 36rpx);
}

.store-entry-main-nav {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  min-height: 72rpx;
}

.store-entry-main-nav__title {
  color: #1d2025;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.store-entry-main-nav__spacer {
  width: 72rpx;
  height: 72rpx;
}

.store-entry-main-store {
  margin-top: 30rpx;
}

.store-entry-main-store__name {
  color: #23252a;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-all;
}

.store-entry-main-section {
  margin-top: 28rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18rpx 46rpx rgba(56, 61, 86, 0.08);
}

.store-entry-main-section__header {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 34rpx 28rpx 0;
}

.store-entry-main-section__marker {
  width: 10rpx;
  height: 44rpx;
  border-radius: 9999rpx;
  background: linear-gradient(180deg, #ffd926 0%, #ffbe00 100%);
}

.store-entry-main-section__title {
  color: #23262c;
  font-size: 32rpx;
  font-weight: 700;
}

.store-entry-main-section__body {
  padding: 22rpx 28rpx 30rpx;
}

.store-entry-main-section__tips {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.store-entry-main-section__tip {
  color: #a1a6af;
  font-size: 25rpx;
  line-height: 1.46;
}

.store-entry-main-example {
  margin-top: 24rpx;
}


.store-entry-main-example__image {
  display: block;
  width: 100%;
  margin-top: 16rpx;
  border-radius: 26rpx;
  box-shadow: 0 18rpx 36rpx rgba(44, 48, 58, 0.1);
}

.store-entry-main-background {
  margin-top: 26rpx;
}

.store-entry-main-background__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18rpx;
}

.store-entry-main-background__slot {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 2rpx solid #d8dce3;
  border-radius: 24rpx;
  background: linear-gradient(180deg, #ffffff 0%, #fbfbfc 100%);
}

.store-entry-main-background__slot--add {
  border-style: dashed;
}

.store-entry-main-background__plus {
  position: relative;
  width: 44rpx;
  height: 44rpx;
}

.store-entry-main-background__plus-line {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 9999rpx;
  background: #bdbfc6;
  transform: translate(-50%, -50%);
}

.store-entry-main-background__plus-line--horizontal {
  width: 44rpx;
  height: 4rpx;
}

.store-entry-main-background__plus-line--vertical {
  width: 4rpx;
  height: 44rpx;
}

.store-entry-main-background__slot--hover,
.store-entry-main-background__upload--hover {
  opacity: 0.86;
}

.store-entry-main-background__upload {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 210rpx;
  height: 92rpx;
  margin-top: 28rpx;
  margin-left: auto;
  border-radius: 18rpx;
  color: #1f2023;
  font-size: 30rpx;
  font-weight: 700;
  background: linear-gradient(180deg, #ffd926 0%, #ffc900 100%);
  box-shadow: 0 18rpx 32rpx rgba(255, 201, 0, 0.2);
}
</style>
