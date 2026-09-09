<script lang="ts" setup>
import { useMerchantPromotionTransfer } from '@/hooks/useMerchantPromotionTransfer'

const emit = defineEmits<{ transferred: [] }>()
const {
  visible,
  step,
  context,
  amount,
  error,
  result,
  pending,
  busy,
  submitting,
  checking,
  recipientName,
  recipientMobile,
  open,
  close,
  loadContext,
  fillAll,
  submit,
  checkResult,
} = useMerchantPromotionTransfer(() => emit('transferred'))

defineExpose({ open })
</script>

<template>
  <view v-if="visible" class="transfer-mask" @tap="close">
    <view class="transfer-dialog" role="dialog" aria-modal="true" aria-label="同城币转入" @tap.stop>
      <view class="transfer-dialog__header">
        <text class="transfer-dialog__title">{{ step === 'success' ? '转入成功' : '转入同城币' }}</text>
        <button class="transfer-dialog__close" aria-label="关闭" :disabled="busy" @tap="close">
          ×
        </button>
      </view>

      <view v-if="step === 'loading'" class="transfer-dialog__loading">
        正在读取分账账户…
      </view>

      <template v-else-if="step === 'error'">
        <text class="transfer-dialog__description">{{ error }}</text>
        <button class="transfer-dialog__primary" @tap="loadContext">
          重新加载
        </button>
      </template>

      <template v-else-if="step === 'transfer'">
        <view class="transfer-dialog__recipient">
          <view class="transfer-dialog__recipient-info">
            <text class="transfer-dialog__caption">个人微信分账账户</text>
            <text class="transfer-dialog__name">{{ recipientName }}</text>
            <text class="transfer-dialog__phone">{{ recipientMobile }}</text>
          </view>
        </view>

        <text class="transfer-dialog__label">转入数量</text>
        <view class="transfer-dialog__amount-row">
          <input
            v-model="amount"
            aria-label="转入数量"
            class="transfer-dialog__amount-input"
            type="digit"
            inputmode="decimal"
            :maxlength="19"
            placeholder="0.00"
            placeholder-class="transfer-dialog__placeholder"
            :disabled="busy || !!pending"
            :adjust-position="true"
            :cursor-spacing="24"
            confirm-type="done"
            @confirm="submit"
          >
          <text class="transfer-dialog__unit">枚</text>
          <button v-if="!pending" class="transfer-dialog__link" :disabled="busy" @tap="fillAll">
            全部
          </button>
        </view>
        <text class="transfer-dialog__caption">可用 {{ context?.availableAmount || '0.00' }} 枚</text>
        <text class="transfer-dialog__description transfer-dialog__description--small">
          接收账户由当前已授权的个人微信分账账户确定。
        </text>
        <text v-if="error" class="transfer-dialog__error">{{ error }}</text>
        <button class="transfer-dialog__primary" :loading="submitting" :disabled="busy" @tap="submit">
          {{ submitting ? '处理中…' : pending ? '重试同一笔转入' : '确认转入' }}
        </button>
        <button v-if="pending" class="transfer-dialog__secondary" :loading="checking" :disabled="busy" @tap="checkResult">
          查询转入结果
        </button>
      </template>

      <template v-else-if="step === 'success' && result">
        <view class="transfer-dialog__success-mark">
          ✓
        </view>
        <text class="transfer-dialog__success-amount">
          {{ result.amount }}<text class="transfer-dialog__unit"> 枚</text>
        </text>
        <text class="transfer-dialog__success-description">
          已转入 {{ result.memberNickname }}（{{ result.mobileMask || '个人微信' }}）
        </text>
        <text class="transfer-dialog__receipt">转入单号 {{ result.transferNo }}</text>
        <button class="transfer-dialog__primary" :disabled="busy" @tap="close">
          完成
        </button>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.transfer-mask {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36rpx;
  background: rgba(22, 25, 32, 0.42);
}

.transfer-dialog {
  width: 100%;
  max-width: 640rpx;
  max-height: calc(100vh - 100rpx - env(safe-area-inset-bottom));
  padding: 32rpx;
  overflow-y: auto;
  border-radius: 30rpx;
  box-sizing: border-box;
  background: #fff;
  color: #23262c;
}

.transfer-dialog button::after {
  border: 0;
}

.transfer-dialog__header,
.transfer-dialog__recipient,
.transfer-dialog__amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.transfer-dialog__title {
  font-size: 32rpx;
  font-weight: 600;
}

.transfer-dialog__close {
  flex-shrink: 0;
  width: 54rpx;
  height: 54rpx;
  margin: -8rpx -12rpx -8rpx 0;
  padding: 0;
  background: transparent;
  color: #9298a2;
  font-size: 42rpx;
  line-height: 50rpx;
}

.transfer-dialog__description,
.transfer-dialog__label,
.transfer-dialog__caption,
.transfer-dialog__name,
.transfer-dialog__phone,
.transfer-dialog__error,
.transfer-dialog__success-amount,
.transfer-dialog__success-description,
.transfer-dialog__receipt {
  display: block;
}

.transfer-dialog__description,
.transfer-dialog__loading {
  margin-top: 24rpx;
  color: #89909b;
  font-size: 26rpx;
  line-height: 40rpx;
}

.transfer-dialog__loading {
  padding: 36rpx 0;
  text-align: center;
}

.transfer-dialog__label {
  margin-top: 30rpx;
  margin-bottom: 16rpx;
  font-size: 26rpx;
}

.transfer-dialog__placeholder {
  color: #b6bbc3;
}

.transfer-dialog__error {
  margin-top: 20rpx;
  color: #d54e47;
  font-size: 24rpx;
  line-height: 36rpx;
}

.transfer-dialog__primary,
.transfer-dialog__secondary {
  display: block;
  width: 100%;
  margin: 28rpx 0 0;
  padding: 0 20rpx;
  border: 0;
  border-radius: 44rpx;
  background: #ed4c4c;
  color: #fff;
  font-size: 28rpx;
  line-height: 84rpx;
}

.transfer-dialog__primary[disabled] {
  background: #f6aaaa;
  color: #fff;
}

.transfer-dialog__secondary {
  margin-top: 12rpx;
  background: #f5f6f8;
  color: #737b87;
}

.transfer-dialog__recipient {
  margin-top: 28rpx;
  padding: 22rpx;
  border-radius: 18rpx;
  background: #fff5f4;
}

.transfer-dialog__recipient-info {
  min-width: 0;
}

.transfer-dialog__caption,
.transfer-dialog__phone {
  color: #959ba5;
  font-size: 24rpx;
  line-height: 36rpx;
}

.transfer-dialog__name {
  margin: 8rpx 0 4rpx;
  font-size: 30rpx;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.transfer-dialog__amount-row {
  padding-bottom: 18rpx;
  border-bottom: 1rpx solid #eef0f3;
  margin-bottom: 14rpx;
}

.transfer-dialog__amount-input {
  flex: 1;
  min-width: 0;
  height: 68rpx;
  font-size: 44rpx;
  font-weight: 600;
}

.transfer-dialog__unit {
  flex-shrink: 0;
  font-size: 24rpx;
  font-weight: 400;
}

.transfer-dialog__link {
  flex-shrink: 0;
  margin: 0;
  padding: 4rpx 0 4rpx 12rpx;
  background: transparent;
  color: #ed4c4c;
  font-size: 24rpx;
  line-height: 44rpx;
}

.transfer-dialog__link[disabled] {
  background: transparent;
  color: #b5bac2;
}

.transfer-dialog__description--small {
  margin-top: 12rpx;
  font-size: 24rpx;
}

.transfer-dialog__success-mark {
  width: 80rpx;
  margin: 36rpx auto 20rpx;
  border-radius: 50%;
  background: #eef8f2;
  color: #539474;
  font-size: 42rpx;
  line-height: 80rpx;
  text-align: center;
}

.transfer-dialog__success-amount {
  font-size: 46rpx;
  font-weight: 600;
  text-align: center;
  overflow-wrap: anywhere;
}

.transfer-dialog__success-description {
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  text-align: center;
  overflow-wrap: anywhere;
}

.transfer-dialog__receipt {
  margin-top: 18rpx;
  color: #a0a6af;
  font-size: 22rpx;
  line-height: 34rpx;
  text-align: center;
  overflow-wrap: anywhere;
}
</style>
