<script lang="ts" setup>
import WithdrawalPageHeader from './components/withdrawal-page-header.vue'
import {
  ACCOUNT_BALANCE,
  ARRIVAL_ACCOUNT,
  validateWithdrawalAmount,
  WITHDRAWAL_PATHS,
} from './withdrawal'

defineOptions({ name: 'MerchantWithdrawForm' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '账户提现',
  },
})

const amount = ref('')
const amountError = computed(() => validateWithdrawalAmount(amount.value, ACCOUNT_BALANCE.available))
const canSubmit = computed(() => amount.value.length > 0 && !amountError.value)

onMounted(() => {
  // #ifdef H5
  nextTick(() => {
    document.querySelector<HTMLInputElement>('.withdraw-input-row__input input')?.setAttribute('aria-label', '提现金额')
  })
  // #endif
})

function showPrototypeNotice(title: string) {
  uni.showToast({ title, icon: 'none' })
}

function submitWithdrawal() {
  if (!canSubmit.value)
    return

  uni.showToast({ title: '静态页面暂不提交提现', icon: 'none' })
}
</script>

<template>
  <view class="withdraw-form-page">
    <withdrawal-page-header title="账户提现" :fallback-url="WITHDRAWAL_PATHS.overview" />

    <view class="withdraw-amount-panel">
      <view class="withdraw-amount-panel__heading">
        <text class="withdraw-amount-panel__title">提现金额</text>
        <view class="withdraw-amount-panel__limit" @tap="showPrototypeNotice('单笔提现额度为¥200')">
          <text>单笔提现额度 ¥ {{ ACCOUNT_BALANCE.singleLimit }}</text>
          <view class="i-carbon-help withdraw-amount-panel__help" />
        </view>
      </view>

      <view class="withdraw-input-row">
        <text class="withdraw-input-row__currency">¥</text>
        <input
          v-model="amount"
          aria-label="提现金额"
          class="withdraw-input-row__input"
          type="digit"
          :maxlength="8"
          placeholder="最低为 ¥1.00"
          placeholder-class="withdraw-input-row__placeholder"
        >
      </view>

      <view class="withdraw-balance-copy">
        <text>可提现余额 ¥ {{ ACCOUNT_BALANCE.available.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</text>
        <text class="withdraw-balance-copy__tip">建议账户留存部分资金，避免退款等原因导致余额不足，影响提现进度</text>
      </view>
    </view>

    <view class="arrival-account-panel">
      <view class="arrival-account-panel__heading">
        <text class="arrival-account-panel__title">到账账户</text>
        <view class="arrival-account-panel__manage" @tap="showPrototypeNotice('账户管理暂未开放')">
          <text>管理账户</text>
          <view class="i-carbon-chevron-right arrival-account-panel__arrow" />
        </view>
      </view>
      <view class="arrival-account-panel__divider" />
      <view class="arrival-account">
        <view class="arrival-account__logo">
          <view class="i-carbon-wallet arrival-account__logo-glyph" />
        </view>
        <view class="arrival-account__copy">
          <text class="arrival-account__name">{{ ARRIVAL_ACCOUNT.name }}</text>
          <text class="arrival-account__id">{{ ARRIVAL_ACCOUNT.maskedId }}</text>
        </view>
      </view>
    </view>

    <button
      class="withdraw-submit"
      :class="{ 'withdraw-submit--enabled': canSubmit }"
      role="button"
      :aria-disabled="!canSubmit"
      :disabled="!canSubmit"
      :tabindex="canSubmit ? 0 : -1"
      @keyup.enter="submitWithdrawal"
      @tap="submitWithdrawal"
    >
      提 现
    </button>
  </view>
</template>

<style lang="scss" scoped>
.withdraw-form-page {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 64rpx);
  box-sizing: border-box;
  background: #f5f5f5;
  color: #303030;
}

.withdraw-amount-panel,
.arrival-account-panel {
  background: #fff;
}

.withdraw-amount-panel {
  margin-top: 16rpx;
  padding: 0 32rpx 38rpx;
}

.withdraw-amount-panel__heading,
.withdraw-amount-panel__limit,
.withdraw-input-row,
.arrival-account-panel__heading,
.arrival-account-panel__manage,
.arrival-account {
  display: flex;
  align-items: center;
}

.withdraw-amount-panel__heading {
  justify-content: space-between;
  gap: 20rpx;
  min-height: 96rpx;
  border-bottom: 1rpx solid #ededed;
}

.withdraw-amount-panel__title,
.arrival-account-panel__title {
  flex-shrink: 0;
  color: #303030;
  font-size: 32rpx;
}

.withdraw-amount-panel__limit {
  min-width: 0;
  gap: 10rpx;
  color: #aaa;
  font-size: 28rpx;
}

.withdraw-amount-panel__help {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}

.withdraw-input-row {
  min-height: 126rpx;
  border-bottom: 1rpx solid #e9e9e9;
}

.withdraw-input-row__currency {
  flex-shrink: 0;
  color: #303030;
  font-size: 52rpx;
}

.withdraw-input-row__input {
  min-width: 0;
  height: 100rpx;
  flex: 1;
  margin-left: 20rpx;
  color: #303030;
  font-size: 52rpx;
  line-height: 100rpx;
}

:deep(.withdraw-input-row__placeholder) {
  color: #c8c8c8;
  font-size: 48rpx;
}

.withdraw-balance-copy {
  margin-top: 30rpx;
  color: #666;
  font-size: 27rpx;
  line-height: 1.5;
}

.withdraw-balance-copy__tip {
  display: block;
  margin-top: 12rpx;
}

.arrival-account-panel {
  margin-top: 16rpx;
  padding: 0 32rpx;
}

.arrival-account-panel__heading {
  justify-content: space-between;
  min-height: 96rpx;
}

.arrival-account-panel__manage {
  gap: 8rpx;
  color: #aaa;
  font-size: 28rpx;
}

.arrival-account-panel__arrow {
  width: 30rpx;
  height: 30rpx;
}

.arrival-account-panel__divider {
  height: 1rpx;
  background: #ededed;
}

.arrival-account {
  gap: 26rpx;
  min-height: 146rpx;
}

.arrival-account__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  flex-shrink: 0;
  border: 6rpx solid #07967b;
  border-radius: 50%;
  box-sizing: border-box;
  color: #07967b;
}

.arrival-account__logo-glyph {
  width: 36rpx;
  height: 36rpx;
}

.arrival-account__copy {
  min-width: 0;
  flex: 1;
}

.arrival-account__name,
.arrival-account__id {
  display: block;
}

.arrival-account__name {
  color: #303030;
  font-size: 31rpx;
}

.arrival-account__id {
  margin-top: 8rpx;
  color: #666;
  font-size: 26rpx;
}

.withdraw-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin: 48rpx 48rpx 0;
  padding: 0;
  border: 0;
  border-radius: 14rpx;
  background: #eeb8b3;
  color: #fff;
  font-size: 34rpx;
  line-height: 1;
}

.withdraw-submit::after {
  border: 0;
}

.withdraw-submit[disabled] {
  background: #eeb8b3;
  color: #fff;
  opacity: 1;
}

.withdraw-submit--enabled {
  background: #ef5d22;
}
</style>
