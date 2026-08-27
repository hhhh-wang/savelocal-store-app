<script lang="ts" setup>
import type { MerchantFoodProduct } from '@/api/types/merchant-food'
import { getMerchantFoodProductsPage } from '@/api/merchant-food'
import productImage from '@/static/images/item-image.png'
import { useMerchantFoodStore } from '@/store'

defineOptions({
  name: 'NewCustomerDiscountPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '选择立减项目',
  },
})

type ProductType = 'DEAL' | 'TAKEOUT'
type StatusFilter = 'all' | 'selling' | 'off-shelf' | 'active'

interface DiscountProduct {
  id: number
  name: string
  image: string
  price: number
  stock: number
  productType: ProductType
  isSelling: boolean
}

const fallbackUrl = '/pages/dashboard/marketing-activity/index'
const merchantFoodStore = useMerchantFoodStore()
const activeProductType = ref<ProductType>('DEAL')
const activeStatus = ref<StatusFilter>('all')
const keyword = ref('')
const loading = ref(false)
const products = ref<DiscountProduct[]>([])
const activeProductIds = ref<number[]>([])

const statusFilters: Array<{ key: StatusFilter, label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'selling', label: '在售中' },
  { key: 'off-shelf', label: '已下架' },
  { key: 'active', label: '活动中' },
]

const visibleProducts = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()
  return products.value.filter((product) => {
    if (product.productType !== activeProductType.value)
      return false

    if (normalizedKeyword && !product.name.toLowerCase().includes(normalizedKeyword)
      && !String(product.id).includes(normalizedKeyword)) {
      return false
    }

    const isActive = activeProductIds.value.includes(product.id)
    if (activeStatus.value === 'active')
      return isActive
    if (activeStatus.value === 'selling')
      return !isActive && product.isSelling
    if (activeStatus.value === 'off-shelf')
      return !isActive && !product.isSelling
    return true
  })
})

function mapProduct(product: MerchantFoodProduct): DiscountProduct {
  const displaySpec = product.specs?.find(spec => spec.isDisplay === '1') ?? product.specs?.[0]
  return {
    id: product.productId,
    name: product.productName,
    image: product.coverImageUrl || productImage,
    price: Number(displaySpec?.salePrice || 0),
    stock: Number(displaySpec?.stockQuantity || 0),
    productType: product.productType === 'DEAL' ? 'DEAL' : 'TAKEOUT',
    isSelling: product.auditStatus === '1' && product.saleStatus === 'ON_SALE',
  }
}

async function loadProducts() {
  loading.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    const result = await getMerchantFoodProductsPage(storeId, { pageNum: 1, pageSize: 100 })
    products.value = (result.rows || []).map(mapProduct)
  }
  catch (error) {
    console.error('加载立减项目失败:', error)
    products.value = []
    uni.showToast({ title: '商品加载失败，请重试', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function setProductType(type: ProductType) {
  activeProductType.value = type
}

function setStatus(status: StatusFilter) {
  activeStatus.value = status
}

function statusLabel(product: DiscountProduct) {
  if (activeProductIds.value.includes(product.id))
    return '活动中'
  return product.isSelling ? '在售中' : '已下架'
}

function toggleDiscount(product: DiscountProduct) {
  const isActive = activeProductIds.value.includes(product.id)
  activeProductIds.value = isActive
    ? activeProductIds.value.filter(id => id !== product.id)
    : [...activeProductIds.value, product.id]
  uni.showToast({ title: isActive ? '已取消立减活动' : '已设置立减活动', icon: 'success' })
}

function openDiscountSetting(product: DiscountProduct) {
  const query = [
    `id=${product.id}`,
    `name=${encodeURIComponent(product.name)}`,
    `image=${encodeURIComponent(product.image)}`,
    `price=${product.price}`,
    `stock=${product.stock}`,
    `status=${product.isSelling ? 'selling' : 'off-shelf'}`,
  ].join('&')

  uni.navigateTo({
    url: `/pages/dashboard/marketing-activity/new-customer-setting/index?${query}`,
    events: {
      discountPublished: (productId: number) => {
        if (!activeProductIds.value.includes(productId))
          activeProductIds.value = [...activeProductIds.value, productId]
      },
    },
  })
}

function handleDiscountAction(product: DiscountProduct) {
  if (activeProductIds.value.includes(product.id)) {
    toggleDiscount(product)
    return
  }
  openDiscountSetting(product)
}

onShow(() => {
  loadProducts().catch(() => {})
})
</script>

<template>
  <view class="new-customer-page">
    <view class="new-customer-page__content">
      <view class="new-customer-nav">
        <back-button
          :fallback-url="fallbackUrl"
          fallback-mode="navigateTo"
          color="#23262c"
          background="transparent"
          size="72rpx"
        />

        <text class="new-customer-nav__title">
          选择立减项目
        </text>

        <view class="new-customer-nav__spacer" />
      </view>

      <view class="product-type-tabs">
        <view
          class="product-type-tabs__item"
          :class="{ 'product-type-tabs__item--active': activeProductType === 'DEAL' }"
          @tap="setProductType('DEAL')"
        >
          团购
        </view>
        <view
          class="product-type-tabs__item"
          :class="{ 'product-type-tabs__item--active': activeProductType === 'TAKEOUT' }"
          @tap="setProductType('TAKEOUT')"
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
          @tap="setStatus(filter.key)"
        >
          <view class="product-status-tabs__radio" />
          <text>{{ filter.label }}</text>
        </view>
      </view>

      <view v-if="loading" class="product-list-state">
        正在加载项目
      </view>

      <view v-else-if="!visibleProducts.length" class="product-list-state">
        暂无符合条件的项目
      </view>

      <view v-else class="discount-product-list">
        <view
          v-for="product in visibleProducts"
          :key="product.id"
          class="discount-product-card"
        >
          <image class="discount-product-card__image" :src="product.image" mode="aspectFill" />

          <view class="discount-product-card__body">
            <view class="discount-product-card__header">
              <text class="discount-product-card__name">
                {{ product.name }}
              </text>
              <text class="discount-product-card__stock">
                库存:{{ product.stock }}
              </text>
            </view>

            <text class="discount-product-card__id">
              ID:{{ product.id }}
            </text>

            <view class="discount-product-card__footer">
              <view class="discount-product-card__status-wrap">
                <view class="discount-product-card__status-line">
                  <text class="discount-product-card__current-label">当前价:</text>
                  <text class="discount-product-card__price">¥ {{ product.price.toFixed(2) }}</text>
                </view>
                <view class="discount-product-card__status-line">
                  <text class="discount-product-card__current-label">状态:</text>
                  <text
                    class="discount-product-card__status"
                    :class="{
                      'discount-product-card__status--active': activeProductIds.includes(product.id),
                      'discount-product-card__status--selling': !activeProductIds.includes(product.id) && product.isSelling,
                    }"
                  >
                    {{ statusLabel(product) }}
                  </text>
                </view>
              </view>

              <view
                class="discount-product-card__action"
                hover-class="discount-product-card__action--hover"
                @tap="handleDiscountAction(product)"
              >
                {{ activeProductIds.includes(product.id) ? '取消活动' : '设置立减' }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <text v-if="!loading && products.length && visibleProducts.length" class="product-list-end">
        没有更多了
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.new-customer-page {
  min-height: 100vh;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #22252b;
}

.new-customer-page__content {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 24rpx) 24rpx calc(env(safe-area-inset-bottom) + 72rpx);
}

.new-customer-nav {
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) 72rpx;
  align-items: center;
  min-height: 72rpx;
}

.new-customer-nav__title {
  color: #202226;
  font-size: 44rpx;
  font-weight: 500;
  line-height: 1.25;
  text-align: center;
}

.new-customer-nav__spacer {
  width: 72rpx;
  height: 72rpx;
}

.product-type-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 64rpx;
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

.discount-product-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.discount-product-card {
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

.discount-product-card__image {
  width: 170rpx;
  height: 170rpx;
  flex-shrink: 0;
  border-radius: 18rpx;
  background: #f2f2f2;
}

.discount-product-card__body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 12rpx;
}

.discount-product-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.discount-product-card__name {
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

.discount-product-card__stock,
.discount-product-card__id,
.discount-product-card__current-label {
  color: #a4a5aa;
  font-size: 26rpx;
}

.discount-product-card__stock {
  flex-shrink: 0;
  line-height: 1.3;
}

.discount-product-card__id {
  line-height: 1.25;
}

.discount-product-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14rpx;
}

.discount-product-card__status-wrap {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
}

.discount-product-card__status-line {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.discount-product-card__price {
  color: #ff633e;
  font-size: 31rpx;
  line-height: 1.25;
}

.discount-product-card__status {
  color: #14161b;
  font-size: 30rpx;
  line-height: 1.25;
}

.discount-product-card__status--selling {
  color: #1298c4;
}

.discount-product-card__status--active {
  color: #24b84b;
}

.discount-product-card__action {
  display: flex;
  min-width: 156rpx;
  height: 64rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0 18rpx;
  box-sizing: border-box;
  border-radius: 16rpx;
  color: #28220c;
  font-size: 28rpx;
  font-weight: 600;
  background: #ffca05;
}

.discount-product-card__action--hover {
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
  .new-customer-page__content {
    padding-right: 18rpx;
    padding-left: 18rpx;
  }

  .product-type-tabs {
    margin-top: 46rpx;
  }

  .product-status-tabs {
    justify-content: flex-start;
    gap: 18rpx;
  }

  .discount-product-card {
    gap: 16rpx;
    padding: 18rpx;
  }

  .discount-product-card__image {
    width: 142rpx;
    height: 142rpx;
  }

  .discount-product-card__name {
    font-size: 29rpx;
  }

  .discount-product-card__stock,
  .discount-product-card__id,
  .discount-product-card__current-label {
    font-size: 22rpx;
  }

  .discount-product-card__price,
  .discount-product-card__status {
    font-size: 25rpx;
  }

  .discount-product-card__action {
    min-width: 132rpx;
    height: 56rpx;
    padding: 0 10rpx;
    font-size: 24rpx;
  }
}
</style>
