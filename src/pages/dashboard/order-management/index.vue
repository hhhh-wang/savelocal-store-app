<script lang="ts" setup>
import type {
  MerchantFoodOrder,
  MerchantFoodOrderDetail,
  MerchantFoodOrderStatus,
  MerchantFoodScene,
} from '@/api/types/merchant-food'
import { confirmMerchantFoodRefund, getMerchantFoodOrderContact, getMerchantFoodOrderDetail, getMerchantFoodOrdersPage, rejectMerchantFoodRefund } from '@/api/merchant-food'
import arrowDownIcon from '@/static/icons/arrow-down.png'
import arrowUpIcon from '@/static/icons/arrow-up.png'
import phoneIcon from '@/static/icons/phone.png'
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
type OrderStatus = 'all' | Lowercase<MerchantFoodOrderStatus>
type TodoAction = '联系客户' | '拒绝退款' | '确认退款'
type NormalAction = '联系客户' | '订单详情'
type TakeoutAction = '取消订单' | '确认出餐' | '驳回退款' | '确认退款'

interface TakeoutOrderProduct {
  id: number
  name: string
  quantity: number
}

interface OrderItem {
  id: number
  scene: Exclude<MerchantFoodScene, 'ALL'>
  orderNo: string
  productName: string
  orderTime: string
  amount: string
  originalAmount: string
  cityCoinDeductAmount: string
  quantity: number
  status: Exclude<OrderStatus, 'all'>
  statusText: string
  isTodo: boolean
  refundId?: number
  image: string
  actions: Array<TodoAction | NormalAction>
  payTime: string
  customerName: string
  customerMobileMask: string
  deliveryAddress: string
  deliveryStatus: string
  dispatchStatus: string
  distanceKm?: number | string
  courierName: string
  courierPhone: string
  riderUpdateTime: string
  buyerRemark: string
  products: TakeoutOrderProduct[]
  productKinds: number
  detailLoaded: boolean
}

const fallbackUrl = '/pages/dashboard/index'
const merchantFoodStore = useMerchantFoodStore()

const topTabs = [
  { key: 'todo', label: '待办' },
  { key: 'all', label: '全部' },
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
const activeTab = ref<OrderTab>('todo')
const activeTimeFilter = ref<TimeFilter>('all')
const activeStatusFilter = ref<OrderStatus>('all')
const openDropdown = ref<'time' | 'status' | ''>('')
const expandedOrderIds = ref<number[]>([])
const loadingOrderIds = ref<number[]>([])
const currentTimestamp = ref(Date.now())
let clockTimer: ReturnType<typeof setInterval> | undefined
let loadSequence = 0

function mapOrder(order: MerchantFoodOrder): OrderItem {
  const status = order.orderStatus.toLowerCase() as Exclude<OrderStatus, 'all'>
  const productName = order.productName || '订单商品'
  return {
    id: order.orderId,
    scene: order.scene,
    orderNo: order.orderNo,
    productName,
    orderTime: order.scene === 'TAKEOUT' ? order.orderTime || '--' : '--',
    amount: String(order.amount ?? 0),
    originalAmount: String(order.originalAmount ?? order.amount ?? 0),
    cityCoinDeductAmount: String(order.cityCoinDeductAmount ?? 0),
    quantity: order.quantity || 1,
    status,
    statusText: order.statusText,
    isTodo: order.todo,
    refundId: order.refundId,
    image: order.imageUrl || productImage,
    actions: order.todo ? ['联系客户', '拒绝退款', '确认退款'] : ['联系客户', '订单详情'],
    payTime: order.payTime || order.orderTime || '',
    customerName: order.customerName || '顾客',
    customerMobileMask: order.customerMobileMask || '',
    deliveryAddress: order.deliveryAddress || '',
    deliveryStatus: order.deliveryStatus || '',
    dispatchStatus: order.dispatchStatus || '',
    distanceKm: order.distanceKm,
    courierName: order.courierName || '',
    courierPhone: order.courierPhone || '',
    riderUpdateTime: order.riderUpdateTime || '',
    buyerRemark: order.buyerRemark || '',
    products: [{ id: order.orderId, name: productName, quantity: order.quantity || 1 }],
    productKinds: order.productKinds || 1,
    detailLoaded: false,
  }
}

function mergeTakeoutDetail(order: OrderItem, detail: MerchantFoodOrderDetail): OrderItem {
  const fulfillment = detail.fulfillment || {}
  const latestTimeline = detail.timeline?.[0]
  const products = detail.items?.length
    ? detail.items.map(item => ({
        id: item.itemId,
        name: item.productNameSnapshot || '订单商品',
        quantity: item.quantity || 1,
      }))
    : order.products

  return {
    ...order,
    productName: detail.productName || order.productName,
    orderTime: detail.orderTime || order.orderTime,
    payTime: detail.payTime || detail.orderTime || order.payTime,
    amount: String(detail.amount ?? order.amount),
    originalAmount: String(detail.originalAmount ?? order.originalAmount),
    cityCoinDeductAmount: String(detail.cityCoinDeductAmount ?? order.cityCoinDeductAmount),
    quantity: detail.quantity || order.quantity,
    status: detail.orderStatus.toLowerCase() as Exclude<OrderStatus, 'all'>,
    statusText: detail.statusText || order.statusText,
    isTodo: detail.todo,
    customerName: fulfillment.deliveryContactName || detail.memberNickname || order.customerName,
    customerMobileMask: detail.memberMobileMask || maskPhone(fulfillment.deliveryContactPhone) || order.customerMobileMask,
    deliveryAddress: fulfillment.deliveryFullAddress || detail.deliveryAddress || order.deliveryAddress,
    deliveryStatus: fulfillment.deliveryStatus || order.deliveryStatus,
    dispatchStatus: fulfillment.dispatchStatus || order.dispatchStatus,
    distanceKm: fulfillment.distanceKm ?? order.distanceKm,
    courierName: fulfillment.courierName || order.courierName,
    courierPhone: fulfillment.courierTel || order.courierPhone,
    riderUpdateTime: latestTimeline?.eventTime
      || latestTimeline?.createTime
      || fulfillment.lastStatusTime
      || order.riderUpdateTime,
    buyerRemark: detail.buyerRemark || fulfillment.buyerRemark || order.buyerRemark,
    products,
    productKinds: products.length,
    detailLoaded: true,
  }
}

const refundDialog = reactive({
  visible: false,
  submitting: false,
  order: undefined as OrderItem | undefined,
  refundAmount: '',
  cityCoinReturnAmount: '',
})

const isGroupBuyRefund = computed(() => refundDialog.order?.scene === 'GROUP_BUY')

function openRefundDialog(order: OrderItem) {
  if (!order.refundId) {
    uni.showToast({ title: '退款申请不存在，请刷新后重试', icon: 'none' })
    return
  }
  refundDialog.order = order
  refundDialog.refundAmount = formatAmount(order.amount)
  refundDialog.cityCoinReturnAmount = formatAmount(order.cityCoinDeductAmount)
  refundDialog.visible = true
}

function closeRefundDialog() {
  if (refundDialog.submitting)
    return
  refundDialog.visible = false
  refundDialog.order = undefined
}

function parseRefundInput(value: string, maxAmount: string) {
  const amount = Number(value)
  const max = Number(maxAmount)
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(max) || amount > max) {
    return undefined
  }
  return Number(amount.toFixed(2))
}

async function submitRefundDialog() {
  const order = refundDialog.order
  if (!order?.refundId)
    return
  const refundAmount = isGroupBuyRefund.value
    ? Number(formatAmount(order.amount))
    : parseRefundInput(refundDialog.refundAmount, order.amount)
  const cityCoinReturnAmount = isGroupBuyRefund.value
    ? Number(formatAmount(order.cityCoinDeductAmount))
    : parseRefundInput(refundDialog.cityCoinReturnAmount, order.cityCoinDeductAmount)
  if (refundAmount === undefined || cityCoinReturnAmount === undefined) {
    uni.showToast({ title: '退款金额不能超过订单已支付金额', icon: 'none' })
    return
  }
  if (refundAmount === 0 && cityCoinReturnAmount === 0) {
    uni.showToast({ title: '两项退款金额不能同时为0', icon: 'none' })
    return
  }
  refundDialog.submitting = true
  try {
    await confirmMerchantFoodRefund(order.refundId, { refundAmount, cityCoinReturnAmount })
    refundDialog.visible = false
    refundDialog.order = undefined
    await loadOrders()
    uni.showToast({ title: '退款已提交', icon: 'success' })
  }
  catch {
    uni.showToast({ title: '退款提交失败，请重试', icon: 'none' })
  }
  finally {
    refundDialog.submitting = false
  }
}

function rejectRefund(order: OrderItem) {
  if (!order.refundId) {
    uni.showToast({ title: '退款申请不存在，请刷新后重试', icon: 'none' })
    return
  }
  uni.showModal({
    title: '拒绝退款',
    content: '确认拒绝该退款申请吗？',
    success: async ({ confirm }) => {
      if (!confirm) {
        return
      }
      try {
        await rejectMerchantFoodRefund(order.refundId, '商家拒绝退款')
        await loadOrders()
        uni.showToast({ title: '已拒绝退款', icon: 'success' })
      }
      catch {
        uni.showToast({ title: '拒绝退款失败，请重试', icon: 'none' })
      }
    },
  })
}

async function loadOrders() {
  const sequence = ++loadSequence
  expandedOrderIds.value = []
  loadingOrderIds.value = []
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
  if (sequence !== loadSequence)
    return

  allOrders.value = result.rows.map(mapOrder)
}

const activeTimeLabel = computed(() => {
  return timeOptions.find(option => option.key === activeTimeFilter.value)?.label || timeOptions[0].label
})

const activeStatusLabel = computed(() => {
  return statusOptions.find(option => option.key === activeStatusFilter.value)?.label || statusOptions[0].label
})

const filteredOrders = computed(() => allOrders.value)

function maskPhone(phone?: string) {
  if (!phone)
    return ''
  return phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone
}

function normalizeDeliveryStatus(order: OrderItem) {
  return order.deliveryStatus.toUpperCase()
}

function isRefundPending(order: OrderItem) {
  return order.isTodo || order.status === 'refunding'
}

function getTakeoutStatusText(order: OrderItem) {
  if (isRefundPending(order))
    return '待退款'
  if (order.status === 'refunded')
    return '已退款'
  if (order.status === 'cancelled' || normalizeDeliveryStatus(order) === 'CANCELLED')
    return '已取消'
  if (order.status === 'delivery_exception' || order.dispatchStatus.toUpperCase() === 'FAILED')
    return '配送异常'

  const deliveryStatus = normalizeDeliveryStatus(order)
  if (deliveryStatus === 'COMPLETED')
    return '已送达'
  if (deliveryStatus === 'DELIVERING')
    return '派送中'
  if (['PENDING', 'DISPATCHED', 'WAITING_ACCEPT', 'PICKING', 'ARRIVED_SHOP'].includes(deliveryStatus))
    return '待出餐'
  if (order.status === 'delivering')
    return '派送中'
  if (order.status === 'completed')
    return '已送达'
  return order.statusText
}

function getTakeoutStatusTone(order: OrderItem) {
  if (isRefundPending(order) || order.status === 'delivery_exception')
    return 'danger'
  if (getTakeoutStatusText(order) === '待出餐')
    return 'warning'
  return 'muted'
}

function getTakeoutActions(order: OrderItem): TakeoutAction[] {
  if (isRefundPending(order))
    return ['驳回退款', '确认退款']

  const deliveryStatus = normalizeDeliveryStatus(order)
  if (['PENDING', 'DISPATCHED', 'WAITING_ACCEPT', 'PICKING', 'ARRIVED_SHOP'].includes(deliveryStatus))
    return ['取消订单', '确认出餐']
  if (order.status === 'paid')
    return ['取消订单', '确认出餐']
  return []
}

function getPreparationActions(order: OrderItem) {
  return getTakeoutActions(order).filter(action => action === '取消订单' || action === '确认出餐')
}

function getRefundActions(order: OrderItem) {
  return getTakeoutActions(order).filter(action => action === '驳回退款' || action === '确认退款')
}

function hasReportedMeal(order: OrderItem) {
  return ['DELIVERING', 'COMPLETED'].includes(normalizeDeliveryStatus(order))
}

function parseDateTime(value: string) {
  if (!value || value === '--')
    return 0
  const timestamp = Date.parse(value.replace(/-/g, '/'))
  return Number.isFinite(timestamp) ? timestamp : 0
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainSeconds = seconds % 60
  return [hours, minutes, remainSeconds].map(value => String(value).padStart(2, '0')).join(':')
}

function getPreparationDuration(order: OrderItem) {
  const startTime = parseDateTime(order.payTime || order.orderTime)
  if (!startTime)
    return '00:00:00'
  const reportedTime = parseDateTime(order.riderUpdateTime)
  const endTime = hasReportedMeal(order) && reportedTime ? reportedTime : currentTimestamp.value
  return formatDuration((endTime - startTime) / 1000)
}

function getPreparationText(order: OrderItem) {
  if (!order.deliveryStatus) {
    if (order.status === 'pending')
      return '等待顾客支付'
    return '暂无出餐信息'
  }
  const duration = getPreparationDuration(order)
  return hasReportedMeal(order) ? `已上报出餐完成，出餐用时 ${duration}` : `用时 ${duration}`
}

function getRiderStatusText(order: OrderItem) {
  const deliveryStatus = normalizeDeliveryStatus(order)
  const statusMap: Record<string, string> = {
    PENDING: '等待骑手接单',
    DISPATCHED: '等待骑手接单',
    WAITING_ACCEPT: '等待骑手接单',
    PICKING: '骑手前往取餐',
    ARRIVED_SHOP: '骑手已到店',
    DELIVERING: '骑手已取餐',
    COMPLETED: '订单已送达',
    CANCELLED: '配送已取消',
  }
  return statusMap[deliveryStatus] || (order.courierName ? '配送信息已更新' : '等待骑手接单')
}

function formatRiderTime(value: string) {
  if (!value)
    return '--'
  const match = value.match(/(\d{2}:\d{2})(?::\d{2})?/)
  return match?.[1] || value
}

function formatDistance(distance?: number | string) {
  const value = Number(distance)
  if (!Number.isFinite(value) || value <= 0)
    return '--km'
  return `${value.toFixed(value < 10 ? 1 : 0).replace(/\.0$/, '')}km`
}

function getProductSummary(order: OrderItem) {
  const totalQuantity = order.products.reduce((total, product) => total + product.quantity, 0)
  return `${order.productKinds}种商品，共${totalQuantity || order.quantity}件`
}

function formatAmount(amount: string) {
  const value = Number(amount)
  return Number.isFinite(value) ? value.toFixed(2) : amount
}

function isTakeoutExpanded(orderId: number) {
  return expandedOrderIds.value.includes(orderId)
}

function isTakeoutLoading(orderId: number) {
  return loadingOrderIds.value.includes(orderId)
}

async function toggleTakeoutDetail(order: OrderItem) {
  if (isTakeoutExpanded(order.id)) {
    expandedOrderIds.value = expandedOrderIds.value.filter(id => id !== order.id)
    return
  }

  expandedOrderIds.value = [...expandedOrderIds.value, order.id]
  if (order.detailLoaded || isTakeoutLoading(order.id))
    return

  loadingOrderIds.value = [...loadingOrderIds.value, order.id]
  try {
    const detail = await getMerchantFoodOrderDetail('TAKEOUT', order.id)
    allOrders.value = allOrders.value.map(item => item.id === order.id ? mergeTakeoutDetail(item, detail) : item)
  }
  catch {
    uni.showToast({ title: '订单明细加载失败', icon: 'none' })
  }
  finally {
    loadingOrderIds.value = loadingOrderIds.value.filter(id => id !== order.id)
  }
}

function showDeliveryAddress(order: OrderItem) {
  uni.showModal({
    title: '配送地址',
    content: order.deliveryAddress || '暂无配送地址',
    showCancel: false,
  })
}

function makePhoneCall(phoneNumber: string, title: string) {
  if (!phoneNumber) {
    uni.showToast({ title: '暂无联系电话', icon: 'none' })
    return
  }
  uni.makePhoneCall({
    phoneNumber,
    fail: () => uni.showModal({ title, content: phoneNumber, showCancel: false }),
  })
}

async function contactTakeoutCustomer(order: OrderItem) {
  const result = await getMerchantFoodOrderContact(order.scene, order.id)
  makePhoneCall(result.contact, '客户联系方式')
}

function contactCourier(order: OrderItem) {
  makePhoneCall(order.courierPhone, '骑手联系方式')
}

function handleTakeoutAction(action: TakeoutAction, order: OrderItem) {
  if (action === '确认退款') {
    openRefundDialog(order)
    return
  }
  if (action === '驳回退款') {
    rejectRefund(order)
    return
  }

  uni.showModal({
    title: action,
    content: action === '确认出餐' ? '确认出餐接口暂未接入，请联系平台处理。' : '取消配送订单接口暂未接入，请联系平台处理。',
    showCancel: false,
  })
}

function startClock() {
  stopClock()
  currentTimestamp.value = Date.now()
  clockTimer = setInterval(() => {
    currentTimestamp.value = Date.now()
  }, 1000)
}

function stopClock() {
  if (clockTimer !== undefined) {
    clearInterval(clockTimer)
    clockTimer = undefined
  }
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
    const formatAmount = (value?: number) => `¥${Number(value || 0).toFixed(2)}`
    const financials = [
      `商家让利（含技术服务费）：${formatAmount(detail.benefitAmount)}`,
      detail.orderStatus === 'REFUNDED'
        ? '其中技术服务费：¥0.00（整单退款免收）'
        : `其中技术服务费：${formatAmount(detail.platformTechFeeAmount)}`,
      `商家结算：${formatAmount(detail.settlementAmount)}`,
    ]
    uni.showModal({
      title: `订单 ${detail.orderNo}`,
      content: [items || `${detail.productName} x${detail.quantity}`, ...financials].join('\n'),
      showCancel: false,
    })
    return
  }
  if (action === '确认退款') {
    openRefundDialog(order)
    return
  }
  if (action === '拒绝退款') {
    rejectRefund(order)
  }
}

onShow(() => {
  startClock()
  loadOrders().catch(() => {})
})

onHide(stopClock)
onUnmounted(stopClock)
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
        <template v-for="order in filteredOrders" :key="order.id">
          <view v-if="order.scene === 'TAKEOUT'" class="takeout-order-card">
            <view class="takeout-order-card__header">
              <text class="takeout-order-card__no">
                订单编号:{{ order.orderNo }}
              </text>
              <text
                class="takeout-order-card__status"
                :class="`takeout-order-card__status--${getTakeoutStatusTone(order)}`"
              >
                {{ getTakeoutStatusText(order) }}
              </text>
            </view>

            <view class="takeout-order-card__section takeout-order-card__customer">
              <view class="takeout-order-card__main-row">
                <view class="takeout-order-card__customer-info">
                  <text class="takeout-order-card__customer-name">
                    {{ order.customerName }}
                  </text>
                  <text class="takeout-order-card__customer-mobile">
                    手机号{{ order.customerMobileMask || '----' }}
                  </text>
                </view>
                <view class="takeout-order-card__phone" @tap.stop="contactTakeoutCustomer(order)">
                  <image class="takeout-order-card__phone-icon" :src="phoneIcon" mode="aspectFit" />
                </view>
              </view>

              <text class="takeout-order-card__tag">
                外卖配送
              </text>

              <view class="takeout-order-card__address" @tap.stop="showDeliveryAddress(order)">
                <text>{{ formatDistance(order.distanceKm) }}</text>
                <text class="takeout-order-card__address-separator">|</text>
                <text class="takeout-order-card__address-text">
                  {{ order.deliveryAddress || '配送地址加载中' }}
                </text>
                <text class="takeout-order-card__address-arrow">›</text>
              </view>
            </view>

            <view class="takeout-order-card__section takeout-order-card__preparation">
              <text class="takeout-order-card__preparation-text">
                {{ getPreparationText(order) }}
              </text>
              <view v-if="getPreparationActions(order).length" class="takeout-order-card__actions">
                <view
                  v-for="action in getPreparationActions(order)"
                  :key="action"
                  class="takeout-order-card__action"
                  :class="{ 'takeout-order-card__action--primary': action === '确认出餐' }"
                  @tap.stop="handleTakeoutAction(action, order)"
                >
                  {{ action }}
                </view>
              </view>
            </view>

            <view class="takeout-order-card__section takeout-order-card__rider">
              <view class="takeout-order-card__main-row">
                <text class="takeout-order-card__rider-name">
                  {{ order.courierName || '骑手待接单' }}
                </text>
                <view
                  v-if="order.courierPhone"
                  class="takeout-order-card__phone"
                  @tap.stop="contactCourier(order)"
                >
                  <image class="takeout-order-card__phone-icon" :src="phoneIcon" mode="aspectFit" />
                </view>
              </view>

              <view class="takeout-order-card__rider-meta">
                <view class="takeout-order-card__rider-progress">
                  <text>{{ formatRiderTime(order.riderUpdateTime) }}</text>
                  <text>{{ getRiderStatusText(order) }}</text>
                </view>
                <view v-if="getRefundActions(order).length" class="takeout-order-card__actions">
                  <view
                    v-for="action in getRefundActions(order)"
                    :key="action"
                    class="takeout-order-card__action"
                    :class="{ 'takeout-order-card__action--danger': action === '确认退款' }"
                    @tap.stop="handleTakeoutAction(action, order)"
                  >
                    {{ action }}
                  </view>
                </view>
              </view>
            </view>

            <view v-if="order.buyerRemark" class="takeout-order-card__remark">
              <text class="takeout-order-card__remark-label">
                备注
              </text>
              <text class="takeout-order-card__remark-text">
                {{ order.buyerRemark }}
              </text>
            </view>

            <view class="takeout-order-card__summary">
              <text class="takeout-order-card__summary-count">
                {{ getProductSummary(order) }}
              </text>
              <text class="takeout-order-card__income">
                ‹ 预计收入
                <text class="takeout-order-card__income-amount">
                  ¥{{ formatAmount(order.amount) }}
                </text>
              </text>
            </view>

            <view
              v-if="!isTakeoutExpanded(order.id)"
              class="takeout-order-card__toggle"
              @tap.stop="toggleTakeoutDetail(order)"
            >
              展开完整信息
              <image class="takeout-order-card__toggle-icon takeout-order-card__toggle-icon--down" :src="arrowUpIcon" mode="aspectFit" />
            </view>

            <view v-else class="takeout-order-card__products">
              <view v-if="isTakeoutLoading(order.id)" class="takeout-order-card__products-loading">
                商品明细加载中...
              </view>
              <template v-else>
                <view v-for="product in order.products" :key="product.id" class="takeout-order-card__product">
                  <text class="takeout-order-card__product-name">
                    {{ product.name }}
                  </text>
                  <text
                    class="takeout-order-card__product-count"
                    :class="{ 'takeout-order-card__product-count--multiple': product.quantity > 1 }"
                  >
                    x{{ product.quantity }}
                  </text>
                </view>
              </template>
              <view class="takeout-order-card__toggle" @tap.stop="toggleTakeoutDetail(order)">
                折叠信息
                <image class="takeout-order-card__toggle-icon" :src="arrowUpIcon" mode="aspectFit" />
              </view>
            </view>
          </view>

          <view v-else class="order-card">
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
                      {{ formatAmount(order.originalAmount) }}
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

                <view class="order-card__payment">
                  <text>现金实付 ¥{{ formatAmount(order.amount) }}</text>
                  <text>同城币抵扣 {{ formatAmount(order.cityCoinDeductAmount) }}</text>
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
        </template>

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

    <view v-if="refundDialog.visible" class="refund-dialog-mask" @tap="closeRefundDialog">
      <view class="refund-dialog" @tap.stop>
        <view class="refund-dialog__header">
          <text class="refund-dialog__title">确认退款</text>
          <text class="refund-dialog__close" @tap="closeRefundDialog">×</text>
        </view>

        <view class="refund-dialog__summary">
          <view class="refund-dialog__summary-row">
            <text>订单原价</text>
            <text>¥{{ formatAmount(refundDialog.order?.originalAmount || '0') }}</text>
          </view>
          <view class="refund-dialog__summary-row">
            <text>现金实付</text>
            <text>¥{{ formatAmount(refundDialog.order?.amount || '0') }}</text>
          </view>
        <view class="refund-dialog__summary-row">
          <text>同城币抵扣</text>
          <text>{{ formatAmount(refundDialog.order?.cityCoinDeductAmount || '0') }}</text>
        </view>
      </view>

      <view v-if="isGroupBuyRefund" class="refund-dialog__full-refund-tip">
        团购订单仅支持整单退款，将退回全部现金实付和同城币抵扣。
      </view>

        <view v-if="!isGroupBuyRefund" class="refund-dialog__field">
          <text class="refund-dialog__label">退款实付金额</text>
          <view class="refund-dialog__input-wrap">
            <text class="refund-dialog__prefix">¥</text>
            <input v-model="refundDialog.refundAmount" class="refund-dialog__input" type="digit" />
          </view>
          <text class="refund-dialog__limit">最多 ¥{{ formatAmount(refundDialog.order?.amount || '0') }}</text>
        </view>

        <view v-if="!isGroupBuyRefund" class="refund-dialog__field">
          <text class="refund-dialog__label">退回同城币</text>
          <view class="refund-dialog__input-wrap">
            <input v-model="refundDialog.cityCoinReturnAmount" class="refund-dialog__input" type="digit" />
            <text class="refund-dialog__suffix">同城币</text>
          </view>
          <text class="refund-dialog__limit">最多 {{ formatAmount(refundDialog.order?.cityCoinDeductAmount || '0') }}</text>
        </view>

        <view class="refund-dialog__actions">
          <view class="refund-dialog__button refund-dialog__button--secondary" @tap="closeRefundDialog">取消</view>
          <view class="refund-dialog__button refund-dialog__button--primary" @tap="submitRefundDialog">
            {{ refundDialog.submitting ? '提交中' : '确认退款' }}
          </view>
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

.takeout-order-card {
  overflow: hidden;
  padding: 0 24rpx 24rpx;
  border-radius: 22rpx;
  background: #fff;
  box-shadow: 0 8rpx 26rpx rgba(79, 84, 98, 0.05);
}

.takeout-order-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-height: 84rpx;
  border-bottom: 2rpx dotted #e7e8eb;
}

.takeout-order-card__no {
  overflow: hidden;
  flex: 1;
  color: #72757b;
  font-size: 25rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.takeout-order-card__status {
  flex-shrink: 0;
  font-size: 29rpx;
  font-weight: 500;
}

.takeout-order-card__status--warning {
  color: #ff9f17;
}

.takeout-order-card__status--danger {
  color: #ff3f4f;
}

.takeout-order-card__status--muted {
  color: #64676d;
}

.takeout-order-card__section {
  padding: 24rpx 0 20rpx;
  border-bottom: 2rpx dotted #e7e8eb;
}

.takeout-order-card__main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.takeout-order-card__customer-info {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 12rpx;
}

.takeout-order-card__customer-name,
.takeout-order-card__rider-name {
  overflow: hidden;
  color: #22252a;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.takeout-order-card__customer-mobile {
  color: #6d7076;
  font-size: 21rpx;
  line-height: 1.2;
  white-space: nowrap;
}

.takeout-order-card__phone {
  display: flex;
  width: 44rpx;
  height: 44rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #101216;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1;
  background: #f7f7f8;
}

.takeout-order-card__phone-icon {
  width: 26rpx;
  height: 26rpx;
}

.takeout-order-card__tag {
  display: inline-flex;
  align-items: center;
  min-height: 30rpx;
  margin-top: 8rpx;
  padding: 0 8rpx;
  border: 1rpx solid #d9dbdf;
  border-radius: 4rpx;
  color: #85888e;
  font-size: 18rpx;
  line-height: 1;
}

.takeout-order-card__address {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7rpx;
  margin-top: 8rpx;
  color: #777a81;
  font-size: 22rpx;
  line-height: 1.35;
}

.takeout-order-card__address-separator {
  color: #c0c2c7;
}

.takeout-order-card__address-text {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.takeout-order-card__address-arrow {
  flex-shrink: 0;
  color: #9b9da2;
  font-size: 28rpx;
}

.takeout-order-card__preparation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.takeout-order-card__preparation-text {
  flex: 1;
  color: #25282d;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.35;
}

.takeout-order-card__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
}

.takeout-order-card__action {
  display: flex;
  min-width: 112rpx;
  height: 44rpx;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  padding: 0 14rpx;
  border: 2rpx solid #8c8f95;
  border-radius: 999rpx;
  color: #686b71;
  font-size: 24rpx;
  line-height: 1;
  background: #fff;
}

.takeout-order-card__action--primary {
  border-color: #f2af25;
  color: #f2a713;
}

.takeout-order-card__action--danger {
  border-color: #ff5864;
  color: #ff4654;
}

.takeout-order-card__rider-meta {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 10rpx;
}

.takeout-order-card__rider-progress {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  color: #777a80;
  font-size: 21rpx;
  line-height: 1.25;
}

.takeout-order-card__remark {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 22rpx;
  padding: 12rpx 14rpx;
  background: #fffbea;
}

.takeout-order-card__remark-label {
  display: flex;
  min-width: 42rpx;
  height: 30rpx;
  align-items: center;
  justify-content: center;
  border-radius: 5rpx;
  color: #fff;
  font-size: 18rpx;
  font-weight: 700;
  background: #ff7417;
}

.takeout-order-card__remark-text {
  overflow: hidden;
  flex: 1;
  color: #303238;
  font-size: 26rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.takeout-order-card__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 22rpx 0 16rpx;
}

.takeout-order-card__summary-count {
  color: #282b30;
  font-size: 30rpx;
  font-weight: 700;
  white-space: nowrap;
}

.takeout-order-card__income {
  color: #686b71;
  font-size: 23rpx;
  white-space: nowrap;
}

.takeout-order-card__income-amount {
  margin-left: 5rpx;
  color: #2e3136;
  font-size: 29rpx;
  font-weight: 700;
}

.takeout-order-card__toggle {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6rpx;
  color: #777a80;
  font-size: 22rpx;
  line-height: 1.4;
  text-align: right;
}

.takeout-order-card__toggle-icon {
  width: 18rpx;
  height: 12rpx;
  flex-shrink: 0;
}

.takeout-order-card__toggle-icon--down {
  transform: rotate(180deg);
}

.takeout-order-card__products {
  padding-top: 4rpx;
}

.takeout-order-card__products-loading {
  padding: 18rpx 0;
  color: #8b8e94;
  font-size: 25rpx;
  text-align: center;
}

.takeout-order-card__product {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-height: 48rpx;
  color: #46494f;
  font-size: 28rpx;
}

.takeout-order-card__product-name {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.takeout-order-card__product-count {
  flex-shrink: 0;
  color: #4f5257;
}

.takeout-order-card__product-count--multiple {
  color: #ff4654;
}

.takeout-order-card__products .takeout-order-card__toggle {
  margin-top: 12rpx;
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

.order-card__payment {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx 20rpx;
  margin-top: 10rpx;
  color: #92969e;
  font-size: 23rpx;
}

.refund-dialog-mask {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 32rpx 24rpx calc(env(safe-area-inset-bottom) + 24rpx);
  background: rgba(20, 22, 27, 0.46);
  box-sizing: border-box;
}

.refund-dialog {
  width: 100%;
  max-width: 680rpx;
  padding: 30rpx 28rpx 26rpx;
  border-radius: 24rpx;
  background: #fff;
  box-sizing: border-box;
}

.refund-dialog__header,
.refund-dialog__summary-row,
.refund-dialog__input-wrap,
.refund-dialog__actions {
  display: flex;
  align-items: center;
}

.refund-dialog__header {
  justify-content: space-between;
}

.refund-dialog__title {
  color: #25282e;
  font-size: 34rpx;
  font-weight: 700;
}

.refund-dialog__close {
  width: 48rpx;
  color: #92969e;
  font-size: 42rpx;
  line-height: 42rpx;
  text-align: center;
}

.refund-dialog__summary {
  margin-top: 24rpx;
  padding: 18rpx 20rpx;
  border-radius: 14rpx;
  background: #f7f8fa;
}

.refund-dialog__summary-row {
  justify-content: space-between;
  min-height: 44rpx;
  color: #5f646d;
  font-size: 26rpx;
}

.refund-dialog__summary-row text:last-child {
  color: #25282e;
  font-weight: 600;
}

.refund-dialog__full-refund-tip {
  margin-top: 22rpx;
  padding: 18rpx 20rpx;
  border-radius: 14rpx;
  background: #fff7e7;
  color: #a26708;
  font-size: 25rpx;
  line-height: 38rpx;
}

.refund-dialog__field {
  margin-top: 26rpx;
}

.refund-dialog__label {
  display: block;
  color: #30343a;
  font-size: 28rpx;
  font-weight: 600;
}

.refund-dialog__input-wrap {
  height: 76rpx;
  margin-top: 14rpx;
  padding: 0 20rpx;
  border: 2rpx solid #d9dce2;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.refund-dialog__prefix,
.refund-dialog__suffix {
  flex-shrink: 0;
  color: #5e626a;
  font-size: 28rpx;
}

.refund-dialog__input {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  margin: 0 12rpx;
  color: #24272c;
  font-size: 30rpx;
}

.refund-dialog__limit {
  display: block;
  margin-top: 10rpx;
  color: #92969e;
  font-size: 23rpx;
}

.refund-dialog__actions {
  justify-content: flex-end;
  gap: 18rpx;
  margin-top: 32rpx;
}

.refund-dialog__button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 150rpx;
  height: 66rpx;
  padding: 0 26rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-sizing: border-box;
}

.refund-dialog__button--secondary {
  background: #f1f2f4;
  color: #61656d;
}

.refund-dialog__button--primary {
  background: #ff8a00;
  color: #fff;
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
