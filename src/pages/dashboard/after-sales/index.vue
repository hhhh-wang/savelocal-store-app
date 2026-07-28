<script lang="ts" setup>
import type { MerchantFoodRefund } from '@/api/types/merchant-food'
import {
  approveMerchantFoodRefund,
  getMerchantFoodRefundDetail,
  getMerchantFoodRefundsPage,
  rejectMerchantFoodRefund,
} from '@/api/merchant-food'
import productImage from '@/static/images/item-image.png'
import { useMerchantFoodStore } from '@/store'

defineOptions({
  name: 'AfterSalesPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '售后管理',
  },
})

type RefundType = 'before' | 'after'
type RefundStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
type RefundFilterStatus = 'all' | RefundStatus
type OrderAction = '联系客户' | '拒绝退款' | '确认退款'

interface AfterSalesOrder {
  id: string
  orderNo: string
  storeName: string
  storeInitial: string
  productName: string
  orderTime: string
  amount: string
  quantity: number
  refundType: RefundType
  status: RefundStatus
  image: string
  actions: OrderAction[]
}

const fallbackUrl = '/pages/dashboard/index'
const merchantFoodStore = useMerchantFoodStore()

const refundTabs = [
  { key: 'before', label: '消费前退款' },
  { key: 'after', label: '消费后退款' },
] as const

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'approved', label: '已同意' },
  { key: 'rejected', label: '已拒绝' },
  { key: 'cancelled', label: '已取消' },
] as const

const statusLabelMap: Record<RefundStatus, string> = {
  pending: '待处理',
  approved: '已同意',
  rejected: '已拒绝',
  cancelled: '已取消',
}

const orders = ref<AfterSalesOrder[]>([])
const activeRefundType = ref<RefundType>('before')
const activeStatus = ref<RefundFilterStatus>('all')
const searchKeyword = ref('')

function mapRefund(refund: MerchantFoodRefund): AfterSalesOrder {
  const status: RefundStatus = refund.refundStatus === '0'
    ? 'pending'
    : refund.refundStatus === '4'
      ? 'rejected'
      : refund.refundStatus === '5'
        ? 'cancelled'
        : 'approved'
  return {
    id: String(refund.refundId),
    orderNo: refund.orderNo,
    storeName: refund.storeName,
    storeInitial: refund.storeName.slice(0, 1) || '店',
    productName: refund.productSummary || refund.productName || '退款商品',
    orderTime: '--',
    amount: String(refund.refundAmount ?? 0),
    quantity: refund.quantity || 1,
    refundType: refund.refundType === 'AFTER' ? 'after' : 'before',
    status,
    image: refund.productImage || productImage,
    actions: status === 'pending' ? ['联系客户', '拒绝退款', '确认退款'] : ['联系客户'],
  }
}

async function loadRefunds() {
  const storeId = await merchantFoodStore.ensureCurrentStoreId()
  const statusCode = activeStatus.value === 'pending'
    ? '0'
    : activeStatus.value === 'rejected'
      ? '4'
      : activeStatus.value === 'cancelled'
        ? '5'
        : undefined
  const result = await getMerchantFoodRefundsPage({
    storeId,
    pageNum: 1,
    pageSize: 100,
    refundType: activeRefundType.value === 'after' ? 'AFTER' : 'BEFORE',
    refundStatus: statusCode,
    keyword: searchKeyword.value.trim() || undefined,
  })
  orders.value = result.rows.map(mapRefund).filter(item => activeStatus.value !== 'approved' || item.status === 'approved')
}

const filteredOrders = computed(() => {
  const keyword = searchKeyword.value.trim()

  return orders.value.filter((order) => {
    const matchType = order.refundType === activeRefundType.value
    const matchStatus = activeStatus.value === 'all' || order.status === activeStatus.value
    const matchKeyword = !keyword || order.productName.includes(keyword) || order.orderNo.includes(keyword)

    return matchType && matchStatus && matchKeyword
  })
})

function switchRefundType(type: RefundType) {
  activeRefundType.value = type
  loadRefunds().catch(() => {})
}

function switchStatus(status: RefundFilterStatus) {
  activeStatus.value = status
  loadRefunds().catch(() => {})
}

function handleClose() {
  const pages = getCurrentPages()

  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  uni.reLaunch({
    url: fallbackUrl,
  })
}

function handleSearch() {
  uni.hideKeyboard()
  loadRefunds().catch(() => {})
}

async function handleOrderAction(action: OrderAction, order: AfterSalesOrder) {
  const refundId = Number(order.id)
  if (action === '联系客户') {
    const detail = await getMerchantFoodRefundDetail(refundId)
    uni.showModal({ title: '客户联系方式', content: detail.memberMobileMask || '暂无联系方式', showCancel: false })
    return
  }
  if (action === '确认退款')
    await approveMerchantFoodRefund(refundId)
  if (action === '拒绝退款')
    await rejectMerchantFoodRefund(refundId)
  await loadRefunds()
  uni.showToast({ title: action === '确认退款' ? '已同意退款' : '已拒绝退款', icon: 'success' })
}

onLoad((options) => {
  searchKeyword.value = options?.keyword ? decodeURIComponent(options.keyword) : ''
})

onShow(() => {
  loadRefunds().catch(() => {})
})
</script>

<template>
  <view class="after-sales-page">
    <view class="after-sales-page__glow after-sales-page__glow--left" />
    <view class="after-sales-page__glow after-sales-page__glow--right" />

    <view class="after-sales-page__content">
      <view class="after-sales-nav">
        <view class="after-sales-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="reLaunch"
            color="#22252b"
            background="transparent"
            size="72rpx"
          />

          <text class="after-sales-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="after-sales-nav__title">
          售后管理
        </text>

        <view class="after-sales-nav__spacer" />
      </view>

      <view class="after-sales-search">
        <view class="after-sales-search__box">
          <view class="after-sales-search__icon" />
          <input
            v-model="searchKeyword"
            class="after-sales-search__input"
            placeholder="请输入商品名称或订单编号"
            placeholder-class="after-sales-search__placeholder"
            confirm-type="search"
            @confirm="handleSearch"
          >
        </view>

        <view class="after-sales-search__action" hover-class="after-sales-search__action--hover" @tap="handleSearch">
          <view class="after-sales-search__action-icon" />
          <text class="after-sales-search__action-text">
            搜索
          </text>
        </view>
      </view>

      <view class="after-sales-tabs">
        <view
          v-for="tab in refundTabs"
          :key="tab.key"
          class="after-sales-tabs__item"
          :class="{ 'after-sales-tabs__item--active': tab.key === activeRefundType }"
          @tap="switchRefundType(tab.key)"
        >
          <text class="after-sales-tabs__label">
            {{ tab.label }}
          </text>
        </view>
      </view>

      <scroll-view class="after-sales-status-scroll" scroll-x enhanced :show-scrollbar="false">
        <view class="after-sales-status-list">
          <view
            v-for="status in statusTabs"
            :key="status.key"
            class="after-sales-status-list__item"
            :class="{ 'after-sales-status-list__item--active': status.key === activeStatus }"
            @tap="switchStatus(status.key)"
          >
            {{ status.label }}
          </view>
        </view>
      </scroll-view>

      <view class="after-sales-order-list">
        <view v-for="order in filteredOrders" :key="order.id" class="after-sales-card">
          <view class="after-sales-card__header">
            <view class="after-sales-card__store">
              <view class="after-sales-card__store-logo">
                {{ order.storeInitial }}
              </view>
              <text class="after-sales-card__store-name">
                {{ order.storeName }}&gt;
              </text>
            </view>

            <text
              class="after-sales-card__status"
              :class="`after-sales-card__status--${order.status}`"
            >
              {{ statusLabelMap[order.status] }}
            </text>
          </view>

          <view class="after-sales-card__body">
            <image class="after-sales-card__image" :src="order.image" mode="aspectFill" />

            <view class="after-sales-card__info">
              <view class="after-sales-card__summary">
                <text class="after-sales-card__product-name">
                  {{ order.productName }}
                </text>

                <view class="after-sales-card__amount-wrap">
                  <text class="after-sales-card__currency">
                    ¥
                  </text>
                  <text class="after-sales-card__amount">
                    {{ order.amount }}
                  </text>
                  <text class="after-sales-card__unit">
                    元
                  </text>
                </view>
              </view>

              <view class="after-sales-card__meta">
                <text class="after-sales-card__meta-text">
                  下单时间：{{ order.orderTime }}
                </text>
                <text class="after-sales-card__count">
                  （共{{ order.quantity }}件）
                </text>
              </view>
            </view>
          </view>

          <view class="after-sales-card__actions">
            <view
              v-for="action in order.actions"
              :key="action"
              class="after-sales-card__action"
              hover-class="after-sales-card__action--hover"
              :class="{ 'after-sales-card__action--primary': action === '确认退款' }"
              @tap="handleOrderAction(action, order)"
            >
              {{ action }}
            </view>
          </view>
        </view>

        <view v-if="!filteredOrders.length" class="after-sales-empty">
          <text class="after-sales-empty__title">
            暂无匹配的售后订单
          </text>
          <text class="after-sales-empty__desc">
            可尝试切换退款类型、处理状态或调整搜索关键词
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.after-sales-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f8f8fa 18%, #f3f4f7 100%);
}

.after-sales-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.after-sales-page__glow--left {
  top: -120rpx;
  left: -120rpx;
  width: 420rpx;
  height: 300rpx;
  background: radial-gradient(circle, rgba(255, 226, 126, 0.28) 0%, rgba(255, 226, 126, 0) 72%);
}

.after-sales-page__glow--right {
  top: -50rpx;
  right: -120rpx;
  width: 360rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(231, 231, 236, 0.88) 0%, rgba(231, 231, 236, 0) 70%);
}

.after-sales-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 22rpx calc(env(safe-area-inset-bottom) + 36rpx);
}

.after-sales-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
}

.after-sales-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.after-sales-nav__close {
  color: #30343a;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}

.after-sales-nav__title {
  color: #1d2025;
  font-size: 20px;
  font-weight: 400;
  text-align: center;
}

.after-sales-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.after-sales-search {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 28rpx;
}

.after-sales-search__box {
  display: flex;
  flex: 1;
  align-items: center;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12rpx 32rpx rgba(78, 83, 99, 0.07);
}

.after-sales-search__icon,
.after-sales-search__action-icon {
  position: relative;
  width: 28rpx;
  height: 28rpx;
  border: 4rpx solid currentcolor;
  border-radius: 50%;
  box-sizing: border-box;
}

.after-sales-search__icon {
  flex-shrink: 0;
  color: #adb1ba;
}

.after-sales-search__icon::after,
.after-sales-search__action-icon::after {
  position: absolute;
  right: -7rpx;
  bottom: -5rpx;
  width: 11rpx;
  height: 4rpx;
  background: currentcolor;
  border-radius: 999rpx;
  content: '';
  transform: rotate(45deg);
}

.after-sales-search__input {
  flex: 1;
  min-width: 0;
  margin-left: 16rpx;
  color: #23262c;
  font-size: 28rpx;
}

.after-sales-search__placeholder {
  color: #b7bbc3;
}

.after-sales-search__action {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8rpx;
  color: #ff8a00;
}

.after-sales-search__action--hover {
  opacity: 0.82;
}

.after-sales-search__action-text {
  font-size: 34rpx;
  font-weight: 600;
}

.after-sales-tabs {
  display: flex;
  gap: 56rpx;
  margin-top: 34rpx;
  padding-left: 8rpx;
}

.after-sales-tabs__item {
  position: relative;
  padding-bottom: 16rpx;
}

.after-sales-tabs__item--active::after {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 32rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #ffd400;
  content: '';
  transform: translateX(-50%);
}

.after-sales-tabs__label {
  color: #5c6068;
  font-size: 34rpx;
  font-weight: 700;
}

.after-sales-tabs__item--active .after-sales-tabs__label {
  color: #22252b;
}

.after-sales-status-scroll {
  width: 100%;
  margin-top: 24rpx;
  white-space: nowrap;
}

.after-sales-status-list {
  display: inline-flex;
  gap: 16rpx;
  min-width: 100%;
  padding: 0 2rpx 6rpx;
  box-sizing: border-box;
}

.after-sales-status-list__item {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: 110rpx;
  height: 54rpx;
  padding: 0 22rpx;
  border: 2rpx solid #d6d9e0;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #5d626b;
  font-size: 28rpx;
  font-weight: 600;
  box-sizing: border-box;
}

.after-sales-status-list__item--active {
  border-color: #ffd24a;
  color: #2d3137;
  box-shadow: 0 8rpx 20rpx rgba(255, 210, 74, 0.16);
}

.after-sales-order-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 24rpx;
}

.after-sales-card {
  padding: 22rpx 20rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 40rpx rgba(56, 61, 86, 0.08);
}

.after-sales-card__header,
.after-sales-card__store,
.after-sales-card__body,
.after-sales-card__summary,
.after-sales-card__meta,
.after-sales-card__actions {
  display: flex;
  align-items: center;
}

.after-sales-card__header {
  justify-content: space-between;
  gap: 16rpx;
}

.after-sales-card__store {
  gap: 10rpx;
  min-width: 0;
}

.after-sales-card__store-logo {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: linear-gradient(180deg, #ff4c45 0%, #df1711 100%);
  color: #fff4d9;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 16rpx rgba(223, 23, 17, 0.22);
}

.after-sales-card__store-name {
  overflow: hidden;
  color: #2f3339;
  font-size: 28rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.after-sales-card__status {
  flex-shrink: 0;
  font-size: 30rpx;
  font-weight: 700;
}

.after-sales-card__status--pending {
  color: #ff5b4d;
}

.after-sales-card__status--approved {
  color: #c1c4cb;
}

.after-sales-card__status--rejected {
  color: #ff7b63;
}

.after-sales-card__status--cancelled {
  color: #b4b8c1;
}

.after-sales-card__body {
  align-items: flex-start;
  gap: 18rpx;
  margin-top: 18rpx;
}

.after-sales-card__image {
  flex-shrink: 0;
  width: 132rpx;
  height: 132rpx;
  border-radius: 20rpx;
}

.after-sales-card__info {
  flex: 1;
  min-width: 0;
}

.after-sales-card__summary {
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.after-sales-card__product-name {
  flex: 1;
  min-width: 0;
  color: #4a4e55;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.35;
}

.after-sales-card__amount-wrap {
  display: flex;
  flex-shrink: 0;
  align-items: baseline;
  color: #2b2f35;
}

.after-sales-card__currency,
.after-sales-card__unit {
  font-size: 28rpx;
  font-weight: 700;
}

.after-sales-card__amount {
  margin: 0 4rpx;
  color: #ff3a2f;
  font-size: 42rpx;
  font-weight: 800;
  line-height: 1;
}

.after-sales-card__meta {
  justify-content: space-between;
  gap: 12rpx;
  margin-top: 12rpx;
}

.after-sales-card__meta-text,
.after-sales-card__count {
  color: #8d929b;
  font-size: 24rpx;
}

.after-sales-card__actions {
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 20rpx;
}

.after-sales-card__action {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 136rpx;
  height: 56rpx;
  padding: 0 18rpx;
  border: 2rpx solid #7f838b;
  border-radius: 999rpx;
  color: #5f636b;
  font-size: 26rpx;
  font-weight: 600;
  background: #fff;
  box-sizing: border-box;
}

.after-sales-card__action--primary {
  color: #4a4e55;
  border-color: #6e727b;
}

.after-sales-card__action--hover {
  opacity: 0.82;
}

.after-sales-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 88rpx 32rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16rpx 36rpx rgba(56, 61, 86, 0.06);
}

.after-sales-empty__title {
  color: #434850;
  font-size: 30rpx;
  font-weight: 700;
}

.after-sales-empty__desc {
  margin-top: 12rpx;
  color: #8b909a;
  font-size: 25rpx;
  text-align: center;
}
</style>
