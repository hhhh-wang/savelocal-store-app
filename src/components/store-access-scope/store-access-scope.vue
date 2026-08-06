<script setup lang="ts">
import type { MerchantFoodStore } from '@/api/types/merchant-food'

interface Props {
  visible?: boolean
  stores?: MerchantFoodStore[]
  modelValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  stores: () => [],
  modelValue: undefined,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:modelValue': [value: number | undefined]
  'confirm': [storeId: number]
  'create-store': []
}>()

const selectedStoreId = ref<number>()

watch([
  () => props.visible,
  () => props.modelValue,
  () => props.stores,
], syncSelectedStore, { immediate: true, deep: true })

function syncSelectedStore() {
  const hasModelValue = props.modelValue !== undefined
    && props.stores.some(store => store.storeId === props.modelValue)
  const nextStoreId = hasModelValue ? props.modelValue : props.stores[0]?.storeId

  selectedStoreId.value = nextStoreId
  if (nextStoreId !== props.modelValue) {
    emit('update:modelValue', nextStoreId)
  }
}

function selectStore(storeId: number) {
  selectedStoreId.value = storeId
  emit('update:modelValue', storeId)
}

function handleClose() {
  emit('update:visible', false)
}

function handleConfirm() {
  if (selectedStoreId.value === undefined) {
    uni.showToast({
      title: '请选择分店',
      icon: 'none',
    })
    return
  }

  emit('confirm', selectedStoreId.value)
  emit('update:visible', false)
}

function handleCreateStore() {
  emit('create-store')
  emit('update:visible', false)
}
</script>

<template>
  <view v-if="visible" class="store-access-scope">
    <view class="store-access-scope__mask" @tap.stop="" />

    <view class="store-access-scope__sheet" @tap.stop="">
      <view class="store-access-scope__header">
        <text class="store-access-scope__title">
          可访问范围
        </text>

        <view
          class="store-access-scope__close"
          hover-class="store-access-scope__close--hover"
          aria-label="关闭"
          @tap="handleClose"
        >
          <view class="store-access-scope__close-line store-access-scope__close-line--first" />
          <view class="store-access-scope__close-line store-access-scope__close-line--second" />
        </view>
      </view>

      <scroll-view class="store-access-scope__list" scroll-y>
        <view
          v-for="store in stores"
          :key="store.storeId"
          class="store-access-scope__item"
          :class="{ 'store-access-scope__item--selected': selectedStoreId === store.storeId }"
          hover-class="store-access-scope__item--hover"
          @tap="selectStore(store.storeId)"
        >
          <view
            class="store-access-scope__radio"
            :class="{ 'store-access-scope__radio--selected': selectedStoreId === store.storeId }"
          >
            <view v-if="selectedStoreId === store.storeId" class="store-access-scope__radio-dot" />
          </view>

          <text class="store-access-scope__name">
            {{ store.storeName }}
          </text>
        </view>

        <view v-if="!stores.length" class="store-access-scope__empty">
          暂无可访问分店
        </view>
      </scroll-view>

      <view class="store-access-scope__actions">
        <view
          class="store-access-scope__button"
          hover-class="store-access-scope__button--hover"
          @tap="handleConfirm"
        >
          确认登录
        </view>

        <view
          class="store-access-scope__button"
          hover-class="store-access-scope__button--hover"
          @tap="handleCreateStore"
        >
          开新店
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-access-scope {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10000;
  display: flex;
  align-items: flex-end;
}

.store-access-scope__mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(21, 24, 29, 0.48);
}

.store-access-scope__sheet {
  position: relative;
  width: 100%;
  max-height: 88vh;
  padding: 56rpx 64rpx calc(env(safe-area-inset-bottom) + 48rpx);
  border-top-left-radius: 44rpx;
  border-top-right-radius: 44rpx;
  background: #ffffff;
  box-sizing: border-box;
  animation: store-access-scope-slide-up 0.24s ease-out;
}

.store-access-scope__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28rpx;
}

.store-access-scope__title {
  color: #141723;
  font-size: 48rpx;
  font-weight: 800;
  line-height: 1.2;
}

.store-access-scope__close {
  position: relative;
  width: 64rpx;
  height: 64rpx;
  flex-shrink: 0;
}

.store-access-scope__close--hover {
  opacity: 0.62;
}

.store-access-scope__close-line {
  position: absolute;
  top: 31rpx;
  left: 8rpx;
  width: 48rpx;
  height: 5rpx;
  border-radius: 999rpx;
  background: #8e9198;
}

.store-access-scope__close-line--first {
  transform: rotate(45deg);
}

.store-access-scope__close-line--second {
  transform: rotate(-45deg);
}

.store-access-scope__list {
  width: 100%;
  max-height: 520rpx;
  margin-top: 44rpx;
  box-sizing: border-box;
}

.store-access-scope__item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  min-height: 112rpx;
  padding: 20rpx 28rpx;
  border-radius: 26rpx;
  box-sizing: border-box;
}

.store-access-scope__item + .store-access-scope__item {
  margin-top: 12rpx;
}

.store-access-scope__item--selected {
  background: #f5f7f8;
}

.store-access-scope__item--hover {
  opacity: 0.78;
}

.store-access-scope__radio {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
  border: 3rpx solid #a8adb4;
  border-radius: 50%;
  background: #ffffff;
  box-sizing: border-box;
}

.store-access-scope__radio--selected {
  border-color: #ffc83b;
}

.store-access-scope__radio-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #ffc83b;
}

.store-access-scope__name {
  min-width: 0;
  overflow: hidden;
  color: #56585d;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-access-scope__empty {
  padding: 58rpx 0;
  color: #9b9ea4;
  font-size: 30rpx;
  line-height: 1.5;
  text-align: center;
}

.store-access-scope__actions {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 38rpx;
}

.store-access-scope__button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96rpx;
  border-radius: 999rpx;
  background: #ffc83b;
  color: #ffffff;
  font-size: 36rpx;
  font-weight: 700;
  line-height: 1.2;
  box-shadow: 0 14rpx 28rpx rgba(255, 200, 59, 0.2);
}

.store-access-scope__button--hover {
  opacity: 0.84;
  transform: translateY(2rpx);
}

@keyframes store-access-scope-slide-up {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}
</style>
