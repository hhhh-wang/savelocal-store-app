<script lang="ts" setup>
import type { MerchantFoodAddressSuggestion } from '@/api/types/merchant-food'
import { getMerchantFoodAddressSuggestions, getMerchantFoodKeywordAddressSuggestions } from '@/api/merchant-food'
import locationIcon from '@/static/icons/location-icon.png'
import { useMerchantFoodStore, useMerchantStoreAuditStore } from '@/store'
import { debounce } from '@/utils/debounce'
import { normalizeMapLocation } from './store-address'

defineOptions({
  name: 'StoreAddress',
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '门店地址',
  },
})

const fallbackUrl = '/pages/me/store-info/index'
const merchantFoodStore = useMerchantFoodStore()
const merchantStoreAudit = useMerchantStoreAuditStore()
const submitting = ref(false)
const initializing = ref(true)
const mapSelecting = ref(false)
const mapSelectionFailed = ref(false)
const addressSuggestions = ref<MerchantFoodAddressSuggestion[]>([])
const loadingAddressSuggestions = ref(false)
const addressSuggestionVisible = ref(false)

const form = reactive({
  address: '',
})

const mapLocation = reactive({
  latitude: 0,
  longitude: 0,
})

const mapScale = ref(14)
const ADDRESS_SUGGESTION_LIMIT = 10
const ADDRESS_SUGGESTION_DEBOUNCE_MS = 300
let addressSuggestionRequestSeq = 0
let mapLocationRevision = 0
let addressRevision = 0
let disposed = false

interface MapChangePayload {
  latitude: number
  longitude: number
  source?: 'init' | 'poi' | 'tap' | 'regionchange'
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

async function loadUserLocation() {
  const locationRevision = mapLocationRevision
  try {
    const res = await uni.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 3000,
    })
    const location = normalizeMapLocation(res.latitude, res.longitude)
    if (locationRevision === mapLocationRevision && location) {
      updateMapLocation(location)
    }
  }
  catch (error) {
    console.log('门店地址定位失败，请搜索地址或拖动地图选点:', error)
  }
}

function updateMapLocation(location: { latitude: number, longitude: number }) {
  mapLocationRevision += 1
  mapLocation.latitude = location.latitude
  mapLocation.longitude = location.longitude
  mapSelectionFailed.value = false
}

function clearAddressSuggestions() {
  addressSuggestionRequestSeq += 1
  addressSuggestions.value = []
  addressSuggestionVisible.value = false
  loadingAddressSuggestions.value = false
}

function formatAddressSuggestionMeta(item: MerchantFoodAddressSuggestion) {
  return [item.province, item.city, item.district, item.street]
    .filter(Boolean)
    .join(' · ')
}

async function requestAddressLocation() {
  const currentLocation = normalizeMapLocation(mapLocation.latitude, mapLocation.longitude)
  if (currentLocation) {
    return currentLocation
  }

  const location = await uni.getLocation({
    type: 'gcj02',
    isHighAccuracy: true,
    highAccuracyExpireTime: 3000,
  })
  const normalizedLocation = normalizeMapLocation(location.latitude, location.longitude)
  if (!normalizedLocation) {
    throw new Error('定位结果无效')
  }

  return normalizedLocation
}

async function loadAddressSuggestions() {
  const requestSeq = ++addressSuggestionRequestSeq
  loadingAddressSuggestions.value = true
  addressSuggestionVisible.value = false

  try {
    const location = await requestAddressLocation()
    if (requestSeq !== addressSuggestionRequestSeq) {
      return
    }

    if (!normalizeMapLocation(mapLocation.latitude, mapLocation.longitude)) {
      updateMapLocation(location)
    }
    const suggestions = await getMerchantFoodAddressSuggestions({
      ...location,
      limit: ADDRESS_SUGGESTION_LIMIT,
    })
    if (requestSeq !== addressSuggestionRequestSeq) {
      return
    }

    addressSuggestions.value = (suggestions || []).filter(item =>
      !!(item.detailAddress || item.title || item.address),
    )
    if (!addressSuggestions.value.length) {
      uni.showToast({ title: '当前位置暂无可选地址', icon: 'none' })
      return
    }

    addressSuggestionVisible.value = true
  }
  catch (error) {
    if (requestSeq !== addressSuggestionRequestSeq) {
      return
    }

    console.error('获取门店地址候选失败:', error)
    uni.showToast({ title: '获取地址失败，请检查定位权限', icon: 'none' })
  }
  finally {
    if (requestSeq === addressSuggestionRequestSeq) {
      loadingAddressSuggestions.value = false
    }
  }
}

async function requestKeywordSearchLocation() {
  const currentLocation = normalizeMapLocation(mapLocation.latitude, mapLocation.longitude)
  if (currentLocation) {
    return currentLocation
  }

  try {
    const location = await uni.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 3000,
    })
    return normalizeMapLocation(location.latitude, location.longitude)
  }
  catch {
    // 关键词搜索不依赖定位；定位不可用时由腾讯地图在全国范围内匹配。
    return undefined
  }
}

async function loadKeywordAddressSuggestions(keyword: string) {
  const normalizedKeyword = keyword.trim()
  if (normalizedKeyword.length < 2 || normalizedKeyword !== form.address.trim()) {
    return
  }

  const requestSeq = ++addressSuggestionRequestSeq
  loadingAddressSuggestions.value = true
  addressSuggestionVisible.value = false

  try {
    const location = await requestKeywordSearchLocation()
    if (requestSeq !== addressSuggestionRequestSeq || normalizedKeyword !== form.address.trim()) {
      return
    }

    const suggestions = await getMerchantFoodKeywordAddressSuggestions({
      keyword: normalizedKeyword,
      ...location,
      limit: ADDRESS_SUGGESTION_LIMIT,
    })
    if (requestSeq !== addressSuggestionRequestSeq || normalizedKeyword !== form.address.trim()) {
      return
    }

    addressSuggestions.value = (suggestions || []).filter(item =>
      !!(item.detailAddress || item.title || item.address),
    )
    addressSuggestionVisible.value = addressSuggestions.value.length > 0
  }
  catch (error) {
    if (requestSeq !== addressSuggestionRequestSeq) {
      return
    }

    console.error('搜索门店地址候选失败:', error)
  }
  finally {
    if (requestSeq === addressSuggestionRequestSeq) {
      loadingAddressSuggestions.value = false
    }
  }
}

const debouncedLoadKeywordAddressSuggestions = debounce((keyword: string) => {
  void loadKeywordAddressSuggestions(keyword)
}, ADDRESS_SUGGESTION_DEBOUNCE_MS)

function handleAddressIconTap() {
  if (submitting.value || loadingAddressSuggestions.value) {
    return
  }

  debouncedLoadKeywordAddressSuggestions.cancel()
  if (addressSuggestions.value.length) {
    addressSuggestionVisible.value = true
    return
  }

  const keyword = form.address.trim()
  if (keyword.length >= 2) {
    void loadKeywordAddressSuggestions(keyword)
  }
  else {
    void loadAddressSuggestions()
  }
}

function selectAddressSuggestion(item: MerchantFoodAddressSuggestion) {
  if (submitting.value) {
    return
  }

  const address = (item.detailAddress || item.address || item.title || '').trim()
  if (!address) {
    return
  }

  debouncedLoadKeywordAddressSuggestions.cancel()
  addressRevision += 1
  form.address = address
  const location = normalizeMapLocation(item.latitude, item.longitude)
  if (location) {
    updateMapLocation(location)
    mapScale.value = 16
  }
  clearAddressSuggestions()
}

function handleAddressInput(event: { detail?: { value?: string } }) {
  addressRevision += 1
  debouncedLoadKeywordAddressSuggestions.cancel()
  clearAddressSuggestions()

  form.address = event.detail?.value ?? form.address
  const keyword = form.address.trim()
  if (keyword.length >= 2) {
    debouncedLoadKeywordAddressSuggestions(keyword)
  }
}

async function handleSubmit() {
  if (submitting.value) {
    return
  }
  const addressText = form.address.trim()
  if (!addressText) {
    uni.showToast({
      title: '请填写门店地址',
      icon: 'none',
    })
    return
  }

  if (initializing.value || mapSelecting.value) {
    uni.showToast({ title: '请等待地图定位完成', icon: 'none' })
    return
  }
  const location = normalizeMapLocation(mapLocation.latitude, mapLocation.longitude)
  if (!location || mapSelectionFailed.value) {
    uni.showToast({ title: '请在地图上确认门店位置', icon: 'none' })
    return
  }
  submitting.value = true
  debouncedLoadKeywordAddressSuggestions.cancel()
  clearAddressSuggestions()
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await merchantStoreAudit.saveAddress(storeId, {
      addressText,
      ...location,
    })
    uni.showToast({ title: '已保存到草稿', icon: 'success' })
  }
  catch (error) {
    console.error('保存门店地址失败:', error)
  }
  finally {
    submitting.value = false
  }
}

function handleMapSelecting(selecting: boolean) {
  mapSelecting.value = selecting
  if (selecting) {
    mapLocationRevision += 1
    debouncedLoadKeywordAddressSuggestions.cancel()
    clearAddressSuggestions()
  }
}

function handleMapChange(payload: MapChangePayload) {
  if (submitting.value) {
    return
  }
  const location = normalizeMapLocation(payload.latitude, payload.longitude)
  if (location) {
    updateMapLocation(location)
    debouncedLoadKeywordAddressSuggestions.cancel()
    clearAddressSuggestions()
  }
  else {
    handleMapSelectionError()
  }
}

function handleMapSelectionError() {
  mapSelectionFailed.value = true
  uni.showToast({ title: '获取地图位置失败，请重新拖动地图', icon: 'none' })
}

onMounted(async () => {
  const initialAddressRevision = addressRevision
  const initialLocationRevision = mapLocationRevision
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    if (disposed) {
      return
    }
    await merchantStoreAudit.load(storeId, true)
    if (disposed) {
      return
    }
    const store = merchantStoreAudit.snapshot.store
    if (addressRevision === initialAddressRevision) {
      form.address = store.addressText || store.addressDetail || ''
    }
    if (mapLocationRevision !== initialLocationRevision) {
      return
    }
    const location = normalizeMapLocation(store.latitude, store.longitude)
    if (location) {
      updateMapLocation(location)
    }
    else {
      await loadUserLocation()
    }
  }
  catch (error) {
    console.error('门店地址资料加载失败:', error)
  }
  finally {
    if (!disposed) {
      initializing.value = false
    }
  }
})

onUnmounted(() => {
  disposed = true
  mapLocationRevision += 1
  debouncedLoadKeywordAddressSuggestions.cancel()
  clearAddressSuggestions()
})
</script>

<template>
  <view class="store-address-page">
    <view class="store-address-page__glow store-address-page__glow--left" />
    <view class="store-address-page__glow store-address-page__glow--right" />

    <view class="store-address-page__content">
      <view class="store-address-nav">
        <view class="store-address-nav__left">
          <back-button
            :fallback-url="fallbackUrl"
            fallback-mode="navigateTo"
            color="#23262c"
            background="transparent"
            size="72rpx"
          />

          <text class="store-address-nav__close" @tap="handleClose">
            关闭
          </text>
        </view>

        <text class="store-address-nav__title">
          门店地址
        </text>

        <view class="store-address-nav__spacer" />
      </view>

      <view class="store-address-card">
        <view class="store-address-field">
          <view class="store-address-field__label">
            <text class="store-address-field__label-text">
              门店地址
            </text>
            <text class="store-address-field__required">
              *
            </text>
            <text class="store-address-field__hint">
              ⓘ 说明
            </text>
          </view>

          <view class="store-address-field__input-wrap">
            <input
              v-model="form.address"
              class="store-address-field__input"
              placeholder="搜索或直接填写详细地址"
              placeholder-class="store-address-field__placeholder"
              :maxlength="255"
              :disabled="submitting"
              confirm-type="search"
              @input="handleAddressInput"
              @confirm="handleAddressIconTap"
            >
            <view
              class="store-address-field__location"
              :class="{ 'store-address-field__location--loading': loadingAddressSuggestions }"
              @tap.stop="handleAddressIconTap"
            >
              <image
                class="store-address-field__location-icon"
                :src="locationIcon"
                mode="aspectFit"
              />
            </view>
          </view>

          <view class="store-address-field__description">
            可搜索地址，也可直接填写门牌号、楼层等详细信息
          </view>

          <view v-if="loadingAddressSuggestions" class="store-address-field__suggestion-state">
            正在搜索地址...
          </view>

          <scroll-view
            v-else-if="addressSuggestionVisible && addressSuggestions.length"
            class="store-address-field__suggestion-list"
            scroll-y
            enhanced
            show-scrollbar
          >
            <view
              v-for="(item, index) in addressSuggestions"
              :key="`${item.title || item.address || 'suggestion'}-${index}`"
              class="store-address-field__suggestion-item"
              @tap="selectAddressSuggestion(item)"
            >
              <view class="store-address-field__suggestion-title">
                {{ item.title || item.detailAddress || item.address }}
              </view>
              <view class="store-address-field__suggestion-address">
                {{ item.address || item.detailAddress }}
              </view>
              <view v-if="formatAddressSuggestionMeta(item)" class="store-address-field__suggestion-meta">
                {{ formatAddressSuggestionMeta(item) }}
              </view>
            </view>
          </scroll-view>
        </view>

        <view class="store-address-map-section">
          <view class="store-address-map-section__label">
            <text class="store-address-map-section__label-text">
              商户位置
            </text>
            <text class="store-address-map-section__required">
              *
            </text>
          </view>

          <tencent-map
            v-model:scale="mapScale"
            class="store-address-map"
            height="500rpx"
            border-radius="20rpx"
            background="#edf5fb"
            selection-mode="center"
            :selectable="!submitting && !initializing"
            :latitude="mapLocation.latitude"
            :longitude="mapLocation.longitude"
            :enable-poi="!submitting && !initializing"
            :enable-scroll="!submitting && !initializing"
            :enable-zoom="!submitting && !initializing"
            @change="handleMapChange"
            @selecting="handleMapSelecting"
            @selectionerror="handleMapSelectionError"
          />
          <view class="store-address-map-section__description">
            拖动地图，将图钉尖端对准门店实际位置，定位以图钉为准
          </view>
        </view>
      </view>
    </view>

    <view class="store-address-footer">
      <view
        class="store-address-footer__button"
        :class="{ 'store-address-footer__button--disabled': submitting || initializing || mapSelecting }"
        hover-class="store-address-footer__button--hover"
        @tap="handleSubmit"
      >
        {{ submitting ? '保存中...' : initializing || mapSelecting ? '定位中...' : '提交' }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-address-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f9f9fb 18%, #f5f6f9 100%);
}

.store-address-page__glow {
  position: absolute;
  border-radius: 9999rpx;
  pointer-events: none;
}

.store-address-page__glow--left {
  top: -110rpx;
  left: -120rpx;
  width: 420rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(255, 229, 122, 0.28) 0%, rgba(255, 229, 122, 0) 72%);
}

.store-address-page__glow--right {
  top: -40rpx;
  right: -120rpx;
  width: 340rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(233, 225, 255, 0.54) 0%, rgba(233, 225, 255, 0) 68%);
}

.store-address-page__content {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 20rpx) 20rpx calc(env(safe-area-inset-bottom) + 180rpx);
}

.store-address-nav {
  display: grid;
  grid-template-columns: 176rpx 1fr 176rpx;
  align-items: center;
  min-height: 72rpx;
}

.store-address-nav__left {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.store-address-nav__close {
  color: #2f3339;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}

.store-address-nav__title {
  color: #1d2025;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.store-address-nav__spacer {
  width: 176rpx;
  height: 72rpx;
}

.store-address-card {
  margin-top: 24rpx;
  padding: 22rpx 22rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16rpx 42rpx rgba(56, 61, 86, 0.08);
}

.store-address-field,
.store-address-map-section {
  padding-bottom: 10rpx;
}

.store-address-field {
  border-bottom: 2rpx solid #f1f2f5;
}

.store-address-field__label,
.store-address-map-section__label {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.store-address-field__label-text,
.store-address-map-section__label-text {
  color: #363b42;
  font-size: 30rpx;
  font-weight: 600;
}

.store-address-field__required,
.store-address-map-section__required {
  color: #ff4d4f;
  font-size: 30rpx;
  font-weight: 700;
}

.store-address-field__hint {
  color: #a5aab4;
  font-size: 24rpx;
  font-weight: 500;
}

.store-address-field__input-wrap {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  margin-top: 18rpx;
}

.store-address-field__location {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 56rpx;
  flex-shrink: 0;
}

.store-address-field__location--loading {
  opacity: 0.55;
}

.store-address-field__location-icon {
  display: block;
  width: 38rpx;
  height: 38rpx;
}

.store-address-field__input {
  min-width: 0;
  flex: 1;
  color: #23262c;
  font-size: 30rpx;
}

.store-address-field__placeholder {
  color: #b8bdc7;
}

.store-address-field__description,
.store-address-map-section__description {
  margin-top: 12rpx;
  color: #8a8f98;
  font-size: 24rpx;
  line-height: 1.5;
}

.store-address-field__suggestion-state {
  margin: 12rpx 0 0 58rpx;
  color: #8a8f98;
  font-size: 24rpx;
  line-height: 1.5;
}

.store-address-field__suggestion-list {
  max-height: 420rpx;
  margin: 12rpx 0 0 58rpx;
  overflow: hidden;
  border: 1rpx solid #eceef2;
  border-radius: 16rpx;
  background: #fafbfc;
}

.store-address-field__suggestion-item {
  padding: 18rpx 20rpx;
  border-top: 1rpx solid #eceef2;
}

.store-address-field__suggestion-item:first-child {
  border-top: none;
}

.store-address-field__suggestion-title {
  color: #20242a;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.4;
}

.store-address-field__suggestion-address {
  margin-top: 6rpx;
  color: #5f6670;
  font-size: 24rpx;
  line-height: 1.45;
}

.store-address-field__suggestion-meta {
  margin-top: 6rpx;
  color: #8b929c;
  font-size: 22rpx;
  line-height: 1.4;
}

.store-address-map-section {
  padding-top: 20rpx;
}

.store-address-map {
  display: block;
  margin-top: 18rpx;
}

.store-address-footer {
  position: fixed;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  left: 24rpx;
}

.store-address-footer__button {
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

.store-address-footer__button--hover,
.store-address-footer__button--disabled {
  opacity: 0.88;
}
</style>
