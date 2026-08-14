<script lang="ts" setup>
import WithdrawalPageHeader from './components/withdrawal-page-header.vue'
import { ACCOUNT_BALANCE, WITHDRAWAL_PATHS } from './withdrawal'

defineOptions({ name: 'MerchantAccountWithdrawal' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '账户提现',
  },
})

const totalAmount = ACCOUNT_BALANCE.total.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function openPage(url: string) {
  uni.navigateTo({ url })
}

function showPrototypeNotice(title: string) {
  uni.showToast({ title, icon: 'none' })
}
</script>

<template>
  <view class="account-withdrawal-page">
    <withdrawal-page-header title="账户提现" />

    <view class="account-withdrawal-hero">
      <view class="agreement-banner">
        <view class="agreement-banner__copy">
          <view class="i-carbon-warning-filled agreement-banner__icon" />
          <text class="agreement-banner__text">请遵守省哒平台商家服务协议</text>
        </view>
        <view class="agreement-banner__action" @tap="showPrototypeNotice('协议详情暂未开放')">
          查看详情
        </view>
      </view>

      <view class="balance-panel">
        <text class="balance-panel__label">总金额（元）</text>
        <text class="balance-panel__amount">{{ totalAmount }}</text>
        <text class="balance-panel__available">含可用金额（元）：{{ ACCOUNT_BALANCE.total.toFixed(2) }}</text>

        <button
          class="balance-panel__button"
          hover-class="balance-panel__button--hover"
          role="button"
          tabindex="0"
          @keyup.enter="openPage(WITHDRAWAL_PATHS.form)"
          @tap="openPage(WITHDRAWAL_PATHS.form)"
        >
          提现
        </button>
      </view>
    </view>

    <view class="account-links">
      <view
        class="account-links__row"
        hover-class="account-links__row--hover"
        @tap="openPage(WITHDRAWAL_PATHS.records)"
      >
        <text class="account-links__label">提现记录</text>
        <view class="i-carbon-chevron-right account-links__arrow" />
      </view>
      <view class="account-links__divider" />
      <view
        class="account-links__row"
        hover-class="account-links__row--hover"
        @tap="openPage(WITHDRAWAL_PATHS.bills)"
      >
        <text class="account-links__label">账单明细</text>
        <view class="i-carbon-chevron-right account-links__arrow" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.account-withdrawal-page {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx);
  box-sizing: border-box;
  background: #f5f5f5;
  color: #303030;
}

.account-withdrawal-hero {
  padding: 20rpx 32rpx 44rpx;
  background: linear-gradient(180deg, #ef5a20 0%, #f26832 58%, #f5f5f5 100%);
}

.agreement-banner,
.agreement-banner__copy,
.balance-panel,
.account-links__row {
  display: flex;
  align-items: center;
}

.agreement-banner {
  justify-content: space-between;
  gap: 18rpx;
  min-height: 80rpx;
  padding: 0 30rpx;
  border-radius: 20rpx;
  background: #fffde6;
  color: #f6a000;
}

.agreement-banner__copy {
  min-width: 0;
  flex: 1;
  gap: 12rpx;
}

.agreement-banner__icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}

.agreement-banner__text {
  overflow: hidden;
  font-size: 29rpx;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agreement-banner__action {
  flex-shrink: 0;
  padding: 10rpx 18rpx;
  border: 2rpx solid #f6a000;
  border-radius: 10rpx;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.4;
}

.balance-panel {
  flex-direction: column;
  margin-top: 18rpx;
  padding: 88rpx 50rpx 48rpx;
  border-radius: 32rpx;
  background: linear-gradient(180deg, #fff0eb 0%, #fff 48%);
}

.balance-panel__label {
  color: #363636;
  font-size: 31rpx;
}

.balance-panel__amount {
  margin-top: 32rpx;
  color: #262626;
  font-size: 84rpx;
  font-weight: 500;
  line-height: 1.12;
}

.balance-panel__available {
  margin-top: 30rpx;
  color: #ababab;
  font-size: 31rpx;
}

.balance-panel__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
  margin-top: 92rpx;
  padding: 0;
  border: 0;
  border-radius: 44rpx;
  background: #ef5d22;
  color: #fff;
  font-size: 34rpx;
  line-height: 1;
}

.balance-panel__button::after {
  border: 0;
}

.balance-panel__button--hover,
.account-links__row--hover {
  opacity: 0.82;
}

.account-links {
  margin: 0 32rpx;
  padding: 0 32rpx;
  border-radius: 32rpx;
  background: #fff;
}

.account-links__row {
  justify-content: space-between;
  min-height: 126rpx;
}

.account-links__label {
  color: #333;
  font-size: 34rpx;
}

.account-links__arrow {
  width: 38rpx;
  height: 38rpx;
  color: #bebebe;
}

.account-links__divider {
  height: 1rpx;
  background: #ededed;
}
</style>
