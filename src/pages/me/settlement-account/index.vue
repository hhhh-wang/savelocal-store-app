<script lang="ts" setup>
import { getLedger } from '@/api/merchant-ledger'
import { getMerchantProfitSharingReceiver } from '@/api/merchant-profit-sharing'
import { useMerchantFoodStore } from '@/store'
import {
  isLegacyMerchantBound,
  isPersonalWechatBound,
} from './settlement-account'

defineOptions({ name: 'SettlementAccount' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '结算账户',
  },
})

const merchantFoodStore = useMerchantFoodStore()
const loading = ref(true)
const loadError = ref('')
const routeStoreId = ref<number>()
const accountStoreId = ref<number>()
const receiver = ref<Awaited<ReturnType<typeof getMerchantProfitSharingReceiver>>>()
const ledger = ref<Awaited<ReturnType<typeof getLedger>>>()

const storeName = computed(() => merchantFoodStore.stores.find(store => store.storeId === accountStoreId.value)?.storeName || '当前门店')
const personalWechatBound = computed(() => isPersonalWechatBound(receiver.value))
const legacyMerchantBound = computed(() => isLegacyMerchantBound(receiver.value))
const hasLegacyReceiver = computed(() => !!receiver.value?.receiverId || personalWechatBound.value || legacyMerchantBound.value)
const accountStatus = computed(() => loading.value ? '正在查询' : ledger.value?.stateLabel.replace(/嘉联/g, '') || '暂未获取账户状态')
const bankCardTail = computed(() => ledger.value?.materials.bankCardNo.replace(/\D/g, '').slice(-4) || '')
const actionText = computed(() => {
  if (loading.value)
    return '正在加载'
  if (ledger.value?.signLink)
    return '去完成签约'
  if (ledger.value?.editable)
    return bankCardTail.value ? '继续完善账户' : '绑定银行卡'
  return ledger.value?.state === 'BOUND' ? '查看账户信息' : '查看办理进度'
})

onLoad((options) => {
  const id = Number(options?.storeId)
  routeStoreId.value = Number.isSafeInteger(id) && id > 0 ? id : undefined
})

onShow(() => {
  void loadAccountStatus()
})

async function loadAccountStatus() {
  loading.value = true
  loadError.value = ''
  ledger.value = undefined
  receiver.value = undefined
  try {
    const currentStoreId = await merchantFoodStore.ensureCurrentStoreId()
    const storeId = routeStoreId.value || currentStoreId
    accountStoreId.value = storeId
    const [ledgerResult, receiverResult] = await Promise.allSettled([
      getLedger(String(storeId)),
      getMerchantProfitSharingReceiver(storeId),
    ])
    if (ledgerResult.status === 'rejected')
      throw ledgerResult.reason
    ledger.value = ledgerResult.value
    if (receiverResult.status === 'fulfilled')
      receiver.value = receiverResult.value
    else
      console.error('加载历史结算账户失败:', receiverResult.reason)
  }
  catch (error) {
    console.error('加载结算账户失败:', error)
    loadError.value = error instanceof Error ? error.message : '账户信息加载失败，请稍后重试'
  }
  finally {
    loading.value = false
  }
}

function openLedger() {
  if (loading.value || !accountStoreId.value || !ledger.value)
    return
  uni.navigateTo({ url: `/pages/me/store-ledger/index?storeId=${accountStoreId.value}` })
}
</script>

<template>
  <view class="settlement-page">
    <view class="settlement-header">
      <back-button color="#25282d" background="transparent" size="64rpx" />
      <text class="settlement-header__title">结算账户</text>
      <view class="settlement-header__spacer" />
    </view>

    <view class="settlement-content">
      <view class="settlement-store">
        <view class="i-carbon-store settlement-store__icon" />
        <text>{{ storeName }}</text>
      </view>

      <view class="settlement-card">
        <view class="settlement-card__heading">
          <view class="settlement-card__icon">
            <view class="i-carbon-wallet settlement-card__glyph" />
          </view>
          <view class="settlement-card__intro">
            <text class="settlement-card__title">结算银行卡</text>
            <text class="settlement-card__desc">绑定银行卡及开户行，用于门店结算</text>
          </view>
        </view>

        <view class="settlement-details">
          <view class="settlement-details__row">
            <text class="settlement-details__label">当前状态</text>
            <text class="settlement-details__value">{{ accountStatus }}</text>
          </view>
          <view v-if="ledger?.materials.bankName" class="settlement-details__row">
            <text class="settlement-details__label">开户银行</text>
            <text class="settlement-details__value">{{ ledger.materials.bankName }}</text>
          </view>
          <view v-if="ledger?.materials.bankBranchName" class="settlement-details__row">
            <text class="settlement-details__label">开户支行</text>
            <text class="settlement-details__value">{{ ledger.materials.bankBranchName }}</text>
          </view>
          <view v-if="bankCardTail" class="settlement-details__row">
            <text class="settlement-details__label">结算账户</text>
            <text class="settlement-details__value">{{ ledger?.materials.merchType === '1' ? '企业对公' : '法人对私' }} · 尾号 {{ bankCardTail }}</text>
          </view>
        </view>

        <view v-if="loadError" class="settlement-error">
          <text>{{ loadError }}</text>
          <button class="settlement-retry" @click="loadAccountStatus">
            重新加载
          </button>
        </view>
        <button
          v-else
          class="settlement-primary"
          :disabled="loading || !ledger"
          :loading="loading"
          hover-class="settlement-primary--hover"
          @click="openLedger"
        >
          {{ actionText }}
        </button>
      </view>

      <view v-if="hasLegacyReceiver" class="settlement-card settlement-history">
        <view class="settlement-history__heading">
          <text class="settlement-history__title">历史微信账户</text>
          <text class="settlement-history__status">{{ personalWechatBound ? '已绑定' : legacyMerchantBound ? '历史记录' : '未绑定' }}</text>
        </view>
        <text v-if="personalWechatBound" class="settlement-history__account">{{ receiver?.receiverName || '微信收款人' }} · {{ receiver?.receiverAccountMasked || '已授权' }}</text>
        <text class="settlement-card__desc">用于历史收款核对，新增结算请绑定银行卡。</text>
      </view>

      <text class="settlement-note">如需更换已生效的银行卡或开户行，请联系平台处理。</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.settlement-page {
  min-height: 100vh;
  background: #f6f7f9;
  color: #24272b;
}

.settlement-header {
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  min-height: 88rpx;
  padding: calc(env(safe-area-inset-top) + 12rpx) 24rpx 12rpx;
  background: #fff;
}

.settlement-header__title {
  font-size: 34rpx;
  font-weight: 600;
  text-align: center;
}

.settlement-header__spacer {
  width: 64rpx;
  height: 64rpx;
}

.settlement-content {
  padding: 28rpx 24rpx calc(env(safe-area-inset-bottom) + 48rpx);
}

.settlement-store {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 0 4rpx 24rpx;
  color: #767d87;
  font-size: 26rpx;
  line-height: 1.5;
  word-break: break-word;
}

.settlement-store__icon {
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
}

.settlement-card {
  padding: 30rpx 28rpx;
  border: 1rpx solid #eceef1;
  border-radius: 22rpx;
  background: #fff;
}

.settlement-card__heading {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.settlement-card__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  border-radius: 18rpx;
  background: #fff8df;
  color: #8c6a23;
}

.settlement-card__glyph {
  width: 38rpx;
  height: 38rpx;
}

.settlement-card__intro {
  flex: 1;
  min-width: 0;
}

.settlement-card__title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
}

.settlement-card__desc {
  display: block;
  margin-top: 10rpx;
  color: #858a93;
  font-size: 24rpx;
  line-height: 1.6;
}

.settlement-details {
  margin-top: 28rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid #f0f1f3;
}

.settlement-details__row {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  padding: 12rpx 0;
  font-size: 26rpx;
  line-height: 1.6;
}

.settlement-details__label {
  flex-shrink: 0;
  color: #858a93;
}

.settlement-details__value {
  flex: 1;
  min-width: 0;
  color: #363b42;
  text-align: right;
  word-break: break-word;
}

.settlement-primary,
.settlement-retry {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 88rpx;
  margin: 26rpx 0 0;
  padding: 18rpx 24rpx;
  border: 0;
  border-radius: 18rpx;
  box-sizing: border-box;
  background: #ffcf37;
  color: #24272b;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.5;
}

.settlement-primary::after,
.settlement-retry::after {
  border: 0;
}

.settlement-primary[disabled] {
  background: #f3f4f6;
  color: #969ca5;
}

.settlement-primary--hover {
  opacity: 0.82;
}

.settlement-error {
  margin-top: 18rpx;
  color: #b64a3d;
  font-size: 25rpx;
  line-height: 1.6;
}

.settlement-retry {
  background: #f5f6f8;
  font-weight: 400;
}

.settlement-history {
  margin-top: 20rpx;
}

.settlement-history__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.settlement-history__title {
  font-size: 28rpx;
  font-weight: 600;
}

.settlement-history__status {
  flex-shrink: 0;
  color: #858a93;
  font-size: 23rpx;
}

.settlement-history__account {
  display: block;
  margin-top: 18rpx;
  color: #555b64;
  font-size: 26rpx;
  line-height: 1.6;
}

.settlement-note {
  display: block;
  margin: 24rpx 8rpx 0;
  color: #9298a1;
  font-size: 23rpx;
  line-height: 1.7;
}
</style>
