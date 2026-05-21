<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import defaultMarkerIcon from '@/static/icons/map-marker.png'

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
  markerWidth: 150,
  markerHeight: 150,
  selectable: false,
  selectionMode: 'center',
})

const emit = defineEmits<{
  (e: 'change', payload: LocationPayload): void
  (e: 'updated'): void
  (e: 'markertap', event: any): void
  (e: 'poitap', event: any): void
  (e: 'regionchange', event: any): void
  (e: 'tap', event: any): void
  (e: 'update:latitude', value: number): void
  (e: 'update:longitude', value: number): void
  (e: 'update:scale', value: number): void
}>()

const mapId = `tencent-map-${++mapInstanceSeed}`
const instance = getCurrentInstance()
const selectedLatitude = ref(props.latitude)
const selectedLongitude = ref(props.longitude)
const currentScale = ref(props.scale)
const mapContext = shallowRef<ReturnType<typeof uni.createMapContext>>()
const centerPinVisible = computed(() => props.selectable && props.selectionMode === 'center')
const hasCustomMarkers = computed(() => props.markers.length > 0)

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
  () => props.scale,
  (value) => {
    currentScale.value = value
  },
)

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
})

async function emitLocationChange(payload: LocationPayload) {
  selectedLatitude.value = payload.latitude
  selectedLongitude.value = payload.longitude

  emit('update:latitude', payload.latitude)
  emit('update:longitude', payload.longitude)
  emit('change', payload)
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

  const { latitude, longitude } = event.detail || {}

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return
  }

  void emitLocationChange({
    latitude,
    longitude,
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
      :scale="currentScale"
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
  width: 50rpx;
  height: 50rpx;
  margin-left: -11rpx;
  margin-top: -40rpx;
  pointer-events: none;
}

.tencent-map__center-pin {
  width: 50rpx;
  height: 50rpx;
}
</style>
