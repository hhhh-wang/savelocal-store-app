<script lang="ts" setup>
import type { BusinessStatus, StoreBusinessStatusPayload } from '@/components/business-hours-picker/types'
import { updateMerchantFoodStoreBusinessStatus } from '@/api/merchant-food'
import { useMerchantFoodStore, useMerchantStoreAuditStore } from '@/store'
import {
  cloneStoreBusinessStatus,
  createDefaultStoreBusinessStatus,
  fromMerchantFoodBusinessTimes,
  toMerchantFoodBusinessTimes,
} from './shared'

defineOptions({
  name: 'StoreStatus',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '营业状态',
  },
})

const fallbackUrl = '/pages/me/store-info/index'

const businessStatusOptions: Array<{ value: BusinessStatus, title: string, description: string }> = [
  {
    value: 'normal',
    title: '正常营业',
    description: '门店正常开放，能够为顾客提供服务',
  },
  {
    value: 'pause',
    title: '暂停营业',
    description: '门店因节假日、装修等原因，短期内停止营业，预计一段时间后恢复营业',
  },
]

const form = reactive<StoreBusinessStatusPayload>(createDefaultStoreBusinessStatus())
const merchantFoodStore = useMerchantFoodStore()
const merchantStoreAudit = useMerchantStoreAuditStore()
const submitting = ref(false)

async function syncForm() {
  const profile = await merchantFoodStore.loadProfile(true)
  await merchantStoreAudit.load(profile.store.storeId, true)
  const storedValue = fromMerchantFoodBusinessTimes(
    profile.store.storeStatus,
    merchantStoreAudit.snapshot.businessHours,
  )

  form.status = storedValue.status
  form.hours = cloneStoreBusinessStatus(storedValue).hours
}

function handleClose() {
  const pages = getCurrentPages()

  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  uni.navigateTo({
    url: fallbackUrl,
  })
}

function selectStatus(status: BusinessStatus) {
  form.status = status
}

async function handleSubmit() {
  if (submitting.value)
    return
  submitting.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await updateMerchantFoodStoreBusinessStatus(storeId, {
      storeStatus: form.status === 'pause' ? '1' : '0',
    })
    await merchantStoreAudit.saveBusinessHours(storeId, {
      businessHours: toMerchantFoodBusinessTimes(form.hours),
    })
    await merchantFoodStore.loadProfile(true)

    uni.showToast({ title: '营业状态已生效，营业时间已保存到草稿', icon: 'success' })

    setTimeout(handleClose, 320)
  }
  finally {
    submitting.value = false
  }
}

onMounted(() => {
  syncForm().catch(() => {})
})
</script>

<template>
  <view class="store-status-page">
    <view class="store-status-page__glow store-status-page__glow--left" />
    <view class="store-status-page__glow store-status-page__glow--right" />

    <view class="store-status-page__content">
      <view class="store-status-nav">
        <view class="store-status-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="navigateTo"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />

          <text class="store-status-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="store-status-nav__title">
          营业状态
        </text>

        <view class="store-status-nav__spacer" />
      </view>

      <view class="store-status-card">
        <view class="store-status-card__label">
          <text class="store-status-card__label-text">
            当前营业状态
          </text>
          <text class="store-status-card__required">
            *
          </text>
        </view>

        <view
          v-for="option in businessStatusOptions"
          :key="option.value"
          class="store-status-option"
          hover-class="store-status-option--hover"
          @tap="selectStatus(option.value)"
        >
          <view class="store-status-option__content">
            <text class="store-status-option__title">
              {{ option.title }}
            </text>
            <text class="store-status-option__desc">
              {{ option.description }}
            </text>
          </view>

          <view
            class="store-status-option__radio"
            :class="{ 'store-status-option__radio--active': form.status === option.value }"
          >
            <view v-if="form.status === option.value" class="store-status-option__radio-dot" />
          </view>
        </view>
      </view>

      <view class="store-status-card store-status-card--hours">
        <view class="store-status-card__label">
          <text class="store-status-card__label-text">
            营业时段
          </text>
          <text class="store-status-card__required">
            *
          </text>
        </view>

        <business-hours-picker v-model="form.hours" />
      </view>
    </view>

    <view class="store-status-footer">
      <view class="store-status-footer__button" hover-class="store-status-footer__button--hover" @tap="handleSubmit">
        提交
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-status-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f9f9fb 18%, #f5f6f9 100%);
}

.store-status-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.store-status-page__glow--left {
  top: -110rpx;
  left: -120rpx;
  width: 420rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 229, 122, 0.28) 0%, rgba(255, 229, 122, 0) 72%);
}

.store-status-page__glow--right {
  top: -40rpx;
  right: -120rpx;
  width: 340rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(233, 225, 255, 0.54) 0%, rgba(233, 225, 255, 0) 68%);
}

.store-status-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 20rpx calc(env(safe-area-inset-bottom) + 180rpx);
}

.store-status-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
}

.store-status-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.store-status-nav__close {
  color: #2f3339;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}

.store-status-nav__title {
  color: #1d2025;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.store-status-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.store-status-card {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.store-status-card--hours {
  padding-bottom: 28rpx;
}

.store-status-card__label {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
}

.store-status-card__label-text {
  color: #363b42;
  font-size: 30rpx;
  font-weight: 600;
}

.store-status-card__required {
  color: #ff4d4f;
  font-size: 30rpx;
  font-weight: 700;
}

.store-status-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 28rpx 0;
}

.store-status-option + .store-status-option {
  border-top: 2rpx solid #f1f2f5;
}

.store-status-option--hover,
.store-status-footer__button--hover {
  opacity: 0.86;
}

.store-status-option__content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 10rpx;
}

.store-status-option__title {
  color: #242931;
  font-size: 34rpx;
  font-weight: 700;
}

.store-status-option__desc {
  color: #8d949f;
  font-size: 28rpx;
  line-height: 1.5;
}

.store-status-option__radio {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
  border-radius: 9999rpx;
  border: 2rpx solid #d8dce5;
  background: #fff;
  box-sizing: border-box;
}

.store-status-option__radio--active {
  border-color: #f4c400;
}

.store-status-option__radio-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 9999rpx;
  background: #f4c400;
}

.store-status-footer {
  position: fixed;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  left: 24rpx;
}

.store-status-footer__button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 9999rpx;
  background: linear-gradient(180deg, #ffd82f 0%, #f5c400 100%);
  color: #1f2023;
  font-size: 32rpx;
  font-weight: 700;
  box-shadow: 0 18rpx 34rpx rgba(245, 196, 0, 0.28);
}
</style>
