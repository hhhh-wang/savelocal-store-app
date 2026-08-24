<script lang="ts" setup>
import type { MerchantFoodOrderDetail } from '@/api/types/merchant-food'
import { redeemMerchantFoodGroupBuy } from '@/api/merchant-food'
import scanIcon from '@/static/icons/dashboard/group-buy-redemption.png'
import { useMerchantFoodStore } from '@/store'
import {
  formatVoucherCode,
  parseScannedVoucher,
  sanitizeVoucherInput,
  validateVoucherCode,
} from './redemption'

defineOptions({
  name: 'GroupBuyRedemptionPage',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '团购核销',
  },
})

const fallbackUrl = '/pages/dashboard/index'
const merchantFoodStore = useMerchantFoodStore()
const voucherCode = ref('')
const scanning = ref(false)
const redeeming = ref(false)
const lastRedemption = ref<MerchantFoodOrderDetail>()

const currentStoreName = computed(() => merchantFoodStore.currentStore?.storeName || '当前餐饮门店')
const voucherDisplay = computed(() => formatVoucherCode(voucherCode.value))

function handleClose() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }
  uni.reLaunch({ url: fallbackUrl })
}

function handleVoucherInput(event: { detail?: { value?: string } }) {
  const value = sanitizeVoucherInput(event.detail?.value)
  voucherCode.value = value
  return value
}

function requestRedemptionConfirmation(code: string) {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '确认核销',
      content: `${currentStoreName.value}\n核销码：${formatVoucherCode(code)}\n\n核销后订单将完成，请确认顾客已到店消费。`,
      confirmText: '确认核销',
      confirmColor: '#e8a800',
      success: result => resolve(result.confirm),
      fail: () => resolve(false),
    })
  })
}

async function submitRedemption(candidate = voucherCode.value) {
  if (redeeming.value)
    return

  const code = sanitizeVoucherInput(candidate)
  const validationMessage = validateVoucherCode(code)
  if (validationMessage) {
    uni.showToast({ title: validationMessage, icon: 'none' })
    return
  }

  voucherCode.value = code
  uni.hideKeyboard()
  if (!await requestRedemptionConfirmation(code))
    return

  redeeming.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    lastRedemption.value = await redeemMerchantFoodGroupBuy({ storeId, voucherCode: code })
    voucherCode.value = ''
  }
  finally {
    redeeming.value = false
  }
}

function startScan() {
  if (scanning.value || redeeming.value)
    return

  scanning.value = true
  uni.scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode'],
    success: (result) => {
      const code = parseScannedVoucher(result.result)
      if (!code) {
        uni.showToast({ title: '未识别到9位数字核销码', icon: 'none' })
        return
      }
      voucherCode.value = code
      submitRedemption(code).catch(() => {})
    },
    fail: (error) => {
      if (!String(error.errMsg || '').includes('cancel'))
        uni.showToast({ title: '扫码不可用，请手动输入核销码', icon: 'none' })
    },
    complete: () => {
      scanning.value = false
    },
  })
}

function continueRedemption() {
  lastRedemption.value = undefined
}

function formatAmount(value: number | string | undefined) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}

onShow(() => {
  merchantFoodStore.loadProfile(true).catch(() => {})
})
</script>

<template>
  <view class="redemption-page">
    <view class="redemption-page__glow redemption-page__glow--yellow" />
    <view class="redemption-page__glow redemption-page__glow--violet" />

    <view class="redemption-page__content">
      <view class="redemption-nav">
        <view class="redemption-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="reLaunch"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />
          <text class="redemption-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="redemption-nav__title">
          团购核销
        </text>

        <view class="redemption-nav__spacer" />
      </view>

      <view class="redemption-hero">
        <view class="redemption-hero__eyebrow">
          <view class="redemption-hero__status-dot" />
          <text class="redemption-hero__eyebrow-text">
            当前核销门店
          </text>
        </view>
        <text class="redemption-hero__store-name">
          {{ currentStoreName }}
        </text>
        <text class="redemption-hero__desc">
          扫描顾客订单二维码，快速完成团购消费核销
        </text>

        <view class="redemption-scan-stage">
          <view class="redemption-scan-stage__corner redemption-scan-stage__corner--tl" />
          <view class="redemption-scan-stage__corner redemption-scan-stage__corner--tr" />
          <view class="redemption-scan-stage__corner redemption-scan-stage__corner--bl" />
          <view class="redemption-scan-stage__corner redemption-scan-stage__corner--br" />
          <view class="redemption-scan-stage__icon-wrap">
            <image class="redemption-scan-stage__icon" :src="scanIcon" mode="aspectFit" />
          </view>
          <view class="redemption-scan-stage__line" />
        </view>

        <view
          class="redemption-scan-button"
          :class="{ 'redemption-scan-button--disabled': scanning || redeeming }"
          hover-class="redemption-scan-button--hover"
          @tap="startScan"
        >
          <image class="redemption-scan-button__icon" :src="scanIcon" mode="aspectFit" />
          <text class="redemption-scan-button__text">
            {{ scanning ? '正在打开相机' : '扫描顾客二维码' }}
          </text>
        </view>
      </view>

      <view class="redemption-divider">
        <view class="redemption-divider__line" />
        <text class="redemption-divider__text">
          或输入数字核销码
        </text>
        <view class="redemption-divider__line" />
      </view>

      <view class="redemption-manual-card">
        <view class="redemption-manual-card__header">
          <view>
            <text class="redemption-manual-card__title">
              数字码核销
            </text>
            <text class="redemption-manual-card__desc">
              请输入顾客出示的9位数字核销码
            </text>
          </view>
          <view class="redemption-manual-card__badge">
            9位
          </view>
        </view>

        <view class="redemption-input-wrap" :class="{ 'redemption-input-wrap--filled': voucherCode }">
          <input
            class="redemption-input"
            type="number"
            inputmode="numeric"
            :value="voucherCode"
            :maxlength="9"
            placeholder="请输入核销码"
            placeholder-class="redemption-input__placeholder"
            confirm-type="done"
            @input="handleVoucherInput"
            @confirm="submitRedemption()"
          >
          <text v-if="voucherCode" class="redemption-input__preview">
            {{ voucherDisplay }}
          </text>
          <text class="redemption-input__count">
            {{ voucherCode.length }}/9
          </text>
        </view>

        <view
          class="redemption-submit-button"
          :class="{ 'redemption-submit-button--disabled': voucherCode.length !== 9 || redeeming }"
          hover-class="redemption-submit-button--hover"
          @tap="submitRedemption()"
        >
          <text>{{ redeeming ? '正在核销...' : '确认核销' }}</text>
        </view>
      </view>

      <view class="redemption-notice">
        <view class="redemption-notice__icon">
          !
        </view>
        <view class="redemption-notice__content">
          <text class="redemption-notice__title">
            核销须知
          </text>
          <text class="redemption-notice__item">
            · 仅支持当前门店已支付、未核销的团购订单
          </text>
          <text class="redemption-notice__item">
            · 请与顾客确认消费内容，核销后不可重复使用
          </text>
        </view>
      </view>
    </view>

    <view v-if="lastRedemption" class="redemption-success-mask">
      <view class="redemption-success-card">
        <view class="redemption-success-card__check">
          <view class="redemption-success-card__check-mark" />
        </view>
        <text class="redemption-success-card__title">
          核销成功
        </text>
        <text class="redemption-success-card__desc">
          团购订单已完成，本次核销已记录
        </text>

        <view class="redemption-success-card__summary">
          <view class="redemption-success-card__product-row">
            <view class="redemption-success-card__product-info">
              <text class="redemption-success-card__product-name">
                {{ lastRedemption.productName || '团购套餐' }}
              </text>
              <text class="redemption-success-card__order-no">
                订单号 {{ lastRedemption.orderNo }}
              </text>
            </view>
            <text class="redemption-success-card__quantity">
              ×{{ lastRedemption.quantity || 1 }}
            </text>
          </view>

          <view class="redemption-success-card__detail-row">
            <text class="redemption-success-card__detail-label">
              核销门店
            </text>
            <text class="redemption-success-card__detail-value">
              {{ lastRedemption.storeName }}
            </text>
          </view>
          <view class="redemption-success-card__detail-row">
            <text class="redemption-success-card__detail-label">
              核销码
            </text>
            <text class="redemption-success-card__voucher">
              {{ formatVoucherCode(lastRedemption.voucherQrContent || '') }}
            </text>
          </view>
          <view class="redemption-success-card__detail-row">
            <text class="redemption-success-card__detail-label">
              实付金额
            </text>
            <text class="redemption-success-card__amount">
              ¥{{ formatAmount(lastRedemption.amount) }}
            </text>
          </view>
        </view>

        <view class="redemption-success-card__actions">
          <view class="redemption-success-card__button redemption-success-card__button--secondary" @tap="handleClose">
            完成
          </view>
          <view class="redemption-success-card__button redemption-success-card__button--primary" @tap="continueRedemption">
            继续核销
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.redemption-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #fff9e8 0%, #f7f7fa 18%, #f2f3f7 100%);
}

.redemption-page__glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.redemption-page__glow--yellow {
  top: -150rpx;
  left: -160rpx;
  width: 520rpx;
  height: 380rpx;
  background: radial-gradient(circle, rgba(255, 215, 64, 0.42) 0%, rgba(255, 215, 64, 0) 72%);
}

.redemption-page__glow--violet {
  top: -80rpx;
  right: -170rpx;
  width: 440rpx;
  height: 360rpx;
  background: radial-gradient(circle, rgba(220, 207, 255, 0.62) 0%, rgba(220, 207, 255, 0) 70%);
}

.redemption-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 22rpx calc(env(safe-area-inset-bottom) + 48rpx);
}

.redemption-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
}

.redemption-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.redemption-nav__close {
  color: #30343a;
  font-size: 30rpx;
  font-weight: 600;
}

.redemption-nav__title {
  color: #1e2228;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.redemption-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.redemption-hero {
  position: relative;
  overflow: hidden;
  margin-top: 24rpx;
  padding: 34rpx 30rpx 30rpx;
  border-radius: 36rpx;
  background:
    radial-gradient(circle at 86% 8%, rgba(255, 216, 52, 0.22) 0%, rgba(255, 216, 52, 0) 34%),
    linear-gradient(145deg, #222531 0%, #303443 58%, #262936 100%);
  box-shadow: 0 24rpx 60rpx rgba(35, 38, 51, 0.2);
}

.redemption-hero__eyebrow {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.redemption-hero__status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ffd534;
  box-shadow: 0 0 0 8rpx rgba(255, 213, 52, 0.12);
}

.redemption-hero__eyebrow-text {
  color: rgba(255, 255, 255, 0.58);
  font-size: 24rpx;
}

.redemption-hero__store-name {
  display: block;
  overflow: hidden;
  margin-top: 14rpx;
  color: #fff;
  font-size: 42rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.redemption-hero__desc {
  display: block;
  margin-top: 10rpx;
  color: rgba(255, 255, 255, 0.62);
  font-size: 25rpx;
  line-height: 1.5;
}

.redemption-scan-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 250rpx;
  height: 250rpx;
  margin: 34rpx auto 30rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.07);
}

.redemption-scan-stage__corner {
  position: absolute;
  width: 48rpx;
  height: 48rpx;
  border-color: #ffd534;
  border-style: solid;
}

.redemption-scan-stage__corner--tl {
  top: 0;
  left: 0;
  border-width: 6rpx 0 0 6rpx;
  border-radius: 18rpx 0 0;
}

.redemption-scan-stage__corner--tr {
  top: 0;
  right: 0;
  border-width: 6rpx 6rpx 0 0;
  border-radius: 0 18rpx 0 0;
}

.redemption-scan-stage__corner--bl {
  bottom: 0;
  left: 0;
  border-width: 0 0 6rpx 6rpx;
  border-radius: 0 0 0 18rpx;
}

.redemption-scan-stage__corner--br {
  right: 0;
  bottom: 0;
  border-width: 0 6rpx 6rpx 0;
  border-radius: 0 0 18rpx;
}

.redemption-scan-stage__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 126rpx;
  height: 126rpx;
  border-radius: 32rpx;
  background: linear-gradient(145deg, #ffe36e 0%, #ffc92f 100%);
  box-shadow: 0 18rpx 44rpx rgba(255, 205, 47, 0.28);
}

.redemption-scan-stage__icon {
  width: 76rpx;
  height: 76rpx;
}

.redemption-scan-stage__line {
  position: absolute;
  top: 50%;
  right: 22rpx;
  left: 22rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, rgba(255, 213, 52, 0), #ffd534, rgba(255, 213, 52, 0));
  box-shadow: 0 0 18rpx rgba(255, 213, 52, 0.76);
}

.redemption-scan-button,
.redemption-submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-weight: 700;
}

.redemption-scan-button {
  gap: 12rpx;
  height: 88rpx;
  background: linear-gradient(180deg, #ffe15c 0%, #ffc929 100%);
  color: #22252c;
  box-shadow: 0 16rpx 34rpx rgba(255, 201, 41, 0.2);
}

.redemption-scan-button__icon {
  width: 38rpx;
  height: 38rpx;
}

.redemption-scan-button__text {
  font-size: 31rpx;
}

.redemption-scan-button--hover,
.redemption-submit-button--hover {
  opacity: 0.86;
}

.redemption-scan-button--disabled,
.redemption-submit-button--disabled {
  opacity: 0.5;
}

.redemption-divider {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 30rpx 12rpx;
}

.redemption-divider__line {
  height: 2rpx;
  flex: 1;
  background: #dedfe5;
}

.redemption-divider__text {
  color: #969ba5;
  font-size: 24rpx;
}

.redemption-manual-card,
.redemption-notice {
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 16rpx 44rpx rgba(57, 62, 84, 0.08);
}

.redemption-manual-card {
  padding: 28rpx 26rpx 26rpx;
}

.redemption-manual-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.redemption-manual-card__title,
.redemption-manual-card__desc {
  display: block;
}

.redemption-manual-card__title {
  color: #262a31;
  font-size: 34rpx;
  font-weight: 800;
}

.redemption-manual-card__desc {
  margin-top: 9rpx;
  color: #969ba5;
  font-size: 24rpx;
}

.redemption-manual-card__badge {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #fff4c9;
  color: #9c7610;
  font-size: 22rpx;
  font-weight: 700;
}

.redemption-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  height: 104rpx;
  margin-top: 26rpx;
  padding: 0 24rpx;
  border: 3rpx solid #e6e7ec;
  border-radius: 24rpx;
  background: #f9fafc;
  box-sizing: border-box;
}

.redemption-input-wrap--filled {
  border-color: #ffd349;
  background: #fffdf5;
}

.redemption-input {
  width: 100%;
  height: 100%;
  color: transparent;
  font-size: 36rpx;
}

.redemption-input__placeholder {
  color: #b8bcc5;
}

.redemption-input__preview {
  position: absolute;
  left: 24rpx;
  color: #252931;
  font-size: 40rpx;
  font-weight: 800;
  letter-spacing: 5rpx;
  pointer-events: none;
}

.redemption-input__count {
  position: absolute;
  right: 22rpx;
  color: #a2a7b0;
  font-size: 22rpx;
  pointer-events: none;
}

.redemption-submit-button {
  height: 86rpx;
  margin-top: 22rpx;
  background: linear-gradient(180deg, #ffd94a 0%, #f4bf00 100%);
  color: #24272d;
  font-size: 30rpx;
  box-shadow: 0 14rpx 28rpx rgba(244, 191, 0, 0.2);
}

.redemption-notice {
  display: flex;
  gap: 18rpx;
  margin-top: 22rpx;
  padding: 24rpx;
  background: rgba(255, 252, 240, 0.96);
  box-shadow: inset 0 0 0 2rpx rgba(255, 215, 73, 0.3);
}

.redemption-notice__icon {
  display: flex;
  width: 40rpx;
  height: 40rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ffd54a;
  color: #6e5504;
  font-size: 24rpx;
  font-weight: 800;
}

.redemption-notice__content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.redemption-notice__title {
  color: #4c4531;
  font-size: 27rpx;
  font-weight: 800;
}

.redemption-notice__item {
  color: #827a65;
  font-size: 23rpx;
  line-height: 1.55;
}

.redemption-success-mask {
  position: fixed;
  z-index: 50;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36rpx;
  background: rgba(26, 29, 38, 0.58);
}

.redemption-success-card {
  width: 100%;
  max-width: 650rpx;
  padding: 44rpx 30rpx 30rpx;
  border-radius: 38rpx;
  background: #fff;
  box-shadow: 0 30rpx 90rpx rgba(19, 22, 31, 0.28);
  box-sizing: border-box;
}

.redemption-success-card__check {
  display: flex;
  width: 108rpx;
  height: 108rpx;
  margin: 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(145deg, #58d59b 0%, #22b777 100%);
  box-shadow: 0 18rpx 34rpx rgba(34, 183, 119, 0.24);
}

.redemption-success-card__check-mark {
  width: 44rpx;
  height: 24rpx;
  margin-top: -8rpx;
  border-bottom: 7rpx solid #fff;
  border-left: 7rpx solid #fff;
  transform: rotate(-45deg);
}

.redemption-success-card__title,
.redemption-success-card__desc {
  display: block;
  text-align: center;
}

.redemption-success-card__title {
  margin-top: 24rpx;
  color: #22262d;
  font-size: 42rpx;
  font-weight: 800;
}

.redemption-success-card__desc {
  margin-top: 10rpx;
  color: #969ba5;
  font-size: 25rpx;
}

.redemption-success-card__summary {
  margin-top: 28rpx;
  padding: 24rpx;
  border-radius: 26rpx;
  background: #f7f8fa;
}

.redemption-success-card__product-row,
.redemption-success-card__detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.redemption-success-card__product-row {
  align-items: flex-start;
  padding-bottom: 22rpx;
  border-bottom: 2rpx solid #eaebef;
}

.redemption-success-card__product-info {
  min-width: 0;
  flex: 1;
}

.redemption-success-card__product-name,
.redemption-success-card__order-no {
  display: block;
}

.redemption-success-card__product-name {
  overflow: hidden;
  color: #292d34;
  font-size: 31rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.redemption-success-card__order-no {
  margin-top: 9rpx;
  color: #9ba0aa;
  font-size: 22rpx;
}

.redemption-success-card__quantity {
  color: #555a64;
  font-size: 27rpx;
  font-weight: 700;
}

.redemption-success-card__detail-row {
  min-height: 66rpx;
}

.redemption-success-card__detail-label {
  color: #8d929c;
  font-size: 25rpx;
}

.redemption-success-card__detail-value,
.redemption-success-card__voucher,
.redemption-success-card__amount {
  overflow: hidden;
  color: #353941;
  font-size: 26rpx;
  font-weight: 700;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.redemption-success-card__detail-value {
  max-width: 360rpx;
}

.redemption-success-card__voucher {
  letter-spacing: 2rpx;
}

.redemption-success-card__amount {
  color: #ef7b1a;
  font-size: 31rpx;
}

.redemption-success-card__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 28rpx;
}

.redemption-success-card__button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 84rpx;
  border-radius: 999rpx;
  font-size: 29rpx;
  font-weight: 700;
}

.redemption-success-card__button--secondary {
  background: #f0f1f4;
  color: #5b606a;
}

.redemption-success-card__button--primary {
  background: linear-gradient(180deg, #ffdd52 0%, #f3bf06 100%);
  color: #25282e;
}
</style>
