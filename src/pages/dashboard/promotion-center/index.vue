<script lang="ts" setup>
import type { MerchantPromotionRewardItem } from '@/api/merchant-promotion'
import {
  formatPromotionAmount,
  useMerchantPromotionRewards,
  useMerchantPromotionSummary,
} from '@/hooks/useMerchantPromotion'
import PromotionTransferDialog from './components/promotion-transfer-dialog.vue'

defineOptions({ name: 'PromotionCenter' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '推广中心',
    enablePullDownRefresh: true,
    backgroundColor: '#f3f4f8',
  },
})

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

const {
  balance,
  frozenAmount,
  todayIncome,
  loading: summaryLoading,
  loadFailed: summaryLoadFailed,
  refresh: loadSummary,
  refreshAfterChange: reloadSummaryAfterTransfer,
} = useMerchantPromotionSummary()
const { rewardList, loading, loadFailed, hasMore, loadRewards } = useMerchantPromotionRewards()
const transferDialog = ref<InstanceType<typeof PromotionTransferDialog>>()

function getRewardTime(item: MerchantPromotionRewardItem) {
  const time = item.status === '3' && item.cancelTime
    ? item.cancelTime
    : item.grantTime || item.createTime
  return time ? time.replace('T', ' ').slice(0, 16) : '--'
}

async function refreshPage() {
  await Promise.all([loadSummary(), loadRewards()])
}

async function handleTransferred() {
  await Promise.all([reloadSummaryAfterTransfer(), loadRewards()])
}

function loadMore() {
  if (hasMore.value)
    void loadRewards(false)
}

function handleWithdraw() {
  void transferDialog.value?.open()
}

onShow(refreshPage)
onReachBottom(loadMore)
onPullDownRefresh(async () => {
  try {
    await refreshPage()
  }
  finally {
    uni.stopPullDownRefresh()
  }
})
</script>

<template>
  <view class="promotion-page">
    <view class="promotion-nav">
      <back-button
        fallback-url="/pages/dashboard/index"
        fallback-mode="reLaunch"
        color="#23262c"
        background="transparent"
        size="64rpx"
      />
      <text class="promotion-nav__title">推广中心</text>
      <view class="promotion-nav__spacer" />
    </view>

    <view class="summary-card">
      <text class="summary-card__label">推广奖励同城币</text>
      <button
        v-if="summaryLoadFailed"
        class="summary-card__retry"
        role="button"
        @tap="loadSummary"
      >
        账户数据加载失败，点击重试
      </button>
      <text v-else class="summary-card__hint">{{ summaryLoading ? '账户数据加载中…' : '商家主体账户 · 所有门店共享' }}</text>

      <view class="summary-card__amount-row">
        <view class="summary-card__balance">
          <text class="summary-card__amount" :class="{ 'summary-card__amount--compact': balance.length > 10 }">{{ balance }}</text>
          <text class="summary-card__unit">枚</text>
        </view>
        <button
          class="summary-card__withdraw"
          hover-class="summary-card__withdraw--hover"
          role="button"
          tabindex="0"
          @keyup.enter="handleWithdraw"
          @tap="handleWithdraw"
        >
          提现
        </button>
      </view>

      <view class="summary-card__stats">
        <view class="summary-card__stat">
          <text class="summary-card__stat-value">{{ frozenAmount }}</text>
          <text class="summary-card__stat-label">冻结中</text>
        </view>
        <view class="summary-card__stat">
          <text class="summary-card__stat-value">{{ todayIncome }}</text>
          <text class="summary-card__stat-label">今日入账</text>
        </view>
      </view>
    </view>

    <view class="list-card">
      <text class="list-card__title">奖励记录</text>

      <view class="record-list">
        <view v-if="!rewardList.length" class="record-empty">
          <text class="record-empty__title">{{ loading ? '加载中…' : loadFailed ? '奖励记录加载失败' : '暂无奖励记录' }}</text>
          <button v-if="loadFailed && !loading" class="record-action" @tap="loadRewards()">
            点击重试
          </button>
          <text v-else-if="!loading" class="record-empty__desc">奖励到账后会显示在这里</text>
        </view>

        <template v-else>
          <view v-for="item in rewardList" :key="item.rewardId" class="record-row">
            <view class="record-row__main">
              <text class="record-row__title">{{ REWARD_TYPE_LABELS[item.rewardType] || item.rewardType }}</text>
              <text class="record-row__amount">{{ formatPromotionAmount(item.rewardAmount) }}<text class="record-row__unit">枚</text></text>
            </view>
            <text v-if="item.tradeStoreName" class="record-row__store">{{ item.tradeStoreName }}</text>
            <view class="record-row__meta">
              <text>{{ getRewardTime(item) }}</text>
              <text class="record-row__status" :class="`record-row__status--${item.status}`">{{ REWARD_STATUS_LABELS[item.status] || item.status }}</text>
            </view>
          </view>
          <button
            class="record-action"
            :disabled="loading || (!loadFailed && !hasMore)"
            @tap="loadRewards(false)"
          >
            {{ loading ? '加载中…' : loadFailed ? '加载失败，点击重试' : hasMore ? '查看更多' : '没有更多了' }}
          </button>
        </template>
      </view>
    </view>
    <PromotionTransferDialog ref="transferDialog" @transferred="handleTransferred" />
  </view>
</template>

<style lang="scss" scoped>
.promotion-page {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 14rpx) 22rpx calc(env(safe-area-inset-bottom) + 40rpx);
  box-sizing: border-box;
  background:
    radial-gradient(ellipse 360rpx 280rpx at 8% 0, rgba(255, 228, 123, 0.8), transparent 76%),
    radial-gradient(ellipse 320rpx 240rpx at 96% 56rpx, rgba(228, 216, 250, 0.72), transparent 76%),
    linear-gradient(180deg, #fff9e7 0%, #f5f5f9 240rpx, #f1f2f6 680rpx);
  color: #202429;
}

.promotion-nav {
  display: grid;
  grid-template-columns: 64rpx minmax(0, 1fr) 64rpx;
  align-items: center;
  min-height: 90rpx;
}

.promotion-nav__title {
  font-size: 32rpx;
  font-weight: 400;
  line-height: 44rpx;
  text-align: center;
}

.promotion-nav__spacer {
  width: 64rpx;
}

.summary-card,
.list-card {
  border-radius: 28rpx;
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.06);
}

.summary-card {
  margin-top: 16rpx;
  padding: 26rpx 26rpx 32rpx;
  background: linear-gradient(180deg, #fff2f2 0%, #fff 72%);
}

.summary-card__label {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.summary-card__hint {
  display: block;
  margin-top: 4rpx;
  color: #a5aab4;
  font-size: 24rpx;
  line-height: 30rpx;
}

.summary-card__retry {
  margin: 4rpx 0 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #d77b6d;
  font-size: 24rpx;
  line-height: 30rpx;
  text-align: left;
}

.summary-card__retry::after {
  border: 0;
}

.summary-card__amount-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 8rpx;
}

.summary-card__balance {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  min-width: 0;
}

.summary-card__amount {
  min-width: 0;
  color: #171a1f;
  font-size: 72rpx;
  font-weight: 700;
  line-height: 88rpx;
  overflow-wrap: anywhere;
}

.summary-card__amount--compact {
  font-size: 48rpx;
}

.summary-card__unit {
  color: #ff625a;
  font-size: 26rpx;
}

.summary-card__withdraw {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 148rpx;
  height: 56rpx;
  margin: 0;
  padding: 0;
  border: 3rpx solid #ff625a;
  border-radius: 30rpx;
  box-sizing: border-box;
  background: transparent;
  color: #ff625a;
  font-size: 32rpx;
  font-weight: 400;
  line-height: 1;
}

.summary-card__withdraw::after,
.record-action::after {
  border: 0;
}

.summary-card__withdraw--hover {
  background: #fff0ee;
}

.summary-card__stats {
  display: flex;
  gap: 56rpx;
  margin-top: 22rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #eef0f4;
}

.summary-card__stat {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  min-width: 112rpx;
  max-width: calc(50% - 28rpx);
}

.summary-card__stat-value {
  font-size: 32rpx;
  font-weight: 600;
  line-height: 42rpx;
  overflow-wrap: anywhere;
}

.summary-card__stat-label {
  color: #939aa6;
  font-size: 24rpx;
  line-height: 32rpx;
}

.list-card {
  margin-top: 24rpx;
  padding: 20rpx 20rpx 22rpx;
  background: #fff;
}

.list-card__title {
  display: block;
  padding: 0 4rpx;
  font-size: 30rpx;
  font-weight: 400;
  line-height: 44rpx;
}

.record-list {
  margin-top: 32rpx;
}

.record-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 406rpx;
  padding: 32rpx 32rpx 64rpx;
  border-radius: 24rpx;
  box-sizing: border-box;
  background: #f9f9fb;
  text-align: center;
}

.record-empty__title {
  color: #343b46;
  font-size: 32rpx;
  font-weight: 400;
  line-height: 44rpx;
}

.record-empty__desc {
  margin-top: 10rpx;
  color: #939aa6;
  font-size: 24rpx;
  line-height: 34rpx;
}

.record-row {
  padding: 24rpx 4rpx;
  border-bottom: 1rpx solid #f0f1f4;
}

.record-row:first-child {
  padding-top: 0;
}

.record-row__main,
.record-row__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24rpx;
}

.record-row__title {
  min-width: 0;
  font-size: 28rpx;
  line-height: 40rpx;
  overflow-wrap: anywhere;
}

.record-row__amount {
  flex-shrink: 0;
  font-size: 32rpx;
  font-weight: 600;
}

.record-row__unit {
  margin-left: 6rpx;
  color: #939aa6;
  font-size: 22rpx;
  font-weight: 400;
}

.record-row__store {
  display: block;
  margin-top: 8rpx;
  color: #939aa6;
  font-size: 24rpx;
  line-height: 34rpx;
  overflow-wrap: anywhere;
}

.record-row__meta {
  margin-top: 10rpx;
  color: #939aa6;
  font-size: 24rpx;
  line-height: 34rpx;
}

.record-row__status {
  flex-shrink: 0;
}

.record-row__status--0 {
  color: #b28235;
}

.record-row__status--1 {
  color: #539474;
}

.record-row__status--3 {
  color: #d77b6d;
}

.record-action,
.record-action[disabled] {
  margin: 10rpx 0 0;
  padding: 8rpx 16rpx;
  border: 0;
  background: transparent;
  color: #939aa6;
  font-size: 24rpx;
  line-height: 40rpx;
}
</style>
