<script lang="ts" setup>
import productImage from '@/static/images/item-image.png'

defineOptions({
  name: 'ProductLibraryPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '商品管理',
  },
})

type ProductStatus = '上架' | '下架'
type ProductAction = '上架' | '下架'
type ProductEditorPayload = {
  name: string
  imageUrl: string
  kind: 'single' | 'set'
  tag: string
  price: string
  unit: string
  description: string
}

interface ProductItem {
  id: string
  name: string
  stock: number
  unitLabel: string
  price: string
  status: ProductStatus
  actionLabel: ProductAction
  image: string
}

type HeaderAction = '批量下架' | '新建商品'

const fallbackUrl = '/pages/dashboard/product-management/index'
const isBatchMode = ref(false)
const selectedProductIds = ref<string[]>([])

const products: ProductItem[] = [
  {
    id: 'product-001',
    name: '现炒青椒炒黄牛肉盖码饭',
    stock: 9999,
    unitLabel: '单品',
    price: '25.90',
    status: '上架',
    actionLabel: '下架',
    image: productImage,
  },
  {
    id: 'product-002',
    name: '现炒青椒炒黄牛肉盖码饭',
    stock: 9999,
    unitLabel: '套餐',
    price: '25.90',
    status: '下架',
    actionLabel: '上架',
    image: productImage,
  },
  {
    id: 'product-003',
    name: '招牌小炒肉双拼盖饭',
    stock: 9999,
    unitLabel: '单品',
    price: '32.90',
    status: '上架',
    actionLabel: '下架',
    image: productImage,
  },
  {
    id: 'product-004',
    name: '香辣鸡腿堡欢乐套餐',
    stock: 888,
    unitLabel: '套餐',
    price: '19.90',
    status: '下架',
    actionLabel: '上架',
    image: productImage,
  },
]

const totalCount = computed(() => products.length)
const selectedCount = computed(() => selectedProductIds.value.length)

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

function buildProductEditorPayload(product: ProductItem): ProductEditorPayload {
  return {
    name: product.name,
    imageUrl: product.image,
    kind: product.unitLabel === '套餐' ? 'set' : 'single',
    tag: '无',
    price: product.price.split('.')[0] || product.price,
    unit: '份',
    description: '',
  }
}

function navigateToEditor(mode: 'create' | 'edit', product?: ProductItem) {
  const query = [`mode=${mode}`]

  if (product) {
    query.push(`id=${product.id}`)
    query.push(`product=${encodeURIComponent(JSON.stringify(buildProductEditorPayload(product)))}`)
  }

  uni.navigateTo({
    url: `/pages/dashboard/product-editor/index?${query.join('&')}`,
  })
}

function handleHeaderAction(action: HeaderAction) {
  if (action === '批量下架') {
    isBatchMode.value = !isBatchMode.value

    if (!isBatchMode.value) {
      selectedProductIds.value = []
    }

    return
  }

  if (action === '新建商品') {
    navigateToEditor('create')
    return
  }

  uni.showToast({
    title: `${action}功能待接入`,
    icon: 'none',
  })
}

function handleProductAction(product: ProductItem, action: 'detail' | 'stock' | 'edit' | ProductAction) {
  if (isBatchMode.value) {
    toggleProductSelection(product.id)
    return
  }

  if (action === 'edit') {
    navigateToEditor('edit', product)
    return
  }

  const actionTextMap: Record<'detail' | 'stock' | 'edit' | ProductAction, string> = {
    detail: '商品详情',
    stock: '库存管理',
    edit: '商品编辑',
    上架: '商品上架',
    下架: '商品下架',
  }

  uni.showToast({
    title: `${product.name}${actionTextMap[action]}待接入`,
    icon: 'none',
  })
}

function toggleProductSelection(productId: string) {
  if (selectedProductIds.value.includes(productId)) {
    selectedProductIds.value = selectedProductIds.value.filter(id => id !== productId)
    return
  }

  selectedProductIds.value = [...selectedProductIds.value, productId]
}
</script>

<template>
  <view class="product-library-page">
    <view class="product-library-page__content">
      <view class="product-library-nav">
        <view class="product-library-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="navigateTo"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />

          <text class="product-library-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="product-library-nav__title">
          商品管理
        </text>

        <view class="product-library-nav__spacer" />
      </view>

      <view class="product-library-toolbar">
        <text class="product-library-toolbar__count">
          {{ isBatchMode ? `已选择${selectedCount}个` : `${totalCount}个商品` }}
        </text>

        <view class="product-library-toolbar__actions">
          <view
            class="product-library-toolbar__button"
            hover-class="product-library-toolbar__button--hover"
            :class="{ 'product-library-toolbar__button--active': isBatchMode }"
            @tap="handleHeaderAction('批量下架')"
          >
            {{ isBatchMode ? '完成' : '批量下架' }}
          </view>

          <view
            v-if="!isBatchMode"
            class="product-library-toolbar__button"
            hover-class="product-library-toolbar__button--hover"
            @tap="handleHeaderAction('新建商品')"
          >
            新建商品
          </view>
        </view>
      </view>

      <view class="product-library-list">
        <view
          v-for="product in products"
          :key="product.id"
          class="product-item"
          :class="{ 'product-item--batch': isBatchMode }"
          hover-class="product-item--hover"
          @tap="handleProductAction(product, 'detail')"
        >
          <view
            v-if="isBatchMode"
            class="product-item__checkbox"
            :class="{ 'product-item__checkbox--checked': selectedProductIds.includes(product.id) }"
          >
            <text class="product-item__checkbox-icon">✓</text>
          </view>

          <image class="product-item__image" :src="product.image" mode="aspectFill" />

          <view class="product-item__content">
            <view class="product-item__main">
              <view class="product-item__top">
                <view class="product-item__info">
                  <view class="product-item__headline">
                    <text class="product-item__name">
                      {{ product.name }}
                    </text>

                    <text class="product-item__chevron">
                      ›
                    </text>
                  </view>

                  <text class="product-item__stock">
                    库存 {{ product.stock }}
                  </text>

                  <view class="product-item__meta">
                    <text class="product-item__unit">
                      ({{ product.unitLabel }})
                    </text>

                    <text class="product-item__price">
                      ¥{{ product.price }}
                    </text>
                  </view>
                </view>

              </view>

              <view class="product-item__bottom">
                <text
                  class="product-item__status"
                  :class="{
                    'product-item__status--offline': product.status === '下架',
                  }"
                >
                  已{{ product.status }}
                </text>

                <view v-if="!isBatchMode" class="product-item__actions">
                  <view
                    class="product-item__action-button"
                    hover-class="product-item__action-button--hover"
                    @tap.stop="handleProductAction(product, 'edit')"
                  >
                    编辑
                  </view>

                  <view
                    class="product-item__action-button"
                    hover-class="product-item__action-button--hover"
                    @tap.stop="handleProductAction(product, 'stock')"
                  >
                    库存
                  </view>

                  <view
                    class="product-item__action-button"
                    hover-class="product-item__action-button--hover"
                    @tap.stop="handleProductAction(product, product.actionLabel)"
                  >
                    {{ product.actionLabel }}
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.product-library-page {
  min-height: 100vh;
  background: #ffffff;
}

.product-library-page__content {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 18rpx) 18rpx calc(env(safe-area-inset-bottom) + 36rpx);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.98) 160rpx, #fdfdfd 160rpx, #fdfdfd 100%);
}

.product-library-nav {
  display: grid;
  grid-template-columns: 190rpx 1fr 190rpx;
  align-items: center;
  min-height: 72rpx;
}

.product-library-nav__left {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.product-library-nav__close {
  color: #2d3138;
  font-size: 28rpx;
  line-height: 1;
}

.product-library-nav__title {
  color: #202226;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.product-library-nav__spacer {
  width: 190rpx;
  height: 72rpx;
}

.product-library-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 34rpx;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid #f2f2f2;
}

.product-library-toolbar__count {
  flex-shrink: 0;
  color: #595d64;
  font-size: 30rpx;
  line-height: 1.2;
}

.product-library-toolbar__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16rpx;
  flex-wrap: wrap;
}

.product-library-toolbar__button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 144rpx;
  height: 68rpx;
  padding: 0 24rpx;
  border: 2rpx solid #d8d8d8;
  border-radius: 12rpx;
  color: #33363d;
  font-size: 26rpx;
  font-weight: 600;
  background: #ffffff;
  box-sizing: border-box;
}

.product-library-toolbar__button--hover {
  opacity: 0.86;
}

.product-library-toolbar__button--active {
  color: #ffffff;
  border-color: #ff8b1f;
  background: #ff8b1f;
}

.product-library-list {
  background: #ffffff;
}

.product-item {
  display: flex;
  gap: 20rpx;
  padding: 28rpx 0;
  border-bottom: 2rpx solid #f4f4f4;
}

.product-item--batch {
  align-items: center;
}

.product-item--hover {
  opacity: 0.94;
}

.product-item__checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
  margin-top: 6rpx;
  border: 2rpx solid #d3d7dd;
  border-radius: 50%;
  box-sizing: border-box;
}

.product-item__checkbox--checked {
  border-color: #ff8b1f;
  background: #ff8b1f;
}

.product-item__checkbox-icon {
  color: transparent;
  font-size: 22rpx;
  line-height: 1;
}

.product-item__checkbox--checked .product-item__checkbox-icon {
  color: #ffffff;
}

.product-item__image {
  width: 132rpx;
  height: 132rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
  background: #f3f3f3;
}

.product-item__content {
  flex: 1;
  min-width: 0;
}

.product-item__main {
  display: flex;
  min-height: 132rpx;
  flex-direction: column;
  justify-content: space-between;
}

.product-item__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.product-item__info {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.product-item__headline {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.product-item__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #33363d;
  font-size: 35rpx;
  font-weight: 700;
  line-height: 1.28;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-item__stock {
  margin-top: 8rpx;
  color: #7f848d;
  font-size: 30rpx;
  line-height: 1.2;
}

.product-item__unit {
  color: #9ca1aa;
  font-size: 28rpx;
  line-height: 1.2;
}

.product-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 12rpx;
}

.product-item__chevron {
  flex-shrink: 0;
  color: #898e96;
  font-size: 50rpx;
  line-height: 1;
}

.product-item__bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12rpx;
  margin-top: 20rpx;
}

.product-item__status {
  flex-shrink: 0;
  color: #ff8b1f;
  font-size: 28rpx;
  line-height: 1.2;
}

.product-item__status--offline {
  color: #ff4949;
}

.product-item__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16rpx;
  flex-wrap: wrap;
}

.product-item__price {
  color: #ff3b30;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1;
}

.product-item__action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 122rpx;
  height: 60rpx;
  padding: 0 22rpx;
  border: 2rpx solid #d5d7dc;
  border-radius: 10rpx;
  color: #4b4f56;
  font-size: 30rpx;
  line-height: 1;
  background: #ffffff;
  box-sizing: border-box;
}

.product-item__action-button--hover {
  opacity: 0.84;
}
</style>
