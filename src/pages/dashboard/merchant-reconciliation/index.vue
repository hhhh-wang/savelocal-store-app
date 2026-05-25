<script lang="ts" setup>
import calendarMonthIcon from '@/static/icons/calendar-month.png'
import storeIcon from '@/static/icons/store-icon.png'

defineOptions({
  name: 'MerchantReconciliation',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '商家对账',
  },
})

type SettlementTab = 'all' | 'onsite' | 'group'
type BillStatus = 'settled' | 'pending'

interface SettlementSummary {
  amount: string
  subtitle: string
}

interface OrderStat {
  key: string
  label: string
  count: string
  amount: string
  dotColor: string
}

interface BillItem {
  id: string
  date: string
  status: BillStatus
  summaryAmount: string
  description: string
  referenceNo: string
  transferDate: string
  transferLabel: string
  transferAmount: string
  settlementType: Exclude<SettlementTab, 'all'>
}

const fallbackUrl = '/pages/dashboard/index'
const storeName = '饱藏食坊（现炒盖饭·中式简餐）'
const currentDate = {
  year: 2026,
  month: 5,
  day: 25,
}
const todayBillDate = `${currentDate.year}-${String(currentDate.month).padStart(2, '0')}-${String(currentDate.day).padStart(2, '0')}`

const settlementTabs = [
  { key: 'all', label: '全部' },
  { key: 'onsite', label: '到店' },
  { key: 'group', label: '团购' },
] as const

const settlementSummaryMap: Record<SettlementTab, SettlementSummary> = {
  all: { amount: '86.38', subtitle: '待结算 5 笔' },
  onsite: { amount: '14.38', subtitle: '待结算 1 笔' },
  group: { amount: '72.00', subtitle: '待结算 4 笔' },
}

const orderStatsMap: Record<SettlementTab, OrderStat[]> = {
  all: [
    { key: 'completed', label: '已完成', count: '3单', amount: '¥128.38', dotColor: '#ff8a3d' },
    { key: 'onsite', label: '到店订单', count: '1单', amount: '¥14.38', dotColor: '#bdbfc6' },
    { key: 'progress', label: '进行中', count: '1单', amount: '¥0', dotColor: '#2f86ff' },
    { key: 'today', label: '今日下单', count: '2单', amount: '¥52.00', dotColor: '#bdbfc6' },
    { key: 'history', label: '历史下单', count: '18单', amount: '¥986.00', dotColor: '#bdbfc6' },
  ],
  onsite: [
    { key: 'completed', label: '已完成', count: '1单', amount: '¥14.38', dotColor: '#ff8a3d' },
    { key: 'onsite', label: '到店订单', count: '1单', amount: '¥14.38', dotColor: '#bdbfc6' },
    { key: 'progress', label: '进行中', count: '0单', amount: '¥0', dotColor: '#2f86ff' },
    { key: 'today', label: '今日下单', count: '1单', amount: '¥14.38', dotColor: '#bdbfc6' },
    { key: 'history', label: '历史下单', count: '6单', amount: '¥238.00', dotColor: '#bdbfc6' },
  ],
  group: [
    { key: 'completed', label: '已完成', count: '2单', amount: '¥114.00', dotColor: '#ff8a3d' },
    { key: 'onsite', label: '到店订单', count: '0单', amount: '¥0.00', dotColor: '#bdbfc6' },
    { key: 'progress', label: '进行中', count: '1单', amount: '¥0', dotColor: '#2f86ff' },
    { key: 'today', label: '今日下单', count: '1单', amount: '¥37.62', dotColor: '#bdbfc6' },
    { key: 'history', label: '历史下单', count: '12单', amount: '¥748.00', dotColor: '#bdbfc6' },
  ],
}

const billList: BillItem[] = [
  {
    id: 'bill-001',
    date: '2026-05-25',
    status: 'pending',
    summaryAmount: '24.90',
    description: '付款成功至银行卡 xxxx 2912，结算中',
    referenceNo: '付款单号：300000000515558973',
    transferDate: '2026-05-25',
    transferLabel: '待平台结算',
    transferAmount: '24.90',
    settlementType: 'group',
  },
  {
    id: 'bill-002',
    date: '2026-05-24',
    status: 'settled',
    summaryAmount: '14.38',
    description: '付款成功至银行卡 xxxx 2912，付款成功',
    referenceNo: '付款单号：300000000515558972',
    transferDate: '2026-05-23',
    transferLabel: '秒速到账',
    transferAmount: '14.38',
    settlementType: 'onsite',
  },
  {
    id: 'bill-003',
    date: '2026-04-18',
    status: 'settled',
    summaryAmount: '36.00',
    description: '付款成功至银行卡 xxxx 2912，付款成功',
    referenceNo: '付款单号：300000000515558860',
    transferDate: '2026-04-17',
    transferLabel: '秒速到账',
    transferAmount: '36.00',
    settlementType: 'group',
  },
  {
    id: 'bill-004',
    date: '2026-03-09',
    status: 'settled',
    summaryAmount: '18.80',
    description: '付款成功至银行卡 xxxx 2912，付款成功',
    referenceNo: '付款单号：300000000515558751',
    transferDate: '2026-03-08',
    transferLabel: '秒速到账',
    transferAmount: '18.80',
    settlementType: 'onsite',
  },
  {
    id: 'bill-005',
    date: '2026-02-27',
    status: 'settled',
    summaryAmount: '58.80',
    description: '付款成功至银行卡 xxxx 2912，付款成功',
    referenceNo: '付款单号：300000000515558640',
    transferDate: '2026-02-27',
    transferLabel: '秒速到账',
    transferAmount: '58.80',
    settlementType: 'group',
  },
  {
    id: 'bill-006',
    date: '2025-12-12',
    status: 'settled',
    summaryAmount: '42.00',
    description: '付款成功至银行卡 xxxx 2912，付款成功',
    referenceNo: '付款单号：300000000515558418',
    transferDate: '2025-12-11',
    transferLabel: '秒速到账',
    transferAmount: '42.00',
    settlementType: 'group',
  },
]

const activeSettlementTab = ref<SettlementTab>('onsite')
const onlyTodayBills = ref(false)

const currentMonthKey = `${currentDate.year}-${String(currentDate.month).padStart(2, '0')}`
const activeBillFilter = ref<string>(currentMonthKey)
const customMonthKey = ref<string>('')

const monthPickerVisible = ref(false)
const yearOptions = Array.from({ length: 7 }, (_, index) => currentDate.year - 3 + index)
const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1)
const monthPickerValue = ref([3, currentDate.month - 1])

const recentMonthKeys = computed(() => {
  const result: string[] = []

  for (let index = 0; index < 4; index += 1) {
    const month = currentDate.month - index
    const yearOffset = Math.floor((month - 1) / 12)
    const normalizedMonth = ((month - 1) % 12 + 12) % 12 + 1
    const normalizedYear = currentDate.year + yearOffset
    result.push(`${normalizedYear}-${String(normalizedMonth).padStart(2, '0')}`)
  }

  return result
})

const billTimeTabs = computed(() => {
  const tabs = recentMonthKeys.value.map(monthKey => ({
    key: monthKey,
    label: `${Number(monthKey.slice(5, 7))}月`,
  }))

  if (customMonthKey.value && !tabs.some(tab => tab.key === customMonthKey.value)) {
    const year = customMonthKey.value.slice(0, 4)
    const month = Number(customMonthKey.value.slice(5, 7))
    tabs.unshift({
      key: customMonthKey.value,
      label: `${year}/${month}月`,
    })
  }

  return [{ key: 'all', label: '全部时间' }, ...tabs]
})

const activeSettlementSummary = computed(() => settlementSummaryMap[activeSettlementTab.value])
const activeOrderStats = computed(() => orderStatsMap[activeSettlementTab.value])

const filteredBills = computed(() => {
  return [...billList]
    .filter((bill) => {
      const matchSettlement = activeSettlementTab.value === 'all' || bill.settlementType === activeSettlementTab.value
      const matchMonth = activeBillFilter.value === 'all' || bill.date.startsWith(activeBillFilter.value)
      const matchToday = !onlyTodayBills.value || bill.date === todayBillDate

      return matchSettlement && matchMonth && matchToday
    })
    .sort((prev, next) => next.date.localeCompare(prev.date))
})

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

function switchSettlementTab(tab: SettlementTab) {
  activeSettlementTab.value = tab
}

function switchBillFilter(filterKey: string) {
  activeBillFilter.value = filterKey
}

function toggleTodayBills() {
  onlyTodayBills.value = !onlyTodayBills.value
}


function openMonthPicker() {
  const monthKey = activeBillFilter.value === 'all'
    ? (customMonthKey.value || currentMonthKey)
    : activeBillFilter.value

  const year = Number(monthKey.slice(0, 4))
  const month = Number(monthKey.slice(5, 7))
  const yearIndex = Math.max(yearOptions.findIndex(item => item === year), 0)
  const monthIndex = Math.max(month - 1, 0)

  monthPickerValue.value = [yearIndex, monthIndex]
  monthPickerVisible.value = true
}

function closeMonthPicker() {
  monthPickerVisible.value = false
}

function handleMonthPickerChange(event: { detail: { value: number[] } }) {
  monthPickerValue.value = event.detail.value
}

function confirmMonthPicker() {
  const selectedYear = yearOptions[monthPickerValue.value[0]] ?? currentDate.year
  const selectedMonth = monthOptions[monthPickerValue.value[1]] ?? currentDate.month
  const nextMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`

  customMonthKey.value = nextMonthKey
  activeBillFilter.value = nextMonthKey
  monthPickerVisible.value = false
}

function formatBillDate(date: string) {
  return date.slice(5).replace('-', '-')
}

function getBillStatusLabel(status: BillStatus) {
  return status === 'settled' ? '已结算' : '待结算'
}
</script>

<template>
  <view class="merchant-page">
    <view class="merchant-page__glow merchant-page__glow--left" />
    <view class="merchant-page__glow merchant-page__glow--right" />

    <view class="merchant-page__content">
      <view class="merchant-nav">
        <view class="merchant-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="reLaunch"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />

          <text class="merchant-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="merchant-nav__title">
          商家对账
        </text>

        <view class="merchant-nav__spacer" />
      </view>

      <view class="merchant-store-row">
        <view class="merchant-store-row__main">
          <image class="merchant-store-row__icon" :src="storeIcon" mode="aspectFit" />
          <text class="merchant-store-row__name">
            {{ storeName }}
          </text>
        </view>
      </view>

      <view class="merchant-balance-card">
        <view class="merchant-balance-card__header">
          <text class="merchant-balance-card__label">
            待结算金额（元）
          </text>

          <view class="merchant-balance-card__tabs">
            <view
              v-for="tab in settlementTabs"
              :key="tab.key"
              class="merchant-balance-card__tab"
              :class="{ 'merchant-balance-card__tab--active': tab.key === activeSettlementTab }"
              @tap="switchSettlementTab(tab.key)"
            >
              {{ tab.label }}
            </view>
          </view>
        </view>

        <view class="merchant-balance-card__body">
          <text class="merchant-balance-card__amount">
            {{ activeSettlementSummary.amount }}
          </text>
          <text class="merchant-balance-card__subtitle">
            {{ activeSettlementSummary.subtitle }}
          </text>
        </view>
      </view>

      <view class="merchant-section">
        <text class="merchant-section__title">
          今日实时订单
        </text>

        <view class="merchant-order-card">
          <view v-for="item in activeOrderStats" :key="item.key" class="merchant-order-card__row">
            <view class="merchant-order-card__label-wrap">
              <text class="merchant-order-card__dot" :style="{ backgroundColor: item.dotColor }" />
              <text class="merchant-order-card__label">
                {{ item.label }}
              </text>
            </view>

            <text class="merchant-order-card__count">
              {{ item.count }}
            </text>

            <text class="merchant-order-card__amount">
              {{ item.amount }}
            </text>
          </view>
        </view>
      </view>

      <view class="merchant-section merchant-section--bill">
        <view class="merchant-section__head">
          <text class="merchant-section__title">
            账单
          </text>

          <view class="merchant-section__toggle" @tap="toggleTodayBills">
            <view class="merchant-section__radio" :class="{ 'merchant-section__radio--active': onlyTodayBills }">
              <view v-if="onlyTodayBills" class="merchant-section__radio-dot" />
            </view>
            <text class="merchant-section__toggle-text">
              当日订单
            </text>
          </view>
        </view>

        <view class="merchant-bill-filter">
          <scroll-view class="merchant-bill-filter__scroll" scroll-x enhanced :show-scrollbar="false">
            <view class="merchant-bill-filter__list">
              <view
                v-for="tab in billTimeTabs"
                :key="tab.key"
                class="merchant-bill-filter__item"
                :class="{ 'merchant-bill-filter__item--active': tab.key === activeBillFilter }"
                @tap="switchBillFilter(tab.key)"
              >
                {{ tab.label }}
              </view>
            </view>
          </scroll-view>

          <view class="merchant-bill-filter__calendar" hover-class="merchant-bill-filter__calendar--hover" @tap="openMonthPicker">
            <image class="merchant-bill-filter__calendar-icon" :src="calendarMonthIcon" mode="aspectFit" />
          </view>
        </view>

        <view class="merchant-bill-list">
          <view v-for="bill in filteredBills" :key="bill.id" class="merchant-bill-card">
            <view class="merchant-bill-card__status-row">
              <view class="merchant-bill-card__status-wrap">
                <view class="merchant-bill-card__status-icon" :class="`merchant-bill-card__status-icon--${bill.status}`" />
                <text class="merchant-bill-card__status-text">
                  {{ getBillStatusLabel(bill.status) }}
                </text>
                <text class="merchant-bill-card__status-help">
                  ?
                </text>
              </view>
            </view>

            <view class="merchant-bill-card__summary-row">
              <text class="merchant-bill-card__date">
                {{ formatBillDate(bill.date) }}
              </text>

              <view class="merchant-bill-card__summary-amount">
                <text class="merchant-bill-card__summary-currency">
                  ¥
                </text>
                <text class="merchant-bill-card__summary-number">
                  {{ bill.summaryAmount }}
                </text>
                <text class="merchant-bill-card__summary-arrow">
                  ^
                </text>
              </view>
            </view>

            <text class="merchant-bill-card__desc">
              {{ bill.description }}
            </text>
            <text class="merchant-bill-card__desc">
              {{ bill.referenceNo }}
            </text>

            <view class="merchant-bill-card__divider" />

            <view class="merchant-bill-card__detail-row">
              <text class="merchant-bill-card__detail-label">
                {{ bill.transferDate }} {{ bill.transferLabel }}
              </text>

              <view class="merchant-bill-card__detail-amount">
                <text class="merchant-bill-card__detail-number">
                  ¥{{ bill.transferAmount }}
                </text>
                <text class="merchant-bill-card__detail-arrow">
                  ›
                </text>
              </view>
            </view>
          </view>

          <view v-if="!filteredBills.length" class="merchant-bill-empty">
            <text class="merchant-bill-empty__title">
              暂无账单记录
            </text>
            <text class="merchant-bill-empty__desc">
              可切换结算类型、账单时间或关闭当日订单筛选后再查看
            </text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="monthPickerVisible" class="merchant-month-picker">
      <view class="merchant-month-picker__mask" @tap="closeMonthPicker" />

      <view class="merchant-month-picker__panel" @tap.stop>
        <text class="merchant-month-picker__title">
          选择年和月
        </text>

        <view class="merchant-month-picker__labels">
          <text class="merchant-month-picker__label">
            年
          </text>
          <text class="merchant-month-picker__label">
            月
          </text>
        </view>

        <view class="merchant-month-picker__picker-wrap">
          <picker-view
            class="merchant-month-picker__picker"
            :value="monthPickerValue"
            indicator-style="height: 88rpx;"
            mask-style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.4) 25%, rgba(255, 255, 255, 0) 45%, rgba(255, 255, 255, 0) 55%, rgba(255, 255, 255, 0.4) 75%, rgba(255, 255, 255, 0.96) 100%);"
            @change="handleMonthPickerChange"
          >
            <picker-view-column>
              <view
                v-for="year in yearOptions"
                :key="year"
                class="merchant-month-picker__item"
              >
                {{ year }}
              </view>
            </picker-view-column>

            <picker-view-column>
              <view
                v-for="month in monthOptions"
                :key="month"
                class="merchant-month-picker__item"
              >
                {{ month }}
              </view>
            </picker-view-column>
          </picker-view>

          <view class="merchant-month-picker__underline merchant-month-picker__underline--left" />
          <view class="merchant-month-picker__underline merchant-month-picker__underline--right" />
          <view class="merchant-month-picker__chevron merchant-month-picker__chevron--left" />
          <view class="merchant-month-picker__chevron merchant-month-picker__chevron--right" />
        </view>

        <view class="merchant-month-picker__actions">
          <text class="merchant-month-picker__action merchant-month-picker__action--cancel" @tap="closeMonthPicker">
            取消
          </text>
          <text class="merchant-month-picker__action merchant-month-picker__action--confirm" @tap="confirmMonthPicker">
            确认
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.merchant-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f9f9fb 16%, #f4f5f8 100%);
}

.merchant-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.merchant-page__glow--left {
  top: -120rpx;
  left: -130rpx;
  width: 420rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 233, 173, 0.26) 0%, rgba(255, 233, 173, 0) 74%);
}

.merchant-page__glow--right {
  top: -40rpx;
  right: -100rpx;
  width: 340rpx;
  height: 240rpx;
  background: radial-gradient(circle, rgba(236, 236, 240, 0.9) 0%, rgba(236, 236, 240, 0) 72%);
}

.merchant-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 22rpx calc(env(safe-area-inset-bottom) + 40rpx);
}

.merchant-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
}

.merchant-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.merchant-nav__close {
  color: #2f3339;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}

.merchant-nav__title {
  color: #26292f;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.merchant-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.merchant-store-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 28rpx;
}

.merchant-store-row__main {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
}

.merchant-store-row__icon {
  flex-shrink: 0;
  width: 28rpx;
  height: 28rpx;
}

.merchant-store-row__name {
  overflow: hidden;
  color: #3a3e45;
  font-size: 30rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.merchant-balance-card {
  margin-top: 24rpx;
  padding: 22rpx 22rpx 26rpx;
  border-radius: 28rpx;
  background: linear-gradient(180deg, rgba(255, 242, 242, 0.98) 0%, rgba(255, 244, 244, 0.95) 100%);
  box-shadow: 0 16rpx 38rpx rgba(78, 83, 99, 0.06);
}

.merchant-balance-card__header,
.merchant-balance-card__tabs,
.merchant-section__head,
.merchant-section__toggle,
.merchant-order-card__row,
.merchant-order-card__label-wrap,
.merchant-bill-filter,
.merchant-bill-filter__list,
.merchant-bill-card__status-row,
.merchant-bill-card__status-wrap,
.merchant-bill-card__summary-row,
.merchant-bill-card__summary-amount,
.merchant-bill-card__detail-row,
.merchant-bill-card__detail-amount,
.merchant-month-picker__labels,
.merchant-month-picker__actions {
  display: flex;
  align-items: center;
}

.merchant-balance-card__header {
  justify-content: space-between;
  align-items: flex-start;
  gap: 20rpx;
}

.merchant-balance-card__label {
  color: #636871;
  font-size: 28rpx;
  font-weight: 600;
}

.merchant-balance-card__tabs {
  gap: 8rpx;
  padding: 4rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.46);
}

.merchant-balance-card__tab {
  min-width: 78rpx;
  padding: 10rpx 0;
  border-radius: 14rpx;
  color: #8c9098;
  font-size: 28rpx;
  font-weight: 600;
  text-align: center;
}

.merchant-balance-card__tab--active {
  background: #fff;
  color: #ff5b4d;
  box-shadow: 0 8rpx 16rpx rgba(255, 91, 77, 0.08);
}

.merchant-balance-card__body {
  margin-top: 26rpx;
}

.merchant-balance-card__amount {
  color: #202429;
  font-size: 76rpx;
  font-weight: 700;
  line-height: 1;
}

.merchant-balance-card__subtitle {
  display: block;
  margin-top: 12rpx;
  color: #979ca5;
  font-size: 24rpx;
}

.merchant-section {
  margin-top: 34rpx;
}

.merchant-section--bill {
  padding-bottom: 12rpx;
}

.merchant-section__head {
  justify-content: space-between;
  gap: 20rpx;
}

.merchant-section__title {
  color: #26292f;
  font-size: 52rpx;
  font-weight: 700;
}

.merchant-section__toggle {
  gap: 8rpx;
}

.merchant-section__radio {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26rpx;
  height: 26rpx;
  border: 2rpx solid #d3d6dd;
  border-radius: 50%;
  box-sizing: border-box;
}

.merchant-section__radio--active {
  border-color: #ff3b30;
}

.merchant-section__radio-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ff3b30;
}

.merchant-section__toggle-text {
  color: #7f848d;
  font-size: 28rpx;
  font-weight: 500;
}

.merchant-order-card {
  margin-top: 22rpx;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(246, 248, 252, 0.98);
  box-shadow: 0 14rpx 34rpx rgba(78, 83, 99, 0.05);
}

.merchant-order-card__row {
  justify-content: space-between;
  gap: 16rpx;
  min-height: 72rpx;
}

.merchant-order-card__row + .merchant-order-card__row {
  border-top: 1rpx solid rgba(224, 227, 233, 0.66);
}

.merchant-order-card__label-wrap {
  flex: 1;
  gap: 12rpx;
  min-width: 0;
}

.merchant-order-card__dot {
  flex-shrink: 0;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.merchant-order-card__label,
.merchant-order-card__count,
.merchant-order-card__amount {
  color: #4b5057;
  font-size: 28rpx;
  font-weight: 600;
}

.merchant-order-card__count {
  min-width: 80rpx;
  text-align: center;
}

.merchant-order-card__amount {
  min-width: 120rpx;
  text-align: right;
}

.merchant-bill-filter {
  gap: 14rpx;
  margin-top: 22rpx;
}

.merchant-bill-filter__scroll {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}

.merchant-bill-filter__list {
  gap: 14rpx;
  padding: 0 2rpx;
}

.merchant-bill-filter__item {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: 110rpx;
  height: 62rpx;
  padding: 0 18rpx;
  border-radius: 14rpx;
  background: #eef1f5;
  color: #444950;
  font-size: 28rpx;
  font-weight: 600;
  box-sizing: border-box;
}

.merchant-bill-filter__item--active {
  background: #ff2a23;
  color: #fff;
  box-shadow: 0 10rpx 22rpx rgba(255, 42, 35, 0.18);
}

.merchant-bill-filter__calendar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 62rpx;
  height: 62rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10rpx 22rpx rgba(78, 83, 99, 0.07);
}

.merchant-bill-filter__calendar--hover {
  opacity: 0.84;
}

.merchant-bill-filter__calendar-icon {
  width: 34rpx;
  height: 34rpx;
}

.merchant-bill-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 18rpx;
}

.merchant-bill-card {
  padding: 22rpx 22rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 40rpx rgba(56, 61, 86, 0.07);
}

.merchant-bill-card__status-wrap {
  gap: 10rpx;
}

.merchant-bill-card__status-icon {
  width: 16rpx;
  height: 24rpx;
  border-radius: 4rpx;
}

.merchant-bill-card__status-icon--settled {
  background: linear-gradient(180deg, #ffcb2f 0%, #ffae00 100%);
}

.merchant-bill-card__status-icon--pending {
  background: linear-gradient(180deg, #ffd4d1 0%, #ff6f66 100%);
}

.merchant-bill-card__status-text {
  color: #4c5158;
  font-size: 32rpx;
  font-weight: 700;
}

.merchant-bill-card__status-help {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid #d8dbe1;
  border-radius: 50%;
  color: #b1b5bd;
  font-size: 20rpx;
  line-height: 1;
  box-sizing: border-box;
}

.merchant-bill-card__summary-row {
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 22rpx;
}

.merchant-bill-card__date {
  color: #31353c;
  font-size: 42rpx;
  font-weight: 700;
}

.merchant-bill-card__summary-amount {
  gap: 2rpx;
  color: #202429;
}

.merchant-bill-card__summary-currency {
  font-size: 28rpx;
  font-weight: 700;
}

.merchant-bill-card__summary-number {
  font-size: 48rpx;
  font-weight: 800;
  line-height: 1;
}

.merchant-bill-card__summary-arrow {
  margin-left: 2rpx;
  color: #8d929b;
  font-size: 22rpx;
  transform: translateY(-4rpx);
}

.merchant-bill-card__desc {
  display: block;
  margin-top: 10rpx;
  color: #9aa0a9;
  font-size: 26rpx;
  line-height: 1.45;
}

.merchant-bill-card__divider {
  height: 1rpx;
  margin: 18rpx 0;
  background: rgba(228, 231, 237, 0.88);
}

.merchant-bill-card__detail-row {
  justify-content: space-between;
  gap: 16rpx;
}

.merchant-bill-card__detail-label {
  color: #666c75;
  font-size: 28rpx;
  font-weight: 600;
}

.merchant-bill-card__detail-amount {
  gap: 6rpx;
}

.merchant-bill-card__detail-number {
  color: #2c3036;
  font-size: 30rpx;
  font-weight: 700;
}

.merchant-bill-card__detail-arrow {
  color: #9ca1aa;
  font-size: 30rpx;
  line-height: 1;
}

.merchant-bill-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 84rpx 32rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16rpx 34rpx rgba(56, 61, 86, 0.05);
}

.merchant-bill-empty__title {
  color: #484d55;
  font-size: 30rpx;
  font-weight: 700;
}

.merchant-bill-empty__desc {
  margin-top: 12rpx;
  color: #8d929b;
  font-size: 25rpx;
  text-align: center;
}

.merchant-month-picker {
  position: fixed;
  inset: 0;
  z-index: 40;
}

.merchant-month-picker__mask {
  position: absolute;
  inset: 0;
  background: rgba(17, 22, 29, 0.18);
}

.merchant-month-picker__panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 28rpx 30rpx calc(env(safe-area-inset-bottom) + 28rpx);
  border-radius: 28rpx 28rpx 0 0;
  background: #fff;
}

.merchant-month-picker__title {
  display: block;
  color: #24282f;
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
}

.merchant-month-picker__labels {
  gap: 36rpx;
  margin-top: 42rpx;
}

.merchant-month-picker__label {
  flex: 1;
  color: #3d4249;
  font-size: 28rpx;
  font-weight: 600;
}

.merchant-month-picker__picker-wrap {
  position: relative;
  margin-top: 8rpx;
}

.merchant-month-picker__picker {
  width: 100%;
  height: 220rpx;
}

.merchant-month-picker__item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  color: #2b2f35;
  font-size: 50rpx;
  font-weight: 500;
}

.merchant-month-picker__underline {
  position: absolute;
  bottom: 16rpx;
  width: calc(50% - 30rpx);
  height: 2rpx;
  background: #cfd2d8;
}

.merchant-month-picker__underline--left {
  left: 0;
}

.merchant-month-picker__underline--right {
  right: 0;
}

.merchant-month-picker__chevron {
  position: absolute;
  top: 82rpx;
  width: 0;
  height: 0;
  border-top: 10rpx solid #6b7078;
  border-right: 8rpx solid transparent;
  border-left: 8rpx solid transparent;
}

.merchant-month-picker__chevron--left {
  left: calc(25% + 68rpx);
}

.merchant-month-picker__chevron--right {
  left: calc(75% + 18rpx);
}

.merchant-month-picker__actions {
  justify-content: flex-end;
  gap: 72rpx;
  margin-top: 18rpx;
}

.merchant-month-picker__action {
  font-size: 32rpx;
  font-weight: 700;
}

.merchant-month-picker__action--cancel {
  color: #b9bcc3;
}

.merchant-month-picker__action--confirm {
  color: #ff3326;
}
</style>
