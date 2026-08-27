<script lang="ts" setup>
import productImage from '@/static/images/item-image.png'

declare const getOpenerEventChannel: () => {
  emit: (event: string, ...args: unknown[]) => void
}

defineOptions({
  name: 'NewCustomerDiscountSettingPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '新客立减活动修改',
  },
})

type InventoryLimit = 'unlimited' | 'limited'

interface ActivityProduct {
  id: number
  name: string
  image: string
  price: number
  stock: number
  isSelling: boolean
}

const fallbackUrl = '/pages/dashboard/marketing-activity/new-customer/index'
const today = new Date().toISOString().slice(0, 10)
const submitting = ref(false)
const agreed = ref(false)
const discountAmount = ref('')
const validStartDate = ref(today)
const validEndDate = ref('')
const inventoryLimit = ref<InventoryLimit>('limited')
const limitedStock = ref('500')
const product = reactive<ActivityProduct>({
  id: 0,
  name: '商品项目',
  image: productImage,
  price: 0,
  stock: 0,
  isSelling: false,
})

const discountValue = computed(() => Number(discountAmount.value || 0))
const discountedPrice = computed(() => Math.max(0, product.price - discountValue.value))
const discountRangeText = computed(() => {
  const maximum = Math.max(0.1, product.price - 0.1)
  return `0.1-${maximum.toFixed(2)} 元`
})
const validPeriodText = computed(() => {
  if (!validEndDate.value)
    return '请选择'
  return `${validStartDate.value} 至 ${validEndDate.value}`
})

function decodeText(value?: string) {
  if (!value)
    return ''
  try {
    return decodeURIComponent(value)
  }
  catch {
    return value
  }
}

function parseNonNegativeNumber(value?: string) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

function handleDiscountInput(event: { detail?: { value?: string } }) {
  const raw = event.detail?.value || ''
  const sanitized = raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
  const [integerPart, decimalPart] = sanitized.split('.')
  discountAmount.value = decimalPart === undefined
    ? integerPart
    : `${integerPart || '0'}.${decimalPart.slice(0, 2)}`
}

function handleStockInput(event: { detail?: { value?: string } }) {
  limitedStock.value = (event.detail?.value || '').replace(/\D/g, '')
}

function handleStartDateChange(event: { detail?: { value?: string } }) {
  const value = event.detail?.value || today
  validStartDate.value = value
  if (validEndDate.value && validEndDate.value < value)
    validEndDate.value = ''
}

function handleEndDateChange(event: { detail?: { value?: string } }) {
  validEndDate.value = event.detail?.value || ''
}

function showActivityRules() {
  uni.showModal({
    title: '活动说明',
    content: '新用户首次购买该项目时可享受本次设置的立减优惠。活动商品库存达到设定上限后，优惠将自动结束。',
    showCancel: false,
    confirmText: '我知道了',
  })
}

function validateForm() {
  if (discountValue.value < 0.1 || discountValue.value >= product.price)
    return `立减金额需在0.1至${Math.max(0.1, product.price - 0.01).toFixed(2)}元之间`
  if (!validEndDate.value)
    return '请选择立减券有效期'
  if (validEndDate.value < validStartDate.value)
    return '结束日期不能早于开始日期'
  if (inventoryLimit.value === 'limited') {
    const quantity = Number(limitedStock.value)
    if (!Number.isInteger(quantity) || quantity < 1)
      return '请填写至少1份活动库存'
  }
  if (!agreed.value)
    return '请阅读并同意活动提报规则'
  return ''
}

function publishActivity() {
  const errorMessage = validateForm()
  if (errorMessage) {
    uni.showToast({ title: errorMessage, icon: 'none' })
    return
  }
  if (submitting.value)
    return

  submitting.value = true
  const eventChannel = getOpenerEventChannel()
  eventChannel.emit('discountPublished', product.id)
  uni.showToast({ title: '立减活动已发布', icon: 'success' })
  setTimeout(() => {
    submitting.value = false
    uni.navigateBack()
  }, 360)
}

onLoad((options) => {
  product.id = Number(options?.id || 0)
  product.name = decodeText(options?.name) || product.name
  product.image = decodeText(options?.image) || productImage
  product.price = parseNonNegativeNumber(options?.price)
  product.stock = Math.floor(parseNonNegativeNumber(options?.stock))
  product.isSelling = options?.status === 'selling'
  if (product.stock > 0)
    limitedStock.value = String(Math.min(product.stock, 500))
})
</script>

<template>
  <view class="discount-setting-page">
    <view class="discount-setting-page__content">
      <view class="discount-setting-nav">
        <back-button
          :fallback-url="fallbackUrl"
          fallback-mode="navigateTo"
          color="#25272c"
          background="transparent"
          size="64rpx"
        />

        <text class="discount-setting-nav__title">
          新客立减活动修改
        </text>

        <view class="discount-setting-nav__rules" hover-class="discount-setting-nav__rules--hover" @tap="showActivityRules">
          <text>活动说明</text>
        </view>
      </view>

      <view class="activity-product-card">
        <image class="activity-product-card__image" :src="product.image" mode="aspectFill" />
        <view class="activity-product-card__body">
          <view class="activity-product-card__heading">
            <text class="activity-product-card__name">{{ product.name }}</text>
            <text class="activity-product-card__stock">库存:{{ product.stock }}</text>
          </view>
          <text class="activity-product-card__id">ID:{{ product.id || '--' }}</text>
          <view class="activity-product-card__meta">
            <text>当前价:</text>
            <text class="activity-product-card__price">¥ {{ product.price.toFixed(2) }}</text>
            <text>状态:</text>
            <text class="activity-product-card__status" :class="{ 'activity-product-card__status--selling': product.isSelling }">
              {{ product.isSelling ? '在售中' : '已下架' }}
            </text>
          </view>
        </view>
      </view>

      <text class="discount-setting-section-title">立减活动设置</text>

      <view class="discount-setting-card">
        <view class="discount-setting-row discount-setting-row--discount">
          <view class="discount-setting-row__label">
            <text>我要减</text>
            <text class="discount-setting-row__required">*</text>
          </view>
          <view class="discount-setting-row__value discount-setting-row__value--discount">
            <view class="discount-setting-row__amount-input-wrap">
              <input
                :value="discountAmount"
                class="discount-setting-row__amount-input"
                type="digit"
                :placeholder="discountRangeText"
                placeholder-class="discount-setting-row__range"
                @input="handleDiscountInput"
              >
              <text class="discount-setting-row__unit">元</text>
            </view>
            <text class="discount-setting-row__preview">
              最终售价=当前价-我要减<br>
              折扣后活动价:<text>{{ discountedPrice.toFixed(2) }}元</text>
            </text>
          </view>
        </view>

        <view class="discount-setting-divider" />

        <view class="discount-setting-row">
          <view class="discount-setting-row__label">
            <text>立减券有效期</text>
            <text class="discount-setting-row__required">*</text>
          </view>
          <view class="discount-setting-row__value discount-setting-row__value--date">
            <picker mode="date" :start="today" :value="validStartDate" @change="handleStartDateChange">
              <text class="discount-setting-row__date-value">{{ validPeriodText }}</text>
            </picker>
            <picker mode="date" :start="validStartDate" :value="validEndDate" @change="handleEndDateChange">
              <view class="discount-setting-row__date-picker">
                <text>选择结束日期</text>
                <view class="i-carbon-chevron-right" />
              </view>
            </picker>
          </view>
        </view>

        <view class="discount-setting-divider" />

        <view class="discount-setting-row discount-setting-row--stock">
          <view class="discount-setting-row__label">
            <text>售卖库存数</text>
            <text class="discount-setting-row__required">*</text>
          </view>
          <view class="discount-setting-row__value discount-setting-row__value--stock">
            <view class="discount-setting-stock-option" @tap="inventoryLimit = 'unlimited'">
              <view class="discount-setting-radio" :class="{ 'discount-setting-radio--selected': inventoryLimit === 'unlimited' }" />
              <text>不限</text>
            </view>
            <view class="discount-setting-stock-option" @tap="inventoryLimit = 'limited'">
              <view class="discount-setting-radio" :class="{ 'discount-setting-radio--selected': inventoryLimit === 'limited' }" />
              <text>最多</text>
            </view>
            <view class="discount-setting-stock-input-wrap" :class="{ 'discount-setting-stock-input-wrap--disabled': inventoryLimit !== 'limited' }">
              <input
                :value="limitedStock"
                class="discount-setting-stock-input"
                type="number"
                :disabled="inventoryLimit !== 'limited'"
                @input="handleStockInput"
              >
            </view>
            <text class="discount-setting-row__unit">份</text>
          </view>
        </view>
      </view>
    </view>

    <view class="discount-setting-footer">
      <view class="discount-setting-agreement" @tap="agreed = !agreed">
        <view class="discount-setting-checkbox" :class="{ 'discount-setting-checkbox--checked': agreed }">
          <view v-if="agreed" class="i-carbon-checkmark" />
        </view>
        <text>已阅读并同意</text>
        <text class="discount-setting-agreement__link" @tap.stop="showActivityRules">《促销活动提报规则》</text>
      </view>
      <button
        class="discount-setting-publish"
        hover-class="discount-setting-publish--hover"
        :loading="submitting"
        :disabled="submitting"
        @tap="publishActivity"
      >
        修改并发布
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.discount-setting-page {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 166rpx);
  box-sizing: border-box;
  background: #f5f5f5;
  color: #25272c;
}

.discount-setting-page__content {
  padding: calc(env(safe-area-inset-top) + 18rpx) 20rpx 28rpx;
}

.discount-setting-nav {
  display: grid;
  grid-template-columns: 64rpx minmax(0, 1fr) 142rpx;
  align-items: center;
  min-height: 64rpx;
}

.discount-setting-nav__title {
  color: #202226;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
}

.discount-setting-nav__rules {
  display: flex;
  justify-self: end;
  align-items: center;
  gap: 6rpx;
  color: #34363b;
  font-size: 30rpx;
}

.discount-setting-nav__rules--hover {
  opacity: 0.7;
}



.activity-product-card {
  display: flex;
  gap: 16rpx;
  width: calc(100% + 16rpx);
  margin: 32rpx -8rpx 34rpx;
  padding: 26rpx 24rpx;
  box-sizing: border-box;
  border-radius: 14rpx;
  background: #fff;
}

.activity-product-card__image {
  width: 150rpx;
  height: 150rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
  background: #f2f2f2;
}

.activity-product-card__body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 7rpx;
}

.activity-product-card__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14rpx;
}

.activity-product-card__name {
  display: -webkit-box;
  overflow: hidden;
  color: #202332;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.activity-product-card__stock,
.activity-product-card__id,
.activity-product-card__meta {
  color: #a4a5aa;
  font-size: 30rpx;
  line-height: 1.25;
}

.activity-product-card__stock {
  flex-shrink: 0;
}

.activity-product-card__meta {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  flex-wrap: wrap;
}

.activity-product-card__price {
  color: #ff633e;
}

.activity-product-card__status {
  color: #313338;
}

.activity-product-card__status--selling {
  color: #42b943;
}

.discount-setting-section-title {
  display: block;
  margin: 22rpx 0 14rpx;
  color: #3a3d43;
  font-size: 34rpx;
  font-weight: 700;
}

.discount-setting-card {
  overflow: hidden;
  border-radius: 14rpx;
  background: #fff;
}

.discount-setting-row {
  display: flex;
  min-height: 88rpx;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 18rpx 20rpx;
  box-sizing: border-box;
}

.discount-setting-row--discount {
  min-height: 174rpx;
  padding-top: 24rpx;
  padding-bottom: 24rpx;
}

.discount-setting-row__label {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  color: #303238;
  font-size: 30rpx;
  font-weight: 500;
}

.discount-setting-row__required {
  margin-left: 4rpx;
  color: #ff4949;
}

.discount-setting-row__value {
  display: flex;
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
}

.discount-setting-row__value--discount {
  position: relative;
  min-height: 126rpx;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 16rpx;
}

.discount-setting-row__amount-input-wrap {
  display: flex;
  min-width: 244rpx;
  align-items: center;
  gap: 8rpx;
}

.discount-setting-row__amount-input {
  width: 220rpx;
  height: 34rpx;
  color: #202226;
  font-size: 30rpx;
  font-weight: 600;
  text-align: right;
}

.discount-setting-row__unit {
  flex-shrink: 0;
  color: #4d5057;
  font-size: 30rpx;
}

.discount-setting-row__range {
  color: #c3c4c8;
  font-size: 30rpx;
}

.discount-setting-row__preview {
  display: block;
  min-width: 244rpx;
  margin-top: 0;
  color: #9fa1a7;
  font-size: 30rpx;
  line-height: 2;
  text-align: right;
}

.discount-setting-row__preview text {
  color: #f34637;
  font-weight: 700;
}

.discount-setting-divider {
  height: 1rpx;
  margin: 0 20rpx;
  background: #f0f0f0;
}

.discount-setting-row__value--date {
  align-items: center;
  gap: 16rpx;
}

.discount-setting-row__date-value {
  display: block;
  max-width: 220rpx;
  overflow: hidden;
  color: #a9aaae;
  font-size: 30rpx;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.discount-setting-row__date-picker {
  display: flex;
  align-items: center;
  gap: 4rpx;
  color: #a9aaae;
  font-size: 30rpx;
}

.discount-setting-row__value--stock {
  align-items: center;
  gap: 12rpx;
}

.discount-setting-stock-option {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6rpx;
  color: #4c4f56;
  font-size: 30rpx;
}

.discount-setting-radio {
  width: 26rpx;
  height: 26rpx;
  box-sizing: border-box;
  border: 2rpx solid #c6c8ce;
  border-radius: 50%;
}

.discount-setting-radio--selected {
  border-color: #ffca05;
  box-shadow: inset 0 0 0 6rpx #ffca05;
}

.discount-setting-stock-input-wrap {
  width: 86rpx;
  height: 50rpx;
  border: 1rpx solid #e0e1e4;
  border-radius: 10rpx;
  background: #fff;
}

.discount-setting-stock-input-wrap--disabled {
  background: #f4f4f5;
}

.discount-setting-stock-input {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  color: #34363b;
  font-size: 30rpx;
  text-align: center;
}

.discount-setting-footer {
  position: fixed;
  z-index: 2;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 16rpx 24rpx calc(env(safe-area-inset-bottom) + 20rpx);
  box-sizing: border-box;
  border-top: 1rpx solid #ededee;
  background: #fff;
}

.discount-setting-agreement {
  display: flex;
  align-items: center;
  gap: 7rpx;
  margin-bottom: 16rpx;
  color: #5f6269;
  font-size: 30rpx;
}

.discount-setting-checkbox {
  display: flex;
  width: 28rpx;
  height: 28rpx;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 2rpx solid #c8c9cc;
  border-radius: 50%;
  color: #fff;
  font-size: 20rpx;
}

.discount-setting-checkbox--checked {
  border-color: #ffca05;
  background: #ffca05;
}

.discount-setting-agreement__link {
  color: #2e83e6;
}

.discount-setting-publish {
  display: flex;
  width: 100%;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 12rpx;
  color: #26200a;
  font-size: 30rpx;
  font-weight: 600;
  background: #ffcc05;
}

.discount-setting-publish--hover {
  opacity: 0.8;
}
</style>
