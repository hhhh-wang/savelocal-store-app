<script lang="ts" setup>
import type { PurchaseNoticeProduct } from '@/api/merchant-purchase-notice'
import { bindPurchaseNoticeTemplate, getPurchaseNoticeProducts, savePurchaseNoticeTemplate } from '@/api/merchant-purchase-notice'
import productImage from '@/static/images/item-image.png'
import { useMerchantFoodStore } from '@/store'

defineOptions({
  name: 'TemplateApplyPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '应用模板',
  },
})

type ProductType = 'DEAL' | 'TAKEOUT'
type StatusFilter = 'all' | 'configured' | 'unconfigured' | 'off-shelf'

interface OpenerEventChannel {
  emit: (eventName: string, ...args: any[]) => void
}

const fallbackUrl = '/pages/dashboard/template-detail/index'
const merchantFoodStore = useMerchantFoodStore()

const templateId = ref(0)
const templateName = ref('购买须知1')
const activeProductType = ref<ProductType>('DEAL')
const activeStatus = ref<StatusFilter>('all')
const keyword = ref('')
const products = ref<PurchaseNoticeProduct[]>([])
const productsLoading = ref(false)

let openerEventChannel: OpenerEventChannel | null = null

const statusFilters: Array<{ key: StatusFilter, label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'configured', label: '已配置' },
  { key: 'unconfigured', label: '未配置' },
  { key: 'off-shelf', label: '已下架' },
]

function isBound(product: PurchaseNoticeProduct) {
  return product.noticeTemplateId != null
}

function isOnShelf(product: PurchaseNoticeProduct) {
  return product.saleStatus === 'ON_SALE'
}

const visibleProducts = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()
  return products.value.filter((product) => {
    if (product.productType !== activeProductType.value)
      return false

    if (normalizedKeyword && !product.productName.toLowerCase().includes(normalizedKeyword)
      && !String(product.productId).includes(normalizedKeyword)) {
      return false
    }

    if (activeStatus.value === 'configured')
      return isBound(product)
    if (activeStatus.value === 'unconfigured')
      return !isBound(product)
    if (activeStatus.value === 'off-shelf')
      return !isOnShelf(product)
    return true
  })
})

function confirmModal(options: { title: string, content: string, confirmColor?: string }) {
  return new Promise<UniApp.ShowModalRes>((resolve) => {
    uni.showModal({ ...options, success: resolve })
  })
}

async function loadProducts() {
  productsLoading.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    products.value = await getPurchaseNoticeProducts(storeId)
  }
  catch (error) {
    console.error('加载购买须知商品失败:', error)
    uni.showToast({ title: '商品加载失败，请重试', icon: 'none' })
  }
  finally {
    productsLoading.value = false
  }
}

function statusLabel(product: PurchaseNoticeProduct) {
  if (isBound(product))
    return '已设置'
  return isOnShelf(product) ? '未配置' : '已下架'
}

function statusClass(product: PurchaseNoticeProduct) {
  if (isBound(product))
    return 'template-product-card__status--configured'
  return isOnShelf(product) ? 'template-product-card__status--unconfigured' : 'template-product-card__status--off-shelf'
}

function formatPrice(price: number) {
  const value = Number(price || 0)
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

async function handleEditName() {
  uni.showModal({
    title: '编辑模板名称',
    editable: true,
    placeholderText: '请输入模板名称',
    content: templateName.value,
    success: async (result) => {
      if (!result.confirm)
        return
      const name = result.content?.trim()
      if (!name || name === templateName.value)
        return
      try {
        const storeId = await merchantFoodStore.ensureCurrentStoreId()
        await savePurchaseNoticeTemplate(storeId, templateId.value, { templateName: name })
      }
      catch (error) {
        console.error('修改模板名称失败:', error)
        uni.showToast({ title: '保存失败，请重试', icon: 'none' })
        return
      }
      templateName.value = name
      openerEventChannel?.emit('templateRenamed', name)
      uni.showToast({ title: '已保存', icon: 'success' })
    },
  })
}

async function handleTemplateAction(product: PurchaseNoticeProduct) {
  const storeId = await merchantFoodStore.ensureCurrentStoreId()
  if (isBound(product)) {
    const result = await confirmModal({
      title: '取消配置',
      content: `确认取消「${product.productName}」的模板配置吗？`,
      confirmColor: '#d94141',
    })
    if (!result.confirm)
      return
    try {
      await bindPurchaseNoticeTemplate(storeId, product.productId, null)
    }
    catch (error) {
      console.error('取消配置失败:', error)
      uni.showToast({ title: '操作失败，请重试', icon: 'none' })
      return
    }
    product.noticeTemplateId = undefined
    product.noticeTemplateName = undefined
    uni.showToast({ title: '已取消配置', icon: 'success' })
    return
  }

  try {
    await bindPurchaseNoticeTemplate(storeId, product.productId, templateId.value)
  }
  catch (error) {
    console.error('配置模板失败:', error)
    uni.showToast({ title: '操作失败，请重试', icon: 'none' })
    return
  }
  product.noticeTemplateId = templateId.value
  product.noticeTemplateName = templateName.value
  uni.showToast({ title: '已配置模板', icon: 'success' })
}

onLoad((options) => {
  templateId.value = Number(options?.templateId) || 0
  const name = options?.name ? decodeURIComponent(options.name) : ''
  if (name)
    templateName.value = name

  const currentPage = getCurrentPages()[getCurrentPages().length - 1] as {
    getOpenerEventChannel?: () => OpenerEventChannel
  } | undefined

  openerEventChannel = currentPage?.getOpenerEventChannel?.() || null
  loadProducts()
})
</script>

<template>
  <view class="template-apply-page">
    <view class="template-apply-page__content">
      <view class="template-apply-nav">
        <back-button
          :fallback-url="fallbackUrl"
          fallback-mode="navigateTo"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />

        <text class="template-apply-nav__title">
          应用模板
        </text>

        <view class="template-apply-nav__spacer" />
      </view>

      <view class="template-card">
        <text class="template-card__name">
          {{ templateName }}
        </text>
        <view class="template-card__edit" hover-class="template-card__edit--hover" @tap="handleEditName">
          编辑
        </view>
      </view>

      <view class="product-type-tabs">
        <view
          class="product-type-tabs__item"
          :class="{ 'product-type-tabs__item--active': activeProductType === 'DEAL' }"
          @tap="activeProductType = 'DEAL'"
        >
          团购
        </view>
        <view
          class="product-type-tabs__item"
          :class="{ 'product-type-tabs__item--active': activeProductType === 'TAKEOUT' }"
          @tap="activeProductType = 'TAKEOUT'"
        >
          外卖
        </view>
      </view>

      <view class="product-search">
        <view class="i-carbon-search product-search__icon" />
        <input
          v-model="keyword"
          class="product-search__input"
          type="text"
          placeholder="请输入项目名称或ID"
          placeholder-class="product-search__placeholder"
          confirm-type="search"
        >
      </view>

      <view class="product-status-tabs">
        <view
          v-for="filter in statusFilters"
          :key="filter.key"
          class="product-status-tabs__item"
          :class="{ 'product-status-tabs__item--active': activeStatus === filter.key }"
          @tap="activeStatus = filter.key"
        >
          <view class="product-status-tabs__radio" />
          <text>{{ filter.label }}</text>
        </view>
      </view>

      <view v-if="productsLoading && !products.length" class="product-list-state">
        正在加载项目
      </view>

      <view v-else-if="!visibleProducts.length" class="product-list-state">
        暂无符合条件的项目
      </view>

      <view v-else class="template-product-list">
        <view
          v-for="product in visibleProducts"
          :key="product.productId"
          class="template-product-card"
        >
          <image class="template-product-card__image" :src="product.coverImageUrl || productImage" mode="aspectFill" />

          <view class="template-product-card__body">
            <view class="template-product-card__header">
              <text class="template-product-card__name">
                {{ product.productName }}
              </text>
              <text class="template-product-card__stock">
                库存:{{ product.stockQuantity }}
              </text>
            </view>

            <text class="template-product-card__id">
              ID:{{ product.productId }}
            </text>

            <view class="template-product-card__footer">
              <view class="template-product-card__status-wrap">
                <view class="template-product-card__status-line">
                  <text class="template-product-card__label">当前价:</text>
                  <text class="template-product-card__price">¥ {{ formatPrice(product.salePrice) }}</text>
                </view>
                <view class="template-product-card__status-line">
                  <text class="template-product-card__label">状态:</text>
                  <text class="template-product-card__status" :class="statusClass(product)">
                    {{ statusLabel(product) }}
                  </text>
                </view>
              </view>

              <view
                class="template-product-card__action"
                hover-class="template-product-card__action--hover"
                @tap="handleTemplateAction(product)"
              >
                {{ isBound(product) ? '取消配置' : '配置模板' }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <text v-if="!productsLoading && visibleProducts.length" class="product-list-end">
        没有更多了
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.template-apply-page {
  min-height: 100vh;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #22252b;
}

.template-apply-page__content {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 24rpx) 24rpx calc(env(safe-area-inset-bottom) + 72rpx);
}

.template-apply-nav {
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) 72rpx;
  align-items: center;
  min-height: 72rpx;
}

.template-apply-nav__title {
  color: #202226;
  font-size: 44rpx;
  font-weight: 500;
  line-height: 1.25;
  text-align: center;
}

.template-apply-nav__spacer {
  width: 72rpx;
  height: 72rpx;
}

.template-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 28rpx;
  padding: 28rpx 24rpx;
  box-sizing: border-box;
  border-radius: 26rpx;
  background: #fff;
  box-shadow: 0 8rpx 22rpx rgba(70, 74, 84, 0.03);
}

.template-card__name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #202332;
  font-size: 34rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-card__edit {
  display: flex;
  min-width: 132rpx;
  height: 64rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0 20rpx;
  box-sizing: border-box;
  border-radius: 16rpx;
  background: #ffca05;
  color: #28220c;
  font-size: 28rpx;
  font-weight: 600;
}

.template-card__edit--hover {
  opacity: 0.8;
}

.product-type-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 40rpx;
  overflow: hidden;
  border: 4rpx solid #ff3154;
  border-radius: 28rpx;
  background: #fff;
}

.product-type-tabs__item {
  display: flex;
  min-height: 70rpx;
  align-items: center;
  justify-content: center;
  color: #7a7b7e;
  font-size: 38rpx;
  font-weight: 600;
}

.product-type-tabs__item--active {
  color: #fff;
  background: #f82b4d;
}

.product-search {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 34rpx;
  padding: 0 26rpx;
  min-height: 92rpx;
  box-sizing: border-box;
  border-radius: 20rpx;
  background: #fff;
}

.product-search__icon {
  flex-shrink: 0;
  color: #999b9f;
  font-size: 48rpx;
}

.product-search__input {
  min-width: 0;
  flex: 1;
  color: #393b40;
  font-size: 32rpx;
}

.product-search__placeholder {
  color: #a5a6aa;
}

.product-status-tabs {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24rpx;
  margin: 26rpx 8rpx 24rpx;
  overflow-x: auto;
}

.product-status-tabs__item {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10rpx;
  color: #b8b9bc;
  font-size: 28rpx;
  line-height: 1.3;
}

.product-status-tabs__item--active {
  color: #56585c;
}

.product-status-tabs__radio {
  width: 26rpx;
  height: 26rpx;
  box-sizing: border-box;
  border: 4rpx solid #c6c7ca;
  border-radius: 50%;
}

.product-status-tabs__item--active .product-status-tabs__radio {
  border-color: #66686d;
  box-shadow: inset 0 0 0 5rpx #fff;
  background: #66686d;
}

.template-product-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.template-product-card {
  display: flex;
  min-height: 220rpx;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  box-sizing: border-box;
  border-radius: 26rpx;
  background: #fff;
  box-shadow: 0 8rpx 22rpx rgba(70, 74, 84, 0.03);
}

.template-product-card__image {
  width: 170rpx;
  height: 170rpx;
  flex-shrink: 0;
  border-radius: 18rpx;
  background: #f2f2f2;
}

.template-product-card__body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 12rpx;
}

.template-product-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.template-product-card__name {
  display: -webkit-box;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #202332;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.template-product-card__stock,
.template-product-card__id,
.template-product-card__label {
  color: #a4a5aa;
  font-size: 26rpx;
}

.template-product-card__stock {
  flex-shrink: 0;
  line-height: 1.3;
}

.template-product-card__id {
  line-height: 1.25;
}

.template-product-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14rpx;
}

.template-product-card__status-wrap {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
}

.template-product-card__status-line {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.template-product-card__price {
  color: #ff633e;
  font-size: 31rpx;
  line-height: 1.25;
}

.template-product-card__status {
  color: #14161b;
  font-size: 30rpx;
  line-height: 1.25;
}

.template-product-card__status--configured {
  color: #24b84b;
}

.template-product-card__status--unconfigured {
  color: #1298c4;
}

.template-product-card__status--off-shelf {
  color: #14161b;
}

.template-product-card__action {
  display: flex;
  min-width: 156rpx;
  height: 64rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0 18rpx;
  box-sizing: border-box;
  border-radius: 16rpx;
  background: #ffca05;
  color: #28220c;
  font-size: 28rpx;
  font-weight: 600;
}

.template-product-card__action--hover {
  opacity: 0.8;
}

.product-list-state,
.product-list-end {
  display: block;
  color: #a7a8ad;
  font-size: 30rpx;
  text-align: center;
}

.product-list-state {
  padding: 100rpx 0;
}

.product-list-end {
  padding: 44rpx 0;
}

@media (max-width: 700rpx) {
  .template-apply-page__content {
    padding-right: 18rpx;
    padding-left: 18rpx;
  }

  .product-type-tabs {
    margin-top: 30rpx;
  }

  .product-status-tabs {
    justify-content: flex-start;
    gap: 18rpx;
  }

  .template-product-card {
    gap: 16rpx;
    padding: 18rpx;
  }

  .template-product-card__image {
    width: 142rpx;
    height: 142rpx;
  }

  .template-product-card__name {
    font-size: 29rpx;
  }

  .template-product-card__stock,
  .template-product-card__id,
  .template-product-card__label {
    font-size: 22rpx;
  }

  .template-product-card__price,
  .template-product-card__status {
    font-size: 25rpx;
  }

  .template-product-card__action,
  .template-card__edit {
    min-width: 132rpx;
    height: 56rpx;
    padding: 0 10rpx;
    font-size: 24rpx;
  }
}
</style>
