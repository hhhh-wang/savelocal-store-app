<script lang="ts" setup>
import mapMarkerIcon from '@/static/icons/map-marker.svg'

defineOptions({
  name: 'StoreAddress',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '门店地址',
  },
})

const fallbackUrl = '/pages/me/store-info/index'

const form = reactive({
  address: '崧河街道新桥社区1号师范后门',
})

const mapCenter = {
  latitude: 31.2304,
  longitude: 121.4737,
}

const mapMarkers = [
  {
    id: 1,
    latitude: mapCenter.latitude,
    longitude: mapCenter.longitude,
    iconPath: mapMarkerIcon,
    width: 34,
    height: 40,
  },
]

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
  if (!form.address.trim()) {
    uni.showToast({
      title: '请填写门店地址',
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
  <view class="store-address-page">
    <view class="store-address-page__glow store-address-page__glow--left" />
    <view class="store-address-page__glow store-address-page__glow--right" />

    <view class="store-address-page__content">
      <view class="store-address-nav">
        <view class="store-address-nav__left">
          <fg-back-button
            :fallback-url="fallbackUrl"
            fallback-mode="navigateTo"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />

          <text class="store-address-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="store-address-nav__title">
          门店地址
        </text>

        <view class="store-address-nav__spacer" />
      </view>

      <view class="store-address-card">
        <view class="store-address-field">
          <view class="store-address-field__label">
            <text class="store-address-field__label-text">
              门店地址
            </text>
            <text class="store-address-field__required">
              *
            </text>
            <text class="store-address-field__hint">
              ⓘ 说明
            </text>
          </view>

          <input
            v-model="form.address"
            class="store-address-field__input"
            placeholder="请输入门店地址"
            placeholder-class="store-address-field__placeholder"
          />
        </view>

        <view class="store-address-map-section">
          <view class="store-address-map-section__label">
            <text class="store-address-map-section__label-text">
              商户位置
            </text>
            <text class="store-address-map-section__required">
              *
            </text>
          </view>

          <view class="store-address-map-wrap">
            <map
              class="store-address-map"
              :latitude="mapCenter.latitude"
              :longitude="mapCenter.longitude"
              :markers="mapMarkers"
              :scale="14"
              enable-poi
              enable-scroll
              enable-zoom
            />
          </view>
        </view>
      </view>
    </view>

    <view class="store-address-footer">
      <view class="store-address-footer__button" hover-class="store-address-footer__button--hover" @tap="handleSubmit">
        提交
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-address-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f9f9fb 18%, #f5f6f9 100%);
}

.store-address-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.store-address-page__glow--left {
  top: -110rpx;
  left: -120rpx;
  width: 420rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 229, 122, 0.28) 0%, rgba(255, 229, 122, 0) 72%);
}

.store-address-page__glow--right {
  top: -40rpx;
  right: -120rpx;
  width: 340rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(233, 225, 255, 0.54) 0%, rgba(233, 225, 255, 0) 68%);
}

.store-address-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 20rpx calc(env(safe-area-inset-bottom) + 180rpx);
}

.store-address-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
}

.store-address-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.store-address-nav__close {
  color: #2f3339;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}

.store-address-nav__title {
  color: #1d2025;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.store-address-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.store-address-card {
  margin-top: 24rpx;
  padding: 22rpx 22rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.store-address-field,
.store-address-map-section {
  padding-bottom: 22rpx;
}

.store-address-field {
  border-bottom: 2rpx solid #f1f2f5;
}

.store-address-field__label,
.store-address-map-section__label {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.store-address-field__label-text,
.store-address-map-section__label-text {
  color: #363b42;
  font-size: 30rpx;
  font-weight: 600;
}

.store-address-field__required,
.store-address-map-section__required {
  color: #ff4d4f;
  font-size: 30rpx;
  font-weight: 700;
}

.store-address-field__hint {
  color: #a5aab4;
  font-size: 24rpx;
  font-weight: 500;
}

.store-address-field__input {
  width: 100%;
  margin-top: 18rpx;
  color: #23262c;
  font-size: 30rpx;
}

.store-address-field__placeholder {
  color: #b8bdc7;
}

.store-address-map-section {
  padding-top: 20rpx;
}

.store-address-map-wrap {
  position: relative;
  overflow: hidden;
  height: 260rpx;
  margin-top: 18rpx;
  border-radius: 20rpx;
  background: #edf5fb;
  box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.75);
}

.store-address-map {
  width: 100%;
  height: 100%;
}

.store-address-footer {
  position: fixed;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  left: 24rpx;
}

.store-address-footer__button {
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

.store-address-footer__button--hover {
  opacity: 0.88;
}
</style>
