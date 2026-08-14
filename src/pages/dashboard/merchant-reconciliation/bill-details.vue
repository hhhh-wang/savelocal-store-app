<script lang="ts" setup>
import type { BillKind } from './withdrawal'
import WithdrawalPageHeader from './components/withdrawal-page-header.vue'
import { BILL_DETAIL_GROUPS, WITHDRAWAL_PATHS } from './withdrawal'

defineOptions({ name: 'MerchantBillDetails' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '账单明细',
  },
})

const billIconMap: Record<BillKind, string> = {
  coupon: 'i-carbon-ticket',
  fee: 'i-carbon-tool-box',
  income: 'i-carbon-money',
}

function showPrototypeNotice(title: string) {
  uni.showToast({ title, icon: 'none' })
}
</script>

<template>
  <view class="bill-details-page">
    <withdrawal-page-header title="账单明细" :fallback-url="WITHDRAWAL_PATHS.overview" />

    <view class="bill-groups">
      <view v-for="(group, groupIndex) in BILL_DETAIL_GROUPS" :key="group.date" class="bill-group">
        <view class="bill-group__header">
          <view class="bill-group__summary">
            <view class="bill-group__date-row" @tap="showPrototypeNotice('日期选择暂未开放')">
              <text class="bill-group__date">{{ group.date }}</text>
              <view v-if="groupIndex === 0" class="i-carbon-chevron-down bill-group__date-arrow" />
            </view>
            <view class="bill-group__totals">
              <text>支出 ¥ {{ group.expense }}</text>
              <text>收入 ¥ {{ group.income }}</text>
            </view>
          </view>
          <view v-if="groupIndex === 0" class="bill-group__filter" @tap="showPrototypeNotice('筛选暂未开放')">
            <text>筛选</text>
            <view class="i-carbon-filter bill-group__filter-icon" />
          </view>
        </view>

        <view class="bill-group__items">
          <view v-for="item in group.items" :key="item.id" class="bill-item">
            <view class="bill-item__icon" :class="`bill-item__icon--${item.kind}`">
              <view class="bill-item__glyph" :class="billIconMap[item.kind]" />
            </view>
            <view class="bill-item__body">
              <text class="bill-item__description">{{ item.description }}</text>
              <text class="bill-item__time">{{ item.time }}</text>
            </view>
            <text class="bill-item__amount" :class="{ 'bill-item__amount--income': item.amount.startsWith('+') }">
              {{ item.amount }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <view class="bill-tabbar">
      <view class="i-carbon-chart-pie bill-tabbar__icon" />
      <text>明细</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.bill-details-page {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 126rpx);
  box-sizing: border-box;
  background: #f5f5f5;
  color: #303030;
}

.bill-group__header,
.bill-group__date-row,
.bill-group__filter,
.bill-item,
.bill-tabbar {
  display: flex;
  align-items: center;
}

.bill-group__header {
  justify-content: space-between;
  gap: 24rpx;
  min-height: 116rpx;
  padding: 14rpx 32rpx;
  box-sizing: border-box;
  background: #f5f5f5;
}

.bill-group__summary {
  min-width: 0;
  flex: 1;
}

.bill-group__date-row {
  gap: 8rpx;
}

.bill-group__date {
  color: #303030;
  font-size: 30rpx;
  line-height: 1.4;
}

.bill-group__date-arrow {
  width: 28rpx;
  height: 28rpx;
  color: #6e6e6e;
}

.bill-group__totals {
  display: flex;
  gap: 24rpx;
  margin-top: 4rpx;
  color: #aaa;
  font-size: 26rpx;
}

.bill-group__filter {
  gap: 10rpx;
  flex-shrink: 0;
  font-size: 29rpx;
}

.bill-group__filter-icon {
  width: 30rpx;
  height: 30rpx;
  color: #6f6f6f;
}

.bill-group__items {
  background: #fff;
}

.bill-item {
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) auto;
  gap: 16rpx;
  min-height: 132rpx;
  margin-left: 32rpx;
  padding: 16rpx 32rpx 16rpx 0;
  border-bottom: 1rpx solid #efefef;
  box-sizing: border-box;
}

.bill-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  color: #fff;
}

.bill-item__icon--coupon,
.bill-item__icon--income {
  background: #ff8508;
}

.bill-item__icon--fee {
  background: #ff6360;
}

.bill-item__glyph {
  width: 34rpx;
  height: 34rpx;
}

.bill-item__body {
  min-width: 0;
}

.bill-item__description,
.bill-item__time {
  display: block;
}

.bill-item__description {
  overflow: hidden;
  color: #303030;
  font-size: 29rpx;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-item__time {
  margin-top: 8rpx;
  color: #aaa;
  font-size: 26rpx;
}

.bill-item__amount {
  align-self: start;
  padding-top: 2rpx;
  color: #303030;
  font-size: 34rpx;
  line-height: 1.4;
  white-space: nowrap;
}

.bill-item__amount--income {
  color: #fb6800;
}

.bill-tabbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  flex-direction: column;
  justify-content: center;
  min-height: 94rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  color: #555;
  font-size: 25rpx;
}

.bill-tabbar__icon {
  width: 44rpx;
  height: 44rpx;
  margin-bottom: 2rpx;
  color: #888;
}
</style>
