import type { MerchantFoodOrder, MerchantFoodRefund } from '@/api/types/merchant-food'
import orderRefundedAudio from '@/static/mp3/order-refunded.mp3'
import paymentReceivedAudio from '@/static/mp3/payment-received.mp3'

const ANNOUNCED_ORDER_STORAGE_KEY = 'merchant-food-announced-onsite-orders-v1'
const MAX_ANNOUNCED_ORDERS = 1000

let initialized = false
let audioContext: ReturnType<typeof uni.createInnerAudioContext> | undefined
let isPlaying = false
const announcedOrderKeys = new Set<string>()
const initializedStoreIds = new Set<number>()
const initializedRefundStoreIds = new Set<number>()
const playbackQueue: string[] = []

function restoreAnnouncedOrderKeys() {
  if (initialized)
    return

  initialized = true
  try {
    const storedKeys = uni.getStorageSync(ANNOUNCED_ORDER_STORAGE_KEY)
    if (!Array.isArray(storedKeys))
      return

    storedKeys.filter((key): key is string => typeof key === 'string').slice(-MAX_ANNOUNCED_ORDERS).forEach(key => announcedOrderKeys.add(key))
  }
  catch {
    // 存储不可用时仍在当前会话内通过内存去重。
  }
}

function persistAnnouncedOrderKeys() {
  try {
    uni.setStorageSync(ANNOUNCED_ORDER_STORAGE_KEY, Array.from(announcedOrderKeys))
  }
  catch {
    // 存储失败不影响当前会话的去重和播报。
  }
}

function trimAnnouncedOrderKeys() {
  while (announcedOrderKeys.size > MAX_ANNOUNCED_ORDERS) {
    const oldestKey = announcedOrderKeys.values().next().value
    if (!oldestKey)
      return
    announcedOrderKeys.delete(oldestKey)
  }
}

function finishPlayback() {
  isPlaying = false
  playNext()
}

function getAudioContext() {
  if (audioContext)
    return audioContext

  audioContext = uni.createInnerAudioContext()
  audioContext.onEnded(finishPlayback)
  audioContext.onError(finishPlayback)
  return audioContext
}

function playNext() {
  if (isPlaying || playbackQueue.length === 0)
    return

  isPlaying = true
  const audioSource = playbackQueue.shift()
  if (!audioSource) {
    isPlaying = false
    return
  }
  const context = getAudioContext()
  context.stop()
  context.src = audioSource
  context.seek(0)
  context.play()
}

/**
 * 首次查询只建立当前门店的订单基线，不补播历史订单；此后的已支付
 * 到店买单会播放一次到账提示音。去重记录由工作台和订单管理页共用。
 */
export function notifyNewPaidOnsiteOrders(storeId: number, orders: MerchantFoodOrder[]) {
  restoreAnnouncedOrderKeys()

  const paidOnsiteOrders = orders.filter((order) => {
    if (order.scene !== 'ONSITE' || !['PAID', 'COMPLETED'].includes(order.orderStatus))
      return false

    return true
  })
  if (!initializedStoreIds.has(storeId)) {
    initializedStoreIds.add(storeId)
    for (const order of paidOnsiteOrders) {
      announcedOrderKeys.add(`${storeId}:${order.orderId}`)
    }
    trimAnnouncedOrderKeys()
    persistAnnouncedOrderKeys()
    return
  }

  const unannouncedOrders = paidOnsiteOrders.filter((order) => {
    const orderKey = `${storeId}:${order.orderId}`
    if (announcedOrderKeys.has(orderKey))
      return false

    announcedOrderKeys.add(orderKey)
    return true
  })
  if (unannouncedOrders.length === 0)
    return

  trimAnnouncedOrderKeys()
  persistAnnouncedOrderKeys()
  playbackQueue.push(...unannouncedOrders.map(() => paymentReceivedAudio))
  playNext()
}

/**
 * 首次查询仅建立退款基线；其后检测到新完成的退款时播放一次退款语音。
 */
export function notifyNewCompletedRefunds(storeId: number, refunds: MerchantFoodRefund[]) {
  restoreAnnouncedOrderKeys()

  const completedRefunds = refunds.filter(refund => refund.refundStatus === '3')
  if (!initializedRefundStoreIds.has(storeId)) {
    initializedRefundStoreIds.add(storeId)
    for (const refund of completedRefunds) {
      announcedOrderKeys.add(`refund:${storeId}:${refund.refundId}`)
    }
    trimAnnouncedOrderKeys()
    persistAnnouncedOrderKeys()
    return
  }

  const unannouncedRefunds = completedRefunds.filter((refund) => {
    const refundKey = `refund:${storeId}:${refund.refundId}`
    if (announcedOrderKeys.has(refundKey))
      return false

    announcedOrderKeys.add(refundKey)
    return true
  })
  if (unannouncedRefunds.length === 0)
    return

  trimAnnouncedOrderKeys()
  persistAnnouncedOrderKeys()
  playbackQueue.push(...unannouncedRefunds.map(() => orderRefundedAudio))
  playNext()
}
