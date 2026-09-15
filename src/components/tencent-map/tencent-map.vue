<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import defaultMarkerIcon from '@/static/icons/map-marker.png'

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
  markerWidth: 50,
  markerHeight: 50,
  selectable: false,
  selectionMode: 'center',
})

const emit = defineEmits<{
  (e: 'change', payload: LocationPayload): void
  (e: 'selecting', value: boolean): void
  (e: 'selectionerror'): void
  (e: 'updated'): void
  (e: 'markertap', event: any): void
  (e: 'poitap', event: any): void
  (e: 'regionchange', event: any): void
  (e: 'tap', event: any): void
  (e: 'update:latitude', value: number): void
  (e: 'update:longitude', value: number): void
  (e: 'update:scale', value: number): void
}>()

const instance = getCurrentInstance()!
const mapId = `tencent-map-${instance.uid}`
const selectedLatitude = ref(props.latitude)
const selectedLongitude = ref(props.longitude)
const currentScale = ref(props.scale)
const mapContext = shallowRef<ReturnType<typeof uni.createMapContext>>()
let centerRequestSeq = 0
let selecting = false
let selectionFailed = false
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
  () => [props.latitude, props.longitude],
  ([latitude, longitude]) => {
    if (latitude === selectedLatitude.value && longitude === selectedLongitude.value) {
      return
    }
    centerRequestSeq += 1
    selectedLatitude.value = latitude
    selectedLongitude.value = longitude
    selectionFailed = false
    setSelecting(false)
  },
)

watch(
  () => [props.selectable, props.selectionMode],
  () => {
    centerRequestSeq += 1
    setSelecting(false)
  },
)

onMounted(() => {
  const proxy = instance?.proxy as ComponentPublicInstance | undefined
  mapContext.value = proxy
    ? uni.createMapContext(mapId, proxy)
    : uni.createMapContext(mapId)
})

onUnmounted(() => {
  centerRequestSeq += 1
})

function setSelecting(value: boolean) {
  if (selecting !== value) {
    selecting = value
    emit('selecting', value)
  }
}

function isValidLocation(location: { latitude?: number, longitude?: number } | undefined) {
  return location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)
    && Math.abs(location.latitude!) <= 90 && Math.abs(location.longitude!) <= 180
}

function emitLocationChange(payload: LocationPayload) {
  selectionFailed = false
  selectedLatitude.value = payload.latitude
  selectedLongitude.value = payload.longitude

  emit('update:latitude', payload.latitude)
  emit('update:longitude', payload.longitude)
  emit('change', payload)
}

async function updateByCenter(source: LocationSource, centerLocation?: { latitude: number, longitude: number }) {
  const requestSeq = ++centerRequestSeq
  setSelecting(true)
  try {
    const center = isValidLocation(centerLocation)
      ? centerLocation!
      : await new Promise<{ latitude: number, longitude: number }>((resolve, reject) => {
          if (!mapContext.value) {
            reject(new Error('地图尚未就绪'))
            return
          }
          mapContext.value.getCenterLocation({
            success: resolve,
            fail: reject,
          })
        })

    if (requestSeq !== centerRequestSeq) {
      return
    }
    if (!isValidLocation(center)) {
      throw new Error('地图位置无效')
    }
    // 原生 App 也会在程序设置中心点后回调，避免同一坐标反复触发选点。
    if (!selectionFailed && center.latitude === selectedLatitude.value && center.longitude === selectedLongitude.value) {
      return
    }
    emitLocationChange({
      latitude: center.latitude,
      longitude: center.longitude,
      source,
    })
  }
  catch {
    if (requestSeq === centerRequestSeq) {
      selectionFailed = true
      emit('selectionerror')
    }
  }
  finally {
    if (requestSeq === centerRequestSeq) {
      setSelecting(false)
    }
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

  if (!isValidLocation({ latitude, longitude })) {
    return
  }

  centerRequestSeq += 1
  emitLocationChange({
    latitude,
    longitude,
    source: 'poi',
  })
  setSelecting(false)
}

function handleTap(event: any) {
  emit('tap', event)

  if (!props.selectable || props.selectionMode !== 'tap') {
    return
  }

  const { latitude, longitude } = event.detail || {}

  if (!isValidLocation({ latitude, longitude })) {
    return
  }

  centerRequestSeq += 1
  emitLocationChange({
    latitude,
    longitude,
    source: 'tap',
  })
  setSelecting(false)
}

function handleRegionChange(event: any) {
  emit('regionchange', event)

  if (!props.selectable || props.selectionMode !== 'center') {
    return
  }

  const detail = event.detail || {}
  const type = detail.type || event.type
  const causedBy = detail.causedBy || event.causedBy
  // 外部设置中心点也会触发事件，不能把程序更新当成用户选点。
  if (causedBy === 'update') {
    return
  }

  if (type === 'begin') {
    centerRequestSeq += 1
    setSelecting(true)
    return
  }
  // App 原生地图的 regionchange 可能没有 begin/end，需直接读取当前中心点。
  if (type && type !== 'end' && type !== 'regionchange') {
    return
  }

  if (Number.isFinite(detail.scale) && detail.scale !== currentScale.value) {
    currentScale.value = detail.scale
    emit('update:scale', detail.scale)
  }
  void updateByCenter('regionchange', detail.centerLocation)
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
  margin-left: -25rpx;
  margin-top: -50rpx;
  pointer-events: none;
}

.tencent-map__center-pin {
  width: 50rpx;
  height: 50rpx;
}
</style>
