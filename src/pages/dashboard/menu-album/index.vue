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
const isDeleting = ref(false)
const albumUploadFormData = reactive<{ bizType: string, storeId?: number }>({
  bizType: 'MERCHANT_FOOD_ALBUM',
})
const maxAlbumUploadCount = 5
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
  if (isDeleting.value)
    return

  const modalResult = await new Promise<UniApp.ShowModalRes>((resolve) => {
    uni.showModal({
      title: '删除图片',
      content: `确认删除选中的 ${selectedImageIds.value.length} 张图片吗？`,
      confirmColor: '#d94141',
      success: resolve,
    })
  })
  if (!modalResult.confirm)
    return

  const imageIds = [...selectedImageIds.value]
  isDeleting.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await Promise.all(imageIds.map(imageId => deleteMerchantFoodAlbumImage(storeId, imageId)))
    selectedImageIds.value = []
    await loadAlbum()
    uni.showToast({ title: `已删除 ${imageIds.length} 张图片`, icon: 'success' })
  }
  finally {
    isDeleting.value = false
  }
}

function uploadedUrl(result: any) {
  return typeof result === 'string' ? result : result?.url || result?.fileUrl || result?.path || ''
}

let uploadedCount = 0
let failedCount = 0

const { run: selectAndUpload } = useUpload<'image'>({
  fileType: 'image',
  count: maxAlbumUploadCount,
  formData: albumUploadFormData,
  success: async (result) => {
    const imageUrl = uploadedUrl(result)
    if (!imageUrl) {
      throw new Error('上传结果缺少图片地址')
    }
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await addMerchantFoodAlbumImage(storeId, imageUrl)
    uploadedCount++
  },
  error: () => {
    failedCount++
  },
  complete: async () => {
    await loadAlbum()
    if (failedCount) {
      uni.showToast({ title: `${uploadedCount} 张上传成功，${failedCount} 张失败`, icon: 'none' })
      return
    }
    uni.showToast({ title: `已上传 ${uploadedCount} 张，等待审核`, icon: 'success' })
  },
})

async function handleUpload() {
  try {
    albumUploadFormData.storeId = await merchantFoodStore.ensureCurrentStoreId()
    uploadedCount = 0
    failedCount = 0
    selectAndUpload()
  }
  catch (err: any) {
    uni.showToast({ title: err?.message || '无法获取当前门店', icon: 'none' })
  }
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
          <text v-else class="album-card__tip">
            上传的图片需审核通过后，才可用于商品。
          </text>
        </view>

        <view class="album-grid">
          <view
            v-for="item in displayImages"
            :key="item.id"
            class="album-grid__item album-grid__item--selectable"
            :class="{
              'album-grid__item--selected': !selectMode && selectedImageIds.includes(item.id),
            }"
            hover-class="album-grid__item--hover"
            @tap="handleImageTap(item)"
          >
            <image class="album-grid__image" :src="item.src" mode="aspectFill" />
            <view
              v-if="!selectMode"
              class="album-grid__checkbox"
              :class="{ 'album-grid__checkbox--checked': selectedImageIds.includes(item.id) }"
            >
              <text class="album-grid__checkbox-icon">✓</text>
            </view>
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
        <view
          v-if="!selectMode"
          class="menu-album-actions__button menu-album-actions__button--delete"
          :class="{ 'menu-album-actions__button--disabled': !selectedImageIds.length || isDeleting }"
          hover-class="menu-album-actions__button--hover"
          @tap="handleDelete"
        >
          <text v-if="isDeleting">删除中...</text>
          <text v-else>删除（{{ selectedImageIds.length }}）</text>
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

.album-grid__item--selected {
  box-shadow: inset 0 0 0 6rpx #ff8b1f;
}

.album-grid__item--hover {
  opacity: 0.9;
}

.album-grid__image {
  width: 100%;
  height: 100%;
}

.album-grid__checkbox {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38rpx;
  height: 38rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  box-sizing: border-box;
  background: rgba(35, 38, 44, 0.38);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.18);
}

.album-grid__checkbox--checked {
  border-color: #ff8b1f;
  background: #ff8b1f;
}

.album-grid__checkbox-icon {
  color: transparent;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
}

.album-grid__checkbox--checked .album-grid__checkbox-icon {
  color: #ffffff;
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

.menu-album-actions__button--disabled {
  color: #9a9da3;
  border-color: #dddddd;
  background: #f5f5f5;
}

.menu-album-actions__button--hover {
  opacity: 0.86;
}
</style>
