<script lang="ts" setup>
import questionIcon from '@/static/icons/question-icon.png'
import albumThumb1 from '@/static/images/dish-library.png'
import albumThumb2 from '@/static/images/item-image.png'

defineOptions({
  name: 'MenuAlbum',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '官方商品相册',
  },
})

interface AlbumImage {
  id: number
  src: string
  status: '通过' | '未通过'
}

const storeName = '喵小厨美食社（现炒盖饭..吃）的官方相册'

const albumStats = {
  total: 50,
  selected: 2,
}

const albumImages: AlbumImage[] = [
  { id: 1, src: albumThumb1, status: '未通过' },
  { id: 2, src: albumThumb2, status: '未通过' },
  { id: 3, src: albumThumb1, status: '通过' },
  { id: 4, src: albumThumb2, status: '通过' },
  { id: 5, src: albumThumb1, status: '未通过' },
  { id: 6, src: albumThumb2, status: '通过' },
]

function handleDelete() {
  uni.showToast({
    title: '删除入口待接入',
    icon: 'none',
  })
}

function handleUpload() {
  uni.showToast({
    title: '上传入口待接入',
    icon: 'none',
  })
}
</script>

<template>
  <view class="menu-album-page">
    <view class="menu-album-page__content">
      <view class="menu-album-nav">
        <fg-back-button
          fallback-url="/pages/dashboard/product-management/index"
          fallback-mode="navigateTo"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />

        <text class="menu-album-nav__title">
          商品相册
        </text>

      </view>

      <view class="album-card">
        <view class="album-card__header">
          <text class="album-card__title">
            {{ storeName }}（{{ albumStats.selected }}/{{ albumStats.total }}）
          </text>
        </view>

        <view class="album-grid">
          <view
            v-for="item in albumImages"
            :key="item.id"
            class="album-grid__item"
          >
            <image class="album-grid__image" :src="item.src" mode="aspectFill" />
            <view class="album-grid__status">
              <text class="album-grid__status-text">
                {{ item.status }}
              </text>
              <image
                v-if="item.status === '未通过'"
                class="album-grid__status-icon"
                :src="questionIcon"
                mode="aspectFit"
              />
            </view>
          </view>
        </view>
      </view>

      <view class="menu-album-actions">
        <view class="menu-album-actions__button menu-album-actions__button--delete" hover-class="menu-album-actions__button--hover" @tap="handleDelete">
          删除
        </view>
        <view class="menu-album-actions__button menu-album-actions__button--upload" hover-class="menu-album-actions__button--hover" @tap="handleUpload">
          上传图片
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.menu-album-page {
  min-height: 100vh;
  background: #f3f3f3;
}

.menu-album-page__content {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 18rpx) 20rpx calc(env(safe-area-inset-bottom) + 24rpx);
}

.menu-album-nav {
  display: grid;
  grid-template-columns: 72rpx 1fr 110rpx;
  align-items: center;
  min-height: 72rpx;
}

.menu-album-nav__title {
  color: #202226;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}


.album-card {
  min-height: calc(100vh - 268rpx);
  margin-top: 16rpx;
  padding: 16rpx 12rpx 18rpx;
  border-radius: 10rpx;
  background: #ffffff;
  box-shadow: inset 0 0 0 2rpx #ececec;
}

.album-card__header {
  padding: 6rpx 6rpx 14rpx;
}

.album-card__title {
  color: #3b3b3b;
  font-size: 28rpx;
  line-height: 1.35;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8rpx;
}

.album-grid__item {
  position: relative;
  overflow: hidden;
  min-height: 206rpx;
  border-radius: 8rpx;
  background: #f7f7f7;
  box-shadow: inset 0 0 0 2rpx rgba(0, 0, 0, 0.04);
}

.album-grid__image {
  width: 100%;
  height: 100%;
}

.album-grid__status {
  position: absolute;
  left: 10rpx;
  bottom: 10rpx;
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 12rpx;
  border-radius: 9999rpx;
  background: rgba(255, 118, 40, 0.95);
}

.album-grid__status-text {
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
}

.album-grid__status-icon {
  width: 24rpx;
  height: 24rpx;
  flex-shrink: 0;
}

.menu-album-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 22rpx;
}

.menu-album-actions__button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 84rpx;
  border-radius: 10rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.menu-album-actions__button--delete {
  color: #222;
  background: #fff;
  border: 2rpx solid #bfbfbf;
}

.menu-album-actions__button--upload {
  color: #1c1c1c;
  background: linear-gradient(180deg, #ffd82f 0%, #f5c400 100%);
}

.menu-album-actions__button--hover {
  opacity: 0.86;
}
</style>
