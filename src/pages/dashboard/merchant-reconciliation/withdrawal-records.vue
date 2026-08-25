<script lang="ts" setup>
import type { MerchantWithdrawApply, MerchantWithdrawApplyDetail } from '@/api/merchant-withdrawal'
import { getMerchantWithdrawal, listMerchantWithdrawals } from '@/api/merchant-withdrawal'
import { useMerchantFoodStore } from '@/store'
import WithdrawalPageHeader from './components/withdrawal-page-header.vue'
import { WITHDRAWAL_PATHS } from './withdrawal'

defineOptions({ name: 'MerchantWithdrawalRecords' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '提现记录',
  },
})

const merchantFoodStore = useMerchantFoodStore()
const loading = ref(false)
const records = ref<MerchantWithdrawApply[]>([])
const total = ref(0)
const detailVisible = ref(false)
const selectedWithdrawal = ref<MerchantWithdrawApply>()
const selectedDetails = ref<MerchantWithdrawApplyDetail[]>([])

onShow(() => {
  void loadWithdrawals()
})

async function loadWithdrawals() {
  loading.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    const result = await listMerchantWithdrawals(storeId, 1, 50)
    records.value = result.rows || []
    total.value = result.total || records.value.length
  }
  catch (error) {
    console.error('加载提现记录失败:', error)
  }
  finally {
    loading.value = false
  }
}

async function openWithdrawalDetail(record: MerchantWithdrawApply) {
  try {
    const result = await getMerchantWithdrawal(record.withdrawId)
    selectedWithdrawal.value = result.withdraw
    selectedDetails.value = result.details || []
    detailVisible.value = true
  }
  catch (error) {
    console.error('加载提现详情失败:', error)
  }
}

function closeDetail() {
  detailVisible.value = false
}

function statusLabel(status?: string) {
  return {
    0: '待审核',
    1: '审核驳回',
    2: '待打款',
    3: '转账中',
    4: '转账成功',
    5: '转账失败',
  }[String(status || '')] || '处理中'
}

function statusTone(status?: string) {
  return {
    0: 'pending',
    1: 'failed',
    2: 'pending',
    3: 'processing',
    4: 'success',
    5: 'failed',
  }[String(status || '')] || 'processing'
}

function sceneLabel(scene?: string) {
  return {
    FOOD_ONSITE: '到店买单',
    STORE_BUYOUT: '到店买单',
    FOOD_DEAL: '团购订单',
    FOOD_GROUP_BUY: '团购订单',
    FOOD_TAKEOUT: '外卖订单',
  }[String(scene || '')] || scene || '-'
}

function profitSharingStatusLabel(status?: string) {
  return {
    PENDING: '待处理',
    PROCESSING: '处理中',
    SUCCESS: '转账成功',
    FAILED: '转账失败',
  }[String(status || '')] || '处理中'
}

function formatAmount(value?: number | string) {
  return Number(value || 0).toFixed(2)
}

function showAgreement() {
  uni.showToast({ title: '协议说明暂未开放', icon: 'none' })
}
</script>

<template>
  <view class="withdrawal-records-page">
    <withdrawal-page-header title="提现记录" :fallback-url="WITHDRAWAL_PATHS.overview" />

    <view class="arrival-banner">
      <view class="arrival-banner__copy">
        <view class="i-carbon-notification-filled arrival-banner__icon" />
        <text>提现金额一般1~3个工作日到账</text>
      </view>
      <view class="arrival-banner__action" @tap="showAgreement">
        协议说明
      </view>
    </view>

    <view class="withdrawal-records-list">
      <view v-if="!loading && !records.length" class="withdrawal-records-empty">
        暂无提现记录
      </view>
      <view
        v-for="record in records"
        :key="record.withdrawId"
        class="withdrawal-record"
        @tap="openWithdrawalDetail(record)"
      >
        <view class="withdrawal-record__main">
          <view class="withdrawal-record__destination">
            <text>{{ record.withdrawNo || '提现记录' }}</text>
            <text>{{ record.storeNameSnapshot || '当前门店' }} · {{ sceneLabel(record.tradeScene) }}</text>
          </view>
          <text class="withdrawal-record__amount">¥ {{ formatAmount(record.payableAmount) }}</text>
        </view>
        <text class="withdrawal-record__account">{{ record.profitSharingReceiverName || record.settlementNameSnapshot || '微信收款用户' }}</text>
        <view class="withdrawal-record__meta">
          <text>{{ record.transferFinishTime || record.transferTime || record.createTime || '-' }}</text>
          <text class="withdrawal-record__status" :class="`withdrawal-record__status--${statusTone(record.withdrawStatus)}`">{{ statusLabel(record.withdrawStatus) }}</text>
        </view>
      </view>
    </view>

    <text v-if="records.length && records.length >= total" class="withdrawal-records-page__end">暂无更多</text>

    <view v-if="detailVisible" class="withdrawal-detail-mask" @tap="closeDetail">
      <view class="withdrawal-detail-panel" @tap.stop>
        <view class="withdrawal-detail-header">
          <text class="withdrawal-detail-title">提现详情</text>
          <text class="withdrawal-detail-close" @tap="closeDetail">×</text>
        </view>
        <scroll-view scroll-y class="withdrawal-detail-scroll">
          <view v-if="selectedWithdrawal" class="withdrawal-detail-summary">
            <view class="withdrawal-detail-row">
              <text>提现单号</text><text>{{ selectedWithdrawal.withdrawNo || '-' }}</text>
            </view>
            <view class="withdrawal-detail-row">
              <text>交易场景</text><text>{{ sceneLabel(selectedWithdrawal.tradeScene) }}</text>
            </view>
            <view class="withdrawal-detail-row">
              <text>申请金额</text><text>¥{{ formatAmount(selectedWithdrawal.applyAmount) }}</text>
            </view>
            <view class="withdrawal-detail-row">
              <text>到账金额</text><text>¥{{ formatAmount(selectedWithdrawal.payableAmount) }}</text>
            </view>
            <view class="withdrawal-detail-row">
              <text>状态</text><text :class="`withdrawal-record__status--${statusTone(selectedWithdrawal.withdrawStatus)}`">{{ statusLabel(selectedWithdrawal.withdrawStatus) }}</text>
            </view>
            <view v-if="selectedWithdrawal.wxTransferBillNo" class="withdrawal-detail-row">
              <text>微信转账单号</text><text>{{ selectedWithdrawal.wxTransferBillNo }}</text>
            </view>
            <view class="withdrawal-detail-row">
              <text>转账收款方</text><text>{{ selectedWithdrawal.profitSharingReceiverName || selectedWithdrawal.settlementNameSnapshot || '-' }}</text>
            </view>
            <view v-if="selectedWithdrawal.transferFailReason" class="withdrawal-detail-error">
              {{ selectedWithdrawal.transferFailReason }}
            </view>
          </view>
          <view class="withdrawal-detail-section-title">
            原结算明细
          </view>
          <view v-for="detail in selectedDetails" :key="detail.detailId" class="withdrawal-detail-item">
            <view class="withdrawal-detail-item__top">
              <text>{{ detail.orderNo || '-' }}</text><text>¥{{ formatAmount(detail.amount) }}</text>
            </view>
            <view class="withdrawal-detail-item__meta">
              <text>{{ sceneLabel(detail.tradeScene) }}</text><text>{{ profitSharingStatusLabel(detail.profitSharingStatus) }}</text>
            </view>
            <view v-if="detail.wxProfitSharingOrderId" class="withdrawal-detail-item__sub">
              原分账单号：{{ detail.wxProfitSharingOrderId }}
            </view>
            <view v-if="detail.profitSharingFailReason" class="withdrawal-detail-error">
              {{ detail.profitSharingFailReason }}
            </view>
          </view>
          <view v-if="!selectedDetails.length" class="withdrawal-records-empty">
            暂无明细
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.withdrawal-records-page {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 60rpx);
  box-sizing: border-box;
  background: #f5f5f5;
  color: #303030;
}

.arrival-banner,
.arrival-banner__copy,
.withdrawal-record__main,
.withdrawal-record__meta {
  display: flex;
  align-items: center;
}

.arrival-banner {
  justify-content: space-between;
  gap: 20rpx;
  min-height: 96rpx;
  padding: 0 32rpx;
  background: #6ca8f5;
  color: #fff;
}

.arrival-banner__copy {
  min-width: 0;
  flex: 1;
  gap: 16rpx;
  font-size: 29rpx;
  line-height: 1.4;
}

.arrival-banner__icon {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
}

.arrival-banner__action {
  flex-shrink: 0;
  padding: 10rpx 18rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  border-radius: 10rpx;
  font-size: 28rpx;
}

.withdrawal-records-list {
  background: #fff;
}

.withdrawal-record {
  margin-left: 32rpx;
  padding: 32rpx 32rpx 30rpx 0;
  border-bottom: 1rpx solid #ededed;
}

.withdrawal-record__main {
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.withdrawal-record__destination {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  color: #303030;
  font-size: 28rpx;
  line-height: 1.35;
}

.withdrawal-record__amount {
  flex-shrink: 0;
  color: #303030;
  font-size: 37rpx;
  font-weight: 400;
  line-height: 1.2;
  white-space: nowrap;
}

.withdrawal-record__account {
  display: block;
  margin-top: 16rpx;
  color: #666;
  font-size: 27rpx;
}

.withdrawal-record__meta {
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 12rpx;
  color: #aaa;
  font-size: 26rpx;
}

.withdrawal-record__status {
  color: #21bc16;
}

.withdrawal-record__status--pending {
  color: #ee9b16;
}

.withdrawal-record__status--processing {
  color: #4389e8;
}

.withdrawal-record__status--failed {
  color: #e55353;
}

.withdrawal-record__status--success {
  color: #21bc16;
}

.withdrawal-records-empty {
  padding: 88rpx 32rpx;
  color: #aaa;
  font-size: 28rpx;
  text-align: center;
}

.withdrawal-records-page__end {
  display: block;
  margin-top: 34rpx;
  color: #aaa;
  font-size: 27rpx;
  text-align: center;
}

.withdrawal-detail-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.42);
}

.withdrawal-detail-panel {
  width: 100%;
  max-height: 78vh;
  padding-bottom: env(safe-area-inset-bottom);
  border-radius: 28rpx 28rpx 0 0;
  background: #fff;
}

.withdrawal-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #eee;
}

.withdrawal-detail-title {
  color: #222;
  font-size: 32rpx;
  font-weight: 700;
}

.withdrawal-detail-close {
  color: #999;
  font-size: 48rpx;
  line-height: 1;
}

.withdrawal-detail-scroll {
  max-height: calc(78vh - 100rpx);
  padding: 24rpx 32rpx;
  box-sizing: border-box;
}

.withdrawal-detail-summary {
  padding: 4rpx 0 20rpx;
}

.withdrawal-detail-row {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  padding: 14rpx 0;
  color: #333;
  font-size: 27rpx;
  line-height: 1.45;
}

.withdrawal-detail-row text:first-child {
  flex-shrink: 0;
  color: #999;
}

.withdrawal-detail-row text:last-child {
  min-width: 0;
  text-align: right;
  word-break: break-all;
}

.withdrawal-detail-section-title {
  margin: 12rpx 0 14rpx;
  color: #222;
  font-size: 29rpx;
  font-weight: 700;
}

.withdrawal-detail-item {
  margin-bottom: 16rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  background: #f7f7f7;
}

.withdrawal-detail-item__top,
.withdrawal-detail-item__meta {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.withdrawal-detail-item__top {
  color: #333;
  font-size: 27rpx;
}

.withdrawal-detail-item__meta,
.withdrawal-detail-item__sub {
  margin-top: 10rpx;
  color: #999;
  font-size: 24rpx;
  word-break: break-all;
}

.withdrawal-detail-error {
  margin-top: 12rpx;
  color: #d34c4c;
  font-size: 24rpx;
  line-height: 1.45;
  word-break: break-all;
}
</style>
