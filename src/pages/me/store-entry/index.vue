<script lang="ts" setup>
import storeEntryBanner from '@/static/images/store-entry-banner.png'
import { useMerchantFoodStore, useMerchantStoreAuditStore } from '@/store'

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
const storeEntryImagePagePath = '/pages/me/store-entry-image/index'
const storeEntryMainPagePath = '/pages/me/store-entry-main/index'
const merchantFoodStore = useMerchantFoodStore()
const merchantStoreAudit = useMerchantStoreAuditStore()
const storeName = computed(() => merchantStoreAudit.snapshot.store.storeName
  || merchantFoodStore.currentStore?.storeName
  || '餐饮门店')

const previewImages = computed(() => {
  const draftStore = merchantStoreAudit.snapshot.store
  const activeStore = merchantFoodStore.profile?.store
  const activeGalleryImages = (activeStore?.galleryImages || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  return [
    draftStore.coverImage,
    ...(draftStore.galleryImages || []),
    activeStore?.coverImage,
    ...activeGalleryImages,
  ].filter((item, index, list): item is string => Boolean(item) && list.indexOf(item) === index)
})

const previewCaption = computed(() => previewImages.value.length
  ? `点击预览已设置图片（${previewImages.value.length}张）`
  : '效果示意')

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
  if (!previewImages.value.length) {
    uni.showToast({
      title: '请先设置入口图或主图',
      icon: 'none',
    })
    return
  }

  uni.previewImage({
    current: previewImages.value[0],
    urls: previewImages.value,
  })
}

function handleActionTap(card: typeof actionCards[number]) {
  if (card.key === 'entry') {
    uni.navigateTo({
      url: storeEntryImagePagePath,
    })
    return
  }

  if (card.key === 'main') {
    uni.navigateTo({
      url: storeEntryMainPagePath,
    })
    return
  }
}

onShow(async () => {
  try {
    const profile = await merchantFoodStore.loadProfile(true)
    await merchantStoreAudit.load(profile.store.storeId, true)
  }
  catch (error) {
    console.error('门店入口资料加载失败:', error)
  }
})
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
          <view
            class="store-entry-demo__phone"
            hover-class="store-entry-demo__phone--hover"
            @tap="openPreview"
          >
            <image class="store-entry-demo__image" :src="storeEntryBanner" mode="widthFix" />
          </view>

          <text class="store-entry-demo__caption">
            {{ previewCaption }}
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
    radial-gradient(
      circle at top,
      rgba(0, 0, 0, 0.035) 0,
      rgba(0, 0, 0, 0.035) 1rpx,
      transparent 1rpx,
      transparent 100%
    ),
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
  min-height: 920rpx;
  border-radius: 18rpx;
  background: #f4f4f4;
  box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.08);
}

.store-entry-demo__phone--hover {
  opacity: 0.9;
}

.store-entry-demo__image {
  display: block;
  width: 100%;
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
