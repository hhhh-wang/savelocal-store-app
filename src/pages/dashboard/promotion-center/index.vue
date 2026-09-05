<script lang="ts" setup>
import type { MerchantPromotionAccount, MerchantPromotionAssetFlowItem, MerchantPromotionOverview, MerchantPromotionRewardItem } from '@/api/merchant-promotion'
import {
  getMerchantPromotionAccount,
  getMerchantPromotionAssetFlowPage,
  getMerchantPromotionOverview,
  getMerchantPromotionRewardPage,
} from '@/api/merchant-promotion'
import { useMerchantFoodStore } from '@/store'

defineOptions({
  name: 'PromotionCenter',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '推广中心',
  },
})

type PromotionTab = 'rewards' | 'flows'

const PAGE_SIZE = 20

const REWARD_TYPE_LABELS: Record<string, string> = {
  REGISTER_REWARD: '注册奖励',
  MERCHANT_PROMOTE_REGISTER_REWARD: '推广注册奖励',
  ORDER_REWARD: '订单奖励',
  FOOD_CONSUMER_REBATE: '消费返奖励',
  ORDER_NO_COUPON_BONUS: '未用券奖励',
  MANUAL_GRANT: '人工发放',
  REWARD_CANCEL: '奖励冲回',
}

const REWARD_STATUS_LABELS: Record<string, string> = {
  0: '待发放',
  1: '已发放',
  2: '已取消',
  3: '已冲回',
}

const REWARD_STATUS_CLASS: Record<string, string> = {
  0: 'pending',
  1: 'granted',
  2: 'cancelled',
  3: 'rollback',
}

const REWARD_MODE_LABELS: Record<string, string> = {
  1: '消费者邀消费者',
  2: '推广人拓展商家',
  3: '商家推广消费者',
  4: '推广消费者转商家',
}

const DIRECTION_LABELS: Record<string, string> = {
  1: '收入',
  2: '支出',
  3: '冻结',
  4: '解冻',
}

const statusFilters = [
  { value: '', label: '全部' },
  { value: '1', label: '已发放' },
  { value: '0', label: '待发放' },
  { value: '3', label: '已冲回' },
  { value: '2', label: '已取消' },
]

const fallbackUrl = '/pages/dashboard/index'
const merchantFoodStore = useMerchantFoodStore()

const account = ref<MerchantPromotionAccount>()
const overview = ref<MerchantPromotionOverview>()
const activeTab = ref<PromotionTab>('rewards')
const activeStatus = ref('')
const activeStoreId = ref<number>()
const rewardList = ref<MerchantPromotionRewardItem[]>([])
const rewardTotal = ref(0)
const flowList = ref<MerchantPromotionAssetFlowItem[]>([])
const flowTotal = ref(0)
const pageNum = ref(1)
const loading = ref(false)

const storeOptions = computed(() => merchantFoodStore.stores)

const balance = computed(() => formatAmount(account.value?.cityCoinBalance))
const frozenAmount = computed(() => formatAmount(account.value?.cityCoinFrozen))
const todayIncome = computed(() => formatAmount(overview.value?.rewardGrantAmount))
const totalGrant = computed(() => formatAmount(account.value?.totalCityCoinGrant))
const totalUsed = computed(() => formatAmount(account.value?.totalCityCoinUsed))

const summaryStats = computed(() => [
  { label: '冻结中', value: frozenAmount.value },
  { label: '今日入账', value: todayIncome.value },
  { label: '累计发放', value: totalGrant.value },
  { label: '累计消耗', value: totalUsed.value },
])

function formatAmount(value?: number) {
  return Number(value || 0).toFixed(2)
}

function formatTime(value?: string) {
  if (!value)
    return '--'
  return value.replace('T', ' ').slice(0, 16)
}

function getRewardTypeLabel(type: string) {
  return REWARD_TYPE_LABELS[type] || type
}

function getBizTypeLabel(type: string) {
  return REWARD_TYPE_LABELS[type] || type
}

function getRewardTime(item: MerchantPromotionRewardItem) {
  if (item.status === '3' && item.cancelTime)
    return formatTime(item.cancelTime)
  return formatTime(item.grantTime || item.createTime)
}

function getFlowSign(direction: string) {
  if (direction === '1')
    return '+'
  if (direction === '2')
    return '-'
  return ''
}

function getFlowAmountClass(direction: string) {
  return direction === '1' ? 'income' : direction === '2' ? 'expense' : 'neutral'
}

function getTodayTimeRange() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return { beginTime: `${date} 00:00:00`, endTime: `${date} 23:59:59` }
}

async function loadSummary() {
  const range = getTodayTimeRange()
  const [accountResult, overviewResult] = await Promise.all([
    getMerchantPromotionAccount(),
    getMerchantPromotionOverview(range.beginTime, range.endTime),
  ])
  account.value = accountResult
  overview.value = overviewResult
}

async function loadRewards(reset = true) {
  if (!reset && loading.value)
    return

  loading.value = true
  try {
    const page = reset ? 1 : pageNum.value + 1
    const result = await getMerchantPromotionRewardPage({
      status: activeStatus.value || undefined,
      tradeStoreId: activeStoreId.value,
      pageNum: page,
      pageSize: PAGE_SIZE,
    })
    pageNum.value = page
    rewardTotal.value = result.total || 0
    const rows = result.rows || []
    rewardList.value = reset ? rows : [...rewardList.value, ...rows]
  }
  finally {
    loading.value = false
  }
}

async function loadFlows(reset = true) {
  if (!reset && loading.value)
    return

  loading.value = true
  try {
    const page = reset ? 1 : pageNum.value + 1
    const result = await getMerchantPromotionAssetFlowPage({
      pageNum: page,
      pageSize: PAGE_SIZE,
    })
    pageNum.value = page
    flowTotal.value = result.total || 0
    const rows = result.rows || []
    flowList.value = reset ? rows : [...flowList.value, ...rows]
  }
  finally {
    loading.value = false
  }
}

function reloadActiveTab() {
  pageNum.value = 1
  if (activeTab.value === 'rewards')
    loadRewards(true).catch(() => {})
  else
    loadFlows(true).catch(() => {})
}

function switchTab(tab: PromotionTab) {
  if (activeTab.value === tab)
    return

  activeTab.value = tab
  reloadActiveTab()
}

function switchStatus(value: string) {
  if (activeStatus.value === value)
    return

  activeStatus.value = value
  reloadActiveTab()
}

function switchStore(storeId?: number) {
  if (activeStoreId.value === storeId)
    return

  activeStoreId.value = storeId
  if (activeTab.value === 'rewards')
    reloadActiveTab()
}

function loadMore() {
  if (loading.value)
    return

  if (activeTab.value === 'rewards' && rewardList.value.length < rewardTotal.value) {
    loadRewards(false).catch(() => {})
    return
  }

  if (activeTab.value === 'flows' && flowList.value.length < flowTotal.value)
    loadFlows(false).catch(() => {})
}

onShow(() => {
  loadSummary().catch(() => {})
  merchantFoodStore.loadStores().catch(() => {})
  reloadActiveTab()
})

onReachBottom(() => {
  loadMore()
})
</script>

<template>
  <view class="promotion-page">
    <view class="promotion-page__glow promotion-page__glow--left" />
    <view class="promotion-page__glow promotion-page__glow--right" />

    <view class="promotion-page__content">
      <view class="promotion-nav">
        <view class="promotion-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="reLaunch"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />
        </view>

        <text class="promotion-nav__title">
          推广中心
        </text>

        <view class="promotion-nav__spacer" />
      </view>

      <view class="summary-card">
        <text class="summary-card__label">
          推广奖励同城币
        </text>
        <text class="summary-card__hint">
          商家主体账户 · 所有门店共享
        </text>
        <view class="summary-card__amount-row">
          <text class="summary-card__amount">
            {{ balance }}
          </text>
          <text class="summary-card__unit">
            元
          </text>
        </view>

        <view class="summary-card__stats">
          <view v-for="stat in summaryStats" :key="stat.label" class="summary-card__stat">
            <text class="summary-card__stat-value">
              {{ stat.value }}
            </text>
            <text class="summary-card__stat-label">
              {{ stat.label }}
            </text>
          </view>
        </view>
      </view>

      <view class="list-card">
        <view class="list-card__tabs">
          <view
            class="list-card__tab"
            :class="{ 'list-card__tab--active': activeTab === 'rewards' }"
            @tap="switchTab('rewards')"
          >
            奖励明细
          </view>
          <view
            class="list-card__tab"
            :class="{ 'list-card__tab--active': activeTab === 'flows' }"
            @tap="switchTab('flows')"
          >
            资产流水
          </view>
        </view>

        <scroll-view
          v-if="activeTab === 'rewards'"
          class="filter-scroll"
          scroll-x
          enhanced
          :show-scrollbar="false"
        >
          <view class="filter-chips">
            <view
              v-for="filter in statusFilters"
              :key="filter.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': filter.value === activeStatus }"
              @tap="switchStatus(filter.value)"
            >
              {{ filter.label }}
            </view>
          </view>
        </scroll-view>

        <scroll-view
          v-if="activeTab === 'rewards'"
          class="filter-scroll"
          scroll-x
          enhanced
          :show-scrollbar="false"
        >
          <view class="filter-chips">
            <view
              class="filter-chip"
              :class="{ 'filter-chip--active': activeStoreId === undefined }"
              @tap="switchStore(undefined)"
            >
              全部门店
            </view>
            <view
              v-for="store in storeOptions"
              :key="store.storeId"
              class="filter-chip"
              :class="{ 'filter-chip--active': store.storeId === activeStoreId }"
              @tap="switchStore(store.storeId)"
            >
              {{ store.storeName }}
            </view>
          </view>
        </scroll-view>

        <view v-if="activeTab === 'rewards'" class="record-list">
          <view v-for="item in rewardList" :key="item.rewardId" class="record-card">
            <view class="record-card__top">
              <text class="record-card__title">
                {{ getRewardTypeLabel(item.rewardType) }}
              </text>
              <view class="record-card__amount">
                <text class="record-card__amount-value">
                  {{ formatAmount(item.rewardAmount) }}
                </text>
                <text class="record-card__amount-unit">
                  元
                </text>
              </view>
            </view>

            <view class="record-card__badges">
              <view class="status-badge" :class="`status-badge--${REWARD_STATUS_CLASS[item.status] || 'pending'}`">
                {{ REWARD_STATUS_LABELS[item.status] || item.status }}
              </view>
              <view v-if="REWARD_MODE_LABELS[item.rewardMode]" class="mode-badge">
                {{ REWARD_MODE_LABELS[item.rewardMode] }}
              </view>
            </view>

            <view class="record-card__meta">
              <text class="record-card__meta-item">
                时间：{{ getRewardTime(item) }}
              </text>
              <text v-if="item.promoterSubjectName || item.sourceMemberNickname" class="record-card__meta-item">
                来源：{{ item.promoterSubjectName || item.sourceMemberNickname }}
              </text>
              <text class="record-card__meta-item">
                成交门店：{{ item.tradeStoreName || '--' }}
              </text>
              <text v-if="item.relationOrderNo" class="record-card__meta-item">
                订单号：{{ item.relationOrderNo }}
              </text>
            </view>
          </view>

          <view v-if="!rewardList.length" class="record-empty">
            <text class="record-empty__title">
              暂无奖励记录
            </text>
            <text class="record-empty__desc">
              切换筛选条件后再看看
            </text>
          </view>
        </view>

        <view v-if="activeTab === 'flows'" class="record-list">
          <view v-for="item in flowList" :key="item.flowId" class="record-card">
            <view class="record-card__top">
              <text class="record-card__title">
                {{ getBizTypeLabel(item.bizType) }}
              </text>
              <view class="record-card__amount">
                <text class="record-card__amount-value" :class="getFlowAmountClass(item.direction)">
                  {{ getFlowSign(item.direction) }}{{ formatAmount(item.changeAmount) }}
                </text>
                <text class="record-card__amount-unit">
                  元
                </text>
              </view>
            </view>

            <view class="record-card__badges">
              <view class="direction-badge">
                {{ DIRECTION_LABELS[item.direction] || item.direction }}
              </view>
            </view>

            <view class="record-card__meta">
              <text class="record-card__meta-item">
                时间：{{ formatTime(item.createTime) }}
              </text>
              <text v-if="item.beforeBalance !== undefined && item.afterBalance !== undefined" class="record-card__meta-item">
                余额：{{ formatAmount(item.beforeBalance) }} → {{ formatAmount(item.afterBalance) }}
              </text>
              <text v-if="item.relationOrderNo" class="record-card__meta-item">
                订单号：{{ item.relationOrderNo }}
              </text>
              <text v-if="item.relationRewardNo" class="record-card__meta-item">
                奖励单号：{{ item.relationRewardNo }}
              </text>
            </view>
          </view>

          <view v-if="!flowList.length" class="record-empty">
            <text class="record-empty__title">
              暂无资产流水
            </text>
            <text class="record-empty__desc">
              同城币的发放、冲回都会在这里留痕
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.promotion-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #fff9df 0%, #f7f7fb 15%, #f3f4f8 38%, #f1f2f6 100%);
}

.promotion-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.promotion-page__glow--left {
  top: -120rpx;
  left: -140rpx;
  width: 440rpx;
  height: 320rpx;
  background: radial-gradient(circle, rgba(255, 227, 112, 0.78) 0%, rgba(255, 227, 112, 0) 70%);
}

.promotion-page__glow--right {
  top: -50rpx;
  right: -120rpx;
  width: 360rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(229, 216, 255, 0.8) 0%, rgba(229, 216, 255, 0) 68%);
}

.promotion-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 24rpx) 22rpx calc(env(safe-area-inset-bottom) + 40rpx);
}

.promotion-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
}

.promotion-nav__left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.promotion-nav__title {
  color: #26292f;
  font-size: 20px;
  font-weight: 400;
  text-align: center;
}

.promotion-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.summary-card {
  margin-top: 24rpx;
  padding: 26rpx 26rpx 28rpx;
  border-radius: 28rpx;
  background: linear-gradient(180deg, rgba(255, 241, 240, 0.98) 0%, rgba(255, 255, 255, 0.98) 68%);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.summary-card__label {
  display: block;
  color: #34383f;
  font-size: 30rpx;
  font-weight: 600;
}

.summary-card__hint {
  display: block;
  margin-top: 8rpx;
  color: #b0b4bc;
  font-size: 22rpx;
}

.summary-card__amount-row {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-top: 18rpx;
}

.summary-card__amount {
  color: #171a1f;
  font-size: 72rpx;
  font-weight: 700;
  line-height: 1;
}

.summary-card__unit {
  color: #ef5d22;
  font-size: 24rpx;
}

.summary-card__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 26rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid rgba(228, 231, 237, 0.8);
}

.summary-card__stat {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.summary-card__stat-value {
  overflow: hidden;
  color: #202429;
  font-size: 32rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-card__stat-label {
  color: #8d929b;
  font-size: 22rpx;
}

.list-card {
  margin-top: 24rpx;
  padding: 20rpx 20rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.list-card__tabs {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 4rpx;
  border-radius: 18rpx;
  background: rgba(245, 246, 249, 0.9);
}

.list-card__tab {
  flex: 1;
  padding: 14rpx 0;
  border-radius: 14rpx;
  color: #8c9098;
  font-size: 28rpx;
  font-weight: 600;
  text-align: center;
}

.list-card__tab--active {
  background: #fff;
  color: #ef5d22;
  box-shadow: 0 8rpx 16rpx rgba(239, 93, 34, 0.1);
}

.filter-scroll {
  margin-top: 20rpx;
  white-space: nowrap;
}

.filter-chips {
  display: inline-flex;
  gap: 14rpx;
  padding: 0 2rpx;
}

.filter-chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: 58rpx;
  padding: 0 20rpx;
  border-radius: 14rpx;
  background: #eef1f5;
  color: #444950;
  font-size: 26rpx;
  font-weight: 500;
}

.filter-chip--active {
  background: rgba(239, 93, 34, 0.1);
  color: #ef5d22;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 20rpx;
}

.record-card {
  padding: 22rpx 22rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(250, 250, 252, 0.98);
  box-shadow: 0 10rpx 28rpx rgba(56, 61, 86, 0.05);
}

.record-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.record-card__title {
  flex: 1;
  min-width: 0;
  color: #26292f;
  font-size: 30rpx;
  font-weight: 700;
}

.record-card__amount {
  display: flex;
  align-items: baseline;
  flex-shrink: 0;
  gap: 4rpx;
}

.record-card__amount-value {
  color: #202429;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1;
}

.record-card__amount-value.income {
  color: #ef5d22;
}

.record-card__amount-value.expense {
  color: #6b7078;
}

.record-card__amount-value.neutral {
  color: #202429;
}

.record-card__amount-unit {
  color: #b0b4bc;
  font-size: 20rpx;
}

.record-card__badges {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 14rpx;
}

.status-badge {
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.status-badge--granted {
  background: rgba(31, 157, 85, 0.1);
  color: #1f9d55;
}

.status-badge--pending {
  background: rgba(240, 160, 32, 0.12);
  color: #d68307;
}

.status-badge--rollback {
  background: rgba(224, 32, 32, 0.08);
  color: #e02020;
}

.status-badge--cancelled {
  background: rgba(160, 164, 171, 0.14);
  color: #7d828b;
}

.mode-badge {
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  background: rgba(47, 134, 255, 0.08);
  color: #2f86ff;
  font-size: 22rpx;
}

.direction-badge {
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  background: rgba(239, 93, 34, 0.08);
  color: #ef5d22;
  font-size: 22rpx;
}

.record-card__meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 14rpx;
}

.record-card__meta-item {
  overflow: hidden;
  color: #9aa0a9;
  font-size: 24rpx;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 72rpx 32rpx;
  border-radius: 24rpx;
  background: rgba(250, 250, 252, 0.98);
}

.record-empty__title {
  color: #484d55;
  font-size: 30rpx;
  font-weight: 700;
}

.record-empty__desc {
  margin-top: 12rpx;
  color: #8d929b;
  font-size: 25rpx;
  text-align: center;
}
</style>
