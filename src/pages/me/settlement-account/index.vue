<script lang="ts" setup>
import {
  createMerchantProfitSharingBindQr,
  getMerchantProfitSharingReceiver,
} from '@/api/merchant-profit-sharing'
import { useMerchantFoodStore } from '@/store'

defineOptions({ name: 'SettlementAccount' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '结算账户',
  },
})

const merchantFoodStore = useMerchantFoodStore()
const loading = ref(false)
const qrLoading = ref(false)
const receiver = ref<Awaited<ReturnType<typeof getMerchantProfitSharingReceiver>>>()
const qr = ref<Awaited<ReturnType<typeof createMerchantProfitSharingBindQr>>>()
const storeName = computed(() => merchantFoodStore.currentStore?.storeName || qr.value?.storeName || '当前门店')
const isBound = computed(() => receiver.value?.bindStatus === 'BOUND')

onShow(() => {
  void loadPage()
})

async function loadPage() {
  loading.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    receiver.value = await getMerchantProfitSharingReceiver(storeId)
    if (!isBound.value)
      await refreshQr(storeId)
  }
  catch (error) {
    console.error('加载结算账户失败:', error)
  }
  finally {
    loading.value = false
  }
}

async function refreshQr(storeId = merchantFoodStore.currentStoreId) {
  if (!storeId || qrLoading.value)
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

function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="settlement-page">
    <view class="settlement-page__header">
      <view class="settlement-page__back" @tap="goBack">
        ‹
      </view>
      <text class="settlement-page__title">结算账户</text>
      <view class="settlement-page__back settlement-page__back--placeholder" />
    </view>

    <view class="settlement-page__content">
      <view class="settlement-card settlement-card--status">
        <view class="settlement-card__eyebrow">
          当前门店
        </view>
        <text class="settlement-card__store">{{ storeName }}</text>
        <view v-if="isBound" class="settlement-status settlement-status--success">
          <text class="settlement-status__dot" />
          <text>个人微信已绑定</text>
        </view>
        <view v-else class="settlement-status">
          <text class="settlement-status__dot settlement-status__dot--pending" />
          <text>尚未绑定个人微信</text>
        </view>
        <text v-if="isBound" class="settlement-card__masked">
          {{ receiver?.receiverName || '微信收款人' }} · {{ receiver?.receiverAccountMasked || '已授权' }}
        </text>
      </view>

      <view v-if="!isBound" class="settlement-card settlement-card--qr">
        <text class="settlement-card__title">绑定个人微信</text>
        <text class="settlement-card__desc">请使用需要收款的个人微信扫描二维码，并在微信小程序中确认绑定</text>
        <view v-if="qr?.qrCode" class="settlement-qr-wrap">
          <image class="settlement-qr" :src="qr.qrCode" mode="aspectFit" />
        </view>
        <view v-else class="settlement-qr settlement-qr--empty">
          <text>{{ qrLoading || loading ? '正在生成二维码' : '二维码暂不可用' }}</text>
        </view>
        <text v-if="qr?.expiresIn" class="settlement-card__hint">二维码 {{ Math.floor(qr.expiresIn / 60) }} 分钟内有效</text>
        <text class="settlement-card__safe">微信授权后由系统获取 OpenID，无需手动填写</text>
        <button class="settlement-card__refresh" :loading="qrLoading" @tap="refreshQr()">
          刷新二维码
        </button>
      </view>

      <view v-else class="settlement-card settlement-card--notice">
        <text class="settlement-card__title">绑定已完成</text>
        <text class="settlement-card__desc">后续符合条件的订单会按分账规则结算到该个人微信。</text>
        <text class="settlement-card__hint">如需更换收款微信，请联系平台运营解绑后重新绑定。</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.settlement-page {
  min-height: 100vh;
  background: #f6f7f9;
  color: #1e2329;
}

.settlement-page__header {
  height: 112rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1rpx solid #edf0f2;
}

.settlement-page__back {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #20262e;
}

.settlement-page__back--placeholder {
  opacity: 0;
}
.settlement-page__title {
  font-size: 34rpx;
  font-weight: 650;
}
.settlement-page__content {
  padding: 28rpx 32rpx 64rpx;
}

.settlement-card {
  margin-bottom: 24rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 12rpx 36rpx rgba(27, 36, 47, 0.05);
}

.settlement-card__eyebrow {
  color: #8a929b;
  font-size: 24rpx;
}
.settlement-card__store {
  display: block;
  margin-top: 10rpx;
  font-size: 38rpx;
  font-weight: 650;
}
.settlement-card__title {
  display: block;
  font-size: 32rpx;
  font-weight: 650;
}
.settlement-card__desc {
  display: block;
  margin-top: 14rpx;
  color: #747d87;
  line-height: 1.65;
  font-size: 26rpx;
}
.settlement-card__masked {
  display: block;
  margin-top: 14rpx;
  color: #59636e;
  font-size: 26rpx;
}

.settlement-status {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 22rpx;
  color: #8a6b1f;
  font-size: 26rpx;
}
.settlement-status--success {
  color: #21865a;
}
.settlement-status__dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #2bb673;
}
.settlement-status__dot--pending {
  background: #e0ad3d;
}

.settlement-card--qr {
  text-align: center;
}
.settlement-qr-wrap {
  width: 480rpx;
  height: 480rpx;
  margin: 28rpx auto 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
.settlement-qr {
  width: 460rpx;
  height: 460rpx;
}
.settlement-qr--empty {
  margin: 28rpx auto 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa1a9;
  background: #f5f6f7;
  font-size: 26rpx;
}
.settlement-card__hint,
.settlement-card__safe {
  display: block;
  color: #9aa1a9;
  font-size: 23rpx;
  line-height: 1.6;
}
.settlement-card__safe {
  margin-top: 8rpx;
  color: #5a8b76;
}
.settlement-card__refresh {
  margin: 24rpx auto 0;
  width: 270rpx;
  height: 76rpx;
  line-height: 76rpx;
  border: 0;
  border-radius: 40rpx;
  background: #202a34;
  color: #fff;
  font-size: 27rpx;
}
.settlement-card__refresh::after {
  border: 0;
}
.settlement-card--notice {
  padding-bottom: 36rpx;
}
</style>
