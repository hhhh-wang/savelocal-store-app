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
const loading = ref(false)
const receiver = ref<Awaited<ReturnType<typeof getMerchantProfitSharingReceiver>>>()
const ledger = ref<Awaited<ReturnType<typeof getLedger>>>()

const storeName = computed(() => merchantFoodStore.currentStore?.storeName || '当前门店')
const personalWechatBound = computed(() => isPersonalWechatBound(receiver.value))
const legacyMerchantBound = computed(() => isLegacyMerchantBound(receiver.value))

onShow(() => {
  void loadAccountStatus()
})

async function loadAccountStatus() {
  loading.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    ledger.value = await getLedger(String(storeId))
    receiver.value = await getMerchantProfitSharingReceiver(storeId)
  }
  catch (error) {
    console.error('加载结算账户失败:', error)
  }
  finally {
    loading.value = false
  }
}

function getOptionStatus() {
  if (loading.value)
    return '查询中'
  if (personalWechatBound.value)
    return '历史已绑定'
  if (legacyMerchantBound.value)
    return '历史记录'
  return '未绑定'
}

async function openLedger() {
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    uni.navigateTo({ url: `/pages/me/store-ledger/index?storeId=${storeId}` })
  }
  catch {
    uni.showToast({ title: '请先选择门店', icon: 'none' })
  }
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
      <view class="settlement-intro">
        <text class="settlement-intro__eyebrow">{{ storeName }}</text>
        <text class="settlement-intro__title">嘉联收款账户</text>
        <text class="settlement-intro__desc">支持法人对私和企业对公账户，完成开户、法人签约及绑定后使用。</text>
        <text class="settlement-intro__desc">{{ ledger?.stateLabel || '正在查询收款进度' }}</text>
      </view>

      <view class="settlement-options">
        <button class="mb-4 w-full rounded-3 bg-[#eef5ff] p-4 text-sm text-[#1677ff]" @click="openLedger">
          嘉联收款账户 · 开户、签约及进度查询
        </button>
        <view
          v-if="receiver"
          class="settlement-option"
        >
          <view class="settlement-option__icon settlement-option__icon--personal">
            <view class="i-carbon-user-avatar-filled settlement-option__icon-glyph" />
          </view>
          <view class="settlement-option__body">
            <view class="settlement-option__heading">
              <text class="settlement-option__title">历史微信账户</text>
              <view
                class="settlement-option__status"
                :class="{ 'settlement-option__status--active': personalWechatBound }"
              >
                <view v-if="personalWechatBound" class="i-carbon-checkmark settlement-option__check" />
                <text>{{ getOptionStatus() }}</text>
              </view>
            </view>
            <text class="settlement-option__desc">保留原渠道记录用于历史核对，新增账户请使用嘉联开户</text>
            <text v-if="personalWechatBound" class="settlement-option__account">
              {{ receiver?.receiverName || '微信收款人' }} · {{ receiver?.receiverAccountMasked || '已授权' }}
            </text>
            <text v-else-if="legacyMerchantBound" class="settlement-option__account settlement-option__account--warning">
              历史微信商户号绑定记录
            </text>
          </view>
        </view>
      </view>

      <view class="settlement-note">
        <view class="i-carbon-information settlement-note__icon" />
        <text>变更已生效的结算银行卡请联系平台办理，存在在途资金时需先完成核对。</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.settlement-page {
  min-height: 100vh;
  background: #f4f5f7;
  color: #202328;
}

.settlement-header {
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  min-height: 88rpx;
  padding: calc(env(safe-area-inset-top) + 12rpx) 24rpx 12rpx;
  border-bottom: 1rpx solid #eceef1;
  background: #fff;
}

.settlement-header__title {
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
}

.settlement-header__spacer {
  width: 64rpx;
  height: 64rpx;
}

.settlement-content {
  padding: 40rpx 28rpx calc(env(safe-area-inset-bottom) + 48rpx);
}

.settlement-intro {
  display: flex;
  flex-direction: column;
}

.settlement-intro__eyebrow {
  color: #687079;
  font-size: 25rpx;
}

.settlement-intro__title {
  margin-top: 10rpx;
  color: #171a1f;
  font-size: 42rpx;
  font-weight: 700;
  line-height: 1.3;
}

.settlement-intro__desc {
  margin-top: 14rpx;
  color: #767d86;
  font-size: 26rpx;
  line-height: 1.65;
}

.settlement-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 34rpx;
}

.settlement-option {
  display: flex;
  align-items: center;
  gap: 22rpx;
  min-height: 176rpx;
  padding: 28rpx 24rpx;
  border: 1rpx solid #e7e9ec;
  border-radius: 16rpx;
  box-sizing: border-box;
  background: #fff;
  box-shadow: 0 10rpx 24rpx rgba(26, 32, 44, 0.05);
}

.settlement-option--hover {
  opacity: 0.82;
}

.settlement-option__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 84rpx;
  flex-shrink: 0;
  border-radius: 16rpx;
}

.settlement-option__icon--personal {
  background: #e9f7f0;
  color: #12845c;
}

.settlement-option__icon-glyph {
  width: 44rpx;
  height: 44rpx;
}

.settlement-option__body {
  min-width: 0;
  flex: 1;
}

.settlement-option__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.settlement-option__title {
  min-width: 0;
  color: #202328;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.35;
}

.settlement-option__status {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  flex-shrink: 0;
  color: #9298a0;
  font-size: 21rpx;
  line-height: 1.4;
}

.settlement-option__status--active {
  color: #16835c;
}

.settlement-option__check {
  width: 24rpx;
  height: 24rpx;
}

.settlement-option__desc,
.settlement-option__account {
  display: block;
  margin-top: 10rpx;
  color: #7e858e;
  font-size: 23rpx;
  line-height: 1.55;
}

.settlement-option__account {
  color: #4e5965;
}

.settlement-option__arrow {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
  color: #b1b6bd;
}

.settlement-note {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  margin-top: 28rpx;
  padding: 0 4rpx;
  color: #858c94;
  font-size: 23rpx;
  line-height: 1.6;
}

.settlement-note__icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}
</style>
