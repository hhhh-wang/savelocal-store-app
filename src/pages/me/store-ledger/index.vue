<script setup lang="ts">
import StoreLedgerForm from '@/components/store-ledger-form/store-ledger-form.vue'

definePage({ style: { navigationStyle: 'custom', navigationBarTitleText: '结算账户信息' } })
const storeId = ref('')
onLoad((options) => {
  const id = options?.storeId
  if (typeof id === 'string' && /^[1-9]\d*$/.test(id))
    storeId.value = id
})
</script>

<template>
  <view class="store-ledger-page">
    <view class="store-ledger-header">
      <back-button
        :fallback-url="storeId ? `/pages/me/settlement-account/index?storeId=${storeId}` : '/pages/me/settlement-account/index'"
        fallback-mode="navigateTo"
        color="#25282d"
        background="transparent"
        size="64rpx"
      />
      <text class="store-ledger-header__title">结算账户信息</text>
      <view class="store-ledger-header__spacer" />
    </view>
    <StoreLedgerForm v-if="storeId" :store-id="storeId" />
    <view v-else class="store-ledger-empty">
      <text class="store-ledger-empty__title">暂无门店信息</text>
      <text class="store-ledger-empty__desc">请返回结算账户，选择门店后再试。</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-ledger-page {
  min-height: 100vh;
  background: #f6f7f9;
  color: #24272b;
}

.store-ledger-header {
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  min-height: 88rpx;
  padding: calc(env(safe-area-inset-top) + 12rpx) 24rpx 12rpx;
  background: #fff;
}

.store-ledger-header__title {
  font-size: 34rpx;
  font-weight: 600;
  text-align: center;
}

.store-ledger-header__spacer {
  width: 64rpx;
  height: 64rpx;
}

.store-ledger-empty {
  margin: 28rpx 24rpx;
  padding: 48rpx 28rpx;
  border-radius: 22rpx;
  background: #fff;
  text-align: center;
}

.store-ledger-empty__title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}

.store-ledger-empty__desc {
  display: block;
  margin-top: 16rpx;
  color: #858a93;
  font-size: 26rpx;
  line-height: 1.6;
}
</style>
