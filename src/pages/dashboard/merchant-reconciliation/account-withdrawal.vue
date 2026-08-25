<script lang="ts" setup>
import type { MerchantWithdrawContext } from '@/api/merchant-withdrawal'
import {
  applyMerchantWithdraw,
  getMerchantWithdrawContext,
  refreshMerchantWithdrawTransfer,
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
const tradeScene = ref('STORE_BUYOUT')

const availableAmount = computed(() => Number(withdrawContext.value?.availableAmount || 0))
const totalAmount = computed(() => availableAmount.value.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}))
const receiverReady = computed(() => withdrawContext.value?.transferAccountReady === true
  || (withdrawContext.value?.receiverBindStatus === 'BOUND'
    && withdrawContext.value?.receiverStatus === '0'))
const processingWithdrawId = computed(() => withdrawContext.value?.processingWithdrawId)

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

function showPrototypeNotice(title: string) {
  uni.showToast({ title, icon: 'none' })
}

function confirmWithdrawal(content: string) {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '确认提现',
      content,
      confirmText: '确认转账',
      success: result => resolve(result.confirm),
      fail: () => resolve(false),
    })
  })
}

function openSettlementAccount() {
  uni.navigateTo({ url: '/pages/me/settlement-account/index' })
}

function wait(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function launchTransferConfirmation(result: Awaited<ReturnType<typeof applyMerchantWithdraw>>) {
  if (!result.transferPackageInfo)
    return
  // #ifdef H5
  const bridge = (globalThis as { WeixinJSBridge?: { invoke: (name: string, params: Record<string, string>, callback: (value: { err_msg?: string }) => void) => void } }).WeixinJSBridge
  if (!bridge) {
    uni.showModal({ title: '请在微信中打开', content: '商家转账收款确认页需要在微信客户端中打开。', showCancel: false })
    return
  }
  await new Promise<void>((resolve) => {
    bridge.invoke('requestMerchantTransfer', {
      mchId: result.transferMchId || '',
      appId: result.transferAppId || '',
      package: result.transferPackageInfo || '',
    }, response => {
      if (response?.err_msg === 'requestMerchantTransfer:ok')
        uni.showToast({ title: '已打开收款确认页', icon: 'none' })
      else if (response?.err_msg === 'requestMerchantTransfer:cancel')
        uni.showToast({ title: '已取消收款', icon: 'none' })
      else if (response?.err_msg)
        uni.showToast({ title: '收款确认页打开失败', icon: 'none' })
      resolve()
    })
  })
  // #endif
}

async function refreshProcessingWithdrawal(result: Awaited<ReturnType<typeof applyMerchantWithdraw>>) {
  let latest = result
  for (let attempt = 0; attempt < 3 && latest.withdrawStatus === '3' && !latest.transferFailReason; attempt += 1) {
    await wait((attempt + 1) * 800)
    try {
      if (latest.transferPackageInfo)
        return latest
      latest = await refreshMerchantWithdrawTransfer(latest.withdrawId)
    }
    catch (error) {
      console.warn('刷新微信商家转账结果失败:', error)
      break
    }
  }
  return latest
}

async function submitWithdrawal() {
  if (loading.value || submitting.value)
    return

  if (!withdrawContext.value)
    await loadWithdrawContext()
  const context = withdrawContext.value
  if (!context)
    return

  if (processingWithdrawId.value) {
    const confirmed = await confirmWithdrawal('当前已有提现转账处理中，是否重试？')
    if (!confirmed)
      return
    submitting.value = true
    try {
      const result = await refreshMerchantWithdrawTransfer(processingWithdrawId.value)
      await launchTransferConfirmation(result)
      if (result.withdrawStatus === '4') {
        uni.showToast({ title: '提现转账成功', icon: 'success' })
      }
      else {
        uni.showModal({
          title: result.transferPackageInfo ? '请确认收款' : '转账处理中',
          content: result.transferPackageInfo ? '请在微信收款确认页完成收款。' : (result.transferFailReason || '转账仍未完成，请稍后重试。'),
          showCancel: false,
        })
      }
      await loadWithdrawContext()
    }
    catch (error) {
      console.error('重试门店提现失败:', error)
    }
    finally {
      submitting.value = false
    }
    return
  }

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
  if (availableAmount.value <= 0) {
    uni.showToast({ title: '当前门店暂无可提现金额', icon: 'none' })
    return
  }

  const receiver = `${context.receiverName || '微信收款用户'} ${context.receiverAccountMasked || ''}`.trim()
  const confirmed = await confirmWithdrawal(`将 ¥${totalAmount.value} 转账至 ${receiver}，是否继续？`)
  if (!confirmed)
    return

  submitting.value = true
  try {
    const submitted = await applyMerchantWithdraw({
      storeId: context.storeId,
      tradeScene: context.tradeScene,
      applyAmount: availableAmount.value,
    })
    await launchTransferConfirmation(submitted)
    const result = await refreshProcessingWithdrawal(submitted)
    if (result.withdrawStatus === '4') {
      uni.showToast({ title: '提现转账成功', icon: 'success' })
    }
    else {
      uni.showModal({
        title: result.transferPackageInfo ? '请确认收款' : '转账处理中',
        content: result.transferPackageInfo ? '请在微信收款确认页完成收款。' : (result.transferFailReason || '提现已提交至微信，处理结果请稍后查看。'),
        showCancel: false,
      })
    }
    await loadWithdrawContext()
  }
  catch (error) {
    console.error('提交门店提现失败:', error)
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
        <text class="balance-panel__amount">{{ loading ? '--' : totalAmount }}</text>
        <text class="balance-panel__available">可提现金额（元）：{{ loading ? '--' : totalAmount }}</text>
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
          @keyup.enter="submitWithdrawal"
          @tap="submitWithdrawal"
        >
          {{ processingWithdrawId ? '重试转账' : '提现' }}
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
