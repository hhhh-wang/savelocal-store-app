<script lang="ts" setup>
import dishLibraryImage from '@/static/images/dish-library.png'
import menuItemImage from '@/static/images/item-image.png'

defineOptions({
  name: 'ProductManagement',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '商品管理',
  },
})

interface ProductCard {
  title: string
  subtitle: string
  image: string
  themeClass: string
  path?: string
}

const productCards: ProductCard[] = [
  {
    title: '商品库',
    subtitle: '管理门店所有上线菜品信息',
    image: dishLibraryImage,
    themeClass: 'product-management-card--library',
  },
  {
    title: '商品图片',
    subtitle: '图文结合，效果更好',
    image: menuItemImage,
    themeClass: 'product-management-card--image',
    path: '/pages/dashboard/menu-album/index',
  },
]

function handleCardTap(card: ProductCard) {
  if (card.path) {
    uni.navigateTo({
      url: card.path,
    })
  }
}
</script>

<template>
  <view class="product-management-page">
    <view class="product-management-page__glow product-management-page__glow--left" />
    <view class="product-management-page__glow product-management-page__glow--right" />

    <view class="product-management-page__content">
      <view class="product-management-nav">
        <back-button
          fallback-url="/pages/dashboard/index"
          fallback-mode="reLaunch"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />

        <text class="product-management-nav__title">
          商品管理
        </text>

        <view class="product-management-nav__spacer" />
      </view>

      <view class="product-management-list">
        <view
          v-for="card in productCards"
          :key="card.title"
          class="product-management-card"
          :class="card.themeClass"
          hover-class="product-management-card--hover"
          @tap="handleCardTap(card)"
        >
          <image class="product-management-card__image" :src="card.image" mode="aspectFill" />

          <view class="product-management-card__shade" />

          <view class="product-management-card__content">
            <view class="product-management-card__text">
              <text class="product-management-card__title">
                {{ card.title }}
                <text class="product-management-card__chevron">
                  &gt;
                </text>
              </text>
              <text class="product-management-card__subtitle">
                {{ card.subtitle }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.product-management-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f6f7fb 18%, #f3f4f8 100%);
}

.product-management-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.product-management-page__glow--left {
  top: -110rpx;
  left: -120rpx;
  width: 400rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 234, 161, 0.28) 0%, rgba(255, 234, 161, 0) 72%);
}

.product-management-page__glow--right {
  top: -40rpx;
  right: -110rpx;
  width: 340rpx;
  height: 240rpx;
  background: radial-gradient(circle, rgba(196, 228, 255, 0.32) 0%, rgba(196, 228, 255, 0) 70%);
}

.product-management-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 18rpx) 18rpx calc(env(safe-area-inset-bottom) + 36rpx);
}

.product-management-nav {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  min-height: 72rpx;
}

.product-management-nav__title {
  color: #1f2328;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.product-management-nav__spacer {
  width: 72rpx;
  height: 72rpx;
}

.product-management-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 22rpx;
}

.product-management-card {
  position: relative;
  overflow: hidden;
  min-height: 366rpx;
  border-radius: 30rpx;
  background: #fff;
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.product-management-card__image,
.product-management-card__shade,
.product-management-card__content {
  position: absolute;
  inset: 0;
}

.product-management-card__image {
  width: 100%;
  height: 100%;
}

.product-management-card__shade {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 52%, rgba(255, 255, 255, 0) 100%);
}

.product-management-card__content {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 28rpx 28rpx 24rpx;
}

.product-management-card__text {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.product-management-card__title {
  color: #43464c;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.2;
}

.product-management-card__subtitle {
  color: #6f747d;
  font-size: 24rpx;
  line-height: 1.3;
}

.product-management-card__chevron {
  margin-left: 2rpx;
}

.product-management-card--image .product-management-card__shade {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 255, 255, 0.16) 38%, rgba(255, 255, 255, 0) 100%);
}

.product-management-card--image .product-management-card__title {
  color: #118fff;
}

.product-management-card--image .product-management-card__subtitle {
  color: #53aaff;
}
</style>
