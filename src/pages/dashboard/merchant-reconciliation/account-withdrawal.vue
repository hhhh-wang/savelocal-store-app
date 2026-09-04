<script lang="ts" setup>
import type {
  MerchantWithdrawContext,
  MerchantWithdrawTransferConfirmQr,
} from '@/api/merchant-withdrawal'
import {
  createMerchantWithdrawTransferConfirmQr,
  getMerchantWithdrawContext,
} from '@/api/merchant-withdrawal'
import { useMerchantFoodStore } from '@/store'
import WithdrawalPageHeader from './components/withdrawal-page-header.vue'
import { WITHDRAWAL_PATHS } from './withdrawal'

defineOptions({ name: 'MerchantAccountWithdrawal' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '账户提现',
  },
})

const merchantFoodStore = useMerchantFoodStore()
const loading = ref(false)
const submitting = ref(false)
const withdrawContext = ref<MerchantWithdrawContext>()
const transferConfirmQr = ref<MerchantWithdrawTransferConfirmQr>()
const qrVisible = ref(false)
const tradeScene = ref('STORE_BUYOUT')

const availableAmount = computed(() => Number(withdrawContext.value?.availableAmount || 0))
const frozenAmount = computed(() => Number(withdrawContext.value?.frozenAmount || 0))
const totalAmount = computed(() => Number(withdrawContext.value?.totalAmount ?? availableAmount.value + frozenAmount.value).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}))
const availableAmountText = computed(() => availableAmount.value.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}))
const frozenAmountText = computed(() => frozenAmount.value.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}))
const receiverReady = computed(() => withdrawContext.value?.transferAccountReady === true
  || (withdrawContext.value?.receiverBindStatus === 'BOUND'
    && withdrawContext.value?.receiverStatus === '0'))

onLoad((options) => {
  const requestedScene = String(options?.tradeScene || '').trim().toUpperCase()
  if (requestedScene)
    tradeScene.value = requestedScene
})

onShow(() => {
  void loadWithdrawContext()
})

async function loadWithdrawContext() {
  loading.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    withdrawContext.value = await getMerchantWithdrawContext(storeId, tradeScene.value)
  }
  catch (error) {
    console.error('加载门店提现信息失败:', error)
  }
  finally {
    loading.value = false
  }
}

function openPage(url: string) {
  uni.navigateTo({ url })
}

function openSettlementAccount() {
  uni.navigateTo({ url: '/pages/me/settlement-account/index' })
}

async function showTransferConfirmQr() {
  if (loading.value || submitting.value)
    return

  if (!withdrawContext.value)
    await loadWithdrawContext()
  const context = withdrawContext.value
  if (!context)
    return

  if (!receiverReady.value) {
    uni.showModal({
      title: '请先绑定微信收款账户',
      content: '当前商户尚未绑定可用于商家转账的微信OpenID，绑定后才能提现。',
      confirmText: '去绑定',
      success: (result) => {
        if (result.confirm)
          openSettlementAccount()
      },
    })
    return
  }
  if (availableAmount.value <= 0 && !context.processingWithdrawId) {
    uni.showToast({ title: '当前门店暂无可提现金额', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    transferConfirmQr.value = await createMerchantWithdrawTransferConfirmQr(context.storeId, context.tradeScene)
    qrVisible.value = true
  }
  catch (error) {
    console.error('生成提现确认二维码失败:', error)
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="account-withdrawal-page">
    <withdrawal-page-header title="账户提现" />

    <view class="account-withdrawal-hero">
      <view class="agreement-banner">
        <view class="i-carbon-warning-filled agreement-banner__icon" />
        <text class="agreement-banner__text">单笔提现额度200元，单日提现额度为2000元</text>
      </view>

      <view class="balance-panel">
        <text class="balance-panel__label">总金额（元）</text>
        <text class="balance-panel__amount">{{ loading ? '--' : totalAmount }}</text>
        <text class="balance-panel__available">可提现金额（元）：{{ loading ? '--' : availableAmountText }}</text>
        <text class="balance-panel__frozen">冻结金额（元）：{{ loading ? '--' : frozenAmountText }}</text>
        <text v-if="withdrawContext?.transferAccountReady || withdrawContext?.receiverId" class="balance-panel__receiver">
          到账账户：{{ withdrawContext.receiverName || '微信收款用户' }} {{ withdrawContext.receiverAccountMasked || '' }}
        </text>

        <button
          class="balance-panel__button"
          hover-class="balance-panel__button--hover"
          role="button"
          tabindex="0"
          :disabled="loading || submitting"
          :loading="submitting"
          @keyup.enter="showTransferConfirmQr"
          @tap="showTransferConfirmQr"
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

    <view v-if="qrVisible && transferConfirmQr" class="transfer-qr-mask" @tap.self="qrVisible = false">
      <view class="transfer-qr-dialog">
        <view class="transfer-qr-dialog__header">
          <text class="transfer-qr-dialog__title">请在微信中打开小程序完成确认收款</text>
          <view class="i-carbon-close transfer-qr-dialog__close" @tap="qrVisible = false" />
        </view>
        <image class="transfer-qr-dialog__image" :src="transferConfirmQr.qrCode" mode="aspectFit" />
        <text class="transfer-qr-dialog__hint">请使用微信扫码，或长按识别小程序码。</text>
        <text class="transfer-qr-dialog__amount">确认金额：¥{{ availableAmountText }}</text>
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
.balance-panel,
.account-links__row {
  display: flex;
  align-items: center;
}

.agreement-banner {
  gap: 12rpx;
  min-height: 80rpx;
  padding: 0 28rpx;
  border-radius: 20rpx;
  background: #fffde6;
  color: #f6a000;
}

.agreement-banner__icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
}

.agreement-banner__text {
  font-size: 29rpx;
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

.balance-panel__frozen {
  margin-top: 10rpx;
  color: #ababab;
  font-size: 28rpx;
}

.balance-panel__receiver {
  margin-top: 16rpx;
  color: #8a8a8a;
  font-size: 27rpx;
  line-height: 1.5;
  text-align: center;
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
.account-links__row--hover,
.transfer-qr-dialog__close:active {
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

.transfer-qr-mask {
  position: fixed;
  z-index: 99;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  background: rgba(0, 0, 0, 0.58);
  box-sizing: border-box;
}

.transfer-qr-dialog {
  width: 100%;
  max-width: 620rpx;
  padding: 34rpx 34rpx 38rpx;
  border-radius: 24rpx;
  background: #fff;
  box-sizing: border-box;
}

.transfer-qr-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.transfer-qr-dialog__title {
  color: #303030;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.45;
}

.transfer-qr-dialog__close {
  width: 40rpx;
  height: 40rpx;
  flex: 0 0 40rpx;
  color: #777;
}

.transfer-qr-dialog__image {
  display: block;
  width: 400rpx;
  height: 400rpx;
  margin: 34rpx auto 22rpx;
}

.transfer-qr-dialog__hint,
.transfer-qr-dialog__amount {
  display: block;
  text-align: center;
}

.transfer-qr-dialog__hint {
  color: #808080;
  font-size: 26rpx;
  line-height: 1.5;
}

.transfer-qr-dialog__amount {
  margin-top: 14rpx;
  color: #303030;
  font-size: 29rpx;
  font-weight: 600;
}
</style>
