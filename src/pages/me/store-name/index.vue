<script lang="ts" setup>
import previewImage from '@/static/images/item-image.png'

defineOptions({
  name: 'StoreName',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '门店名称',
  },
})

const fallbackUrl = '/pages/me/store-info/index'

const reviewStatus = ref<'rejected' | 'editing'>('rejected')
const rejectReason = ref('门店名称需与营业执照主体保持一致，请修改后重新提交。')

const form = reactive({
  storeName: '喵小厨美食社',
  branchName: '现炒盖饭·油炸小吃',
})

const previewStoreName = computed(() => { 
  const storeName = form.storeName.trim()
  const branchName = form.branchName.trim()

  if (!storeName) {
    return '请填写门店名称'
  }

  if (!branchName) {
    return storeName
  }

  return `${storeName}（${branchName}）`
})

function handleClose() {
  const pages = getCurrentPages()

  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  uni.navigateTo({
    url: fallbackUrl,
  })
}

function handleSubmit() {
  if (!form.storeName.trim()) {
    uni.showToast({
      title: '请填写门店名称',
      icon: 'none',
    })
    return
  }

  uni.showToast({
    title: '提交成功，等待审核',
    icon: 'none',
  })
}
</script>

<template>
  <view class="store-name-page">
    <view class="store-name-page__glow store-name-page__glow--left" />
    <view class="store-name-page__glow store-name-page__glow--right" />

    <view class="store-name-page__content">
      <view class="store-name-nav">
        <view class="store-name-nav__left">
          <fg-back-button
            :fallback-url="fallbackUrl"
            fallback-mode="navigateTo"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />

          <text class="store-name-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="store-name-nav__title">
          门店名称
        </text>

        <view class="store-name-nav__spacer" />
      </view>

      <view v-if="reviewStatus === 'rejected'" class="store-name-notice">
        <text class="store-name-notice__title">
          审核未通过
        </text>
        <text class="store-name-notice__desc">
          驳回原因：{{ rejectReason }}
        </text>
      </view>

      <view class="store-name-card">
        <view class="store-name-field">
          <view class="store-name-field__label">
            <text class="store-name-field__label-text">
              门店名称
            </text>
            <text class="store-name-field__required">
              *
            </text>
          </view>

          <input
            v-model="form.storeName"
            class="store-name-field__input"
            :maxlength="20"
            placeholder="请输入门店名称"
            placeholder-class="store-name-field__placeholder"
          />
        </view>

        <view class="store-name-field">
          <text class="store-name-field__label-text">
            分店名称
          </text>

          <input
            v-model="form.branchName"
            class="store-name-field__input"
            :maxlength="20"
            placeholder="请输入分店名称"
            placeholder-class="store-name-field__placeholder"
          />
        </view>

        <view class="store-name-preview">
          <text class="store-name-preview__label">
            预览效果
          </text>

          <view class="store-name-preview__card">
            <image class="store-name-preview__image" :src="previewImage" mode="aspectFill" />

            <view class="store-name-preview__content">
              <text class="store-name-preview__title">
                {{ previewStoreName }}
              </text>
              <text class="store-name-preview__meta">
                外卖店铺展示效果预览
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="store-name-footer">
      <view class="store-name-footer__button" hover-class="store-name-footer__button--hover" @tap="handleSubmit">
        提交
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-name-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f9f9fb 18%, #f5f6f9 100%);
}

.store-name-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.store-name-page__glow--left {
  top: -110rpx;
  left: -120rpx;
  width: 420rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 229, 122, 0.28) 0%, rgba(255, 229, 122, 0) 72%);
}

.store-name-page__glow--right {
  top: -40rpx;
  right: -120rpx;
  width: 340rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(233, 225, 255, 0.54) 0%, rgba(233, 225, 255, 0) 68%);
}

.store-name-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 20rpx calc(env(safe-area-inset-bottom) + 180rpx);
}

.store-name-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
}

.store-name-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.store-name-nav__close {
  color: #2f3339;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}

.store-name-nav__title {
  color: #1d2025;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.store-name-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.store-name-notice,
.store-name-card {
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.store-name-notice {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 24rpx;
  padding: 24rpx;
  background: linear-gradient(180deg, rgba(255, 247, 247, 0.96) 0%, rgba(255, 240, 240, 0.98) 100%);
}

.store-name-notice__title {
  color: #f23d3d;
  font-size: 32rpx;
  font-weight: 700;
}

.store-name-notice__desc {
  color: #f05a5a;
  font-size: 26rpx;
  line-height: 1.5;
}

.store-name-card {
  margin-top: 20rpx;
  padding: 0 24rpx 24rpx;
}

.store-name-field {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-height: 108rpx;
}

.store-name-field:not(:last-of-type) {
  border-bottom: 2rpx solid #f0f1f4;
}

.store-name-field__label {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  flex-shrink: 0;
}

.store-name-field__label-text {
  color: #363b42;
  font-size: 30rpx;
  font-weight: 600;
}

.store-name-field__required {
  color: #ff4d4f;
  font-size: 30rpx;
  font-weight: 700;
}

.store-name-field__input {
  flex: 1;
  min-width: 0;
  height: 108rpx;
  color: #1f2328;
  font-size: 30rpx;
  text-align: left;
}

.store-name-field__placeholder {
  color: #b8bdc7;
}

.store-name-preview {
  padding-top: 24rpx;
}

.store-name-preview__label {
  color: #8d939e;
  font-size: 26rpx;
}

.store-name-preview__card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 20rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfd 100%);
  box-shadow: inset 0 0 0 2rpx rgba(240, 242, 246, 0.9);
}

.store-name-preview__image {
  width: 132rpx;
  height: 132rpx;
  flex-shrink: 0;
  border-radius: 20rpx;
}

.store-name-preview__content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 12rpx;
}

.store-name-preview__title {
  overflow: hidden;
  color: #2a2e35;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-name-preview__meta {
  color: #9aa0aa;
  font-size: 24rpx;
}

.store-name-footer {
  position: fixed;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  left: 24rpx;
}

.store-name-footer__button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 9999rpx;
  background: linear-gradient(180deg, #ffd82f 0%, #f5c400 100%);
  color: #1f2023;
  font-size: 32rpx;
  font-weight: 700;
  box-shadow: 0 18rpx 34rpx rgba(245, 196, 0, 0.28);
}

.store-name-footer__button--hover {
  opacity: 0.88;
}
</style>
