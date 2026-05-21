<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import defaultMarkerIcon from '@/static/icons/map-marker.svg'

let mapInstanceSeed = 0

type LocationSource = 'init' | 'poi' | 'tap' | 'regionchange'
type SelectionMode = 'center' | 'tap'

interface MapMarkerLike {
  id: number
  latitude: number
  longitude: number
  iconPath: string
  width?: number
  height?: number
  [key: string]: any
}

interface LocationPayload {
  latitude: number
  longitude: number
  address?: string
  name?: string
  source: LocationSource
}

interface Props {
  latitude: number
  longitude: number
  markers?: MapMarkerLike[]
  scale?: number
  height?: string
  borderRadius?: string
  background?: string
  enablePoi?: boolean
  enableScroll?: boolean
  enableZoom?: boolean
  showLocation?: boolean
  markerIconPath?: string
  markerWidth?: number
  markerHeight?: number
  selectable?: boolean
  selectionMode?: SelectionMode
  reverseGeocode?: boolean
  tencentMapKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  markers: () => [],
  scale: 14,
  height: '260rpx',
  borderRadius: '20rpx',
  background: '#edf5fb',
  enablePoi: true,
  enableScroll: true,
  enableZoom: true,
  showLocation: false,
  markerIconPath: defaultMarkerIcon,
  markerWidth: 34,
  markerHeight: 40,
  selectable: false,
  selectionMode: 'center',
  reverseGeocode: false,
  tencentMapKey: '',
})

const emit = defineEmits<{
  change: [payload: LocationPayload]
  updated: []
  markertap: [event: any]
  poitap: [event: any]
  regionchange: [event: any]
  tap: [event: any]
  'update:latitude': [value: number]
  'update:longitude': [value: number]
}>()

const mapId = `tencent-map-${++mapInstanceSeed}`
const instance = getCurrentInstance()
const selectedLatitude = ref(props.latitude)
const selectedLongitude = ref(props.longitude)
const mapContext = shallowRef<ReturnType<typeof uni.createMapContext>>()
const centerPinVisible = computed(() => props.selectable && props.selectionMode === 'center')
const hasCustomMarkers = computed(() => props.markers.length > 0)
const runtimeTencentMapKey = computed(() => props.tencentMapKey || import.meta.env.VITE_TENCENT_MAP_KEY || '')

const resolvedMarkers = computed(() => {
  if (centerPinVisible.value) {
    return props.markers
  }

  if (hasCustomMarkers.value) {
    return props.markers
  }

  return [
    {
      id: 1,
      latitude: selectedLatitude.value,
      longitude: selectedLongitude.value,
      iconPath: props.markerIconPath,
      width: props.markerWidth,
      height: props.markerHeight,
    },
  ]
})

watch(
  () => props.latitude,
  (value) => {
    selectedLatitude.value = value
  },
)

watch(
  () => props.longitude,
  (value) => {
    selectedLongitude.value = value
  },
)

onMounted(() => {
  const proxy = instance?.proxy as ComponentPublicInstance | undefined
  mapContext.value = proxy
    ? uni.createMapContext(mapId, proxy)
    : uni.createMapContext(mapId)

  if (props.reverseGeocode) {
    void emitLocationChange({
      latitude: selectedLatitude.value,
      longitude: selectedLongitude.value,
      source: 'init',
    })
  }
})

async function reverseGeocode(latitude: number, longitude: number) {
  const key = runtimeTencentMapKey.value

  if (!key) {
    return {}
  }

  try {
    const response = await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
      uni.request({
        url: 'https://apis.map.qq.com/ws/geocoder/v1/',
        method: 'GET',
        data: {
          key,
          location: `${latitude},${longitude}`,
        },
        success: resolve,
        fail: reject,
      })
    })

    const data = response.data as {
      status?: number
      result?: {
        address?: string
        formatted_addresses?: {
          recommend?: string
        }
        address_reference?: {
          landmark_l2?: {
            title?: string
          }
        }
      }
    }

    if (data.status !== 0 || !data.result) {
      return {}
    }

    return {
      address: data.result.address,
      name: data.result.formatted_addresses?.recommend || data.result.address_reference?.landmark_l2?.title,
    }
  }
  catch {
    return {}
  }
}

async function emitLocationChange(payload: LocationPayload) {
  selectedLatitude.value = payload.latitude
  selectedLongitude.value = payload.longitude

  emit('update:latitude', payload.latitude)
  emit('update:longitude', payload.longitude)

  const resolvedAddress = props.reverseGeocode
    ? await reverseGeocode(payload.latitude, payload.longitude)
    : {}

  emit('change', {
    ...payload,
    address: payload.address || resolvedAddress.address,
    name: payload.name || resolvedAddress.name,
  })
}

async function updateByCenter(source: LocationSource) {
  if (!mapContext.value) {
    return
  }

  try {
    const center = await new Promise<{ latitude: number, longitude: number }>((resolve, reject) => {
      mapContext.value!.getCenterLocation({
        success: resolve,
        fail: reject,
      })
    })

    await emitLocationChange({
      latitude: center.latitude,
      longitude: center.longitude,
      source,
    })
  }
  catch {
    // ignore map context failures to avoid interrupting page interaction
  }
}

function handleUpdated() {
  emit('updated')
}

function handleMarkerTap(event: any) {
  emit('markertap', event)
}

function handlePoiTap(event: any) {
  emit('poitap', event)

  if (!props.selectable) {
    return
  }

  const { latitude, longitude, name } = event.detail || {}

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return
  }

  void emitLocationChange({
    latitude,
    longitude,
    name,
    address: name,
    source: 'poi',
  })
}

function handleTap(event: any) {
  emit('tap', event)

  if (!props.selectable || props.selectionMode !== 'tap') {
    return
  }

  const { latitude, longitude } = event.detail || {}

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return
  }

  void emitLocationChange({
    latitude,
    longitude,
    source: 'tap',
  })
}

function handleRegionChange(event: any) {
  emit('regionchange', event)

  if (!props.selectable || props.selectionMode !== 'center') {
    return
  }

  if (event.type !== 'end') {
    return
  }

  void updateByCenter('regionchange')
}
</script>

<template>
  <view
    class="tencent-map"
    :style="{
      height: props.height,
      borderRadius: props.borderRadius,
      background: props.background,
    }"
  >
    <map
      :id="mapId"
      class="tencent-map__inner"
      :latitude="selectedLatitude"
      :longitude="selectedLongitude"
      :markers="resolvedMarkers"
      :scale="props.scale"
      :enable-poi="props.enablePoi"
      :enable-scroll="props.enableScroll"
      :enable-zoom="props.enableZoom"
      :show-location="props.showLocation"
      @updated="handleUpdated"
      @markertap="handleMarkerTap"
      @poitap="handlePoiTap"
      @tap="handleTap"
      @regionchange="handleRegionChange"
    />

    <cover-view v-if="centerPinVisible" class="tencent-map__center-pin-shell">
      <cover-image class="tencent-map__center-pin" :src="props.markerIconPath" />
    </cover-view>
  </view>
</template>

<style scoped>
.tencent-map {
  position: relative;
  overflow: hidden;
  width: 100%;
  box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.75);
}

.tencent-map__inner {
  width: 100%;
  height: 100%;
}

.tencent-map__center-pin-shell {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 34rpx;
  height: 40rpx;
  margin-left: -17rpx;
  margin-top: -40rpx;
  pointer-events: none;
}

.tencent-map__center-pin {
  width: 34rpx;
  height: 40rpx;
}
</style>
