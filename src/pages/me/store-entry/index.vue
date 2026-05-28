<script lang="ts" setup>
import storeEntryBanner from '@/static/images/store-entry-banner.png'

defineOptions({
  name: 'StoreEntry',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '门店入口',
  },
})

const fallbackUrl = '/pages/me/store-info/index'
const storeName = ref('喵小厨美食社（现炒盖饭·油炸小吃）')

const actionCards = [
  {
    key: 'entry',
    title: '入口图',
    desc: '提升店铺意向',
    primary: true,
    buttonText: '去设置',
  },
  {
    key: 'main',
    title: '主图',
    desc: '店铺直观招牌',
    primary: false,
    buttonText: '去设置',
  },
] as const

function openPreview() {
  uni.showToast({
    title: '预览入口待接入',
    icon: 'none',
  })
}

function handleActionTap(card: typeof actionCards[number]) {
  uni.showToast({
    title: `${card.title}设置待接入`,
    icon: 'none',
  })
}
</script>

<template>
  <view class="store-entry-page">
    <view class="store-entry-page__content">
      <view class="store-entry-nav">
        <back-button
          :fallback-url="fallbackUrl"
          fallback-mode="navigateTo"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />

        <text class="store-entry-nav__title">
          门店入口
        </text>


      </view>

      <view class="store-entry-store">
        <text class="store-entry-store__name">
          {{ storeName }}
        </text>
      </view>

      <view class="store-entry-layout">
        <view class="store-entry-demo">
          <view class="store-entry-demo__phone">
            <image class="store-entry-demo__image" :src="storeEntryBanner" mode="aspectFill" />

            <view class="store-entry-demo__focus">
              <view class="store-entry-demo__focus-thumb" />

              <view class="store-entry-demo__focus-body">
                <text class="store-entry-demo__focus-title">
                  示例门店
                </text>

                <view class="store-entry-demo__focus-row">
                  <text class="store-entry-demo__focus-stars">★★★★★</text>
                  <text class="store-entry-demo__focus-score">5.0</text>
                  <text class="store-entry-demo__focus-meta">999条</text>
                  <text class="store-entry-demo__focus-meta">¥87/人</text>
                </view>

                <view class="store-entry-demo__focus-row store-entry-demo__focus-row--muted">
                  <text class="store-entry-demo__focus-tag">
                    火锅
                  </text>
                  <text class="store-entry-demo__focus-meta">
                    步步高
                  </text>
                  <text class="store-entry-demo__focus-meta">
                    100m
                  </text>
                </view>
              </view>
            </view>
          </view>

          <text class="store-entry-demo__caption">
            效果示意
          </text>
        </view>

        <view class="store-entry-actions">
          <view
            v-for="card in actionCards"
            :key="card.key"
            class="store-entry-card"
            :class="{ 'store-entry-card--primary': card.primary }"
          >
            <text class="store-entry-card__title">
              {{ card.title }}
            </text>
            <text class="store-entry-card__desc">
              {{ card.desc }}
            </text>

            <view
              class="store-entry-card__button"
              :class="{ 'store-entry-card__button--primary': card.primary }"
              hover-class="store-entry-card__button--hover"
              @tap="handleActionTap(card)"
            >
              {{ card.buttonText }}
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-entry-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(0, 0, 0, 0.035) 0, rgba(0, 0, 0, 0.035) 1rpx, transparent 1rpx, transparent 100%),
    #ffffff;
  background-size: 8rpx 8rpx;
}

.store-entry-page__content {
  padding: calc(env(safe-area-inset-top) + 18rpx) 20rpx calc(env(safe-area-inset-bottom) + 24rpx);
}

.store-entry-nav {
  display: grid;
  grid-template-columns: 72rpx 1fr 96rpx;
  align-items: start;
  min-height: 84rpx;
}

.store-entry-nav__title {
  padding-top: 6rpx;
  color: #666666;
  font-size: 44rpx;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}




.store-entry-store {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  max-width: 100%;
  margin-top: 38rpx;
}

.store-entry-store__name {
  overflow: hidden;
  max-width: 100%;
  color: #23252a;
  font-size: 35rpx;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}



.store-entry-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 228rpx;
  gap: 22rpx;
  align-items: start;
  margin-top: 30rpx;
}

.store-entry-demo {
  min-width: 0;
}

.store-entry-demo__phone {
  position: relative;
  overflow: hidden;
  height: 804rpx;
  border-radius: 18rpx;
  background: #5d5d5d;
  box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.1);
}

.store-entry-demo__image {
  width: 100%;
  height: 100%;
  filter: saturate(0) brightness(0.56) blur(1.2rpx);
  transform: scale(1.02);
}

.store-entry-demo__focus {
  position: absolute;
  right: 0;
  bottom: 214rpx;
  left: 0;
  display: flex;
  gap: 14rpx;
  margin: 0 14rpx;
  padding: 16rpx 16rpx 18rpx;
  border: 4rpx solid #ffcb12;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.12);
}

.store-entry-demo__focus-thumb {
  flex-shrink: 0;
  width: 88rpx;
  height: 88rpx;
  border-radius: 12rpx;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 228, 135, 0.7), transparent 36%),
    linear-gradient(135deg, #cb3528 0%, #ef9543 54%, #f8d26c 100%);
}

.store-entry-demo__focus-body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
}

.store-entry-demo__focus-title {
  color: #2b2d31;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 1.3;
}

.store-entry-demo__focus-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
}

.store-entry-demo__focus-row--muted {
  gap: 10rpx;
}

.store-entry-demo__focus-stars {
  color: #ff4b3a;
  font-size: 18rpx;
  letter-spacing: 2rpx;
}

.store-entry-demo__focus-score {
  color: #ff4b3a;
  font-size: 22rpx;
  font-weight: 700;
}

.store-entry-demo__focus-meta {
  color: #767a82;
  font-size: 18rpx;
}

.store-entry-demo__focus-tag {
  padding: 3rpx 8rpx;
  border-radius: 8rpx;
  color: #f37c2e;
  font-size: 18rpx;
  background: #fff1e3;
}

.store-entry-demo__caption {
  display: block;
  margin-top: 18rpx;
  color: #70757d;
  font-size: 30rpx;
  line-height: 1.2;
  text-align: center;
}

.store-entry-actions {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.store-entry-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 22rpx 18rpx 18rpx;
  border: 2rpx solid rgba(237, 239, 243, 0.9);
  border-radius: 18rpx;
  background: #ffffff;
}

.store-entry-card--primary {
  border-color: #ffcb12;
}

.store-entry-card__title {
  color: #24262b;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.25;
}

.store-entry-card__desc {
  color: #7d8188;
  font-size: 24rpx;
  line-height: 1.4;
}

.store-entry-card__button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64rpx;
  border-radius: 14rpx;
  color: #2a2c30;
  font-size: 28rpx;
  font-weight: 700;
  background: linear-gradient(180deg, #f7f7f7 0%, #eeeeee 100%);
}

.store-entry-card__button--primary {
  background: linear-gradient(180deg, #ffd91f 0%, #ffc900 100%);
}
</style>
