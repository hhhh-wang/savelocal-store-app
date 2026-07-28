<script lang="ts" setup>
import { addMerchantFoodAlbumImage, deleteMerchantFoodAlbumImage, getMerchantFoodAlbumPage } from '@/api/merchant-food'
import useUpload from '@/hooks/useUpload'
import questionIcon from '@/static/icons/question-icon.png'
import { useMerchantFoodStore } from '@/store'

defineOptions({
  name: 'MenuAlbum',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '官方商品相册',
  },
})

type AlbumImageStatus = '通过' | '未通过'

interface AlbumImage {
  id: number
  src: string
  status: AlbumImageStatus
}

const fallbackUrl = '/pages/dashboard/product-management/index'
const merchantFoodStore = useMerchantFoodStore()
const storeName = computed(() => `${merchantFoodStore.currentStore?.storeName || '餐饮门店'}的官方相册`)
const selectMode = ref(false)
const selectApprovedOnly = ref(false)
const selectedImageIds = ref<number[]>([])
interface OpenerEventChannel {
  emit: (eventName: string, ...args: any[]) => void
}

let openerEventChannel: OpenerEventChannel | null = null

const albumImages = ref<AlbumImage[]>([])
const albumTotal = ref(0)

const approvedImages = computed(() => albumImages.value.filter(item => item.status === '通过'))
const displayImages = computed(() => {
  if (selectMode.value && selectApprovedOnly.value) {
    return approvedImages.value
  }

  return albumImages.value
})

const albumHeaderTitle = computed(() => {
  if (selectMode.value) {
    return `已审核通过图片（${displayImages.value.length}/${albumImages.value.length}）`
  }

  return `${storeName.value}（${approvedImages.value.length}/${albumTotal.value}）`
})

async function loadAlbum() {
  const storeId = await merchantFoodStore.ensureCurrentStoreId()
  const result = await getMerchantFoodAlbumPage(storeId, { pageNum: 1, pageSize: 100 })
  albumTotal.value = result.total
  albumImages.value = result.rows.map(item => ({
    id: item.imageId,
    src: item.imageUrl,
    status: item.auditStatus === '1' ? '通过' : '未通过',
  }))
}

async function handleDelete() {
  if (!selectedImageIds.value.length) {
    uni.showToast({ title: '请先选择要删除的图片', icon: 'none' })
    return
  }
  const storeId = await merchantFoodStore.ensureCurrentStoreId()
  await Promise.all(selectedImageIds.value.map(imageId => deleteMerchantFoodAlbumImage(storeId, imageId)))
  selectedImageIds.value = []
  await loadAlbum()
  uni.showToast({ title: '删除成功', icon: 'success' })
}

function uploadedUrl(result: any) {
  return typeof result === 'string' ? result : result?.url || result?.fileUrl || result?.path || ''
}

const { run: selectAndUpload } = useUpload<'image'>({
  fileType: 'image',
  success: async (result) => {
    const imageUrl = uploadedUrl(result)
    if (!imageUrl) {
      uni.showToast({ title: '上传结果缺少图片地址', icon: 'none' })
      return
    }
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await addMerchantFoodAlbumImage(storeId, imageUrl)
    await loadAlbum()
    uni.showToast({ title: '已上传，等待审核', icon: 'success' })
  },
})

function handleUpload() {
  selectAndUpload()
}

function handleImageTap(item: AlbumImage) {
  if (!selectMode.value) {
    selectedImageIds.value = selectedImageIds.value.includes(item.id)
      ? selectedImageIds.value.filter(id => id !== item.id)
      : [...selectedImageIds.value, item.id]
    return
  }

  openerEventChannel?.emit('selectImage', item)
  uni.navigateBack()
}

onLoad((options) => {
  selectMode.value = options?.mode === 'select'
  selectApprovedOnly.value = options?.status === 'approved'
  const currentPage = getCurrentPages()[getCurrentPages().length - 1] as {
    getOpenerEventChannel?: () => OpenerEventChannel
  } | undefined

  openerEventChannel = currentPage?.getOpenerEventChannel?.() || null
  loadAlbum().catch(() => {})
})
</script>

<template>
  <view class="menu-album-page">
    <view class="menu-album-page__content">
      <view class="menu-album-nav">
        <back-button
          :fallback-url="fallbackUrl"
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
            {{ albumHeaderTitle }}
          </text>
          <text v-if="selectMode" class="album-card__tip">
            点击一张已审核通过的图片后将返回编辑页
          </text>
        </view>

        <view class="album-grid">
          <view
            v-for="item in displayImages"
            :key="item.id"
            class="album-grid__item"
            :class="{ 'album-grid__item--selectable': selectMode || selectedImageIds.includes(item.id) }"
            hover-class="album-grid__item--hover"
            @tap="handleImageTap(item)"
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

      <view v-if="!selectMode" class="menu-album-actions">
        <view class="menu-album-actions__button menu-album-actions__button--delete" hover-class="menu-album-actions__button--hover" @tap="handleDelete">
          删除
        </view>
        <view class="menu-album-actions__button menu-album-actions__button--upload" hover-class="menu-album-actions__button--hover" @tap="handleUpload">
          上传图片
        </view>
      </view>
      <view v-else class="menu-album-select-bar">
        仅展示审核通过图片
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

.album-card__tip {
  display: block;
  margin-top: 8rpx;
  color: #8a9099;
  font-size: 24rpx;
  line-height: 1.4;
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

.album-grid__item--selectable {
  cursor: pointer;
}

.album-grid__item--hover {
  opacity: 0.9;
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

.menu-album-select-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 84rpx;
  margin-top: 22rpx;
  border-radius: 10rpx;
  color: #6f7681;
  font-size: 28rpx;
  background: #ffffff;
  box-shadow: inset 0 0 0 2rpx #ececec;
}
</style>
