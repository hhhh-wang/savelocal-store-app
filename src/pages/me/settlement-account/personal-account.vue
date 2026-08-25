<script lang="ts" setup>
import {
  createMerchantProfitSharingBindQr,
  getMerchantProfitSharingReceiver,
} from '@/api/merchant-profit-sharing'
import { useMerchantFoodStore } from '@/store'
import { isLegacyMerchantBound, isPersonalWechatBound } from './settlement-account'

defineOptions({ name: 'SettlementPersonalAccount' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '个人微信',
  },
})

const merchantFoodStore = useMerchantFoodStore()
const loading = ref(false)
const qrLoading = ref(false)
const receiver = ref<Awaited<ReturnType<typeof getMerchantProfitSharingReceiver>>>()
const qr = ref<Awaited<ReturnType<typeof createMerchantProfitSharingBindQr>>>()

const storeName = computed(() => merchantFoodStore.currentStore?.storeName || qr.value?.storeName || '当前门店')
const isPersonalBound = computed(() => isPersonalWechatBound(receiver.value))
const isLegacyMerchantBoundValue = computed(() => isLegacyMerchantBound(receiver.value))

onShow(() => {
  void loadPage()
})

async function loadPage() {
  loading.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    receiver.value = await getMerchantProfitSharingReceiver(storeId)
    if (!isPersonalBound.value && !isLegacyMerchantBoundValue.value)
      await refreshQr(storeId)
    else
      qr.value = undefined
  }
  catch (error) {
    console.error('加载个人微信结算账户失败:', error)
  }
  finally {
    loading.value = false
  }
}

async function refreshQr(storeId = merchantFoodStore.currentStoreId) {
  if (!storeId || qrLoading.value || isPersonalBound.value || isLegacyMerchantBoundValue.value)
    return
  qrLoading.value = true
  try {
    qr.value = await createMerchantProfitSharingBindQr(storeId)
  }
  catch (error) {
    console.error('生成绑定二维码失败:', error)
  }
  finally {
    qrLoading.value = false
  }
}
</script>

<template>
  <view class="account-page">
    <view class="account-header">
      <back-button color="#25282d" background="transparent" size="64rpx" />
      <text class="account-header__title">个人微信</text>
      <view class="account-header__spacer" />
    </view>

    <view class="account-content">
      <view class="account-status">
        <view class="account-status__topline">
          <view class="account-status__identity">
            <view class="i-carbon-user-avatar-filled account-status__icon" />
            <view class="account-status__copy">
              <text class="account-status__eyebrow">{{ storeName }}</text>
              <text class="account-status__title">个人微信结算</text>
            </view>
          </view>
          <view
            class="account-status__badge"
            :class="{ 'account-status__badge--bound': isPersonalBound }"
          >
            {{ loading ? '查询中' : isPersonalBound ? '已绑定' : '未绑定' }}
          </view>
        </view>

        <text v-if="isPersonalBound" class="account-status__account">
          {{ receiver?.receiverName || '微信收款人' }} · {{ receiver?.receiverAccountMasked || '已授权' }}
        </text>
        <text v-else-if="receiver?.syncFailReason" class="account-status__error">
          上次绑定失败：{{ receiver.syncFailReason }}
        </text>
      </view>

      <view v-if="loading && !receiver" class="account-panel account-panel--loading">
        <text>正在加载账户信息</text>
      </view>

      <view v-else-if="isLegacyMerchantBoundValue" class="account-panel account-panel--notice">
        <view class="i-carbon-locked account-panel__notice-icon" />
        <text class="account-panel__title">暂时无法绑定个人微信</text>
        <text class="account-panel__desc">当前门店存在历史商户号绑定，请联系平台运营解绑后，再绑定个人微信用于商家转账提现。</text>
      </view>

      <view v-else-if="!isPersonalBound" class="account-panel account-panel--qr">
        <text class="account-panel__title">扫码绑定收款微信</text>
        <text class="account-panel__desc">使用需要收款的个人微信扫码，并在小程序中确认授权。</text>

        <view v-if="qr?.qrCode" class="account-qr-wrap">
          <image class="account-qr" :src="qr.qrCode" mode="aspectFit" />
        </view>
        <view v-else class="account-qr account-qr--empty">
          <text>{{ qrLoading || loading ? '正在生成二维码' : '二维码暂不可用' }}</text>
        </view>

        <text v-if="qr?.expiresIn" class="account-panel__hint">
          二维码 {{ Math.floor(qr.expiresIn / 60) }} 分钟内有效
        </text>
        <view class="account-panel__safe">
          <view class="i-carbon-security account-panel__safe-icon" />
          <text>系统通过微信授权获取 OpenID</text>
        </view>
        <button class="account-refresh" :loading="qrLoading" @tap="refreshQr()">
          <view class="i-carbon-renew account-refresh__icon" />
          <text>刷新二维码</text>
        </button>
      </view>

      <view v-else class="account-panel account-panel--notice">
        <view class="i-carbon-checkmark-filled account-panel__notice-icon account-panel__notice-icon--success" />
        <text class="account-panel__title">绑定已完成</text>
        <text class="account-panel__desc">提现时将通过微信商家转账到该个人微信。</text>
        <text class="account-panel__hint">如需更换收款方式，请联系平台运营解绑。</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.account-page {
  min-height: 100vh;
  background: #f4f5f7;
  color: #202328;
}

.account-header {
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  min-height: 88rpx;
  padding: calc(env(safe-area-inset-top) + 12rpx) 24rpx 12rpx;
  border-bottom: 1rpx solid #eceef1;
  background: #fff;
}

.account-header__title {
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
}

.account-header__spacer {
  width: 64rpx;
  height: 64rpx;
}

.account-content {
  padding: 28rpx 28rpx calc(env(safe-area-inset-bottom) + 48rpx);
}

.account-status,
.account-panel {
  border: 1rpx solid #e7e9ec;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 10rpx 24rpx rgba(26, 32, 44, 0.05);
}

.account-status {
  padding: 26rpx;
}

.account-status__topline,
.account-status__identity {
  display: flex;
  align-items: center;
}

.account-status__topline {
  justify-content: space-between;
  gap: 18rpx;
}

.account-status__identity {
  min-width: 0;
  gap: 18rpx;
}

.account-status__icon {
  width: 58rpx;
  height: 58rpx;
  flex-shrink: 0;
  color: #14855d;
}

.account-status__copy {
  min-width: 0;
}

.account-status__eyebrow,
.account-status__title,
.account-status__account,
.account-status__warning,
.account-status__error {
  display: block;
}

.account-status__eyebrow {
  overflow: hidden;
  color: #808790;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-status__title {
  margin-top: 6rpx;
  font-size: 31rpx;
  font-weight: 700;
}

.account-status__badge {
  flex-shrink: 0;
  color: #8c929a;
  font-size: 23rpx;
}

.account-status__badge--bound {
  color: #14855d;
}

.account-status__account,
.account-status__warning,
.account-status__error {
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #eef0f2;
  color: #59616b;
  font-size: 25rpx;
  line-height: 1.5;
}

.account-status__warning {
  color: #8a6415;
}

.account-status__error {
  color: #c94444;
}

.account-panel {
  margin-top: 20rpx;
  padding: 32rpx 28rpx;
}

.account-panel--loading,
.account-panel--notice,
.account-panel--qr {
  text-align: center;
}

.account-panel--loading {
  color: #8a9098;
  font-size: 26rpx;
}

.account-panel__title,
.account-panel__desc,
.account-panel__hint {
  display: block;
}

.account-panel__title {
  font-size: 31rpx;
  font-weight: 700;
}

.account-panel__desc {
  margin-top: 12rpx;
  color: #737b84;
  font-size: 25rpx;
  line-height: 1.65;
}

.account-panel__hint {
  margin-top: 12rpx;
  color: #969ca4;
  font-size: 23rpx;
  line-height: 1.55;
}

.account-panel__notice-icon {
  width: 54rpx;
  height: 54rpx;
  margin: 0 auto 18rpx;
  color: #a07018;
}

.account-panel__notice-icon--success {
  color: #14855d;
}

.account-qr-wrap,
.account-qr {
  width: 460rpx;
  height: 460rpx;
}

.account-qr-wrap {
  margin: 26rpx auto 14rpx;
  background: #fff;
}

.account-qr--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 26rpx auto 14rpx;
  border: 1rpx solid #e7e9ec;
  border-radius: 12rpx;
  box-sizing: border-box;
  background: #f6f7f8;
  color: #999fa7;
  font-size: 25rpx;
}

.account-panel__safe {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 10rpx;
  color: #4f806c;
  font-size: 23rpx;
}

.account-panel__safe-icon,
.account-refresh__icon {
  width: 28rpx;
  height: 28rpx;
}

.account-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  width: 280rpx;
  height: 78rpx;
  margin: 24rpx auto 0;
  border: 0;
  border-radius: 16rpx;
  background: #222a32;
  color: #fff;
  font-size: 26rpx;
  line-height: 78rpx;
}

.account-refresh::after {
  border: 0;
}
</style>
