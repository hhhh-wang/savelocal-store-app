<script lang="ts" setup>
import type { StorePhoneInputItem } from './shared'
import { useMerchantFoodStore, useMerchantStoreAuditStore } from '@/store'
import { buildInitialPhoneNumbers } from './shared'

defineOptions({
  name: 'StorePhone',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '门店电话',
  },
})

const fallbackUrl = '/pages/me/store-info/index'

const INITIAL_PHONE_ID = -1
let nextPhoneId = INITIAL_PHONE_ID - 1
const merchantFoodStore = useMerchantFoodStore()
const merchantStoreAudit = useMerchantStoreAuditStore()
const submitting = ref(false)

const phoneNumbers = ref<StorePhoneInputItem[]>([])

const canAddPhone = computed(() => {
  return phoneNumbers.value.length < 10
})
const phoneIssue = computed(() => merchantStoreAudit.issueMessages['phones']
  || merchantStoreAudit.issueMessages['phones.primary.phoneNumber'] || '')

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

function addPhone() {
  if (!canAddPhone.value) {
    uni.showToast({
      title: '上一条手机号未审核通过，暂不能继续添加',
      icon: 'none',
    })
    return
  }

  phoneNumbers.value.push({
    id: nextPhoneId--,
    draftKey: `phone-${Math.abs(nextPhoneId)}`,
    value: '',
    auditStatus: 'pending',
  })
}

function removePhone(index: number) {
  if (phoneNumbers.value.length <= 1) {
    return
  }

  phoneNumbers.value.splice(index, 1)
}

function markPhonePending(index: number) {
  const currentPhone = phoneNumbers.value[index]

  if (!currentPhone || currentPhone.auditStatus !== 'approved') {
    return
  }

  currentPhone.auditStatus = 'pending'
}

async function handleSubmit() {
  const validPhones = phoneNumbers.value.filter(phone => phone.value.trim())

  if (!validPhones.length) {
    uni.showToast({
      title: '请至少填写一个门店电话',
      icon: 'none',
    })
    return
  }

  if (submitting.value)
    return
  submitting.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await merchantStoreAudit.savePhones(storeId, {
      phones: validPhones.map((phone, index) => ({
        draftKey: phone.draftKey || (index === 0 ? 'primary' : `phone-${index + 1}`),
        phoneNumber: phone.value.trim(),
        sortNum: index,
      })),
    })
    phoneNumbers.value = buildInitialPhoneNumbers(merchantStoreAudit.snapshot.phones)
    uni.showToast({ title: '已保存到草稿', icon: 'success' })
  }
  finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await merchantStoreAudit.load(storeId, true)
    phoneNumbers.value = buildInitialPhoneNumbers(
      merchantStoreAudit.snapshot.phones,
      merchantStoreAudit.snapshot.store.contactMobile,
    )
  }
  catch {}
})
</script>

<template>
  <view class="store-phone-page">
    <view class="store-phone-page__glow store-phone-page__glow--left" />
    <view class="store-phone-page__glow store-phone-page__glow--right" />

    <view class="store-phone-page__content">
      <view class="store-phone-nav">
        <view class="store-phone-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="navigateTo"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />

          <text class="store-phone-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="store-phone-nav__title">
          门店电话
        </text>

        <view class="store-phone-nav__spacer" />
      </view>

      <view class="store-phone-card">
        <view v-if="phoneIssue" class="store-phone-card__issue">
          {{ phoneIssue }}
        </view>
        <view class="store-phone-card__label">
          <text class="store-phone-card__label-text">
            门店电话
          </text>
          <text class="store-phone-card__required">
            *
          </text>
        </view>

        <view class="store-phone-list">
          <view
            v-for="(phone, index) in phoneNumbers"
            :key="phone.id"
            class="store-phone-item"
          >
            <view class="store-phone-item__icon store-phone-item__icon--minus" @tap="removePhone(index)">
              <text class="store-phone-item__icon-line" />
            </view>

            <input
              v-model="phone.value"
              class="store-phone-item__input"
              type="number"
              :maxlength="11"
              placeholder="请输入门店电话"
              placeholder-class="store-phone-item__placeholder"
              @input="markPhonePending(index)"
            >
          </view>

          <view
            class="store-phone-add"
            :class="{ 'store-phone-add--disabled': !canAddPhone }"
            hover-class="store-phone-add--hover"
            @tap="addPhone"
          >
            <view class="store-phone-item__icon store-phone-item__icon--plus">
              <text class="store-phone-item__icon-line store-phone-item__icon-line--vertical" />
              <text class="store-phone-item__icon-line" />
            </view>
            <text class="store-phone-add__text">
              添加电话
            </text>
          </view>
        </view>
      </view>
    </view>

    <view class="store-phone-footer">
      <view class="store-phone-footer__button" hover-class="store-phone-footer__button--hover" @tap="handleSubmit">
        提交
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-phone-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f9f9fb 18%, #f5f6f9 100%);
}

.store-phone-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.store-phone-page__glow--left {
  top: -110rpx;
  left: -120rpx;
  width: 420rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 229, 122, 0.28) 0%, rgba(255, 229, 122, 0) 72%);
}

.store-phone-page__glow--right {
  top: -40rpx;
  right: -120rpx;
  width: 340rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(233, 225, 255, 0.54) 0%, rgba(233, 225, 255, 0) 68%);
}

.store-phone-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 20rpx calc(env(safe-area-inset-bottom) + 180rpx);
}

.store-phone-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
}

.store-phone-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.store-phone-nav__close {
  color: #2f3339;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}

.store-phone-nav__title {
  color: #1d2025;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.store-phone-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.store-phone-card {
  margin-top: 24rpx;
  padding: 22rpx 22rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.store-phone-card__issue {
  margin-bottom: 18rpx;
  color: #d93025;
  font-size: 25rpx;
  line-height: 36rpx;
}

.store-phone-card__label {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
}

.store-phone-card__label-text {
  color: #363b42;
  font-size: 30rpx;
  font-weight: 600;
}

.store-phone-card__required {
  color: #ff4d4f;
  font-size: 30rpx;
  font-weight: 700;
}

.store-phone-list {
  margin-top: 16rpx;
}

.store-phone-item,
.store-phone-add {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-height: 86rpx;
}

.store-phone-item {
  padding: 4rpx 0;
}

.store-phone-item + .store-phone-item,
.store-phone-add {
  margin-top: 10rpx;
}

.store-phone-item__icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
  border-radius: 9999rpx;
  border: 2rpx solid #d5d5d5;
  box-sizing: border-box;
}

.store-phone-item__icon--minus {
  border-color: #ffb36f;
  background: #fff7ee;
}

.store-phone-item__icon--plus {
  border-color: #d8d8d8;
  background: #fafafa;
}

.store-phone-item__icon-line {
  position: absolute;
  width: 14rpx;
  height: 2rpx;
  border-radius: 9999rpx;
  background: #ff9d34;
}

.store-phone-item__icon--plus .store-phone-item__icon-line {
  background: #c7c7c7;
}

.store-phone-item__icon-line--vertical {
  transform: rotate(90deg);
}

.store-phone-item__input {
  flex: 1;
  min-width: 0;
  height: 86rpx;
  color: #23262c;
  font-size: 30rpx;
}

.store-phone-item__placeholder {
  color: #b8bdc7;
}

.store-phone-add {
  color: #b8bdc7;
}

.store-phone-add--disabled {
  opacity: 0.68;
}

.store-phone-add--hover {
  opacity: 0.84;
}

.store-phone-add__text {
  font-size: 28rpx;
}

.store-phone-footer {
  position: fixed;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  left: 24rpx;
}

.store-phone-footer__button {
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

.store-phone-footer__button--hover {
  opacity: 0.88;
}
</style>
