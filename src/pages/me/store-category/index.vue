<script lang="ts" setup>
import type { StoreCategoryPrimaryOption, StoreCategorySecondaryOption, StoreCategorySelection } from './shared'
import { updateMerchantFoodStoreCategory } from '@/api/merchant-food'
import { useMerchantFoodStore } from '@/store'
import {
  createDefaultStoreCategorySelection,
  formatStoreCategoryPath,
  normalizeStoreCategorySelection,
  storeCategoryOptions,
} from './shared'

defineOptions({
  name: 'StoreCategory',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '门店品类',
  },
})

const fallbackUrl = '/pages/me/store-info/index'

const searchKeyword = ref('')
const savedSelection = ref<StoreCategorySelection>(createDefaultStoreCategorySelection())
const draftSelection = ref<StoreCategorySelection>(createDefaultStoreCategorySelection())
const activePrimaryId = ref('')
const merchantFoodStore = useMerchantFoodStore()
const submitting = ref(false)

const normalizedSearchKeyword = computed(() => searchKeyword.value.trim().toLowerCase())

const filteredPrimaryOptions = computed(() => {
  const keyword = normalizedSearchKeyword.value

  if (!keyword) {
    return storeCategoryOptions
  }

  return storeCategoryOptions.filter((primaryOption) => {
    if (primaryOption.label.toLowerCase().includes(keyword)) {
      return true
    }

    return primaryOption.children.some((secondaryOption) => {
      const combinedLabel = `${primaryOption.label}${secondaryOption.label}`

      return secondaryOption.label.toLowerCase().includes(keyword) || combinedLabel.toLowerCase().includes(keyword)
    })
  })
})

const currentActivePrimaryId = computed(() => {
  const options = filteredPrimaryOptions.value

  if (!options.length) {
    return ''
  }

  if (options.some(option => option.id === activePrimaryId.value)) {
    return activePrimaryId.value
  }

  if (options.some(option => option.id === draftSelection.value.primaryId)) {
    return draftSelection.value.primaryId
  }

  return options[0].id
})

const activePrimaryOption = computed<StoreCategoryPrimaryOption | null>(() => {
  if (!filteredPrimaryOptions.value.length) {
    return null
  }

  return filteredPrimaryOptions.value.find(option => option.id === currentActivePrimaryId.value) ?? filteredPrimaryOptions.value[0]
})

const filteredSecondaryOptions = computed<StoreCategorySecondaryOption[]>(() => {
  const activeOption = activePrimaryOption.value
  const keyword = normalizedSearchKeyword.value

  if (!activeOption) {
    return []
  }

  if (!keyword) {
    return activeOption.children
  }

  return activeOption.children.filter((secondaryOption) => {
    const combinedLabel = `${activeOption.label}${secondaryOption.label}`

    return secondaryOption.label.toLowerCase().includes(keyword) || combinedLabel.toLowerCase().includes(keyword)
  })
})

const savedCategoryPath = computed(() => formatStoreCategoryPath(savedSelection.value))
const currentCategoryPath = computed(() => formatStoreCategoryPath(draftSelection.value))

async function syncStateFromServer() {
  const profile = await merchantFoodStore.loadProfile(true)
  const storedSelection = normalizeStoreCategorySelection({
    primaryId: 'FOOD',
    secondaryId: profile.store.mainIndustryCode,
  })

  savedSelection.value = storedSelection
  draftSelection.value = normalizeStoreCategorySelection(storedSelection)
  activePrimaryId.value = draftSelection.value.primaryId
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

function selectPrimaryCategory(primaryOption: StoreCategoryPrimaryOption) {
  activePrimaryId.value = primaryOption.id
}

function selectSecondaryCategory(secondaryOption: StoreCategorySecondaryOption) {
  const activeOption = activePrimaryOption.value

  if (!activeOption) {
    return
  }

  draftSelection.value = normalizeStoreCategorySelection({
    primaryId: activeOption.id,
    secondaryId: secondaryOption.id,
  })
  activePrimaryId.value = activeOption.id
}

function clearSearch() {
  searchKeyword.value = ''

  if (typeof uni.hideKeyboard === 'function') {
    uni.hideKeyboard()
  }
}

async function handleSubmit() {
  if (submitting.value)
    return
  submitting.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await updateMerchantFoodStoreCategory(storeId, draftSelection.value.secondaryId)
    savedSelection.value = normalizeStoreCategorySelection(draftSelection.value)
    await merchantFoodStore.loadProfile(true)

    uni.showToast({ title: '提交成功', icon: 'success' })

    setTimeout(handleClose, 320)
  }
  finally {
    submitting.value = false
  }
}

onMounted(() => {
  syncStateFromServer().catch(() => {})
})
</script>

<template>
  <view class="store-category-page">
    <view class="store-category-page__glow store-category-page__glow--left" />
    <view class="store-category-page__glow store-category-page__glow--right" />

    <view class="store-category-page__content">
      <view class="store-category-nav">
        <view class="store-category-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="navigateTo"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />

          <text class="store-category-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="store-category-nav__title">
          门店品类
        </text>

        <view class="store-category-nav__spacer" />
      </view>

      <view class="store-category-search">
        <view class="store-category-search__bar">
          <view class="store-category-search__icon">
            <view class="store-category-search__icon-circle" />
            <view class="store-category-search__icon-line" />
          </view>

          <!-- eslint-disable-next-line vue/html-self-closing -->
          <input
            v-model="searchKeyword"
            class="store-category-search__input"
            placeholder="请输入搜索的商户分类"
            placeholder-class="store-category-search__placeholder"
            confirm-type="search"
          >
        </view>

        <text class="store-category-search__cancel" @tap="clearSearch">
          取消
        </text>
      </view>

      <view class="store-category-summary">
        <view class="store-category-summary__row">
          <text class="store-category-summary__label">
            店铺类目：
          </text>
          <text class="store-category-summary__value">
            {{ savedCategoryPath }}
          </text>
        </view>

        <view class="store-category-summary__row store-category-summary__row--current">
          <text class="store-category-summary__label">
            当前所选类目：
          </text>
          <text class="store-category-summary__value store-category-summary__value--highlight">
            {{ currentCategoryPath }}
          </text>
        </view>
      </view>

      <view class="store-category-panel">
        <text class="store-category-panel__title">
          全部类型
        </text>

        <view v-if="filteredPrimaryOptions.length" class="store-category-panel__picker">
          <view class="store-category-primary-list">
            <view
              v-for="primaryOption in filteredPrimaryOptions"
              :key="primaryOption.id"
              class="store-category-primary-item"
              :class="{ 'store-category-primary-item--active': activePrimaryOption?.id === primaryOption.id }"
              hover-class="store-category-primary-item--hover"
              @tap="selectPrimaryCategory(primaryOption)"
            >
              <text
                class="store-category-primary-item__text"
                :class="{ 'store-category-primary-item__text--active': activePrimaryOption?.id === primaryOption.id }"
              >
                {{ primaryOption.label }}
              </text>

              <text
                v-if="activePrimaryOption?.id === primaryOption.id"
                class="store-category-primary-item__chevron"
              >
                ›
              </text>

              <view v-else class="store-category-primary-item__radio" />
            </view>
          </view>

          <view class="store-category-secondary-list">
            <view
              v-for="secondaryOption in filteredSecondaryOptions"
              :key="secondaryOption.id"
              class="store-category-secondary-item"
              hover-class="store-category-secondary-item--hover"
              @tap="selectSecondaryCategory(secondaryOption)"
            >
              <text
                class="store-category-secondary-item__text"
                :class="{ 'store-category-secondary-item__text--active': draftSelection.primaryId === activePrimaryOption?.id && draftSelection.secondaryId === secondaryOption.id }"
              >
                {{ secondaryOption.label }}
              </text>

              <view
                class="store-category-secondary-item__radio"
                :class="{ 'store-category-secondary-item__radio--active': draftSelection.primaryId === activePrimaryOption?.id && draftSelection.secondaryId === secondaryOption.id }"
              >
                <view
                  v-if="draftSelection.primaryId === activePrimaryOption?.id && draftSelection.secondaryId === secondaryOption.id"
                  class="store-category-secondary-item__radio-dot"
                />
              </view>
            </view>
          </view>
        </view>

        <view v-else class="store-category-empty">
          暂无匹配类目
        </view>
      </view>
    </view>

    <view class="store-category-footer">
      <view class="store-category-footer__button" hover-class="store-category-footer__button--hover" @tap="handleSubmit">
        提交
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-category-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f9f9fb 18%, #f5f6f9 100%);
}

.store-category-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.store-category-page__glow--left {
  top: -110rpx;
  left: -120rpx;
  width: 420rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 229, 122, 0.28) 0%, rgba(255, 229, 122, 0) 72%);
}

.store-category-page__glow--right {
  top: -40rpx;
  right: -120rpx;
  width: 340rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(233, 225, 255, 0.54) 0%, rgba(233, 225, 255, 0) 68%);
}

.store-category-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 0 calc(env(safe-area-inset-bottom) + 180rpx);
}

.store-category-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
  padding: 0 20rpx;
}

.store-category-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.store-category-nav__close {
  color: #2f3339;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}

.store-category-nav__title {
  color: #1d2025;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.store-category-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.store-category-search {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 18rpx 20rpx 0;
  padding: 16rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.store-category-search__bar {
  display: flex;
  align-items: center;
  flex: 1;
  height: 62rpx;
  padding: 0 22rpx;
  border-radius: 9999rpx;
  background: #f0f1f5;
}

.store-category-search__icon {
  position: relative;
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
}

.store-category-search__icon-circle {
  position: absolute;
  top: 2rpx;
  left: 2rpx;
  width: 18rpx;
  height: 18rpx;
  border: 3rpx solid #9ea5b0;
  border-radius: 9999rpx;
}

.store-category-search__icon-line {
  position: absolute;
  right: 2rpx;
  bottom: 3rpx;
  width: 10rpx;
  height: 3rpx;
  border-radius: 9999rpx;
  background: #9ea5b0;
  transform: rotate(45deg);
  transform-origin: center;
}

.store-category-search__input {
  flex: 1;
  min-width: 0;
  height: 62rpx;
  margin-left: 14rpx;
  color: #23262c;
  font-size: 28rpx;
}

.store-category-search__placeholder {
  color: #b8bdc7;
}

.store-category-search__cancel {
  flex-shrink: 0;
  color: #f0b114;
  font-size: 28rpx;
  font-weight: 600;
}

.store-category-summary {
  margin: 20rpx 20rpx 0;
  overflow: hidden;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.store-category-summary__row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-height: 82rpx;
  padding: 0 18rpx;
  border-bottom: 2rpx solid #f1f2f5;
}

.store-category-summary__row--current {
  border-bottom: none;
}

.store-category-summary__label {
  flex-shrink: 0;
  color: #464c56;
  font-size: 28rpx;
}

.store-category-summary__value {
  min-width: 0;
  flex: 1;
  color: #555b65;
  font-size: 28rpx;
  line-height: 1.5;
  word-break: break-all;
}

.store-category-summary__value--highlight {
  color: #f0b114;
}

.store-category-panel {
  margin: 18rpx 20rpx 0;
  overflow: hidden;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.store-category-panel__title {
  display: block;
  padding: 26rpx 18rpx 20rpx;
  color: #2f343c;
  font-size: 34rpx;
  font-weight: 700;
}

.store-category-panel__picker {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 2rpx solid #f1f2f5;
}

.store-category-primary-list {
  border-right: 2rpx solid #f1f2f5;
}

.store-category-primary-item,
.store-category-secondary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 96rpx;
  padding: 0 18rpx;
  border-bottom: 2rpx solid #f1f2f5;
  box-sizing: border-box;
}

.store-category-primary-item--active {
  background: linear-gradient(90deg, rgba(255, 205, 69, 0.12) 0%, rgba(255, 205, 69, 0.03) 100%);
}

.store-category-primary-item--hover,
.store-category-secondary-item--hover,
.store-category-footer__button--hover {
  opacity: 0.86;
}

.store-category-primary-item__text,
.store-category-secondary-item__text {
  min-width: 0;
  flex: 1;
  color: #4a5059;
  font-size: 30rpx;
  word-break: break-all;
}

.store-category-primary-item__text--active,
.store-category-secondary-item__text--active {
  color: #f0b114;
  font-weight: 600;
}

.store-category-primary-item__chevron {
  color: #9ea4ad;
  font-size: 36rpx;
  line-height: 1;
}

.store-category-primary-item__radio,
.store-category-secondary-item__radio {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
  border-radius: 9999rpx;
  border: 2rpx solid #b8bec8;
  background: #fff;
  box-sizing: border-box;
}

.store-category-secondary-item__radio--active {
  border-color: #f4c400;
}

.store-category-secondary-item__radio-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 9999rpx;
  background: #f4c400;
}

.store-category-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280rpx;
  color: #b0b6c0;
  font-size: 28rpx;
}

.store-category-footer {
  position: fixed;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  left: 24rpx;
}

.store-category-footer__button {
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
