<script lang="ts" setup>
import type { RegionCodes } from './shared'
import type { MerchantFoodAddressSuggestion } from '@/api/types/merchant-food'
import { getMerchantFoodAddressSuggestions, submitMerchantFoodProfileChange } from '@/api/merchant-food'
import locationIcon from '@/static/icons/location-icon.png'
import { useMerchantFoodStore } from '@/store'
import { normalizeCoordinate, resolveRegionCodesFromAdcode } from './shared'

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
const submitting = ref(false)
const regionCodes = reactive<RegionCodes>({ provinceCode: '', cityCode: '', districtCode: '' })
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
let addressSuggestionRequestSeq = 0

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

function loadUserLocation() {
  uni.getLocation({
    type: 'gcj02',
    isHighAccuracy: true,
    success(res) {
      mapLocation.latitude = res.latitude
      mapLocation.longitude = res.longitude
      console.log('门店地址定位成功:', {
        latitude: res.latitude,
        longitude: res.longitude,
      })
    },
    fail(error) {
      console.log('门店地址定位失败，使用默认经纬度:', error)
    },
  })
}

function resetRegionCodes() {
  regionCodes.provinceCode = ''
  regionCodes.cityCode = ''
  regionCodes.districtCode = ''
}

function clearAddressSuggestions() {
  addressSuggestionRequestSeq += 1
  addressSuggestions.value = []
  addressSuggestionVisible.value = false
}

function formatAddressSuggestionMeta(item: MerchantFoodAddressSuggestion) {
  return [item.province, item.city, item.district, item.street]
    .filter(Boolean)
    .join(' · ')
}

async function requestAddressLocation() {
  const currentLatitude = normalizeCoordinate(mapLocation.latitude)
  const currentLongitude = normalizeCoordinate(mapLocation.longitude)

  if (currentLatitude && currentLongitude) {
    return {
      latitude: currentLatitude,
      longitude: currentLongitude,
    }
  }

  const location = await uni.getLocation({
    type: 'gcj02',
    isHighAccuracy: true,
    highAccuracyExpireTime: 3000,
  })
  const latitude = normalizeCoordinate(location.latitude)
  const longitude = normalizeCoordinate(location.longitude)
  if (latitude === undefined || longitude === undefined) {
    throw new Error('定位结果无效')
  }

  return { latitude, longitude }
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

    mapLocation.latitude = location.latitude
    mapLocation.longitude = location.longitude
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

function handleAddressIconTap() {
  if (loadingAddressSuggestions.value) {
    return
  }

  if (addressSuggestions.value.length) {
    addressSuggestionVisible.value = true
    return
  }

  void loadAddressSuggestions()
}

function selectAddressSuggestion(item: MerchantFoodAddressSuggestion) {
  const address = (item.detailAddress || item.address || item.title || '').trim()
  const latitude = normalizeCoordinate(item.latitude)
  const longitude = normalizeCoordinate(item.longitude)
  const codes = resolveRegionCodesFromAdcode(item.adcode)

  if (!address || latitude === undefined || longitude === undefined || !codes.districtCode) {
    uni.showToast({ title: '该地址缺少完整定位信息，请重新选择', icon: 'none' })
    return
  }

  form.address = address
  regionCodes.provinceCode = codes.provinceCode
  regionCodes.cityCode = codes.cityCode
  regionCodes.districtCode = codes.districtCode
  mapLocation.latitude = latitude
  mapLocation.longitude = longitude
  mapScale.value = 16
  clearAddressSuggestions()
}

function handleAddressInput() {
  resetRegionCodes()
  clearAddressSuggestions()
}

async function handleSubmit() {
  if (!form.address.trim()) {
    uni.showToast({
      title: '请填写门店地址',
      icon: 'none',
    })
    return
  }

  const latitude = normalizeCoordinate(mapLocation.latitude)
  const longitude = normalizeCoordinate(mapLocation.longitude)
  if (!regionCodes.provinceCode || !regionCodes.cityCode || !regionCodes.districtCode) {
    uni.showToast({ title: '门店地区编码不完整，请联系管理员', icon: 'none' })
    return
  }
  if (!latitude || !longitude) {
    uni.showToast({ title: '请先选择完整的门店定位', icon: 'none' })
    return
  }
  if (submitting.value)
    return
  submitting.value = true
  try {
    const storeId = await merchantFoodStore.ensureCurrentStoreId()
    await submitMerchantFoodProfileChange(storeId, {
      changeType: 'ADDRESS',
      ...regionCodes,
      addressDetail: form.address.trim(),
      longitude,
      latitude,
    })
    await merchantFoodStore.loadProfile(true)
    uni.showToast({ title: '已提交审核', icon: 'success' })
  }
  finally {
    submitting.value = false
  }
}

function handleMapChange(payload: MapChangePayload) {
  mapLocation.latitude = payload.latitude
  mapLocation.longitude = payload.longitude

  if (payload.source === 'regionchange') {
    console.log('门店地址地图滑动后经纬度:', {
      latitude: payload.latitude,
      longitude: payload.longitude,
    })
  }
}

onMounted(async () => {
  try {
    const { store } = await merchantFoodStore.loadProfile(true)
    form.address = store.addressDetail || ''
    regionCodes.provinceCode = store.provinceCode || ''
    regionCodes.cityCode = store.cityCode || ''
    regionCodes.districtCode = store.districtCode || ''
    mapLocation.latitude = Number(store.latitude || 0)
    mapLocation.longitude = Number(store.longitude || 0)
    if (!mapLocation.latitude || !mapLocation.longitude)
      loadUserLocation()
  }
  catch (error) {
    console.error('门店地址资料加载失败:', error)
  }
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

            <input
              v-model="form.address"
              class="store-address-field__input"
              placeholder="请输入门店地址"
              placeholder-class="store-address-field__placeholder"
              @input="handleAddressInput"
            >
          </view>

          <view v-if="loadingAddressSuggestions" class="store-address-field__suggestion-state">
            正在获取附近地址...
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
            selectable
            selection-mode="center"
            :latitude="mapLocation.latitude"
            :longitude="mapLocation.longitude"
            :enable-poi="true"
            :enable-scroll="true"
            :enable-zoom="true"
            @change="handleMapChange"
          />
        </view>
      </view>
    </view>

    <view class="store-address-footer">
      <view class="store-address-footer__button" hover-class="store-address-footer__button--hover" @tap="handleSubmit">
        提交
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
  padding-bottom: 22rpx;
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

.store-address-footer__button--hover {
  opacity: 0.88;
}
</style>
