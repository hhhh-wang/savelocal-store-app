<script lang="ts" setup>
import type { MerchantFoodCommissionBill } from '@/api/types/merchant-food'
import { getMerchantFoodCommissionBillsPage } from '@/api/merchant-food'
import { useMerchantFoodStore } from '@/store'
import type { BillDetailGroup, BillDetailItem, BillKind } from './withdrawal'
import WithdrawalPageHeader from './components/withdrawal-page-header.vue'
import { WITHDRAWAL_PATHS } from './withdrawal'

defineOptions({ name: 'MerchantBillDetails' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '账单明细',
  },
})

const billIconMap: Record<BillKind, string> = {
  coupon: 'i-carbon-ticket',
  fee: 'i-carbon-tool-box',
  income: 'i-carbon-money',
}

const merchantFoodStore = useMerchantFoodStore()
const billGroups = ref<BillDetailGroup[]>([])
const commissionBills = ref<MerchantFoodCommissionBill[]>([])
const loading = ref(false)
const pageNum = ref(0)
const hasMore = ref(true)

function toAmount(value?: number) {
  return Number(value || 0).toFixed(2)
}

function resolveBillTime(bill: MerchantFoodCommissionBill) {
  return bill.billTime || ''
}

function formatGroupDate(value: string) {
  const date = new Date(value.replace(/-/g, '/'))
  if (Number.isNaN(date.getTime()))
    return '其他'
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`
}

function formatTime(value: string) {
  return value.length >= 19 ? value.slice(11, 19) : '--'
}

function buildBillGroups(bills: MerchantFoodCommissionBill[]) {
  const groups = new Map<string, { timeValue: string, expense: number, income: number, items: BillDetailItem[] }>()
  for (const bill of bills) {
    const timeValue = resolveBillTime(bill)
    const date = formatGroupDate(timeValue)
    const group = groups.get(date) || { timeValue, expense: 0, income: 0, items: [] }
    const fee = Number(bill.platformTechFeeAmount || 0)
    const settlement = Number(bill.settlementAmount || 0)
    group.expense += fee
    group.items.push({
      id: `${bill.foodOrderId}-fee`,
      kind: 'fee',
      description: `技术服务费-订单${bill.orderNo}`,
      time: formatTime(timeValue),
      amount: `-${toAmount(fee)}`,
    })
    if (settlement > 0) {
      group.income += settlement
      group.items.push({
        id: `${bill.foodOrderId}-income`,
        kind: 'income',
        description: `交易收入-订单${bill.orderNo}`,
        time: formatTime(timeValue),
        amount: `+${toAmount(settlement)}`,
      })
    }
    groups.set(date, group)
  }
  return Array.from(groups.entries())
    .sort((left, right) => right[1].timeValue.localeCompare(left[1].timeValue))
    .map(([date, group]) => ({
      date,
      expense: toAmount(group.expense),
      income: toAmount(group.income),
      items: group.items,
    }))
}

async function loadBills(loadMore = false) {
  if (loading.value || (loadMore && !hasMore.value))
    return
  loading.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    const nextPage = loadMore ? pageNum.value + 1 : 1
    const result = await getMerchantFoodCommissionBillsPage({ storeId, pageNum: nextPage, pageSize: 20 })
    const rows = result.rows || []
    commissionBills.value = loadMore ? [...commissionBills.value, ...rows] : rows
    pageNum.value = nextPage
    hasMore.value = commissionBills.value.length < Number(result.total || 0)
    billGroups.value = buildBillGroups(commissionBills.value)
  }
  catch {
    if (!loadMore) {
      commissionBills.value = []
      billGroups.value = []
    }
    uni.showToast({ title: '账单明细加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function reloadBills() {
  pageNum.value = 0
  hasMore.value = true
  commissionBills.value = []
  billGroups.value = []
  loadBills()
}

onShow(reloadBills)
onReachBottom(() => loadBills(true))
</script>

<template>
  <view class="bill-details-page">
    <withdrawal-page-header title="账单明细" :fallback-url="WITHDRAWAL_PATHS.overview" />

    <view class="bill-groups">
      <view v-for="group in billGroups" :key="group.date" class="bill-group">
        <view class="bill-group__header">
          <view class="bill-group__summary">
            <view class="bill-group__date-row">
              <text class="bill-group__date">{{ group.date }}</text>
            </view>
            <view class="bill-group__totals">
              <text>支出 ¥ {{ group.expense }}</text>
              <text>收入 ¥ {{ group.income }}</text>
            </view>
          </view>
        </view>

        <view class="bill-group__items">
          <view v-for="item in group.items" :key="item.id" class="bill-item">
            <view class="bill-item__icon" :class="`bill-item__icon--${item.kind}`">
              <view class="bill-item__glyph" :class="billIconMap[item.kind]" />
            </view>
            <view class="bill-item__body">
              <text class="bill-item__description">{{ item.description }}</text>
              <text class="bill-item__time">{{ item.time }}</text>
            </view>
            <text class="bill-item__amount" :class="{ 'bill-item__amount--income': item.amount.startsWith('+') }">
              {{ item.amount }}
            </text>
          </view>
        </view>
      </view>
      <view v-if="!loading && !billGroups.length" class="bill-empty">暂无账单明细</view>
      <view v-else-if="loading" class="bill-page-status">加载中</view>
      <view v-else-if="!hasMore" class="bill-page-status">没有更多了</view>
    </view>

    <view class="bill-tabbar">
      <view class="i-carbon-chart-pie bill-tabbar__icon" />
      <text>明细</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.bill-details-page {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 126rpx);
  box-sizing: border-box;
  background: #f5f5f5;
  color: #303030;
}

.bill-group__header,
.bill-group__date-row,
.bill-item,
.bill-tabbar {
  display: flex;
  align-items: center;
}

.bill-group__header {
  justify-content: space-between;
  gap: 24rpx;
  min-height: 116rpx;
  padding: 14rpx 32rpx;
  box-sizing: border-box;
  background: #f5f5f5;
}

.bill-group__summary {
  min-width: 0;
  flex: 1;
}

.bill-group__date-row {
  gap: 8rpx;
}

.bill-group__date {
  color: #303030;
  font-size: 30rpx;
  line-height: 1.4;
}

.bill-group__totals {
  display: flex;
  gap: 24rpx;
  margin-top: 4rpx;
  color: #aaa;
  font-size: 26rpx;
}

.bill-group__items {
  background: #fff;
}

.bill-item {
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) auto;
  gap: 16rpx;
  min-height: 132rpx;
  margin-left: 32rpx;
  padding: 16rpx 32rpx 16rpx 0;
  border-bottom: 1rpx solid #efefef;
  box-sizing: border-box;
}

.bill-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  color: #fff;
}

.bill-item__icon--coupon,
.bill-item__icon--income {
  background: #ff8508;
}

.bill-item__icon--fee {
  background: #ff6360;
}

.bill-item__glyph {
  width: 34rpx;
  height: 34rpx;
}

.bill-item__body {
  min-width: 0;
}

.bill-item__description,
.bill-item__time {
  display: block;
}

.bill-item__description {
  overflow: hidden;
  color: #303030;
  font-size: 29rpx;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-item__time {
  margin-top: 8rpx;
  color: #aaa;
  font-size: 26rpx;
}

.bill-item__amount {
  align-self: start;
  padding-top: 2rpx;
  color: #303030;
  font-size: 34rpx;
  line-height: 1.4;
  white-space: nowrap;
}

.bill-item__amount--income {
  color: #fb6800;
}

.bill-empty {
  padding: 96rpx 32rpx;
  color: #999;
  font-size: 28rpx;
  text-align: center;
}

.bill-page-status {
  padding: 28rpx 32rpx;
  color: #999;
  font-size: 26rpx;
  text-align: center;
}

.bill-tabbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  flex-direction: column;
  justify-content: center;
  min-height: 94rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  color: #555;
  font-size: 25rpx;
}

.bill-tabbar__icon {
  width: 44rpx;
  height: 44rpx;
  margin-bottom: 2rpx;
  color: #888;
}
</style>
