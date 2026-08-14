<script lang="ts" setup>
import WithdrawalPageHeader from './components/withdrawal-page-header.vue'
import { WITHDRAWAL_PATHS, WITHDRAWAL_RECORDS } from './withdrawal'

defineOptions({ name: 'MerchantWithdrawalRecords' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '提现记录',
  },
})

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
      <view v-for="record in WITHDRAWAL_RECORDS" :key="record.id" class="withdrawal-record">
        <view class="withdrawal-record__main">
          <view class="withdrawal-record__destination">
            <text>{{ record.destination }}</text>
            <text>{{ record.owner }}</text>
          </view>
          <text class="withdrawal-record__amount">¥ {{ record.amount }}</text>
        </view>
        <text class="withdrawal-record__account">{{ record.maskedAccount }}</text>
        <view class="withdrawal-record__meta">
          <text>{{ record.submittedAt }}</text>
          <text class="withdrawal-record__status">{{ record.status }}</text>
        </view>
      </view>
    </view>

    <text class="withdrawal-records-page__end">暂无更多</text>
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

.withdrawal-records-page__end {
  display: block;
  margin-top: 34rpx;
  color: #aaa;
  font-size: 27rpx;
  text-align: center;
}
</style>
