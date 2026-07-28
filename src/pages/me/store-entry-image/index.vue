<script lang="ts" setup>
import { updateMerchantFoodEntryImages } from '@/api/merchant-food'
import useUpload from '@/hooks/useUpload'
import storeEntryMainImageFallback from '@/static/images/store-entry-avatar.png'
import { useMerchantFoodStore } from '@/store'

defineOptions({
  name: 'StoreEntryImage',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '门店入口图',
  },
})

const fallbackUrl = '/pages/me/store-entry/index'
const merchantFoodStore = useMerchantFoodStore()
const storeName = computed(() => merchantFoodStore.currentStore?.storeName || '餐饮门店')
const storeEntryMainImage = computed(() => merchantFoodStore.profile?.store.coverImage || storeEntryMainImageFallback)

function uploadedUrl(result: any) {
  return typeof result === 'string' ? result : result?.url || result?.fileUrl || result?.path || ''
}

const { run: selectAndUpload } = useUpload<'image'>({
  fileType: 'image',
  success: async (result) => {
    const coverImage = uploadedUrl(result)
    if (!coverImage) {
      uni.showToast({ title: '上传结果缺少图片地址', icon: 'none' })
      return
    }
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    const galleryImages = (merchantFoodStore.profile?.store.galleryImages || '').split(',').filter(Boolean)
    await updateMerchantFoodEntryImages(storeId, { coverImage, galleryImages })
    await merchantFoodStore.loadProfile(true)
    uni.showToast({ title: '入口图已更新', icon: 'success' })
  },
})

function handleChangeAvatar() {
  selectAndUpload()
}

onMounted(() => {
  merchantFoodStore.loadProfile(true).catch(() => {})
})
</script>

<template>
  <view class="store-entry-image-page">
    <view class="store-entry-image-page__glow store-entry-image-page__glow--left" />
    <view class="store-entry-image-page__glow store-entry-image-page__glow--right" />

    <view class="store-entry-image-page__content">
      <view class="store-entry-image-nav">
        <back-button
          :fallback-url="fallbackUrl"
          fallback-mode="navigateTo"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />

        <text class="store-entry-image-nav__title">
          门店入口图
        </text>

        <view class="store-entry-image-nav__spacer" />
      </view>

      <view class="store-entry-image-store">
        <text class="store-entry-image-store__name">
          {{ storeName }}
        </text>
      </view>

      <view class="store-entry-image-section">
        <view class="store-entry-image-section__header">
          <view class="store-entry-image-section__marker" />
          <text class="store-entry-image-section__title">
            店铺头像
          </text>
        </view>

        <view class="store-entry-image-section__body">
          <view class="store-entry-image-section__tips">
            <text class="store-entry-image-section__tip">
              1.建议上传门店特色的菜品、logo、门头招牌或特色环境图
            </text>
            <text class="store-entry-image-section__tip">
              2.图片会被裁成正方形，请保障画面主体在正方形区域内
            </text>
            <text class="store-entry-image-section__tip">
              3.建议尺寸900*900像素，不超过5M，格式支持png、jpg、jpeg。
            </text>
          </view>

          <view class="store-entry-avatar">
            <image class="store-entry-avatar__preview" :src="storeEntryMainImage" mode="aspectFill" />

            <view class="store-entry-avatar__upload-panel">
              <view class="store-entry-avatar__upload-box">
                <view class="store-entry-avatar__upload-plus">
                  <view class="store-entry-avatar__upload-line store-entry-avatar__upload-line--horizontal" />
                  <view class="store-entry-avatar__upload-line store-entry-avatar__upload-line--vertical" />
                </view>
                <text class="store-entry-avatar__upload-text">
                  上传头像
                </text>
              </view>
            </view>
          </view>

          <view class="store-entry-avatar__footer">
            <view class="store-entry-avatar__status">
              <view class="store-entry-avatar__status-dot" />
              审核通过
            </view>

            <view class="store-entry-avatar__change" hover-class="store-entry-avatar__change--hover" @tap="handleChangeAvatar">
              更换图片
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-entry-image-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f8f8fa 20%, #f4f5f8 100%);
}

.store-entry-image-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.store-entry-image-page__glow--left {
  top: -110rpx;
  left: -120rpx;
  width: 420rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 229, 122, 0.28) 0%, rgba(255, 229, 122, 0) 72%);
}

.store-entry-image-page__glow--right {
  top: -40rpx;
  right: -120rpx;
  width: 340rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(233, 225, 255, 0.42) 0%, rgba(233, 225, 255, 0) 68%);
}

.store-entry-image-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 20rpx calc(env(safe-area-inset-bottom) + 36rpx);
}

.store-entry-image-nav {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  min-height: 72rpx;
}

.store-entry-image-nav__title {
  color: #1d2025;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.store-entry-image-nav__spacer {
  width: 72rpx;
  height: 72rpx;
}

.store-entry-image-store {
  margin-top: 30rpx;
}

.store-entry-image-store__name {
  color: #23252a;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-all;
}

.store-entry-image-section {
  margin-top: 28rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18rpx 46rpx rgba(56, 61, 86, 0.08);
}

.store-entry-image-section__header {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 34rpx 28rpx 0;
}

.store-entry-image-section__marker {
  width: 10rpx;
  height: 44rpx;
  border-radius: 9999rpx;
  background: linear-gradient(180deg, #ffd926 0%, #ffbe00 100%);
}

.store-entry-image-section__title {
  color: #23262c;
  font-size: 32rpx;
  font-weight: 700;
}

.store-entry-image-section__body {
  padding: 22rpx 28rpx 30rpx;
}

.store-entry-image-section__tips {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.store-entry-image-section__tips--compact {
  gap: 4rpx;
}

.store-entry-image-section__tip {
  color: #a1a6af;
  font-size: 25rpx;
  line-height: 1.46;
}

.store-entry-avatar {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18rpx;
  width: 100%;
  margin-top: 26rpx;
}

.store-entry-avatar__preview {
  display: block;
  flex-shrink: 0;
  width: 100%;
  height: 320rpx;
  border-radius: 24rpx;
  box-shadow: 0 16rpx 34rpx rgba(36, 39, 48, 0.12);
}

.store-entry-avatar__upload-panel {
  display: flex;
  width: 100%;
  align-items: stretch;
}

.store-entry-avatar__upload-box {
  display: flex;
  width: 100%;
  height: 400rpx;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 18rpx;
  border: 2rpx dashed #d6dbe5;
  border-radius: 24rpx;
  background: linear-gradient(180deg, #fcfcfd 0%, #f7f8fb 100%);
}

.store-entry-avatar__upload-plus,
.store-entry-background__plus {
  position: relative;
  width: 44rpx;
  height: 44rpx;
}

.store-entry-avatar__upload-line,
.store-entry-background__plus-line {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 9999rpx;
  background: #bdbfc6;
  transform: translate(-50%, -50%);
}

.store-entry-avatar__upload-line--horizontal,
.store-entry-background__plus-line--horizontal {
  width: 44rpx;
  height: 4rpx;
}

.store-entry-avatar__upload-line--vertical,
.store-entry-background__plus-line--vertical {
  width: 4rpx;
  height: 44rpx;
}

.store-entry-avatar__upload-text {
  color: #969ba5;
  font-size: 30rpx;
  line-height: 1.3;
}

.store-entry-avatar__footer,
.store-entry-avatar__status {
  display: flex;
  align-items: center;
}

.store-entry-avatar__footer {
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 24rpx;
}

.store-entry-avatar__status {
  gap: 10rpx;
  padding: 0 20rpx;
  height: 58rpx;
  border: 2rpx solid #7ae4b6;
  border-radius: 16rpx;
  color: #19b36d;
  font-size: 28rpx;
  font-weight: 600;
  background: #ebfff5;
}

.store-entry-avatar__status-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #19b36d;
  box-shadow: inset 0 0 0 6rpx #ebfff5;
}

.store-entry-avatar__change,
.store-entry-background__upload {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  color: #1f2023;
  font-size: 30rpx;
  font-weight: 700;
  background: linear-gradient(180deg, #ffd926 0%, #ffc900 100%);
  box-shadow: 0 18rpx 32rpx rgba(255, 201, 0, 0.2);
}

.store-entry-avatar__change {
  min-width: 208rpx;
  height: 94rpx;
  padding: 0 20rpx;
}

.store-entry-avatar__change--hover {
  opacity: 0.86;
}
</style>
