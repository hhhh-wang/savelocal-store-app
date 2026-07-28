<script lang="ts" setup>
import type { MerchantFoodOrder } from '@/api/types/merchant-food'
import { getMerchantFoodOrderContact, getMerchantFoodOrderDetail, getMerchantFoodOrdersPage } from '@/api/merchant-food'
import arrowDownIcon from '@/static/icons/arrow-down.png'
import productImage from '@/static/images/item-image.png'
import { useMerchantFoodStore } from '@/store'

defineOptions({
  name: 'OrderManagementPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '订单管理',
  },
})

type OrderTab = 'all' | 'todo'
type TimeFilter = 'all' | 'quarter'
type OrderStatus = 'all' | 'pending' | 'completed' | 'cancelled' | 'refunded'
type TodoAction = '联系客户' | '拒绝退款' | '确认退款'
type NormalAction = '联系客户' | '订单详情'

interface OrderItem {
  id: number
  scene: 'ONSITE' | 'GROUP_BUY'
  orderNo: string
  productName: string
  orderTime: string
  amount: string
  quantity: number
  status: Exclude<OrderStatus, 'all'>
  statusText: string
  isTodo: boolean
  image: string
  actions: Array<TodoAction | NormalAction>
}

const fallbackUrl = '/pages/dashboard/index'
const merchantFoodStore = useMerchantFoodStore()

const topTabs = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '待办' },
] as const

const timeOptions = [
  { key: 'all', label: '全部时间' },
  { key: 'quarter', label: '近三个月' },
] as const

const statusOptions = [
  { key: 'all', label: '全部状态' },
  { key: 'pending', label: '待处理' },
  { key: 'cancelled', label: '已取消' },
] as const

const allOrders = ref<OrderItem[]>([])
const activeTab = ref<OrderTab>('all')
const activeTimeFilter = ref<TimeFilter>('all')
const activeStatusFilter = ref<OrderStatus>('all')
const openDropdown = ref<'time' | 'status' | ''>('')

function mapOrder(order: MerchantFoodOrder): OrderItem {
  const status = order.orderStatus.toLowerCase() as Exclude<OrderStatus, 'all'>
  return {
    id: order.orderId,
    scene: order.scene,
    orderNo: order.orderNo,
    productName: order.productName || '订单商品',
    orderTime: '--',
    amount: String(order.amount ?? 0),
    quantity: order.quantity || 1,
    status,
    statusText: order.statusText,
    isTodo: order.todo,
    image: order.imageUrl || productImage,
    actions: order.todo ? ['联系客户', '拒绝退款', '确认退款'] : ['联系客户', '订单详情'],
  }
}

async function loadOrders() {
  const storeId = await merchantFoodStore.ensureCurrentStoreId()
  const result = await getMerchantFoodOrdersPage({
    storeId,
    pageNum: 1,
    pageSize: 100,
    scene: 'ALL',
    todoOnly: activeTab.value === 'todo' ? true : undefined,
    timeRange: activeTimeFilter.value === 'quarter' ? 'QUARTER' : undefined,
    orderStatus: activeStatusFilter.value === 'all' ? undefined : activeStatusFilter.value.toUpperCase(),
  })
  allOrders.value = result.rows.map(mapOrder)
}

const activeTimeLabel = computed(() => {
  return timeOptions.find(option => option.key === activeTimeFilter.value)?.label || timeOptions[0].label
})

const activeStatusLabel = computed(() => {
  return statusOptions.find(option => option.key === activeStatusFilter.value)?.label || statusOptions[0].label
})

const filteredOrders = computed(() => allOrders.value)

function isRecentThreeMonths(orderTime: string) {
  const [datePart] = orderTime.split(' ')
  const [year, month, day] = datePart.split('/').map(Number)
  const orderDate = new Date(year, (month || 1) - 1, day || 1)
  const currentDate = new Date(2026, 4, 26)
  const compareDate = new Date(currentDate)
  compareDate.setMonth(compareDate.getMonth() - 3)

  return orderDate >= compareDate && orderDate <= currentDate
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

function switchTab(tab: OrderTab) {
  activeTab.value = tab
  loadOrders().catch(() => {})
}

function toggleDropdown(type: 'time' | 'status') {
  openDropdown.value = openDropdown.value === type ? '' : type
}

function selectTimeFilter(filter: TimeFilter) {
  activeTimeFilter.value = filter
  openDropdown.value = ''
  loadOrders().catch(() => {})
}

function selectStatusFilter(filter: OrderStatus) {
  activeStatusFilter.value = filter
  openDropdown.value = ''
  loadOrders().catch(() => {})
}

function closeDropdown() {
  openDropdown.value = ''
}

async function handleOrderAction(action: TodoAction | NormalAction, order: OrderItem) {
  if (action === '联系客户') {
    const result = await getMerchantFoodOrderContact(order.scene, order.id)
    uni.showModal({ title: '客户联系方式', content: result.contact, showCancel: false })
    return
  }
  if (action === '订单详情') {
    const detail = await getMerchantFoodOrderDetail(order.scene, order.id)
    const items = detail.items?.map(item => `${item.productNameSnapshot} x${item.quantity}`).join('\n')
    uni.showModal({ title: `订单 ${detail.orderNo}`, content: items || `${detail.productName} x${detail.quantity}`, showCancel: false })
    return
  }
  uni.navigateTo({ url: `/pages/dashboard/after-sales/index?keyword=${encodeURIComponent(order.orderNo)}` })
}

onShow(() => {
  loadOrders().catch(() => {})
})
</script>

<template>
  <view class="order-page" @tap="closeDropdown">
    <view class="order-page__content">
      <view class="order-nav">
        <view class="order-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="reLaunch"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />

          <text class="order-nav__close" @tap.stop="handleClose">
            关闭
          </text>
        </view>

        <text class="order-nav__title">
          订单管理
        </text>

        <view class="order-nav__spacer" />
      </view>

      <view class="order-tabs">
        <view
          v-for="tab in topTabs"
          :key="tab.key"
          class="order-tabs__item"
          :class="{ 'order-tabs__item--active': tab.key === activeTab }"
          @tap.stop="switchTab(tab.key)"
        >
          {{ tab.label }}
        </view>
      </view>

      <view class="order-filters">
        <view class="order-filter-group">
          <view class="order-filter" :class="{ 'order-filter--open': openDropdown === 'time' }" @tap.stop="toggleDropdown('time')">
            <text class="order-filter__label">
              {{ activeTimeLabel }}
            </text>
            <image
              class="order-filter__arrow"
              :class="{ 'order-filter__arrow--open': openDropdown === 'time' }"
              :src="arrowDownIcon"
              mode="aspectFit"
            />
          </view>

          <view v-if="openDropdown === 'time'" class="order-dropdown" @tap.stop>
            <view
              v-for="option in timeOptions"
              :key="option.key"
              class="order-dropdown__item"
              :class="{ 'order-dropdown__item--active': option.key === activeTimeFilter }"
              @tap.stop="selectTimeFilter(option.key)"
            >
              <text class="order-dropdown__text">
                {{ option.label }}
              </text>
              <text v-if="option.key === activeTimeFilter" class="order-dropdown__check">
                ✓
              </text>
            </view>
          </view>
        </view>

        <view class="order-filter-group">
          <view class="order-filter" :class="{ 'order-filter--open': openDropdown === 'status' }" @tap.stop="toggleDropdown('status')">
            <text class="order-filter__label">
              {{ activeStatusLabel }}
            </text>
            <image
              class="order-filter__arrow"
              :class="{ 'order-filter__arrow--open': openDropdown === 'status' }"
              :src="arrowDownIcon"
              mode="aspectFit"
            />
          </view>

          <view v-if="openDropdown === 'status'" class="order-dropdown order-dropdown--wide" @tap.stop>
            <view
              v-for="option in statusOptions"
              :key="option.key"
              class="order-dropdown__item"
              :class="{ 'order-dropdown__item--active': option.key === activeStatusFilter }"
              @tap.stop="selectStatusFilter(option.key)"
            >
              <text class="order-dropdown__text">
                {{ option.label }}
              </text>
              <text v-if="option.key === activeStatusFilter" class="order-dropdown__check">
                ✓
              </text>
            </view>
          </view>
        </view>
      </view>

      <view class="order-list">
        <view v-for="order in filteredOrders" :key="order.id" class="order-card">
          <view class="order-card__header">
            <text class="order-card__no">
              订单编号:{{ order.orderNo }}
            </text>
            <text
              class="order-card__status"
              :class="{
                'order-card__status--pending': order.status === 'pending',
              }"
            >
              {{ order.statusText }}
            </text>
          </view>

          <view class="order-card__body">
            <image class="order-card__image" :src="order.image" mode="aspectFill" />

            <view class="order-card__info">
              <view class="order-card__main">
                <text class="order-card__title">
                  {{ order.productName }}
                </text>

                <view class="order-card__price">
                  <text class="order-card__currency">
                    ¥
                  </text>
                  <text class="order-card__amount">
                    {{ order.amount }}
                  </text>
                  <text class="order-card__unit">
                    元
                  </text>
                </view>
              </view>

              <view class="order-card__meta">
                <text class="order-card__time">
                  下单时间：{{ order.orderTime }}
                </text>
                <text class="order-card__count">
                  （共{{ order.quantity }}件）
                </text>
              </view>
            </view>
          </view>

          <view class="order-card__actions">
            <view
              v-for="action in order.actions"
              :key="action"
              class="order-card__action"
              hover-class="order-card__action--hover"
              @tap.stop="handleOrderAction(action, order)"
            >
              {{ action }}
            </view>
          </view>
        </view>

        <view v-if="!filteredOrders.length" class="order-empty">
          <text class="order-empty__title">
            暂无订单
          </text>
          <text class="order-empty__desc">
            请尝试切换 tab 或筛选条件
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.order-page {
  min-height: 100vh;
  background: #f5f5f6;
}

.order-page__content {
  padding: calc(env(safe-area-inset-top) + 18rpx) 0 calc(env(safe-area-inset-bottom) + 36rpx);
}

.order-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  padding: 0 12rpx;
}

.order-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.order-nav__close {
  color: #26282d;
  font-size: 30rpx;
  font-weight: 500;
}

.order-nav__title {
  color: #1f2328;
  font-size: 34rpx;
  font-weight: 600;
  text-align: center;
}

.order-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.order-tabs {
  display: flex;
  width: 400rpx;
  height: 60rpx;
  margin: 22rpx auto 20rpx;
  overflow: hidden;
  border: 2rpx solid #f4bc1a;
  border-radius: 16rpx;
  background: #fff;
}

.order-tabs__item {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  color: #5c5f66;
  font-size: 32rpx;
  font-weight: 500;
}

.order-tabs__item--active {
  color: #16181d;
  font-weight: 700;
  background: #ffc31a;
}

.order-filters {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 44rpx;
  padding: 22rpx 18rpx 20rpx;
  background: #fff;
}

.order-filter-group {
  position: relative;
}

.order-filter {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-height: 40rpx;
}

.order-filter--open .order-filter__label,
.order-filter--open .order-filter__arrow {
  color: #ff7f1f;
}

.order-filter__label {
  color: #ff7f1f;
  font-size: 32rpx;
  font-weight: 500;
}

.order-filter__label {
  line-height: 1.2;
}

.order-filter__arrow {
  width: 20rpx;
  height: 12rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.order-filter__arrow--open {
  transform: rotate(180deg);
}

.order-dropdown {
  position: absolute;
  top: 54rpx;
  left: 0;
  z-index: 10;
  min-width: 190rpx;
  padding: 16rpx 22rpx;
  border-radius: 22rpx;
  background: #fff;
  box-shadow: 0 14rpx 36rpx rgba(65, 68, 79, 0.12);
}

.order-dropdown--wide {
  min-width: 280rpx;
}

.order-dropdown__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  min-height: 62rpx;
  color: #ff7f1f;
  font-size: 32rpx;
  font-weight: 500;
}

.order-dropdown__item--active {
  font-weight: 700;
}

.order-dropdown__check {
  color: #ff9d00;
  font-size: 32rpx;
  font-weight: 700;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 18rpx;
}

.order-card {
  overflow: hidden;
  border-radius: 30rpx;
  background: #fff;
  box-shadow: 0 10rpx 30rpx rgba(79, 84, 98, 0.06);
}

.order-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 28rpx 24rpx 0;
}

.order-card__no {
  color: #6a6d73;
  font-size: 28rpx;
}

.order-card__status {
  flex-shrink: 0;
  color: #7d8088;
  font-size: 28rpx;
}

.order-card__status--pending {
  color: #ff3c2f;
}

.order-card__body {
  display: flex;
  gap: 20rpx;
  padding: 22rpx 24rpx 0;
}

.order-card__image {
  width: 140rpx;
  height: 140rpx;
  flex-shrink: 0;
  border-radius: 24rpx;
}

.order-card__info {
  flex: 1;
  min-width: 0;
}

.order-card__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.order-card__title {
  flex: 1;
  color: #404247;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.35;
}

.order-card__price {
  display: flex;
  align-items: baseline;
  color: #4a4c52;
  white-space: nowrap;
}

.order-card__currency {
  margin-right: 4rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.order-card__amount {
  color: #ff3c2f;
  font-size: 46rpx;
  font-weight: 700;
  line-height: 1;
}

.order-card__unit {
  margin-left: 4rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.order-card__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 16rpx;
  color: #73767d;
}

.order-card__time {
  font-size: 25rpx;
}

.order-card__count {
  font-size: 28rpx;
  color: #b3b5ba;
  white-space: nowrap;
}

.order-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  padding: 24rpx 24rpx 26rpx;
}

.order-card__action {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 138rpx;
  height: 58rpx;
  padding: 0 20rpx;
  border: 2rpx solid #66696f;
  border-radius: 999rpx;
  color: #66696f;
  font-size: 30rpx;
  background: #fff;
}

.order-card__action--hover {
  opacity: 0.9;
}

.order-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 120rpx 0 80rpx;
  color: #8e929b;
}

.order-empty__title {
  font-size: 32rpx;
  font-weight: 600;
}

.order-empty__desc {
  font-size: 26rpx;
}
</style>
