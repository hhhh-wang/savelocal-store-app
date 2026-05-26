<script lang="ts" setup>
defineOptions({
  name: 'MyContracts',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '我的合同',
  },
})

type ContractTab = 'signed' | 'pending'

interface ContractItem {
  id: string
  title: string
}

const fallbackUrl = '/pages/me/me'

const contractTabs = [
  { key: 'signed', label: '已签约合同' },
  { key: 'pending', label: '待签约合同' },
] as const

const contractMap: Record<ContractTab, ContractItem[]> = {
  signed: [
    { id: 'contract-001', title: '2805526-团购技术服务补充协议-20260131' },
    { id: 'contract-002', title: '2805526-平台商家服务协议' },
    { id: 'contract-003', title: '2805526-全渠道合作补充协议' },
  ],
  pending: [
    { id: 'contract-004', title: '2805526-商户授权签约确认书' },
    { id: 'contract-005', title: '2805526-门店服务补充协议' },
  ],
}

const activeTab = ref<ContractTab>('signed')

const activeContracts = computed(() => contractMap[activeTab.value])

function switchTab(tab: ContractTab) {
  activeTab.value = tab
}

function handleClose() {
  const pages = getCurrentPages()

  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  uni.reLaunch({
    url: fallbackUrl,
  })
}

function openContract(item: ContractItem) {
  uni.showToast({
    title: `${item.title}待接入`,
    icon: 'none',
  })
}
</script>

<template>
  <view class="my-contracts-page">
    <view class="my-contracts-page__glow my-contracts-page__glow--left" />
    <view class="my-contracts-page__glow my-contracts-page__glow--right" />

    <view class="my-contracts-page__content">
      <view class="my-contracts-nav">
        <view class="my-contracts-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="reLaunch"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />

          <text class="my-contracts-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="my-contracts-nav__title">
          我的合同
        </text>

        <view class="my-contracts-nav__spacer" />
      </view>

      <view class="my-contracts-tabs">
        <view
          v-for="tab in contractTabs"
          :key="tab.key"
          class="my-contracts-tabs__item"
          :class="{ 'my-contracts-tabs__item--active': tab.key === activeTab }"
          @tap="switchTab(tab.key)"
        >
          <text class="my-contracts-tabs__label">
            {{ tab.label }}
          </text>
        </view>
      </view>

      <view class="my-contracts-list">
        <view
          v-for="item in activeContracts"
          :key="item.id"
          class="my-contracts-card"
          hover-class="my-contracts-card--hover"
          @tap="openContract(item)"
        >
          <text class="my-contracts-card__title">
            {{ item.title }}
          </text>
          <text class="my-contracts-card__arrow">
            ›
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.my-contracts-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f8f8fa 18%, #f2f3f7 100%);
}

.my-contracts-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.my-contracts-page__glow--left {
  top: -110rpx;
  left: -130rpx;
  width: 420rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 230, 122, 0.28) 0%, rgba(255, 230, 122, 0) 72%);
}

.my-contracts-page__glow--right {
  top: -50rpx;
  right: -120rpx;
  width: 340rpx;
  height: 240rpx;
  background: radial-gradient(circle, rgba(230, 231, 237, 0.9) 0%, rgba(230, 231, 237, 0) 70%);
}

.my-contracts-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 12rpx calc(env(safe-area-inset-bottom) + 36rpx);
}

.my-contracts-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
  padding: 0 10rpx;
}

.my-contracts-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.my-contracts-nav__close {
  color: #30343a;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}

.my-contracts-nav__title {
  color: #20242a;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.my-contracts-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.my-contracts-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 76rpx;
  margin-top: 22rpx;
}

.my-contracts-tabs__item {
  position: relative;
  padding-bottom: 18rpx;
}

.my-contracts-tabs__item--active::after {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 46rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #ff3b30;
  content: '';
  transform: translateX(-50%);
}

.my-contracts-tabs__label {
  color: #838892;
  font-size: 34rpx;
  font-weight: 600;
}

.my-contracts-tabs__item--active .my-contracts-tabs__label {
  color: #262a31;
}

.my-contracts-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 26rpx;
}

.my-contracts-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 108rpx;
  padding: 0 22rpx 0 24rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12rpx 30rpx rgba(56, 61, 86, 0.06);
}

.my-contracts-card--hover {
  opacity: 0.84;
}

.my-contracts-card__title {
  flex: 1;
  min-width: 0;
  color: #454a52;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.4;
}

.my-contracts-card__arrow {
  flex-shrink: 0;
  color: #ced2d9;
  font-size: 42rpx;
  line-height: 1;
}
</style>
