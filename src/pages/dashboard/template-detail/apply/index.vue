<script lang="ts" setup>
import productImage from '@/static/images/item-image.png'

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

interface TemplateProduct {
  id: number
  name: string
  image: string
  price: number
  stock: number
  productType: ProductType
  onShelf: boolean
  templateApplied: boolean
}

interface OpenerEventChannel {
  emit: (eventName: string, ...args: any[]) => void
}

const fallbackUrl = '/pages/dashboard/template-detail/index'

const templateName = ref('购买须知1')
const activeProductType = ref<ProductType>('DEAL')
const activeStatus = ref<StatusFilter>('all')
const keyword = ref('')
const products = ref<TemplateProduct[]>([
  { id: 1354137879, name: '饱藏食坊代金券', image: productImage, price: 98, stock: 29, productType: 'DEAL', onShelf: true, templateApplied: true },
  { id: 1359213174, name: '【店招】青椒肉丝盖饭单人餐', image: productImage, price: 14, stock: 29, productType: 'DEAL', onShelf: false, templateApplied: false },
  { id: 1361540877, name: '【现炒】万坪豆腐丝炒肉盖码饭', image: productImage, price: 14, stock: 29, productType: 'DEAL', onShelf: true, templateApplied: false },
  { id: 1362245101, name: '【外卖】农家小炒肉双人套餐', image: productImage, price: 32, stock: 50, productType: 'TAKEOUT', onShelf: true, templateApplied: false },
  { id: 1363346202, name: '【外卖】香干回锅肉盖码饭', image: productImage, price: 18, stock: 50, productType: 'TAKEOUT', onShelf: true, templateApplied: true },
])

let openerEventChannel: OpenerEventChannel | null = null

const statusFilters: Array<{ key: StatusFilter, label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'configured', label: '已配置' },
  { key: 'unconfigured', label: '未配置' },
  { key: 'off-shelf', label: '已下架' },
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

    if (activeStatus.value === 'configured')
      return product.templateApplied
    if (activeStatus.value === 'unconfigured')
      return !product.templateApplied
    if (activeStatus.value === 'off-shelf')
      return !product.onShelf
    return true
  })
})

function confirmModal(options: { title: string, content: string, confirmColor?: string }) {
  return new Promise<UniApp.ShowModalRes>((resolve) => {
    uni.showModal({ ...options, success: resolve })
  })
}

function statusLabel(product: TemplateProduct) {
  if (product.templateApplied)
    return '已设置'
  return product.onShelf ? '未配置' : '已下架'
}

function statusClass(product: TemplateProduct) {
  if (product.templateApplied)
    return 'template-product-card__status--configured'
  return product.onShelf ? 'template-product-card__status--unconfigured' : 'template-product-card__status--off-shelf'
}

function formatPrice(price: number) {
  return Number.isInteger(price) ? String(price) : price.toFixed(2)
}

function handleEditName() {
  uni.showModal({
    title: '编辑模板名称',
    editable: true,
    placeholderText: '请输入模板名称',
    content: templateName.value,
    success: (result) => {
      if (!result.confirm)
        return
      const name = result.content?.trim()
      if (!name || name === templateName.value)
        return
      templateName.value = name
      openerEventChannel?.emit('templateRenamed', name)
      uni.showToast({ title: '已保存', icon: 'success' })
    },
  })
}

async function handleTemplateAction(product: TemplateProduct) {
  if (product.templateApplied) {
    const result = await confirmModal({
      title: '取消配置',
      content: `确认取消「${product.name}」的模板配置吗？`,
      confirmColor: '#d94141',
    })
    if (!result.confirm)
      return
    product.templateApplied = false
    uni.showToast({ title: '已取消配置', icon: 'success' })
    return
  }

  product.templateApplied = true
  uni.showToast({ title: '已配置模板', icon: 'success' })
}

onLoad((options) => {
  const name = options?.name ? decodeURIComponent(options.name) : ''
  if (name)
    templateName.value = name

  const currentPage = getCurrentPages()[getCurrentPages().length - 1] as {
    getOpenerEventChannel?: () => OpenerEventChannel
  } | undefined

  openerEventChannel = currentPage?.getOpenerEventChannel?.() || null
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

      <view v-if="!visibleProducts.length" class="product-list-state">
        暂无符合条件的项目
      </view>

      <view v-else class="template-product-list">
        <view
          v-for="product in visibleProducts"
          :key="product.id"
          class="template-product-card"
        >
          <image class="template-product-card__image" :src="product.image" mode="aspectFill" />

          <view class="template-product-card__body">
            <view class="template-product-card__header">
              <text class="template-product-card__name">
                {{ product.name }}
              </text>
              <text class="template-product-card__stock">
                库存:{{ product.stock }}
              </text>
            </view>

            <text class="template-product-card__id">
              ID:{{ product.id }}
            </text>

            <view class="template-product-card__footer">
              <view class="template-product-card__status-wrap">
                <view class="template-product-card__status-line">
                  <text class="template-product-card__label">当前价:</text>
                  <text class="template-product-card__price">¥ {{ formatPrice(product.price) }}</text>
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
                {{ product.templateApplied ? '取消配置' : '配置模板' }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <text v-if="visibleProducts.length" class="product-list-end">
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
