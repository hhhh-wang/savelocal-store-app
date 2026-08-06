<script lang="ts" setup>
import { submitMerchantStoreForAudit } from '@/api/merchant-store'
import {
  formatStoreCategorySummary,
  normalizeStoreCategorySelection,
} from '@/pages/me/store-category/shared'
import {
  formatBusinessHoursSummary,
  fromMerchantFoodBusinessTimes,
  getBusinessStatusLabel,
} from '@/pages/me/store-status/shared'
import customerServiceIcon from '@/static/icons/customer-service.png'
import { useMerchantFoodStore } from '@/store'

defineOptions({
  name: 'StoreInfo',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '门店信息',
  },
})

interface StoreInfoRow {
  label: string
  value?: string
  type?: 'text' | 'image'
  muted?: boolean
  imageText?: string
  required?: boolean
}

const storeNamePagePath = '/pages/me/store-name/index'
const storePhonePagePath = '/pages/me/store-phone/index'
const storeAddressPagePath = '/pages/me/store-address/index'
const storeStatusPagePath = '/pages/me/store-status/index'
const storeCategoryPagePath = '/pages/me/store-category/index'
const storeQualificationsPagePath = '/pages/me/store-qualifications/index'
const storeEntryPagePath = '/pages/me/store-entry/index'

const merchantFoodStore = useMerchantFoodStore()
const isCreateMode = ref(false)
const pageTitle = computed(() => isCreateMode.value ? '新增门店' : '门店信息')
const storeName = computed(() => merchantFoodStore.currentStore?.storeName || '餐饮门店')
const storeBusinessStatus = computed(() => fromMerchantFoodBusinessTimes(
  merchantFoodStore.profile?.store.storeStatus,
  merchantFoodStore.profile?.businessTimes || [],
))
const storeCategorySelection = computed(() => normalizeStoreCategorySelection({
  primaryId: 'FOOD',
  secondaryId: merchantFoodStore.profile?.store.mainIndustryCode,
}))

const storeInfoRows = computed<StoreInfoRow[]>(() => {
  const businessHoursSummary = formatBusinessHoursSummary(storeBusinessStatus.value.hours)

  return [
    { label: '门店入口图', type: 'image', imageText: merchantFoodStore.profile?.store.coverImage ? '已设置' : '未设置' },
    { label: '门店名称', value: merchantFoodStore.profile?.store.storeName || '未设置' },
    { label: '营业状态', value: getBusinessStatusLabel(storeBusinessStatus.value.status) },
    { label: '营业时间', value: businessHoursSummary, muted: businessHoursSummary === '未设置' },
    { label: '门店品类', value: formatStoreCategorySummary(storeCategorySelection.value) },
    {
      label: '门店电话',
      value: merchantFoodStore.profile?.phones.map(item => item.phoneNumber).join('、')
        || merchantFoodStore.profile?.store.contactMobile
        || '未设置',
      required: true,
    },
    { label: '企业资质', value: '上传材料', required: true },
    { label: '门店地址', value: merchantFoodStore.profile?.store.addressDetail || '未设置', required: true },
  ]
})

onLoad((options) => {
  isCreateMode.value = options?.mode === 'create'
})

function openCustomerService() {
  uni.showToast({
    title: '客服入口待接入',
    icon: 'none',
  })
}

async function loadStoreProfile() {
  try {
    await merchantFoodStore.loadProfile(true)
  }
  catch (error) {
    console.error('门店资料加载失败:', error)
  }
}

function openStoreName() {
  uni.navigateTo({
    url: storeNamePagePath,
  })
}

function handleRowTap(row: StoreInfoRow) {
  if (row.label === '门店入口图') {
    uni.navigateTo({
      url: storeEntryPagePath,
    })
    return
  }

  if (row.label === '门店名称') {
    openStoreName()
    return
  }

  if (row.label === '营业状态' || row.label === '营业时间') {
    uni.navigateTo({
      url: storeStatusPagePath,
    })
    return
  }

  if (row.label === '门店品类') {
    uni.navigateTo({
      url: storeCategoryPagePath,
    })
    return
  }

  if (row.label === '门店电话') {
    uni.navigateTo({
      url: storePhonePagePath,
    })
    return
  }

  if (row.label === '企业资质') {
    uni.navigateTo({
      url: storeQualificationsPagePath,
    })
    return
  }

  if (row.label === '门店地址') {
    uni.navigateTo({
      url: storeAddressPagePath,
    })
    return
  }

  uni.showToast({
    title: `${row.label}入口待接入`,
    icon: 'none',
  })
}

async function submitStoreForAudit() {
  const currentStore = merchantFoodStore.currentStore
  if (currentStore?.auditStatus === '1') {
    uni.showToast({ title: '门店已提交审核，请耐心等待', icon: 'none' })
    return
  }
  if (currentStore?.auditStatus === '2') {
    uni.showToast({ title: '门店已审核通过', icon: 'none' })
    return
  }

  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await submitMerchantStoreForAudit(storeId)
    await merchantFoodStore.loadStores()
    await merchantFoodStore.loadProfile(true)
    uni.showToast({ title: '已提交审核', icon: 'success' })
  }
  catch (error) {
    console.error('新门店提审失败:', error)
    if (error instanceof Error && error.message) {
      uni.showToast({ title: error.message, icon: 'none' })
    }
  }
}

function openFeedback() {
  uni.showToast({
    title: '使用反馈入口待接入',
    icon: 'none',
  })
}

function handleFooterTap() {
  if (isCreateMode.value) {
    void submitStoreForAudit()
    return
  }

  openFeedback()
}

onShow(() => {
  void loadStoreProfile()
})
</script>

<template>
  <view class="store-info-page">
    <view class="store-info-page__glow store-info-page__glow--left" />
    <view class="store-info-page__glow store-info-page__glow--right" />

    <view class="store-info-page__content">
      <view class="store-info-nav">
        <back-button
          fallback-url="/pages/me/me"
          color="#22262d"
          background="transparent"
          size="72rpx"
        />

        <text class="store-info-nav__title">
          {{ pageTitle }}
        </text>

        <view class="store-info-nav__action" hover-class="store-info-nav__action--hover" @tap="openCustomerService">
          <image class="store-info-nav__icon" :src="customerServiceIcon" mode="aspectFit" />
        </view>
      </view>

      <view class="store-info-summary" hover-class="store-info-summary--hover" @tap="openStoreName">
        <text class="store-info-summary__name">
          {{ storeName }}
        </text>
        <text class="store-info-summary__chevron">
          ›
        </text>
      </view>

      <view class="store-info-card">
        <view
          v-for="row in storeInfoRows"
          :key="row.label"
          class="store-info-card__row"
          :class="{ 'store-info-card__row--image': row.type === 'image' }"
          hover-class="store-info-card__row--hover"
          @tap="handleRowTap(row)"
        >
          <text class="store-info-card__label">
            {{ row.label }}
          </text>
          <text v-if="isCreateMode && row.required" class="store-info-card__required">
            *
          </text>

          <view class="store-info-card__value-wrap">
            <view v-if="row.type === 'image'" class="store-info-card__thumb">
              <text class="store-info-card__thumb-text">
                {{ row.imageText }}
              </text>
            </view>

            <text
              v-else
              class="store-info-card__value"
              :class="{ 'store-info-card__value--muted': row.muted }"
            >
              {{ row.value }}
            </text>

            <text class="store-info-card__chevron">
              ›
            </text>
          </view>
        </view>
      </view>

      <view class="store-info-footer">
        <view class="store-info-footer__button" hover-class="store-info-footer__button--hover" @tap="handleFooterTap">
          {{ isCreateMode ? '新门店提交审核' : '使用反馈' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-info-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #f6f7fb 0%, #f2f3f7 100%);
}

.store-info-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.store-info-page__glow--left {
  top: -120rpx;
  left: -140rpx;
  width: 420rpx;
  height: 300rpx;
  background: radial-gradient(circle, rgba(255, 227, 112, 0.42) 0%, rgba(255, 227, 112, 0) 70%);
}

.store-info-page__glow--right {
  top: -60rpx;
  right: -120rpx;
  width: 360rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(225, 216, 255, 0.6) 0%, rgba(225, 216, 255, 0) 68%);
}

.store-info-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 18rpx calc(env(safe-area-inset-bottom) + 52rpx);
}

.store-info-nav {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  min-height: 72rpx;
}

.store-info-nav__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 9999rpx;
}

.store-info-nav__action--hover,
.store-info-summary--hover,
.store-info-card__row--hover,
.store-info-footer__button--hover {
  opacity: 0.82;
}

.store-info-nav__title {
  color: #171a1f;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.store-info-nav__icon {
  width: 42rpx;
  height: 42rpx;
}

.store-info-summary,
.store-info-card,
.store-info-footer__button {
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.store-info-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 22rpx;
  padding: 24rpx 22rpx 24rpx 24rpx;
}

.store-info-summary__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #21252b;
  font-size: 28rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-info-summary__chevron,
.store-info-card__chevron {
  flex-shrink: 0;
  color: #a5aab4;
  font-size: 40rpx;
  line-height: 1;
}

.store-info-card {
  margin-top: 18rpx;
  padding: 12rpx 0;
}

.store-info-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 26rpx 24rpx;
}

.store-info-card__row:not(:last-child) {
  border-bottom: 2rpx solid #f1f2f5;
}

.store-info-card__label {
  flex-shrink: 0;
  color: #525861;
  font-size: 28rpx;
}

.store-info-card__required {
  margin-left: 4rpx;
  color: #ff4d4f;
  font-size: 30rpx;
  font-weight: 700;
}

.store-info-card__value-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  min-width: 0;
  flex: 1;
}

.store-info-card__value {
  overflow: hidden;
  color: #262a31;
  font-size: 28rpx;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-info-card__value--muted {
  color: #c2c6cf;
}

.store-info-card__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, #fff2e2 0%, #ffd9bf 100%);
  box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.55);
}

.store-info-card__thumb-text {
  color: #b15a2f;
  font-size: 28rpx;
  font-weight: 700;
}

.store-info-footer {
  display: flex;
  justify-content: center;
  margin-top: 28rpx;
}

.store-info-footer__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 256rpx;
  height: 76rpx;
  border: 2rpx solid #dadde4;
  color: #242931;
  font-size: 28rpx;
  font-weight: 600;
}
</style>
